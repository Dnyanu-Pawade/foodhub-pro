import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons broken by Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_COLOR = {
  ASSIGNED:  'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-600',
}

function emojiIcon(emoji) {
  return L.divIcon({
    html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">${emoji}</div>`,
    className: '',
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
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

function DeliveryMap({ delivery, partnerLoc, customerLoc }) {
  const mapRef     = useRef(null)
  const mapObj     = useRef(null)
  const partnerMk  = useRef(null)
  const customerMk = useRef(null)

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return

    const map = L.map(mapRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    mapObj.current = map

    const init = async () => {
      const bounds = []

      // Restaurant pin — geocode from address
      if (delivery.restaurantAddress) {
        const rll = await geocode(delivery.restaurantAddress)
        if (rll) {
          L.marker(rll, { icon: emojiIcon('🍽️') }).addTo(map)
            .bindPopup(`<b>${delivery.restaurantName}</b>`)
          bounds.push(rll)
        }
      }

      // Customer pin — prefer saved lat/lng
      let cll = null
      if (delivery.deliveryLat && delivery.deliveryLng) {
        cll = [delivery.deliveryLat, delivery.deliveryLng]
      } else if (delivery.deliveryAddress) {
        cll = await geocode(delivery.deliveryAddress)
      }
      if (cll) {
        customerMk.current = L.marker(cll, { icon: emojiIcon('🏠') }).addTo(map)
          .bindPopup('Customer')
        bounds.push(cll)
      }

      if (bounds.length > 1) map.fitBounds(bounds, { padding: [50, 50] })
      else if (bounds.length === 1) map.setView(bounds[0], 14)
    }

    init()
  }, [])

  // Update customer live location
  useEffect(() => {
    if (!customerLoc || !mapObj.current) return
    const latlng = [customerLoc.latitude, customerLoc.longitude]
    if (customerMk.current) customerMk.current.setLatLng(latlng)
    else customerMk.current = L.marker(latlng, { icon: emojiIcon('🏠') }).addTo(mapObj.current).bindPopup('Customer')
  }, [customerLoc])

  // Update partner live location
  useEffect(() => {
    if (!partnerLoc || !mapObj.current) return
    const latlng = [partnerLoc.latitude, partnerLoc.longitude]
    if (partnerMk.current) {
      partnerMk.current.setLatLng(latlng)
    } else {
      partnerMk.current = L.marker(latlng, { icon: emojiIcon('🛵') })
        .addTo(mapObj.current).bindPopup('You').openPopup()
    }
    mapObj.current.panTo(latlng)
  }, [partnerLoc])

  return <div ref={mapRef} style={{ height: '220px', width: '100%', borderRadius: '10px', marginTop: '12px' }} />
}

function EarningsChart({ earnings }) {
  const canvasRef  = useRef(null)
  const chartRef   = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement,
                               Tooltip, Legend, BarController }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, BarController)
      if (chartRef.current) chartRef.current.destroy()
      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: ['Today', 'This Month', 'All Time'],
          datasets: [
            {
              label: 'Deliveries',
              data: [earnings.todayDeliveries, earnings.monthDeliveries, earnings.totalDeliveries],
              backgroundColor: '#f9731680',
              borderColor: '#f97316',
              borderWidth: 2,
              borderRadius: 6,
              yAxisID: 'y',
            },
            {
              label: 'Earnings (₹)',
              data: [earnings.todayEarnings, earnings.monthEarnings, earnings.totalEarnings],
              backgroundColor: '#22c55e80',
              borderColor: '#22c55e',
              borderWidth: 2,
              borderRadius: 6,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'top' } },
          scales: {
            y:  { beginAtZero: true, position: 'left',  title: { display: true, text: 'Deliveries' } },
            y1: { beginAtZero: true, position: 'right', title: { display: true, text: '₹ Earnings' }, grid: { drawOnChartArea: false } },
          },
        },
      })
    })
    return () => chartRef.current?.destroy()
  }, [earnings])

  return (
    <div className="card">
      <h2 className="font-semibold mb-4 dark:text-white">📊 Earnings Overview</h2>
      <canvas ref={canvasRef} />
    </div>
  )
}

