import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/services/api'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import toast from 'react-hot-toast'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { FiShoppingBag, FiClock, FiCheckCircle, FiAlertCircle, FiPrinter, FiCalendar } from 'react-icons/fi'

const NEXT_STATUS = {
  PLACED:           'CONFIRMED',
  CONFIRMED:        'PREPARING',
  PREPARING:        'READY_FOR_PICKUP',
  READY_FOR_PICKUP: null,
}

const TAB_STATUSES = {
  new:    ['PLACED'],
  active: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP'],
  done:   ['DELIVERED', 'REJECTED', 'CANCELLED'],
}

function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

export default function OwnerDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [restaurants,        setRestaurants]        = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [orders,             setOrders]             = useState([])
  const [bookings,           setBookings]           = useState([])
  const [tab,                setTab]                = useState('new')
  const [newIds,             setNewIds]             = useState(new Set())
  const clientRef = useRef(null)

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) setSelectedRestaurant(r.data[0])
      else navigate('/owner/onboarding')
    })
  }, [])

  useEffect(() => {
    if (!selectedRestaurant) return
    api.get(`/orders/restaurant/${selectedRestaurant.id}`).then(r => setOrders(r.data))
    api.get(`/table-bookings/restaurant/${selectedRestaurant.id}`).then(r => setBookings(r.data)).catch(() => {})

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      onConnect: () => {
        client.subscribe(`/topic/restaurant/${selectedRestaurant.id}/orders`, msg => {
          const incoming = JSON.parse(msg.body)
          setOrders(prev => {
            const exists = prev.find(o => o.id === incoming.id)
            if (exists) return prev.map(o => o.id === incoming.id ? incoming : o)
            playBeep()
            setNewIds(s => new Set([...s, incoming.id]))
            setTab('new')
            toast.success(`🔔 New order #${incoming.id} from ${incoming.customerName}!`, { duration: 5000 })
            setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(incoming.id); return n }), 8000)
            return [incoming, ...prev]
          })
        })
      }
    })
    client.activate()
    clientRef.current = client
    return () => client.deactivate()
  }, [selectedRestaurant])

  const updateStatus = async (orderId, status) => {
    try {
      const { data } = await api.patch(`/orders/${orderId}/status?status=${status}`)
      setOrders(prev => prev.map(o => o.id === orderId ? data : o))
      setNewIds(s => { const n = new Set(s); n.delete(orderId); return n })
      toast.success(`Order #${orderId} → ${status.replace(/_/g, ' ')}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const printKOT = (order) => {
    const win = window.open('', '_blank', 'width=400,height=600')
    win.document.write(
      '<html><head><title>KOT #' + order.id + '</title>' +
      '<style>body{font-family:monospace;padding:16px;font-size:13px}' +
      'h2{text-align:center;margin:0}.d{border-top:1px dashed #000;margin:8px 0}' +
      '.r{display:flex;justify-content:space-between}</style></head><body>' +
      '<h2>KITCHEN ORDER TICKET</h2><div class="d"></div>' +
      '<div class="r"><span>Order #' + order.id + '</span><span>' + new Date(order.createdAt).toLocaleTimeString() + '</span></div>' +
      '<div class="r"><span>Customer:</span><span>' + order.customerName + '</span></div>' +
      '<div class="d"></div>' +
      (order.items || []).map(i => '<div class="r"><b>' + i.itemName + '</b><b>x' + i.quantity + '</b></div>').join('') +
      '<div class="d"></div>' +
      (order.specialInstructions ? '<p>Note: ' + order.specialInstructions + '</p>' : '') +
      '<p style="text-align:center">*** END ***</p>' +
      '</body></html>'
    )
    win.document.close()
    win.print()
  }

  const updateBookingStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/table-bookings/${id}/status?status=${status}`)
      setBookings(prev => prev.map(b => b.id === id ? data : b))
      toast.success(`Booking ${status.toLowerCase()}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const filtered  = orders.filter(o => TAB_STATUSES[tab]?.includes(o.status))
  const newCount  = orders.filter(o => o.status === 'PLACED').length

  const STATS = [
    { label: t('total_orders'), value: orders.length,                                        icon: <FiShoppingBag size={18}/>, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('new_orders').split(' ')[0],         value: orders.filter(o => o.status === 'PLACED').length,     icon: <FiAlertCircle size={18}/>, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: t('preparing'),   value: orders.filter(o => o.status === 'PREPARING').length,  icon: <FiClock size={18}/>,       color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: t('delivered'),   value: orders.filter(o => o.status === 'DELIVERED').length,  icon: <FiCheckCircle size={18}/>, color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold dark:text-white">📋 {t('orders_dashboard')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage incoming orders in real-time</p>
        </div>
        <div className="flex gap-2">
          <Link to="/staff/kitchen" className="btn-outline text-sm px-3 py-2">🍳 {t('kitchen_display')}</Link>
          <Link to="/owner/analytics" className="btn-primary text-sm px-3 py-2">📊 {t('analytics')}</Link>
        </div>
      </div>

      {/* Restaurant selector */}
      {restaurants.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {restaurants.map(r => (
            <button key={r.id} onClick={() => setSelectedRestaurant(r)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                      ${selectedRestaurant?.id === r.id
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white hover:border-primary'}`}>
              🏪 {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATS.map(s => (
          <div key={s.label} className={`card ${s.bg} border-0`}>
            <div className="flex items-center justify-between mb-2">
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b dark:border-gray-700 pb-0">
        {[
          { key: 'new',      label: `🔔 ${t('new_orders')}`,  badge: newCount },
          { key: 'active',   label: `🔥 ${t('active')}` },
          { key: 'done',     label: `✅ ${t('completed')}` },
          { key: 'bookings', label: `🪑 Bookings`, badge: bookings.filter(b => b.status === 'PENDING').length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  className={`relative px-5 py-2.5 text-sm font-semibold transition-all rounded-t-lg -mb-px
                    ${tab === t.key
                      ? 'bg-white dark:bg-gray-800 border border-b-white dark:border-gray-700 dark:border-b-gray-800 text-primary border-b-0'
                      : 'text-gray-500 dark:text-gray-400 hover:text-primary'}`}>
            {t.label}
            {t.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings tab */}
      {tab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FiCalendar size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No table bookings yet</p>
            </div>
          ) : bookings.map(b => (
            <div key={b.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold dark:text-white">Booking #{b.id}</p>
                  <p className="text-sm text-gray-500">
                    📅 {b.bookingDate} at {b.bookingTime} &nbsp;•&nbsp; 👥 {b.numberOfGuests} guests
                  </p>
                  {b.specialRequest && <p className="text-xs text-gray-400 mt-1">📝 {b.specialRequest}</p>}
                </div>
                <span className={`badge text-xs font-semibold ${
                  b.status === 'PENDING'   ? 'bg-yellow-100 text-yellow-700' :
                  b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                  b.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                  'bg-blue-100 text-blue-700'}`}>{b.status}</span>
              </div>
              {b.status === 'PENDING' && (
                <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                  <button onClick={() => updateBookingStatus(b.id, 'CANCELLED')}
                          className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">✕ Decline</button>
                  <button onClick={() => updateBookingStatus(b.id, 'CONFIRMED')}
                          className="btn-primary text-sm px-4 py-1.5">✓ Confirm</button>
                </div>
              )}
              {b.status === 'CONFIRMED' && (
                <button onClick={() => updateBookingStatus(b.id, 'COMPLETED')}
                        className="btn-outline text-sm px-4 py-1.5 mt-2">✓ Mark Completed</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Order cards */}
      {tab !== 'bookings' && (
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FiCheckCircle size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="font-medium">{t('no_orders_tab')}</p>
          </div>
        )}
        {filtered.map(order => (
          <div key={order.id}
               className={`card transition-all ${newIds.has(order.id) ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {newIds.has(order.id) && (
                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">NEW</span>
                )}
                <span className="font-bold text-lg dark:text-white">Order #{order.id}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400">
                  {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {order.items?.map((i, idx) => (
                <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg font-medium">
                  {i.itemName} ×{i.quantity}
                </span>
              ))}
            </div>

            <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              📍 {order.deliveryAddress} &nbsp;•&nbsp; 💳 {order.paymentMethod}
              {order.specialInstructions && (
                <span className="ml-2 text-yellow-600 dark:text-yellow-400">📝 {order.specialInstructions}</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
              <span className="font-extrabold text-xl dark:text-white">₹{order.totalAmount}</span>
              <div className="flex gap-2">
                <button onClick={() => printKOT(order)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
                  <FiPrinter size={14}/> {t('kot')}
                </button>
                {order.status === 'PLACED' && (
                  <>
                    <button onClick={() => updateStatus(order.id, 'REJECTED')}
                            className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">
                      ✕ {t('reject')}
                    </button>
                    <button onClick={() => updateStatus(order.id, 'CONFIRMED')} className="btn-primary text-sm px-4 py-1.5">
                      ✓ {t('accept')}
                    </button>
                  </>
                )}
                {NEXT_STATUS[order.status] && order.status !== 'PLACED' && (
                  <button onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])}
                          className="btn-primary text-sm px-4 py-1.5">
                    → {NEXT_STATUS[order.status].replace(/_/g, ' ')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
