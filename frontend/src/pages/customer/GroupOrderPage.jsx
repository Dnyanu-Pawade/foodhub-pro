import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItem, clearCart } from '@/features/cart/cartSlice'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiUsers, FiCopy, FiShoppingCart, FiPlus, FiMinus } from 'react-icons/fi'

export default function GroupOrderPage() {
  const { code }   = useParams()
  const navigate   = useNavigate()
  const dispatch   = useDispatch()
  const { user }   = useSelector(s => s.auth)

  const [groupCart, setGroupCart] = useState(null)
  const [menu,      setMenu]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [myItems,   setMyItems]   = useState([]) // items added by this user in this session

  useEffect(() => {
    if (!code) return
    api.get(`/group-cart/${code}`)
      .then(r => {
        setGroupCart(r.data)
        return api.get(`/restaurants/${r.data.restaurantId}/menu`)
      })
      .then(r => setMenu(r.data))
      .catch(() => toast.error('Group cart not found or expired'))
      .finally(() => setLoading(false))
  }, [code])

  const getQty = (itemId) => myItems.find(i => i.id === itemId)?.quantity || 0

  const addToGroup = (item) => {
    setMyItems(prev => {
      const ex = prev.find(i => i.id === item.id)
      if (ex) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), quantity: 1, imageUrl: item.imageUrl }]
    })
  }

  const removeFromGroup = (itemId) => {
    setMyItems(prev => {
      const ex = prev.find(i => i.id === itemId)
      if (!ex) return prev
      if (ex.quantity === 1) return prev.filter(i => i.id !== itemId)
      return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }

  const saveMyItems = async () => {
    if (myItems.length === 0) { toast.error('Add at least one item'); return }
    try {
      // Merge with existing items
      const existing = JSON.parse(groupCart.itemsJson || '[]')
      const merged = [...existing]
      myItems.forEach(mi => {
        const ex = merged.find(e => e.id === mi.id && e.addedBy === (user?.username || 'Guest'))
        if (ex) ex.quantity += mi.quantity
        else merged.push({ ...mi, addedBy: user?.username || 'Guest' })
      })
      const { data } = await api.put(`/group-cart/${code}/items`, { itemsJson: JSON.stringify(merged) })
      setGroupCart(data)
      setMyItems([])
      toast.success('Items added to group cart!')
    } catch { toast.error('Failed to save items') }
  }

  const checkoutGroup = () => {
    if (!groupCart) return
    const items = JSON.parse(groupCart.itemsJson || '[]')
    if (items.length === 0) { toast.error('No items in group cart'); return }
    dispatch(clearCart())
    items.forEach(item => dispatch(addItem({
      id: item.id, name: item.name, price: item.price,
      imageUrl: item.imageUrl, quantity: item.quantity,
      restaurantId: groupCart.restaurantId,
      restaurantName: groupCart.restaurantName,
      cartKey: String(item.id),
    })))
    toast.success('Group cart loaded! Proceeding to checkout.')
    navigate('/cart')
  }

  const shareLink = () => {
    const url = `${window.location.origin}/group-order/${code}`
    if (navigator.share) navigator.share({ title: 'Join my group order!', url })
    else { navigator.clipboard.writeText(url); toast.success('Link copied!') }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="animate-spin text-4xl mb-4">🍽️</div>
      <p className="text-gray-500">Loading group cart...</p>
    </div>
  )

  if (!groupCart) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">
      <p className="text-5xl mb-4">😕</p>
      <p>Group cart not found or has expired.</p>
      <button onClick={() => navigate('/')} className="btn-primary mt-4">Go Home</button>
    </div>
  )

  const allItems = JSON.parse(groupCart.itemsJson || '[]')
  const byPerson = allItems.reduce((acc, item) => {
    const key = item.addedBy || 'Guest'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  const groupTotal = allItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const categories = [...new Set(menu.map(i => i.category))].filter(Boolean)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
      {/* Header */}
      <div className="card mb-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiUsers size={20} />
              <h1 className="text-xl font-bold">Group Order</h1>
            </div>
            <p className="text-orange-100 text-sm">{groupCart.restaurantName}</p>
            <p className="text-orange-200 text-xs mt-1">Created by {groupCart.createdByName}</p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-xl px-4 py-2 mb-2">
              <p className="text-xs text-orange-100">Share Code</p>
              <p className="text-2xl font-extrabold tracking-widest">{groupCart.code}</p>
            </div>
            <button onClick={shareLink}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition">
              <FiCopy size={14} /> Share Link
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Menu */}
        <div>
          <h2 className="font-bold text-lg mb-3 dark:text-white">📋 Menu</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {menu.map(item => (
              <div key={item.id} className="card flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate dark:text-white">{item.name}</p>
                  <p className="text-primary font-semibold text-sm">₹{item.price}</p>
                </div>
                {getQty(item.id) === 0 ? (
                  <button onClick={() => addToGroup(item)}
                          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0">
                    <FiPlus size={12} /> ADD
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 border border-primary rounded-lg overflow-hidden flex-shrink-0">
                    <button onClick={() => removeFromGroup(item.id)}
                            className="w-7 h-7 flex items-center justify-center text-primary hover:bg-primary/10">
                      <FiMinus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-primary">{getQty(item.id)}</span>
                    <button onClick={() => addToGroup(item)}
                            className="w-7 h-7 flex items-center justify-center text-primary hover:bg-primary/10">
                      <FiPlus size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {myItems.length > 0 && (
            <button onClick={saveMyItems} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
              <FiShoppingCart size={16} /> Add {myItems.reduce((s,i)=>s+i.quantity,0)} items to group
            </button>
          )}
        </div>

        {/* Right: Group cart summary */}
        <div>
          <h2 className="font-bold text-lg mb-3 dark:text-white">🛒 Group Cart</h2>
          {allItems.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">🛒</p>
              <p className="text-sm">No items yet. Be the first to add!</p>
            </div>
          ) : (
            <div className="card space-y-4">
              {Object.entries(byPerson).map(([person, items]) => (
                <div key={person}>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    👤 {person}
                  </p>
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="dark:text-gray-300">{item.name} ×{item.quantity}</span>
                        <span className="font-medium dark:text-white">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t dark:border-gray-700 pt-3 flex justify-between font-bold dark:text-white">
                <span>Total</span>
                <span>₹{groupTotal.toFixed(0)}</span>
              </div>
            </div>
          )}

          {/* Only creator can checkout */}
          {groupCart.createdByUserId === user?.id && allItems.length > 0 && (
            <button onClick={checkoutGroup} className="btn-primary w-full mt-4 py-3 text-base">
              🛒 Checkout Group Order • ₹{groupTotal.toFixed(0)}
            </button>
          )}
          {groupCart.createdByUserId !== user?.id && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300 text-center">
              ✅ Your items are added! The host will place the order.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
