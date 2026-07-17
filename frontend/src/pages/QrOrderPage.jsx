import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi'

export default function QrOrderPage() {
  const [params] = useSearchParams()
  const restaurantId = params.get('restaurant')
  const tableNumber  = params.get('table')

  const [restaurant, setRestaurant] = useState(null)
  const [menu,       setMenu]       = useState([])
  const [cart,       setCart]       = useState({}) // { itemId: { item, qty } }
  const [name,       setName]       = useState('')
  const [phone,      setPhone]      = useState('')
  const [placing,    setPlacing]    = useState(false)
  const [placed,     setPlaced]     = useState(null)
  const [step,       setStep]       = useState('menu') // menu | checkout | done

  useEffect(() => {
    if (!restaurantId) return
    api.get(`/restaurants/${restaurantId}`).then(r => setRestaurant(r.data)).catch(() => {})
    api.get(`/menu/restaurant/${restaurantId}`).then(r => setMenu(r.data)).catch(() => {})
  }, [restaurantId])

  const qty = id => cart[id]?.qty || 0

  const add = item => setCart(c => ({
    ...c,
    [item.id]: { item, qty: (c[item.id]?.qty || 0) + 1 }
  }))

  const remove = id => setCart(c => {
    const cur = c[id]?.qty || 0
    if (cur <= 1) { const n = { ...c }; delete n[id]; return n }
    return { ...c, [id]: { ...c[id], qty: cur - 1 } }
  })

  const cartItems  = Object.values(cart).filter(x => x.qty > 0)
  const cartTotal  = cartItems.reduce((s, x) => s + Number(x.item.price) * x.qty, 0)
  const cartCount  = cartItems.reduce((s, x) => s + x.qty, 0)

  const categories = [...new Set(menu.map(i => i.category))].filter(Boolean)
  const grouped    = categories.reduce((acc, cat) => {
    acc[cat] = menu.filter(i => i.category === cat && i.isAvailable)
    return acc
  }, {})
  const uncategorized = menu.filter(i => !i.category && i.isAvailable)

  const placeOrder = async () => {
    if (!name.trim()) { toast.error('Enter your name'); return }
    if (cartItems.length === 0) { toast.error('Add items to cart'); return }
    setPlacing(true)
    try {
      const payload = {
        restaurantId: Number(restaurantId),
        tableNumber,
        customerName: name,
        customerPhone: phone,
        deliveryAddress: tableNumber ? `Table ${tableNumber}` : 'Dine-in',
        paymentMethod: 'CASH',
        items: cartItems.map(x => ({ menuItemId: x.item.id, quantity: x.qty }))
      }
      const { data } = await api.post('/orders/guest', payload)
      setPlaced(data)
      setStep('done')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  if (!restaurantId) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <div className="text-center">
        <p className="text-5xl mb-4">📷</p>
        <p className="text-lg font-semibold">Invalid QR Code</p>
        <p className="text-sm mt-1">Please scan a valid restaurant QR code</p>
      </div>
    </div>
  )

  if (!restaurant) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin text-4xl">🍽️</div>
    </div>
  )

  if (step === 'done' && placed) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-4">Order #{placed.id}</p>
        {tableNumber && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
            <p className="text-orange-700 font-semibold">Table {tableNumber}</p>
            <p className="text-orange-600 text-sm">Your food will be served at your table</p>
          </div>
        )}
        <div className="text-left space-y-1 mb-4 text-sm text-gray-600">
          {cartItems.map(x => (
            <div key={x.item.id} className="flex justify-between">
              <span>{x.item.name} × {x.qty}</span>
              <span>₹{(Number(x.item.price) * x.qty).toFixed(0)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-gray-800 border-t pt-2 mt-2">
            <span>Total</span><span>₹{cartTotal.toFixed(0)}</span>
          </div>
        </div>
        <button onClick={() => { setCart({}); setStep('menu'); setPlaced(null) }}
                className="btn-primary w-full">Order More</button>
      </div>
    </div>
  )

  if (step === 'checkout') return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <button onClick={() => setStep('menu')} className="text-primary mb-4 flex items-center gap-1 text-sm">
          ← Back to menu
        </button>
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Your Order</h2>
          <div className="space-y-2 mb-4">
            {cartItems.map(x => (
              <div key={x.item.id} className="flex justify-between text-sm">
                <span>{x.item.name} × {x.qty}</span>
                <span className="font-medium">₹{(Number(x.item.price) * x.qty).toFixed(0)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total</span><span>₹{cartTotal.toFixed(0)}</span>
            </div>
          </div>
          {tableNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
              📍 Ordering for <strong>Table {tableNumber}</strong>
            </div>
          )}
          <div className="space-y-3">
            <input className="input" placeholder="Your name *" value={name}
                   onChange={e => setName(e.target.value)} />
            <input className="input" placeholder="Phone (optional)" value={phone}
                   onChange={e => setPhone(e.target.value)} />
          </div>
          <button onClick={placeOrder} disabled={placing}
                  className="btn-primary w-full mt-4 py-3 text-base">
            {placing ? '⏳ Placing...' : `✅ Place Order • ₹${cartTotal.toFixed(0)}`}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {restaurant.logoUrl
            ? <img src={restaurant.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
            : <span className="text-2xl">🍽️</span>
          }
          <div className="flex-1">
            <h1 className="font-bold text-gray-800">{restaurant.name}</h1>
            <p className="text-xs text-gray-500">
              {tableNumber ? `Table ${tableNumber}` : 'Dine-in'} • {restaurant.cuisineType}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {!restaurant.isOpen && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm text-center">
            This restaurant is currently closed. Please come back later.
          </div>
        )}

        {/* Menu */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <h2 className="text-base font-bold text-gray-700 mb-3 sticky top-16 bg-gray-50 py-1">{cat}</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                        {item.isVeg ? '🥗' : '🍗'}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                        <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                      </span>
                      <p className="font-medium text-sm truncate">{item.name}</p>
                    </div>
                    {item.description && <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>}
                    <p className="font-bold text-gray-800 mt-1">₹{item.price}</p>
                  </div>
                  {restaurant.isOpen && (
                    qty(item.id) === 0 ? (
                      <button onClick={() => add(item)}
                              className="btn-primary px-4 py-1.5 text-sm flex-shrink-0">
                        <FiPlus size={14} className="inline mr-1" />ADD
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 border border-primary rounded-lg overflow-hidden flex-shrink-0">
                        <button onClick={() => remove(item.id)}
                                className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10">
                          <FiMinus size={13} />
                        </button>
                        <span className="w-6 text-center font-bold text-primary text-sm">{qty(item.id)}</span>
                        <button onClick={() => add(item)}
                                className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10">
                          <FiPlus size={13} />
                        </button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {uncategorized.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3 mb-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              {item.isVeg ? '🥗' : '🍗'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="font-bold text-gray-800 mt-1">₹{item.price}</p>
            </div>
            {restaurant.isOpen && (
              qty(item.id) === 0 ? (
                <button onClick={() => add(item)} className="btn-primary px-4 py-1.5 text-sm">ADD</button>
              ) : (
                <div className="flex items-center gap-1 border border-primary rounded-lg overflow-hidden">
                  <button onClick={() => remove(item.id)} className="w-8 h-8 flex items-center justify-center text-primary"><FiMinus size={13}/></button>
                  <span className="w-6 text-center font-bold text-primary text-sm">{qty(item.id)}</span>
                  <button onClick={() => add(item)} className="w-8 h-8 flex items-center justify-center text-primary"><FiPlus size={13}/></button>
                </div>
              )
            )}
          </div>
        ))}

        {menu.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p>Menu not available</p>
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-30">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep('checkout')}
                    className="w-full bg-primary text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-2xl font-semibold text-base">
              <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{cartCount} items</span>
              <span className="flex items-center gap-2"><FiShoppingCart size={18}/> View Cart</span>
              <span>₹{cartTotal.toFixed(0)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
