import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

export function usePushNotifications() {
  const auth = useSelector(s => s.auth)
  const user = auth?.user
  const accessToken = auth?.accessToken
  const stompRef = useRef(null)

  // Request browser notification permission once
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // Subscribe to order status updates via WebSocket
  useEffect(() => {
    if (!user || !accessToken) return

    let client = null
    const connect = async () => {
      try {
        const [{ Client }, SockJSModule] = await Promise.all([
          import('@stomp/stompjs'),
          import('sockjs-client'),
        ])
        const SockJS = SockJSModule.default
        client = new Client({
          webSocketFactory: () => new SockJS('/ws'),
          connectHeaders: { Authorization: `Bearer ${accessToken}` },
          onConnect: () => {
            stompRef.current = client
            if (user.roles?.includes('ROLE_CUSTOMER')) {
              client.subscribe('/user/queue/orders', msg => {
                try {
                  const order = JSON.parse(msg.body)
                  if (Notification.permission === 'granted')
                    new Notification(`Order #${order.id} Update`, { body: `Status: ${order.status}`, icon: '/favicon.svg' })
                } catch {}
              })
            }
            if (user.roles?.includes('ROLE_RESTAURANT_OWNER')) {
              client.subscribe('/user/queue/new-orders', msg => {
                try {
                  const order = JSON.parse(msg.body)
                  if (Notification.permission === 'granted')
                    new Notification('New Order!', { body: `Order #${order.id} — ₹${order.totalAmount}`, icon: '/favicon.svg' })
                } catch {}
              })
            }
          },
          onStompError: () => {},
        })
        client.activate()
      } catch {}
    }

    connect()
    return () => { client?.deactivate().catch(() => {}) }
  }, [user, accessToken])
}
