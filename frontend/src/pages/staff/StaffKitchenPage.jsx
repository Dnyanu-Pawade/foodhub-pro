import { useEffect, useState, useRef } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

const NEXT = { CONFIRMED: 'PREPARING', PREPARING: 'READY_FOR_PICKUP' }
const ROLE_TABS = {
  CHEF:    ['CONFIRMED', 'PREPARING'],
  CASHIER: ['READY_FOR_PICKUP', 'DELIVERED'],
  MANAGER: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED', 'REJECTED'],
}

export default function StaffKitchenPage() {
  const [restaurants, setRestaurants] = useState([])
  const [selected, setSelected]       = useState(null)
  const [orders, setOrders]           = useState([])
  const [role, setRole]               = useState('CHEF')
  const clientRef = useRef(null)

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) setSelected(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    api.get(`/orders/restaurant/${selected.id}`).then(r => setOrders(r.data))
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      onConnect: () => {
        client.subscribe(`/topic/restaurant/${selected.id}/orders`, msg => {
          const o = JSON.parse(msg.body)
          setOrders(prev => {
            const exists = prev.find(x => x.id === o.id)
            if (!exists) { playBeep(); toast.success(`New order #${o.id}!`) }
            return exists ? prev.map(x => x.id === o.id ? o : x) : [o, ...prev]
          })
        })
      }
    })
    client.activate()
    clientRef.current = client
    return () => client.deactivate()
  }, [selected])

  const updateStatus = async (orderId, status) => {
    try {
      const { data } = await api.patch(`/orders/${orderId}/status?status=${status}`)
      setOrders(prev => prev.map(o => o.id === orderId ? data : o))
      toast.success(`Order #${orderId} → ${status.replace(/_/g, ' ')}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const filtered = orders.filter(o => ROLE_TABS[role]?.includes(o.status))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold dark:text-white">🍳 Kitchen Display System</h1>
        <div className="flex gap-2">
          {[['CHEF','👨‍🍳','bg-orange-500'],['CASHIER','💰','bg-blue-500'],['MANAGER','👔','bg-purple-500']].map(([r,e,c]) => (
            <button key={r} onClick={() => setRole(r)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${role === r ? c : 'bg-gray-300 dark:bg-gray-600'}`}>
              {e} {r}
            </button>
          ))}
        </div>
      </div>

      {restaurants.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {restaurants.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${selected?.id === r.id ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-white'}`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'New', statuses: ['PLACED'], color: 'text-yellow-600' },
          { label: 'Cooking', statuses: ['CONFIRMED','PREPARING'], color: 'text-orange-600' },
          { label: 'Ready', statuses: ['READY_FOR_PICKUP'], color: 'text-green-600' },
          { label: 'Done', statuses: ['DELIVERED'], color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <p className={`text-3xl font-bold ${s.color}`}>{orders.filter(o => s.statuses.includes(o.status)).length}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">✅</p><p>No orders for {role} right now</p>
          </div>
        )}
        {filtered.map(order => {
          const age = Math.floor((Date.now() - new Date(order.createdAt)) / 60000)
          const urgent = age > 15
          return (
            <div key={order.id}
                 className={`card border-2 ${urgent ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg dark:text-white">#{order.id}</span>
                  {urgent && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">URGENT</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${urgent ? 'text-red-600' : 'text-gray-400'}`}>{age}m ago</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{order.customerName} • {order.paymentMethod}</p>
              <div className="space-y-1.5 mb-4">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <span className="font-medium dark:text-white">{item.itemName}</span>
                    <span className="text-lg font-bold text-primary">×{item.quantity}</span>
                  </div>
                ))}
              </div>
              {order.specialInstructions && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg px-3 py-2 mb-3 text-sm text-yellow-800 dark:text-yellow-300">
                  📝 {order.specialInstructions}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-bold dark:text-white">₹{order.totalAmount}</span>
                {NEXT[order.status] && (
                  <button onClick={() => updateStatus(order.id, NEXT[order.status])} className="btn-primary text-sm px-4 py-2">
                    {NEXT[order.status] === 'PREPARING' ? '🔥 Start Cooking' : '✅ Mark Ready'}
                  </button>
                )}
                {order.status === 'READY_FOR_PICKUP' && role === 'CASHIER' && (
                  <span className="text-green-600 font-semibold text-sm">🛵 Awaiting Pickup</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
