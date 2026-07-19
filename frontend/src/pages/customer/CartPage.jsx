import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addItem, removeItem, clearCart, applyCoupon, removeCoupon,
         toggleWallet, setTip, setItemInstructions, selectCartTotal } from '@/features/cart/cartSlice'
import { placeOrder } from '@/features/order/orderSlice'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiMinus, FiTrash2, FiUsers, FiCopy } from 'react-icons/fi'

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

const TIP_OPTIONS = [0, 10, 20, 30, 50]

export default function CartPage() {
  const { t } = useTranslation()
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const cart      = useSelector(s => s.cart)
  const subtotal  = useSelector(selectCartTotal)
  const wallet    = useSelector(s => s.wallet)
  const tip       = useSelector(s => s.cart.tip || 0)
  const { loading } = useSelector(s => s.order)

  const [couponInput, setCouponInput]       = useState('')
  const [address, setAddress]               = useState('')
  const [paymentMethod, setPaymentMethod]   = useState('COD')
  const [savedAddresses, setSavedAddresses] = useState([])
  const [gpsCoords, setGpsCoords]           = useState(null)
  const [gpsLoading, setGpsLoading]         = useState(false)
  const [gpsHint,    setGpsHint]            = useState(null)
  const [surge, setSurge]                   = useState(null)
  const [alsoOrdered, setAlsoOrdered]       = useState([])
  const [splitCount, setSplitCount]         = useState(1)
  const [groupCode, setGroupCode]           = useState(null)
  const [groupLoading, setGroupLoading]     = useState(false)
  const [zoneWarning, setZoneWarning]       = useState(null)
  const [scheduleAt,   setScheduleAt]       = useState('')
  const [showSchedule, setShowSchedule]     = useState(false)

  useEffect(() => {
    api.get('/surge/status').then(r => { if (r.data.active) setSurge(r.data) }).catch(() => {})
    if (cart.restaurantId)
      api.get(`/recommendations/also-ordered/${cart.restaurantId}?limit=4`)
        .then(r => setAlsoOrdered(r.data)).catch(() => {})
  }, [cart.restaurantId])

  useEffect(() => {
    api.get('/addresses').then(r => {
      setSavedAddresses(r.data)
      const def = r.data.find(a => a.default)
      if (def) setAddress(def.fullAddress + ', ' + def.city)
    }).catch(() => {})
  }, [])

  const discount    = cart.discount || 0
  const walletDebit = cart.useWallet ? Math.min(wallet.balance, subtotal - discount) : 0
  const total       = Math.max(0, subtotal - discount - walletDebit + tip)
  const perPerson   = splitCount > 1 ? (total / splitCount).toFixed(2) : null

  const startGroupOrder = async () => {
    setGroupLoading(true)
    try {
      const { data } = await api.post('/group-cart/create', {
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName,
        itemsJson: JSON.stringify(cart.items.map(i => ({
          id: i.id, name: i.name, price: i.price,
          quantity: i.quantity, imageUrl: i.imageUrl, addedBy: 'You'
        })))
      })
      setGroupCode(data.code)
      toast.success('Group order created!')
    } catch { toast.error('Failed to create group order') }
    finally { setGroupLoading(false) }
  }

  const copyGroupLink = () => {
    const url = `${window.location.origin}/group-order/${groupCode}`
    navigator.clipboard.writeText(url).catch(() => {})
    toast.success('Group link copied!')
  }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) { toast.error('Enter a coupon code'); return }
    try {
      const { data } = await api.post('/coupons/apply', {
        code: couponInput,
        orderAmount: subtotal > 0 ? subtotal : 1
      })
      dispatch(applyCoupon({ code: data.code, discountAmount: data.discountAmount }))
      toast.success(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon')
    }
  }

  // Delivery zone check when GPS coords set
  const checkDeliveryZone = async (lat, lng) => {
    if (!cart.restaurantId) return
    try {
      const { data } = await api.get(`/restaurants/${cart.restaurantId}`)
      if (data.latitude && data.longitude) {
        // Haversine distance in km
        const R = 6371
        const dLat = (lat - data.latitude) * Math.PI / 180
        const dLon = (lng - data.longitude) * Math.PI / 180
        const a = Math.sin(dLat/2)**2 + Math.cos(data.latitude * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLon/2)**2
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        if (dist > 15) setZoneWarning(`⚠️ You are ${dist.toFixed(1)} km away. Delivery may not be available.`)
        else if (dist > 8) setZoneWarning(`📍 ${dist.toFixed(1)} km away — delivery available but may take longer.`)
        else setZoneWarning(null)
      }
    } catch {}
  }

  const shareLocation = () => {
    if (!navigator.geolocation) { toast.error('GPS not supported'); return }
    setGpsLoading(true)

    const reverseGeocode = async (lat, lng) => {
      setGpsCoords({ lat, lng })
      checkDeliveryZone(lat, lng)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
          { headers: { 'User-Agent': 'FoodHubPro/1.0' } }
        )
        const d = await res.json()
        const a = d.address || {}
        const street = a.road || a.pedestrian || a.footway || a.path || a.street || ''
        const houseNo = a.house_number ? `${a.house_number}, ` : ''
        const area = a.suburb || a.neighbourhood || a.quarter || a.village || a.hamlet || ''
        const city = a.city || a.town || a.municipality || a.county || ''
        const state = a.state || ''
        const pin = a.postcode || ''
        const parts = [houseNo + street, area, city, state].filter(s => s.trim())
        const composed = parts.join(', ') + (pin ? ` - ${pin}` : '')
        // Show as HINT only — never overwrite user's address
        setGpsHint(composed.length > 10 ? composed : d.display_name || null)
      } catch {
        setGpsHint(null)
      }
      toast.success('📍 GPS captured! Verify your address below.')
      setGpsLoading(false)
    }

    navigator.geolocation.getCurrentPosition(
      pos => reverseGeocode(pos.coords.latitude, pos.coords.longitude),
      () => {
        // Retry without high accuracy
        navigator.geolocation.getCurrentPosition(
          pos => reverseGeocode(pos.coords.latitude, pos.coords.longitude),
          () => { toast.error('Location access denied. Please enter address manually.'); setGpsLoading(false) },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        )
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  const handleCheckout = async () => {
    if (!address.trim()) { toast.error('Please enter delivery address'); return }
    if (cart.items.length === 0) { toast.error('Cart is empty'); return }

    const result = await dispatch(placeOrder({
      restaurantId: cart.restaurantId,
      items: cart.items.map(i => ({ menuItemId: i.id, quantity: i.quantity, instructions: i.instructions })),
      deliveryAddress: address,
      couponCode: cart.couponCode,
      paymentMethod,
      tip,
      deliveryLat: gpsCoords?.lat || null,
      deliveryLng: gpsCoords?.lng || null,
      scheduledAt: scheduleAt || null,
    }))

    if (result.error) return
    const orderId = result.payload.id

    if (paymentMethod === 'ONLINE') {
      try {
        const { data } = await api.post(`/payments/orders/${orderId}/initiate`)

        // Simulate mode — no Razorpay SDK needed
        if (data.keyId === 'simulate') {
          await api.post('/payments/verify', {
            razorpayOrderId:   data.razorpayOrderId,
            razorpayPaymentId: 'sim_pay_' + Date.now(),
            razorpaySignature: 'simulated',
          })
          toast.success('✅ Payment successful (simulate mode)!')
          dispatch(clearCart())
          navigate('/order-success', { state: { orderId } })
          return
        }

        const ok = await loadRazorpay()
        if (!ok) { toast.error('Razorpay failed to load'); return }
        const rzp = new window.Razorpay({
          key: data.keyId,
          amount: data.amount * 100,
          currency: data.currency,
          order_id: data.razorpayOrderId,
          name: 'FoodHub Pro',
          description: `Order #${orderId}`,
          handler: async (response) => {
            try {
              await api.post('/payments/verify', {
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature:  response.razorpay_signature,
              })
              toast.success('Payment successful!')
            } catch { toast.error('Payment verification failed') }
            dispatch(clearCart())
            navigate('/order-success', { state: { orderId } })
          },
          modal: { ondismiss: () => toast('Payment cancelled') },
        })
        rzp.open()
        return
      } catch (err) {
        toast.error(err.response?.data?.message || 'Payment initiation failed')
        return
      }
    }

    dispatch(clearCart())
    navigate('/order-success', { state: { orderId } })
  }

  if (cart.items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">
      <p className="text-6xl mb-4">🛒</p>
      <p className="text-lg">{t('empty_cart')}</p>
      <button onClick={() => navigate('/')} className="btn-primary mt-4">{t('browse_restaurants')}</button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-2xl font-bold mb-6">{t('your_cart')}</h1>
      <p className="text-sm text-gray-500 mb-4">From: <span className="font-medium">{cart.restaurantName}</span></p>

      {/* Surge pricing banner */}
      {surge && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="font-semibold text-red-700">Surge pricing active — {surge.reason}</p>
            <p className="text-sm text-red-600">Delivery fee is {((surge.multiplier - 1) * 100).toFixed(0)}% higher than usual</p>
          </div>
        </div>
      )}

      {/* Delivery zone warning */}
      {zoneWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 text-yellow-800 text-sm">
          {zoneWarning}
        </div>
      )}

      {/* Items with special instructions */}
      <div className="card mb-4 space-y-4">
        {cart.items.map(item => (
          <div key={item.cartKey || item.id}>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                {item.addons?.length > 0 && (
                  <p className="text-xs text-gray-400">{item.addons.map(a => a.name).join(', ')}</p>
                )}
                <p className="text-primary font-semibold">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => dispatch(removeItem(item.cartKey || item.id))}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary">
                  <FiMinus size={12} />
                </button>
                <span className="w-6 text-center font-medium">{item.quantity}</span>
                <button onClick={() => dispatch(addItem({ ...item }))}
                        className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center">
                  <FiPlus size={12} />
                </button>
              </div>
              <p className="w-16 text-right font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <input className="input text-xs mt-2 py-1.5" placeholder="📝 Add special instructions (optional)"
                   value={item.instructions || ''}
                   onChange={e => dispatch(setItemInstructions({ id: item.cartKey || item.id, instructions: e.target.value }))} />
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="card mb-4">
        <p className="font-medium mb-2">{t('apply_coupon')}</p>
        {cart.couponCode ? (
          <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg">
            <span className="text-green-700 font-medium text-sm">✅ {cart.couponCode} applied</span>
            <button onClick={() => dispatch(removeCoupon())} className="text-red-500 text-sm">
              <FiTrash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Enter coupon code"
                   value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} />
            <button onClick={handleApplyCoupon} className="btn-outline">Apply</button>
          </div>
        )}
      </div>

      {/* Wallet */}
      {wallet.balance > 0 && (
        <div className="card mb-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{t('use_wallet')}</p>
            <p className="text-sm text-gray-500">{t('available')}: ₹{wallet.balance}</p>
          </div>
          <button onClick={() => dispatch(toggleWallet())}
                  className={`w-12 h-6 rounded-full transition-colors ${cart.useWallet ? 'bg-primary' : 'bg-gray-300'}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform
              ${cart.useWallet ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      )}

      {/* Tip for delivery partner */}
      <div className="card mb-4">
        <p className="font-medium mb-2">🛵 Tip for Delivery Partner</p>
        <div className="flex gap-2 flex-wrap">
          {TIP_OPTIONS.map(amt => (
            <button key={amt} onClick={() => dispatch(setTip(amt))}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors
                      ${tip === amt ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
              {amt === 0 ? 'No tip' : `₹${amt}`}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">100% of tip goes to your delivery partner ❤️</p>
      </div>

      {/* Delivery address */}
      <div className="card mb-4">
        <p className="font-medium mb-2">{t('delivery_address')}</p>
        {savedAddresses.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {savedAddresses.map(a => (
              <button key={a.id} type="button"
                      onClick={() => setAddress(a.fullAddress + ', ' + a.city)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors
                        ${address === a.fullAddress + ', ' + a.city
                          ? 'bg-primary text-white border-primary'
                          : 'border-gray-200 text-gray-600'}`}>
                {a.label === 'Home' ? '🏠' : a.label === 'Work' ? '💼' : '📍'} {a.label}
              </button>
            ))}
          </div>
        )}
        <textarea className="input resize-none" rows={2} placeholder="Enter full delivery address"
                  value={address} onChange={e => setAddress(e.target.value)} />
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={shareLocation} disabled={gpsLoading}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors
                    ${gpsCoords ? 'bg-green-50 border-green-400 text-green-700' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
            {gpsLoading ? '⏳ Getting location...' : gpsCoords ? '✅ Location shared' : '📍 Share my location'}
          </button>
          {gpsCoords && (
            <button type="button" onClick={() => { setGpsCoords(null); setGpsHint(null) }}
                    className="text-xs text-red-500 hover:underline">Remove</button>
          )}
        </div>
        {gpsCoords && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-green-600 font-medium">
              ✅ GPS locked: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
            </p>
            {gpsHint && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <span className="text-blue-500 text-xs mt-0.5">📍</span>
                <div className="flex-1">
                  <p className="text-xs text-blue-700 font-medium">Detected nearby:</p>
                  <p className="text-xs text-blue-600">{gpsHint}</p>
                </div>
                <button type="button"
                        onClick={() => { setAddress(gpsHint); setGpsHint(null) }}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0">
                  Use this
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400">✏️ Edit the address above to your exact location</p>
          </div>
        )}
      </div>

      {/* Schedule Order */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">⏰ Schedule Order</p>
          <button onClick={() => { setShowSchedule(s => !s); if (showSchedule) setScheduleAt('') }}
                  className={`text-sm px-3 py-1 rounded-full border transition-colors
                    ${showSchedule ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
            {showSchedule ? 'Cancel' : 'Schedule'}
          </button>
        </div>
        {showSchedule && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Order will be placed automatically at the selected time</p>
            <input type="datetime-local" className="input"
                   min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                   max={new Date(Date.now() + 7 * 24 * 60 * 60000).toISOString().slice(0, 16)}
                   value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} />
            {scheduleAt && (
              <p className="text-xs text-green-600 mt-1.5 font-medium">
                ✅ Scheduled for {new Date(scheduleAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Payment method */}
      <div className="card mb-6">
        <p className="font-medium mb-2">{t('payment_method')}</p>
        <div className="flex gap-3">
          {['COD', 'ONLINE', 'WALLET'].map(m => (
            <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                      ${paymentMethod === m ? 'bg-primary text-white border-primary' : 'border-gray-200'}`}>
              {m === 'COD' ? '💵 Cash' : m === 'ONLINE' ? '💳 Online' : '👛 Wallet'}
            </button>
          ))}
        </div>
      </div>

      {/* People Also Ordered */}
      {alsoOrdered.length > 0 && (
        <div className="card mb-4">
          <p className="font-medium mb-3">🔥 People also ordered</p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {alsoOrdered.map(item => (
              <div key={item.id} className="flex-shrink-0 w-32 text-center">
                <div className="w-full h-20 rounded-xl overflow-hidden bg-gray-100 mb-1">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">{item.isVeg ? '🥗' : '🍗'}</div>
                  }
                </div>
                <p className="text-xs font-medium truncate dark:text-white">{item.name}</p>
                <p className="text-xs text-primary font-semibold">₹{item.price}</p>
                <button onClick={() => dispatch(addItem({
                  id: item.id, name: item.name, price: Number(item.price),
                  imageUrl: item.imageUrl, restaurantId: cart.restaurantId,
                  restaurantName: cart.restaurantName, cartKey: String(item.id)
                }))} className="mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20">
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Order */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium flex items-center gap-2"><FiUsers size={16} /> Group Order</p>
          {!groupCode && (
            <button onClick={startGroupOrder} disabled={groupLoading}
                    className="text-sm text-primary border border-primary px-3 py-1 rounded-lg hover:bg-primary/10 transition">
              {groupLoading ? '...' : '+ Start Group Order'}
            </button>
          )}
        </div>
        {groupCode ? (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">Share this code with friends:</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-widest text-primary">{groupCode}</span>
              <button onClick={copyGroupLink}
                      className="flex items-center gap-1 text-xs bg-primary text-white px-3 py-1.5 rounded-lg">
                <FiCopy size={12} /> Copy Link
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Friends can join at /group-order/{groupCode}</p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Invite friends to add items. You place the final order.</p>
        )}
      </div>

      {/* Bill Splitting */}
      <div className="card mb-6">
        <p className="font-medium mb-2">💸 Split the Bill</p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Split among</span>
          <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <button onClick={() => setSplitCount(c => Math.max(1, c - 1))}
                    className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10">
              <FiMinus size={14} />
            </button>
            <span className="w-8 text-center font-bold dark:text-white">{splitCount}</span>
            <button onClick={() => setSplitCount(c => Math.min(10, c + 1))}
                    className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10">
              <FiPlus size={14} />
            </button>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">people</span>
          {perPerson && (
            <span className="ml-auto text-primary font-bold">₹{perPerson} / person</span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="card mb-6 space-y-2 text-sm">
        <div className="flex justify-between"><span>{t('subtotal')}</span><span>₹{subtotal.toFixed(2)}</span></div>
        {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon discount</span><span>-₹{discount}</span></div>}
        {walletDebit > 0 && <div className="flex justify-between text-blue-600"><span>Wallet</span><span>-₹{walletDebit.toFixed(2)}</span></div>}
        {tip > 0 && <div className="flex justify-between text-orange-500"><span>🛵 Delivery tip</span><span>+₹{tip}</span></div>}
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>{t('total')}</span><span>₹{total.toFixed(2)}</span>
        </div>
        {perPerson && (
          <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400 font-medium">
            <span>💸 Per person ({splitCount} people)</span>
            <span>₹{perPerson}</span>
          </div>
        )}
      </div>

      <button onClick={handleCheckout} disabled={loading} className="btn-primary w-full text-base py-3">
        {loading ? t('placing_order') : scheduleAt ? `⏰ Schedule Order • ₹${total.toFixed(2)}` : `${t('place_order')} • ₹${total.toFixed(2)}`}
      </button>
    </div>
  )
}