export default function DeliveryDashboard() {
  const { t } = useTranslation()
  const [tab, setTab]                       = useState('available')
  const [available, setAvailable]           = useState([])
  const [myDeliveries, setMyDeliveries]     = useState([])
  const [earnings, setEarnings]             = useState(null)
  const [partnerLocs, setPartnerLocs]       = useState({})
  const [customerLocs, setCustomerLocs]     = useState({})
  const [activeMapId, setActiveMapId]       = useState(null)
  const [otpInputs, setOtpInputs]           = useState({})
  const [photoUploading, setPhotoUploading] = useState({})
  const stompRef = useRef(null)
  const watchIds = useRef({})

  useEffect(() => {
    loadData()
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      onConnect: () => { stompRef.current = client },
    })
    client.activate()
    return () => {
      client.deactivate()
      Object.values(watchIds.current).forEach(id => navigator.geolocation.clearWatch(id))
    }
  }, [])

  useEffect(() => {
    if (!stompRef.current || myDeliveries.length === 0) return
    myDeliveries.forEach(d => {
      if (['ASSIGNED','PICKED_UP'].includes(d.status)) {
        stompRef.current.subscribe(`/topic/order/${d.orderId}/customer-location`, msg => {
          setCustomerLocs(prev => ({ ...prev, [d.orderId]: JSON.parse(msg.body) }))
        })
      }
    })
  }, [myDeliveries])

  const loadData = () => {
    api.get('/delivery/available').then(r => setAvailable(r.data)).catch(() => {})
    api.get('/delivery/my').then(r => setMyDeliveries(r.data)).catch(() => {})
    api.get('/delivery/earnings').then(r => setEarnings(r.data)).catch(() => {})
  }

  const acceptDelivery = async (orderId) => {
    try {
      const { data } = await api.post(`/delivery/accept/${orderId}`)
      setAvailable(a => a.filter(d => d.orderId !== orderId))
      setMyDeliveries(m => [data, ...m])
      toast.success('Delivery accepted!')
      setTab('my')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const updateStatus = async (deliveryId, status) => {
    try {
      const { data } = await api.patch(`/delivery/${deliveryId}/status?status=${status}`)
      setMyDeliveries(m => m.map(d => d.id === deliveryId ? data : d))
      toast.success(`Marked as ${status}`)
      loadData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const startGPS = (delivery) => {
    if (!navigator.geolocation) { toast.error('GPS not supported'); return }
    if (watchIds.current[delivery.orderId]) { toast('GPS already active'); return }
    const wid = navigator.geolocation.watchPosition(
      pos => {
        const loc = { orderId: delivery.orderId, latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        stompRef.current?.publish({ destination: '/app/delivery/location', body: JSON.stringify(loc) })
        setPartnerLocs(prev => ({ ...prev, [delivery.orderId]: loc }))
      },
      () => toast.error('GPS error'),
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    watchIds.current[delivery.orderId] = wid
    setActiveMapId(delivery.orderId)
    toast.success('GPS tracking started!')
  }

  const stopGPS = (orderId) => {
    if (watchIds.current[orderId]) {
      navigator.geolocation.clearWatch(watchIds.current[orderId])
      delete watchIds.current[orderId]
      toast('GPS stopped')
    }
  }

  const verifyOtp = async (delivery) => {
    const otp = otpInputs[delivery.id]
    if (!otp || otp.length !== 4) { toast.error('Enter 4-digit OTP'); return }
    try {
      await api.post(`/orders/${delivery.orderId}/verify-otp?otp=${otp}`)
      toast.success('OTP verified! Order delivered ✅')
      loadData()
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP') }
  }

  const uploadProofPhoto = async (deliveryId, file) => {
    setPhotoUploading(prev => ({ ...prev, [deliveryId]: true }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/delivery/${deliveryId}/proof-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Proof photo uploaded!')
      loadData()
    } catch { toast.error('Photo upload failed') }
    finally { setPhotoUploading(prev => ({ ...prev, [deliveryId]: false })) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">{t('delivery_dashboard')}</h1>

      {earnings && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Today',      count: earnings.todayDeliveries,  earn: earnings.todayEarnings },
            { label: 'This Month', count: earnings.monthDeliveries,  earn: earnings.monthEarnings },
            { label: 'Total',      count: earnings.totalDeliveries,  earn: earnings.totalEarnings },
          ].map(c => (
            <div key={c.label} className="card text-center">
              <p className="text-3xl font-bold text-primary">{c.count}</p>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-green-600 font-semibold text-sm">₹{c.earn}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {[
          { key: 'available', label: `${t('available_deliveries')} (${available.length})` },
          { key: 'my',        label: t('my_deliveries') },
          { key: 'earnings',  label: t('earnings') },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium
                    ${tab === t.key ? 'bg-primary text-white' : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'available' && (
        <div className="space-y-3">
          {available.length === 0
            ? <div className="text-center py-10 text-gray-400">No available deliveries right now</div>
            : available.map(d => (
              <div key={d.orderId} className="card flex items-start justify-between">
                <div>
                  <p className="font-bold dark:text-white">Order #{d.orderId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">📍 From: {d.restaurantName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">🏠 To: {d.deliveryAddress}</p>
                  <p className="text-primary font-semibold mt-1">₹{d.totalAmount} • Earn ₹30</p>
                </div>
                <button onClick={() => acceptDelivery(d.orderId)} className="btn-primary text-sm px-3 py-1.5">
                  {t('accept')}
                </button>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'my' && (
        <div className="space-y-4">
          {myDeliveries.length === 0
            ? <div className="text-center py-10 text-gray-400">No deliveries yet</div>
            : myDeliveries.map(d => (
              <div key={d.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold dark:text-white">Order #{d.orderId}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{d.restaurantName} → {d.deliveryAddress}</p>
                  </div>
                  <span className={`badge ${STATUS_COLOR[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                </div>

                <div className="flex gap-2 flex-wrap mb-2">
                  {d.status === 'ASSIGNED' && (
                    <>
                      {watchIds.current[d.orderId]
                        ? <button onClick={() => stopGPS(d.orderId)} className="btn-outline text-sm px-3 py-1.5">⏹ {t('stop_gps')}</button>
                        : <button onClick={() => startGPS(d)} className="btn-outline text-sm px-3 py-1.5">🛵 {t('start_gps')}</button>
                      }
                      <button onClick={() => updateStatus(d.id, 'PICKED_UP')} className="btn-primary text-sm px-3 py-1.5">
                        {t('picked_up')}
                      </button>
                    </>
                  )}
                  {d.status === 'PICKED_UP' && (
                    <>
                      {watchIds.current[d.orderId]
                        ? <button onClick={() => stopGPS(d.orderId)} className="btn-outline text-sm px-3 py-1.5">⏹ Stop GPS</button>
                        : <button onClick={() => startGPS(d)} className="btn-outline text-sm px-3 py-1.5">🛵 Start GPS</button>
                      }
                    </>
                  )}
                  {['ASSIGNED','PICKED_UP'].includes(d.status) && (
                    <button onClick={() => setActiveMapId(activeMapId === d.orderId ? null : d.orderId)}
                            className="btn-outline text-sm px-3 py-1.5">
                      {activeMapId === d.orderId ? `🗺 ${t('hide_map')}` : `🗺 ${t('show_map')}`}
                    </button>
                  )}
                </div>

                {d.status === 'PICKED_UP' && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-xl p-3 mt-2">
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">
                      🔐 Enter OTP from customer to complete delivery
                    </p>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number" maxLength={4} placeholder="4-digit OTP"
                        value={otpInputs[d.id] || ''}
                        onChange={e => setOtpInputs(prev => ({ ...prev, [d.id]: e.target.value.slice(0, 4) }))}
                        className="input w-32 text-center text-xl font-bold tracking-widest"
                      />
                      <button onClick={() => verifyOtp(d)} className="btn-primary px-4">
                        ✅ Verify & Deliver
                      </button>
                    </div>
                    <div className="border-t border-orange-200 pt-2">
                      <p className="text-xs text-orange-600 mb-1">📸 Upload proof of delivery (optional)</p>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100">
                        {photoUploading[d.id] ? 'Uploading...' : '📷 Take/Upload Photo'}
                        <input type="file" accept="image/*" capture="environment" className="hidden"
                               onChange={e => e.target.files[0] && uploadProofPhoto(d.id, e.target.files[0])} />
                      </label>
                      {d.deliveryPhotoUrl && (
                        <a href={d.deliveryPhotoUrl} target="_blank" rel="noreferrer"
                           className="ml-2 text-xs text-green-600 underline">✅ Photo uploaded</a>
                      )}
                    </div>
                  </div>
                )}

                {customerLocs[d.orderId] && (
                  <p className="text-xs text-green-600 mt-2">🟢 Customer is sharing live location</p>
                )}

                {activeMapId === d.orderId && (
                  <DeliveryMap
                    delivery={d}
                    partnerLoc={partnerLocs[d.orderId]}
                    customerLoc={customerLocs[d.orderId]}
                  />
                )}
              </div>
            ))
          }
        </div>
      )}

      {tab === 'earnings' && earnings && (
        <div className="space-y-4">
          <div className="card space-y-3">
            {[
              { label: "Today's Deliveries",      count: earnings.todayDeliveries,  earn: earnings.todayEarnings },
              { label: "This Month's Deliveries", count: earnings.monthDeliveries,  earn: earnings.monthEarnings },
              { label: 'Total All Time',           count: earnings.totalDeliveries,  earn: earnings.totalEarnings },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2 border-b last:border-0">
                <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
                <div className="text-right">
                  <p className="font-bold dark:text-white">{row.count} deliveries</p>
                  <p className="text-green-600 text-sm">₹{row.earn}</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400">* ₹30 flat rate per delivery</p>
          </div>
          <EarningsChart earnings={earnings} />
        </div>
      )}
    </div>
  )
}
