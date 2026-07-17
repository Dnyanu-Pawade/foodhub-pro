import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchOrderById, updateOrderStatus } from '@/features/order/orderSlice'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import api from '@/services/api'
import toast from 'react-hot-toast'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons broken by Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STEPS = ['PLACED','CONFIRMED','PREPARING','READY_FOR_PICKUP','PICKED_UP','DELIVERED']

function emojiIcon(emoji) {
  return L.divIcon({
    html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">${emoji}</div>`,
    className: '',
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  })
}

async function geocode(address) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
    const d = await r.json()
    if (d.length) return [parseFloat(d[0].lat), parseFloat(d[0].lon)]
  } catch {}
  return null
}

async function getRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    const d = await (await fetch(url)).json()
    if (d.routes?.length) {
      const r = d.routes[0]
      return {
        coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: (r.distance / 1000).toFixed(1),
        durationMin: Math.ceil(r.duration / 60),
      }
    }
  } catch {}
  return null
}

export default function OrderTrackingPage() {
  const { t } = useTranslation()
  const { id }   = useParams()
  const dispatch = useDispatch()
  const { current: order } = useSelector(s => s.order)

  const mapRef        = useRef(null)
  const mapObj        = useRef(null)
  const partnerMarker = useRef(null)
  const routeLine     = useRef(null)
  const customerLL    = useRef(null)
  const watchIdRef    = useRef(null)

  const [partnerLoc, setPartnerLoc] = useState(null)
  const [eta,         setEta]         = useState(null)
  const [sharing,     setSharing]     = useState(false)
  const [countdown,   setCountdown]   = useState(null)
  const [partner,     setPartner]     = useState(null)
  const [ratingModal, setRatingModal] = useState(false)
  const [rating,      setRating]      = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingDone,  setRatingDone]  = useState(false)

  useEffect(() => { dispatch(fetchOrderById(id)) }, [id])

  // Show rating prompt when order is delivered
  useEffect(() => {
    if (order?.status === 'DELIVERED' && !ratingDone) {
      const timer = setTimeout(() => setRatingModal(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [order?.status])

  // Countdown timer from order placed time
  useEffect(() => {
    if (!order || ['DELIVERED','CANCELLED'].includes(order.status)) return
    const placed = new Date(order.createdAt).getTime()
    const estMs  = (order.avgDeliveryTimeMinutes || 40) * 60 * 1000
    const end    = placed + estMs
    const tick = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000))
      setCountdown(left)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [order?.id, order?.status])

  // Poll delivery partner location once
  useEffect(() => {
    api.get(`/delivery/location/${id}`).then(r => setPartnerLoc(r.data)).catch(() => {})
    api.get(`/orders/${id}/delivery-partner`).then(r => setPartner(r.data)).catch(() => {})
  }, [id])

  // WebSocket: order status + partner location
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      onConnect: () => {
        client.subscribe(`/topic/order/${id}/status`,   msg => dispatch(updateOrderStatus(JSON.parse(msg.body))))
        client.subscribe(`/topic/order/${id}/location`, msg => setPartnerLoc(JSON.parse(msg.body)))
      },
    })
    client.activate()
    return () => client.deactivate()
  }, [id])

  // Init map once order loads
  useEffect(() => {
    if (!order || !mapRef.current || mapObj.current) return

    const map = L.map(mapRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    mapObj.current = map

    const bounds = []

    const init = async () => {
      // Restaurant pin
      if (order.restaurantLat && order.restaurantLng) {
        const rll = [order.restaurantLat, order.restaurantLng]
        L.marker(rll, { icon: emojiIcon('🍽️') }).addTo(map)
          .bindPopup(`<b>${order.restaurantName}</b>`)
        bounds.push(rll)
      }

      // Customer pin — prefer saved coords, fallback to geocode
      let cll = null
      if (order.deliveryLat && order.deliveryLng) {
        cll = [order.deliveryLat, order.deliveryLng]
      } else if (order.deliveryAddress) {
        cll = await geocode(order.deliveryAddress)
      }
      if (cll) {
        customerLL.current = cll
        L.marker(cll, { icon: emojiIcon('🏠') }).addTo(map)
          .bindPopup(`<b>Your Address</b><br/>${order.deliveryAddress}`)
        bounds.push(cll)
      }

      // Route line
      if (bounds.length === 2) {
        const route = await getRoute(bounds[0], bounds[1])
        if (route) {
          routeLine.current = L.polyline(route.coords, { color: '#f97316', weight: 5, opacity: 0.8 }).addTo(map)
        }
      }

      if (bounds.length > 1) map.fitBounds(bounds, { padding: [60, 60] })
      else if (bounds.length === 1) map.setView(bounds[0], 15)
    }

    init()
  }, [order])

  // Update delivery partner marker live
  useEffect(() => {
    if (!partnerLoc || !mapObj.current) return
    const latlng = [partnerLoc.latitude, partnerLoc.longitude]

    if (partnerMarker.current) {
      partnerMarker.current.setLatLng(latlng)
    } else {
      partnerMarker.current = L.marker(latlng, { icon: emojiIcon('🛵') })
        .addTo(mapObj.current).bindPopup('🛵 Delivery Partner').openPopup()
    }

    // Update route + ETA from partner to customer
    if (customerLL.current) {
      getRoute(latlng, customerLL.current).then(route => {
        if (!route) return
        setEta({ distanceKm: route.distanceKm, durationMin: route.durationMin })
        if (routeLine.current) routeLine.current.setLatLngs(route.coords)
        else routeLine.current = L.polyline(route.coords, { color: '#f97316', weight: 5, opacity: 0.8 }).addTo(mapObj.current)
      })
    }

    mapObj.current.panTo(latlng)
  }, [partnerLoc])

  const toggleShareLocation = () => {
    if (sharing) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setSharing(false)
      toast('Location sharing stopped')
      return
    }
    if (!navigator.geolocation) { toast.error('GPS not supported'); return }
    const wid = navigator.geolocation.watchPosition(
      pos => api.patch(`/orders/${id}/customer-location?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`).catch(() => {}),
      () => toast.error('GPS error'),
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    watchIdRef.current = wid
    setSharing(true)
    toast.success('Sharing live location!')
  }

  const cancelOrder = async () => {
    if (!confirm('Cancel this order?')) return
    try {
      await api.post(`/orders/${id}/cancel`)
      toast.success('Order cancelled')
      dispatch(fetchOrderById(id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel')
    }
  }

  const submitRating = async () => {
    try {
      await api.post(`/restaurants/${order.restaurantId}/reviews`, { rating, comment: ratingComment })
      toast.success('Thanks for your review! 🌟')
      setRatingDone(true)
      setRatingModal(false)
    } catch {
      setRatingDone(true)
      setRatingModal(false)
    }
  }

  if (!order) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card animate-pulse h-20 bg-gray-100 dark:bg-gray-700" />
      ))}
    </div>
  )

  const currentStep = STEPS.indexOf(order.status)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">{t('order_number')} #{order.id}</h1>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {['PLACED','CONFIRMED'].includes(order.status) && (
            <button onClick={cancelOrder}
                    className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
              {t('cancel')}
            </button>
          )}
        </div>
      </div>

      {/* Progress stepper */}
      <div className="card mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-0 rounded-full" />
          <div className="absolute top-4 left-0 h-1 bg-primary z-0 rounded-full transition-all duration-700 ease-in-out"
               style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} />
          {STEPS.map((step, i) => {
            const done    = i < currentStep
            const active  = i === currentStep
            const EMOJIS  = ['📋','✅','👨‍🍳','📦','🛵','🎉']
            return (
              <div key={step} className="flex flex-col items-center z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-500
                  ${done   ? 'bg-primary text-white scale-100 shadow-md shadow-primary/30'
                  : active ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/40 ring-4 ring-primary/20'
                           : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                  {done ? '✓' : EMOJIS[i]}
                </div>
                <span className={`text-xs mt-1.5 text-center w-16 leading-tight transition-colors duration-300
                  ${active ? 'text-primary font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
            )
          })}
        </div>
        {/* Active step label */}
        <div className="mt-4 text-center">
          <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full">
            {['Order Placed 📋','Confirmed ✅','Being Prepared 👨‍🍳','Ready for Pickup 📦','Out for Delivery 🛵','Delivered 🎉'][currentStep] || order.status}
          </span>
        </div>
      </div>

      {/* Countdown timer */}
      {countdown !== null && !['DELIVERED','CANCELLED'].includes(order.status) && (
        <div className="card mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-100">Estimated arrival</p>
              <p className="text-xs text-orange-200 mt-0.5">{order.restaurantName}</p>
            </div>
            <div className="text-right">
              {countdown > 0 ? (
                <>
                  <p className="text-4xl font-extrabold tabular-nums">
                    {String(Math.floor(countdown / 60)).padStart(2,'0')}:{String(countdown % 60).padStart(2,'0')}
                  </p>
                  <p className="text-xs text-orange-200">min : sec remaining</p>
                </>
              ) : (
                <p className="text-xl font-bold">🎉 Arriving any moment!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ETA banner */}
      {eta ? (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛵</span>
            <div>
              <p className="font-bold text-orange-700 dark:text-orange-400">On the way!</p>
              <p className="text-sm text-orange-600 dark:text-orange-300">{eta.distanceKm} km away</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{eta.durationMin} min</p>
            <p className="text-xs text-orange-500">estimated arrival</p>
          </div>
        </div>
      ) : order.avgDeliveryTimeMinutes && !['DELIVERED','CANCELLED'].includes(order.status) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-2xl">⏱️</span>
          <div>
            <p className="font-semibold text-blue-700 dark:text-blue-400">Estimated delivery</p>
            <p className="text-sm text-blue-600 dark:text-blue-300">~{order.avgDeliveryTimeMinutes} minutes</p>
          </div>
        </div>
      )}

      {/* Delivery Partner Info */}
      {partner && ['PICKED_UP','READY_FOR_PICKUP'].includes(order.status) && (
        <div className="card mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
            {partner.photoUrl
              ? <img src={partner.photoUrl} alt={partner.name} className="w-full h-full rounded-full object-cover" />
              : '🛵'
            }
          </div>
          <div className="flex-1">
            <p className="font-semibold dark:text-white">{partner.name}</p>
            <p className="text-sm text-gray-500">{partner.vehicleNumber || 'Delivery Partner'}</p>
            <div className="flex items-center gap-1 text-yellow-500 text-xs mt-0.5">
              {'★'.repeat(Math.round(partner.rating || 4))}{'☆'.repeat(5 - Math.round(partner.rating || 4))}
              <span className="text-gray-400 ml-1">{partner.totalDeliveries || 0} deliveries</span>
            </div>
          </div>
          {partner.phone && (
            <a href={`tel:${partner.phone}`}
               className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg hover:bg-green-200 transition-colors flex-shrink-0">
              📞
            </a>
          )}
        </div>
      )}

      {/* Live Map */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold dark:text-white">📍 {t('live_map')}</p>
          <div className="flex gap-3 text-xs text-gray-500">
            <span>🍽️ Restaurant</span>
            <span>🏠 You</span>
            {partnerLoc && <span>🛵 Partner</span>}
          </div>
        </div>
        <div ref={mapRef} style={{ height: '320px', width: '100%', borderRadius: '10px' }} />
        {!partnerLoc && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Partner location appears once they start delivery
          </p>
        )}
        {['CONFIRMED','PREPARING','READY_FOR_PICKUP','PICKED_UP'].includes(order.status) && (
          <button onClick={toggleShareLocation}
                  className={`mt-3 w-full py-2 rounded-lg text-sm font-medium border transition-colors
                    ${sharing
                      ? 'bg-green-50 border-green-400 text-green-700'
                      : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
            {sharing ? '🟢 Sharing live location — tap to stop' : '📍 Share live location with delivery partner'}
          </button>
        )}
      </div>

      {/* Order items */}
      <div className="card mb-4">
        <h2 className="font-semibold mb-3 dark:text-white">{t('order_items')}</h2>
        <div className="space-y-2">
          {order.items?.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="dark:text-gray-300">{item.itemName} × {item.quantity}</span>
              <span className="font-medium dark:text-white">₹{item.totalPrice}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between font-bold dark:text-white">
          <span>{t('total')}</span><span>₹{order.totalAmount}</span>
        </div>
      </div>

      <div className="card text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p><span className="font-medium">Restaurant:</span> {order.restaurantName}</p>
        <p><span className="font-medium">Delivery to:</span> {order.deliveryAddress}</p>
        <p><span className="font-medium">Payment:</span> {order.paymentMethod} — {order.paymentStatus}</p>
      </div>

      {order.deliveryPhotoUrl && (
        <div className="card mt-4">
          <p className="font-semibold mb-2 dark:text-white">📸 Proof of Delivery</p>
          <img src={order.deliveryPhotoUrl} alt="Proof of delivery"
               className="w-full rounded-lg max-h-64 object-cover" />
        </div>
      )}

      {order.deliveryOtp && ['READY_FOR_PICKUP','PICKED_UP'].includes(order.status) && (
        <div className="card mt-4 text-center border-2 border-primary">
          <p className="text-sm text-gray-500 mb-1">Show this OTP to delivery partner</p>
          <p className="text-5xl font-bold tracking-widest text-primary">{order.deliveryOtp}</p>
          <p className="text-xs text-gray-400 mt-2">Do not share with anyone else</p>
        </div>
      )}

      {/* Post-delivery rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">🎉</p>
              <h2 className="text-xl font-bold dark:text-white">Order Delivered!</h2>
              <p className="text-sm text-gray-500 mt-1">How was your experience at {order.restaurantName}?</p>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)}
                        className={`text-4xl transition-transform hover:scale-110 ${n <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea className="input resize-none mb-4" rows={2}
                      placeholder="Tell us about your experience (optional)"
                      value={ratingComment} onChange={e => setRatingComment(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => { setRatingDone(true); setRatingModal(false) }}
                      className="btn-outline flex-1 text-sm">Skip</button>
              <button onClick={submitRating} className="btn-primary flex-1 text-sm">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
