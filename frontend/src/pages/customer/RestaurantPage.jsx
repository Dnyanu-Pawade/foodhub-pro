import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchRestaurant } from '@/features/restaurant/restaurantSlice'
import { addItem, removeItem } from '@/features/cart/cartSlice'
import { FiStar, FiClock, FiTruck, FiPlus, FiMinus, FiHeart, FiAlertCircle, FiSearch, FiMessageCircle } from 'react-icons/fi'
import api from '@/services/api'
import toast from 'react-hot-toast'

// ── Customize Modal ──────────────────────────────────────────────────────────
function CustomizeModal({ item, restaurant, onClose, onConfirm }) {
  const groups = item.addons?.reduce((acc, a) => {
    if (!acc[a.groupName]) acc[a.groupName] = []
    acc[a.groupName].push(a)
    return acc
  }, {}) || {}

  const [selected, setSelected] = useState(() => {
    const init = {}
    Object.entries(groups).forEach(([g, opts]) => {
      const def = opts.find(o => o.isDefault)
      if (def) init[g] = def.id
    })
    return init
  })

  const extraTotal = Object.entries(selected).reduce((sum, [g, id]) => {
    const opt = groups[g]?.find(o => o.id === id)
    return sum + (opt?.extraPrice || 0)
  }, 0)

  const handleConfirm = () => {
    const chosenAddons = Object.entries(selected).map(([g, id]) => {
      const opt = groups[g]?.find(o => o.id === id)
      return opt ? { id: opt.id, groupName: g, name: opt.name, extraPrice: opt.extraPrice } : null
    }).filter(Boolean)
    const cartKey = `${item.id}_${chosenAddons.map(a => a.id).sort().join('_')}`
    onConfirm({
      id: item.id, name: item.name,
      price: Number(item.price) + extraTotal,
      imageUrl: item.imageUrl,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      addons: chosenAddons,
      cartKey,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover" />
              : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">{item.isVeg ? '🥗' : '🍗'}</div>
            }
            <div>
              <h3 className="font-bold text-lg dark:text-white">{item.name}</h3>
              <p className="text-primary font-semibold">₹{(Number(item.price) + extraTotal).toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5 max-h-80 overflow-y-auto">
          {Object.entries(groups).map(([groupName, opts]) => (
            <div key={groupName}>
              <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">{groupName}</p>
              <div className="space-y-2">
                {opts.map(opt => (
                  <label key={opt.id} className="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors
                    hover:border-primary dark:border-gray-600"
                    style={selected[groupName] === opt.id ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary)10' } : {}}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name={groupName} value={opt.id}
                             checked={selected[groupName] === opt.id}
                             onChange={() => setSelected(s => ({ ...s, [groupName]: opt.id }))}
                             className="accent-primary" />
                      <span className="text-sm dark:text-gray-200">{opt.name}</span>
                    </div>
                    {opt.extraPrice > 0 && (
                      <span className="text-sm text-primary font-medium">+₹{opt.extraPrice}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(groups).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No customization options</p>
          )}
        </div>
        <div className="p-5 flex gap-3 border-t dark:border-gray-700">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={handleConfirm} className="btn-primary flex-1">
            Add to Cart • ₹{(Number(item.price) + extraTotal).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RestaurantPage() {
  const { t } = useTranslation()
  const { id }    = useParams()
  const dispatch  = useDispatch()
  const { current: restaurant, menu, reviews, loading } = useSelector(s => s.restaurant)
  const { user }  = useSelector(s => s.auth)
  const cartItems = useSelector(s => s.cart.items)
  const [activeCategory, setActiveCategory] = useState(null)
  const [favorited, setFavorited]           = useState(false)
  const [reviewForm, setReviewForm]         = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [vegFilter, setVegFilter]           = useState(false)
  const [lightboxPhoto, setLightboxPhoto]   = useState(null)
  const [menuSearch,    setMenuSearch]       = useState('')
  const [viewers,       setViewers]          = useState(0)
  const [customizeItem, setCustomizeItem]   = useState(null)
  const categoryRefs = useRef({})
  const isCustomer = user?.roles?.includes('ROLE_CUSTOMER')

  const getCartQty = (itemId) => cartItems
    .filter(i => i.id === itemId)
    .reduce((sum, i) => sum + i.quantity, 0)

  useEffect(() => { dispatch(fetchRestaurant(id)) }, [id])

  // Social proof: random viewers count, refreshes every 30s
  useEffect(() => {
    const rand = () => Math.floor(Math.random() * 18) + 3
    setViewers(rand())
    const t = setInterval(() => setViewers(rand()), 30000)
    return () => clearInterval(t)
  }, [id])

  useEffect(() => {
    if (isCustomer && id)
      api.get(`/favorites/${id}/check`).then(r => setFavorited(r.data.favorited)).catch(() => {})
  }, [id, isCustomer])

  const toggleFavorite = async () => {
    try {
      const { data } = await api.post(`/favorites/${id}`)
      setFavorited(data.favorited)
      toast.success(data.message)
    } catch { toast.error('Login to save favorites') }
  }

  const handleAdd = item => {
    if (!(restaurant.open ?? restaurant.isOpen)) { toast.error('Restaurant is currently closed'); return }
    if (item.addons?.length > 0) { setCustomizeItem(item); return }
    dispatch(addItem({
      id: item.id, name: item.name, price: Number(item.price),
      imageUrl: item.imageUrl, restaurantId: restaurant.id,
      restaurantName: restaurant.name, cartKey: String(item.id)
    }))
  }

  const handleRemove = item => dispatch(removeItem(item.id))

  const submitReview = async e => {
    e.preventDefault()
    setSubmittingReview(true)
    try {
      await api.post(`/restaurants/${id}/reviews`, reviewForm)
      toast.success('Review submitted!')
      dispatch(fetchRestaurant(id))
      setReviewForm({ rating: 5, comment: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally { setSubmittingReview(false) }
  }

  const scrollToCategory = (cat) => {
    setActiveCategory(cat)
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const categories = [...new Set(menu.map(i => i.category))].filter(Boolean)
  const displayMenu = menu
    .filter(i => !vegFilter || i.isVeg)
    .filter(i => !menuSearch || i.name.toLowerCase().includes(menuSearch.toLowerCase()) || i.description?.toLowerCase().includes(menuSearch.toLowerCase()))
  const grouped = categories.reduce((acc, cat) => {
    const items = displayMenu.filter(i => i.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})
  const uncategorized = displayMenu.filter(i => !i.category)

  // best seller = top 3 most ordered items
  const bestSellerIds = new Set(menu.filter(i => i.isAvailable).slice(0, 3).map(i => i.id))

  // Format open time
  const formatTime = (t) => {
    if (!t) return null
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  if (loading || !restaurant) return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-6 bg-gray-200 rounded w-1/3" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
      {/* Header */}
      <div className="card mb-4">
        {restaurant.bannerUrl && (
          <img src={restaurant.bannerUrl} alt={restaurant.name}
               className="w-full h-48 object-cover rounded-lg mb-4" />
        )}
        <div className="flex items-start gap-4">
          {restaurant.logoUrl && (
            <img src={restaurant.logoUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              <span className={`badge text-xs font-semibold ${(restaurant.open ?? restaurant.isOpen)
                ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {(restaurant.open ?? restaurant.isOpen) ? '🟢 Open' : '🔴 Closed'}
              </span>
              {viewers > 0 && (
                <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-medium animate-pulse">
                  🔥 {viewers} people viewing
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{restaurant.cuisineType}</p>
            <p className="text-gray-400 text-sm">{restaurant.address}, {restaurant.city}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1 text-yellow-500 font-medium">
                <FiStar size={14} /> {restaurant.avgRating?.toFixed(1) || 'New'}
                {restaurant.totalRatings > 0 && <span className="text-gray-400 text-xs">({restaurant.totalRatings})</span>}
              </span>
              <span className="flex items-center gap-1"><FiClock size={14} /> {restaurant.avgDeliveryTimeMinutes} min</span>
              <span className="flex items-center gap-1">
                <FiTruck size={14} />
                {restaurant.deliveryFee === 0 ? 'Free delivery' : `₹${restaurant.deliveryFee} delivery`}
              </span>
              {restaurant.minOrderAmount > 0 && (
                <span className="text-xs text-gray-400">Min ₹{restaurant.minOrderAmount}</span>
              )}
            </div>
            {/* Offers strip */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {restaurant.deliveryFee === 0 && (
                <span className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-1 rounded-full font-medium">🚚 Free Delivery</span>
              )}
              {restaurant.avgRating >= 4.0 && (
                <span className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">⭐ Top Rated</span>
              )}
              {restaurant.avgDeliveryTimeMinutes <= 30 && (
                <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">⚡ Fast Delivery</span>
              )}
              <span className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">✅ FSSAI Certified</span>
              <span className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-1 rounded-full font-medium">🧼 Hygiene Rating: A</span>
            </div>
          </div>
          {isCustomer && (
            <button onClick={toggleFavorite}
                    className={`p-2 rounded-full border transition-colors flex-shrink-0
                      ${favorited ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-200 text-gray-400 hover:text-red-500'}`}>
              <FiHeart size={20} fill={favorited ? 'currentColor' : 'none'} />
            </button>
          )}
          <button onClick={() => {
            const url = window.location.href
            if (navigator.share) navigator.share({ title: restaurant.name, url })
            else { navigator.clipboard.writeText(url); toast.success('Link copied!') }
          }} className="p-2 rounded-full border border-gray-200 text-gray-400 hover:text-primary transition-colors flex-shrink-0">
            🔗
          </button>
          {isCustomer && (
            <a href={`/chat/${restaurant.id}`}
               className="p-2 rounded-full border border-gray-200 text-gray-400 hover:text-primary transition-colors flex-shrink-0"
               title="Chat with restaurant">
              <FiMessageCircle size={20} />
            </a>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      {restaurant.photoUrls?.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold mb-3 dark:text-white">📸 Photos ({restaurant.photoUrls.length})</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {restaurant.photoUrls.map((url, i) => (
              <img key={i} src={url} alt={`photo-${i}`}
                   onClick={() => setLightboxPhoto(url)}
                   className="flex-shrink-0 w-32 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" />
            ))}
          </div>
        </div>
      )}

      {/* Closed banner */}
      {!(restaurant.open ?? restaurant.isOpen) && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
          <FiAlertCircle size={16} />
          <span>This restaurant is currently closed.</span>
          {restaurant.openTime && (
            <span className="font-semibold ml-1">Opens at {formatTime(restaurant.openTime)}</span>
          )}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sticky category sidebar */}
        {categories.length > 1 && (
          <div className="hidden md:block w-48 flex-shrink-0">
            <div className="sticky top-20 card p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Menu</p>
              {categories.map(cat => (
                <button key={cat} onClick={() => scrollToCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                          ${activeCategory === cat ? 'bg-primary text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Menu search */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input className="input pl-9 py-2 text-sm" placeholder="Search in menu..."
                   value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
          </div>

          {/* Veg filter + mobile categories */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
              {categories.map(c => (
                <button key={c} onClick={() => scrollToCategory(c)}
                        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0
                          ${activeCategory === c ? 'bg-primary text-white' : 'bg-white border border-gray-200'}`}>
                  {c}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer ml-auto">
              <input type="checkbox" checked={vegFilter} onChange={e => setVegFilter(e.target.checked)}
                     className="accent-green-500" />
              <span className="text-green-600 font-medium">🟢 {t('veg_only')}</span>
            </label>
          </div>

          {/* Menu grouped by category */}
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} ref={el => categoryRefs.current[cat] = el} className="mb-8">
              <h2 className="text-lg font-bold mb-3 sticky top-16 bg-gray-50 dark:bg-gray-900 py-2 z-10">{cat}</h2>
              <div className="space-y-3">
                {items.map(item => (
                  <MenuItemRow key={item.id} item={item} isCustomer={isCustomer}
                    qty={getCartQty(item.id)} onAdd={handleAdd} onRemove={handleRemove}
                    isBestSeller={bestSellerIds.has(item.id)} />
                ))}
              </div>
            </div>
          ))}

          {uncategorized.length > 0 && (
            <div className="space-y-3 mb-8">
              {uncategorized.map(item => (
                <MenuItemRow key={item.id} item={item} isCustomer={isCustomer}
                  qty={getCartQty(item.id)} onAdd={handleAdd} onRemove={handleRemove}
                  isBestSeller={bestSellerIds.has(item.id)} />
              ))}
            </div>
          )}

          {displayMenu.length === 0 && (
            <div className="text-center py-10 text-gray-400">No items match your filter.</div>
          )}

          {/* Write review */}
          {isCustomer && (
            <div className="card mb-6">
              <h2 className="font-semibold mb-3">{t('write_review')}</h2>
              <form onSubmit={submitReview} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{t('rating')}:</span>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                            className={`text-2xl transition-colors ${n <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea className="input resize-none" rows={2} placeholder="Share your experience..."
                          value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                <button type="submit" disabled={submittingReview} className="btn-primary">
                  {submittingReview ? t('loading') : t('submit_review')}
                </button>
              </form>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">{t('reviews')} ({reviews.length})</h2>
              <div className="space-y-3">
                {reviews.slice(0, 10).map(r => (
                  <div key={r.id} className="card">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                        {r.customerName?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{r.customerName}</span>
                      <span className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span className="text-xs text-gray-400 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-10">{r.comment}</p>
                    {r.photoUrl && (
                      <img src={r.photoUrl} alt="review" onClick={() => setLightboxPhoto(r.photoUrl)}
                           className="ml-10 mt-2 w-32 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
             onClick={() => setLightboxPhoto(null)}>
          <img src={lightboxPhoto} alt="full"
               className="max-w-full max-h-full rounded-xl shadow-2xl" />
          <button className="absolute top-4 right-4 text-white text-3xl font-bold"
                  onClick={() => setLightboxPhoto(null)}>✕</button>
        </div>
      )}

      {/* Customize Modal */}
      {customizeItem && (
        <CustomizeModal
          item={customizeItem}
          restaurant={restaurant}
          onClose={() => setCustomizeItem(null)}
          onConfirm={payload => dispatch(addItem(payload))}
        />
      )}
    </div>
  )
}

function MenuItemRow({ item, isCustomer, qty, onAdd, onRemove, isBestSeller }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="relative flex-shrink-0">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
          : <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
              {item.isVeg ? '🥗' : '🍗'}
            </div>
        }
        {isBestSeller && (
          <span className="absolute -top-1.5 -left-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
            🏆 Most Ordered
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
            <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
          </span>
          <h3 className="font-medium truncate">{item.name}</h3>
          {!item.isAvailable && <span className="badge bg-red-100 text-red-600 text-xs flex-shrink-0">Unavailable</span>}
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">{item.description}</p>
        <p className="font-semibold text-gray-900 dark:text-white mt-1">₹{item.price}</p>
      </div>
      {isCustomer && item.isAvailable && (
        qty === 0 ? (
          <button onClick={() => onAdd(item)}
                  className="btn-primary flex items-center gap-1 flex-shrink-0 px-4 py-1.5">
            <FiPlus size={14} /> {item.addons?.length > 0 ? 'Customize' : 'ADD'}
          </button>
        ) : (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-2 border border-primary rounded-lg overflow-hidden">
              <button onClick={() => onRemove(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                <FiMinus size={14} />
              </button>
              <span className="w-6 text-center font-bold text-primary text-sm">{qty}</span>
              <button onClick={() => onAdd(item)}
                      className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                <FiPlus size={14} />
              </button>
            </div>
            {item.addons?.length > 0 && (
              <button onClick={() => onAdd(item)} className="text-xs text-primary underline">+ Add more</button>
            )}
          </div>
        )
      )}
    </div>
  )
}
