import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { searchRestaurants } from '@/features/restaurant/restaurantSlice'
import RestaurantCard from '@/components/ui/RestaurantCard'
import { RestaurantCardSkeleton } from '@/components/ui/Skeletons'
import CitySelector from '@/components/ui/CitySelector'
import { FiSearch, FiFilter, FiX, FiClock } from 'react-icons/fi'
import api from '@/services/api'
const CUISINES = ['🍕 Pizza','🍔 Burger','🍱 Biryani','🍜 Chinese','🥗 Healthy','🌮 Snacks','🍦 Desserts','☕ Cafe']

const STORE_TYPES = [
  { labelKey: 'food',  value: 'RESTAURANT', emoji: '🍽️' },
  { labelKey: 'grocery', value: 'GROCERY', emoji: '🛒' },
  { labelKey: 'pharmacy', value: 'PHARMACY', emoji: '💊' },
]

const SORT_OPTIONS = [
  { labelKey: 'relevance',   value: 'relevance' },
  { labelKey: 'rating_sort', value: 'rating',        emoji: '⭐' },
  { labelKey: 'fastest',     value: 'delivery_time', emoji: '🚀' },
  { labelKey: 'low_fee',     value: 'delivery_fee',  emoji: '💰' },
]

// FOMO offers — rotate every 8 seconds
const FOMO_OFFERS = [
  { emoji: '🔥', text: 'FLAT50 — 50% off up to ₹100 on your first order!', code: 'FLAT50', color: 'from-orange-500 to-red-500' },
  { emoji: '🎉', text: 'FREEDEL — Free delivery on orders above ₹199!',    code: 'FREEDEL', color: 'from-green-500 to-teal-500' },
  { emoji: '⚡', text: 'WELCOME50 — ₹50 off for new users. Limited time!', code: 'WELCOME50', color: 'from-purple-500 to-indigo-500' },
]

export default function HomePage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list, totalPages, loading } = useSelector(s => s.restaurant)
  const { selected: citySelected } = useSelector(s => s.city)
  const { user, accessToken } = useSelector(s => s.auth)
  const loyalty = useSelector(s => s.loyalty)

  const [search,       setSearch]       = useState('')
  const [storeType,    setStoreType]    = useState('')
  const [sortBy,       setSortBy]       = useState('relevance')
  const [vegOnly,      setVegOnly]      = useState(false)
  const [openNow,      setOpenNow]      = useState(false)
  const [maxFee,       setMaxFee]       = useState('')
  const [minRating,    setMinRating]    = useState('')
  const [page,         setPage]         = useState(0)
  const [showFilters,  setShowFilters]  = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [cuisine,      setCuisine]      = useState('')
  const [orderAgain,   setOrderAgain]   = useState([])
  const [fomoIdx,      setFomoIdx]      = useState(0)
  const [copiedCode,   setCopiedCode]   = useState(null)
  const [collections,  setCollections]  = useState([])
  const [offers,        setOffers]        = useState([])
  const [trending,      setTrending]      = useState([])

  useEffect(() => {
    api.get('/collections').then(r => setCollections(r.data)).catch(() => {})
    api.get('/coupons/active').then(r => setOffers(r.data?.slice(0,3) || [])).catch(() => {})
    api.get('/recommendations/trending?limit=6').then(r => setTrending(r.data)).catch(() => {})
  }, [])

  const doSearch = (p = 0) => {
    dispatch(searchRestaurants({
      city: citySelected, storeType, search: cuisine ? cuisine.replace(/^\S+\s/, '') : search,
      sortBy, vegOnly: vegOnly || undefined, openNow: openNow || undefined,
      maxDeliveryFee: maxFee || undefined, minRating: minRating || undefined, page: p,
    }))
    setPage(p)
  }

  useEffect(() => { doSearch(0) }, [citySelected, storeType, sortBy, vegOnly, openNow, maxFee, minRating, cuisine])

  useEffect(() => {
    if (user && accessToken) {
      api.get('/orders/my?page=0&size=5').then(r => {
        const orders = r.data?.content || r.data || []
        const seen = new Set()
        const unique = orders.filter(o => {
          if (seen.has(o.restaurantId)) return false
          seen.add(o.restaurantId); return true
        }).slice(0, 4)
        setOrderAgain(unique)
      }).catch(() => {})
    }
  }, [user, accessToken])


  // Rotate FOMO banner every 8s
  useEffect(() => {
    const t = setInterval(() => setFomoIdx(i => (i + 1) % FOMO_OFFERS.length), 8000)
    return () => clearInterval(t)
  }, [])

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const activeFilterCount = [vegOnly, openNow, maxFee, minRating].filter(Boolean).length
  const offer = FOMO_OFFERS[fomoIdx]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* FOMO Offer Banner */}
      <div className={`bg-gradient-to-r ${offer.color} text-white rounded-2xl px-5 py-3 mb-6 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{offer.emoji}</span>
          <p className="font-semibold text-sm md:text-base">{offer.text}</p>
        </div>
        <button onClick={() => copyCode(offer.code)}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap">
          {copiedCode === offer.code ? '✅ Copied!' : `Use ${offer.code}`}
        </button>
      </div>

      {/* Loyalty points banner */}
      {user && loyalty?.availablePoints > 0 && (
        <div onClick={() => navigate('/loyalty')}
             className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl px-4 py-2.5 mb-5 flex items-center justify-between cursor-pointer hover:bg-yellow-100 transition">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              You have <span className="font-bold">{loyalty.availablePoints} loyalty points</span> = ₹{(loyalty.availablePoints / 10).toFixed(0)} off your next order!
            </p>
          </div>
          <span className="text-xs text-yellow-600 dark:text-yellow-400">Redeem →</span>
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {t('hero_title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{t('hero_sub')}</p>
      </div>

      {/* Search bar */}
      <form onSubmit={e => { e.preventDefault(); doSearch(0) }}
            className="flex gap-2 mb-4 max-w-2xl mx-auto">
        <input className="input flex-1" placeholder={t('search_placeholder')}
               value={search} onChange={e => setSearch(e.target.value)} />
        <CitySelector />
        <button type="submit" className="btn-primary flex items-center gap-1 px-4">
          <FiSearch size={16} /> {t('search')}
        </button>
        <button type="button" onClick={() => setShowFilters(f => !f)}
                className={`relative btn-outline flex items-center gap-1 px-3
                  ${activeFilterCount > 0 ? 'border-primary text-primary' : ''}`}>
          <FiFilter size={16} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="card max-w-2xl mx-auto mb-4 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm dark:text-white">{t('filters')}</span>
            <button onClick={() => { setVegOnly(false); setOpenNow(false); setMaxFee(''); setMinRating('') }}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <FiX size={12} /> {t('clear_all')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)}
                     className="accent-green-500" />
              <span className="text-green-600 font-medium dark:text-green-400">🟢 {t('veg_only')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={openNow} onChange={e => setOpenNow(e.target.checked)}
                     className="accent-orange-500" />
              <span className="text-orange-600 font-medium dark:text-orange-400 flex items-center gap-1">
                <FiClock size={12} /> {t('open_now')}
              </span>
            </label>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('max_fee')} (₹)</label>
              <input className="input py-1 text-sm" type="number" placeholder="e.g. 50"
                     value={maxFee} onChange={e => setMaxFee(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('min_rating')}</label>
              <select className="input py-1 text-sm" value={minRating}
                      onChange={e => setMinRating(e.target.value)}>
                <option value="">{t('any')}</option>
                {[3, 3.5, 4, 4.5].map(r => (
                  <option key={r} value={r}>⭐ {r}+</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Store type + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {STORE_TYPES.map(st => (
            <button key={st.value} onClick={() => { setStoreType(st.value); setPage(0) }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${storeType === st.value
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary'}`}>
              {st.emoji ? `${st.emoji} ` : ''}{t(st.labelKey)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {SORT_OPTIONS.map(s => (
            <button key={s.value} onClick={() => setSortBy(s.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                      ${sortBy === s.value
                        ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {s.emoji ? `${s.emoji} ` : ''}{t(s.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Order Again */}
      {orderAgain.length > 0 && !search && !cuisine && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3 dark:text-white">🔄 Order Again</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {orderAgain.map(order => (
              <div key={order.id}
                   onClick={() => navigate(`/restaurant/${order.restaurantId}`)}
                   className="flex-shrink-0 w-44 card cursor-pointer hover:shadow-md transition-shadow p-3 border-2 border-transparent hover:border-primary">
                <p className="font-semibold text-sm truncate dark:text-white">{order.restaurantName}</p>
                <p className="text-xs text-gray-400 mt-1 truncate">{order.items?.map(i => i.itemName).join(', ')}</p>
                <p className="text-xs text-primary font-semibold mt-2">Reorder →</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Near You */}
      {trending.length > 0 && !search && !cuisine && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold dark:text-white">🔥 Trending Near You</h2>
            <span className="text-xs text-gray-400">Based on orders in last 24h</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trending.map(r => (
              <a key={r.id} href={`/restaurant/${r.id}`}
                 className="flex-shrink-0 w-48 card p-0 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-28 bg-gray-100 relative">
                  {r.bannerUrl || r.logoUrl
                    ? <img src={r.bannerUrl || r.logoUrl} alt={r.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl bg-orange-50">🍽️</div>
                  }
                  {r.recentOrderCount > 0 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                      🔥 {r.recentOrderCount}+ orders today
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="font-semibold text-sm truncate dark:text-white">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.avgDeliveryTimeMinutes} min • {r.deliveryFee === 0 ? 'Free delivery' : `₹${r.deliveryFee}`}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Offers for you */}
      {offers.length > 0 && !search && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3 dark:text-white">🎁 Offers for you</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {offers.map((offer, i) => {
              const colors = ['from-orange-500 to-red-500','from-green-500 to-teal-500','from-purple-500 to-indigo-500']
              return (
                <div key={offer.id || i}
                     className={`flex-shrink-0 w-64 bg-gradient-to-r ${colors[i % colors.length]} text-white rounded-2xl p-4 shadow-lg`}>
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="font-bold text-sm">{offer.description || offer.code}</p>
                  <p className="text-xs text-white/80 mt-1">
                    {offer.discountType === 'PERCENTAGE'
                      ? `${offer.discountValue}% off`
                      : `₹${offer.discountValue} off`}
                    {offer.minOrderAmount > 0 ? ` on orders above ₹${offer.minOrderAmount}` : ''}
                  </p>
                  <div className="mt-3 bg-white/20 rounded-lg px-3 py-1.5 inline-block">
                    <span className="font-bold text-sm tracking-wider">{offer.code}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Food Collections */}
      {collections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3 dark:text-white">🍽️ What's on your mind?</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {collections.map(col => (
              <button key={col.id}
                      onClick={() => setCuisine(cuisine === col.tag ? '' : col.tag)}
                      className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all w-24
                        ${cuisine === col.tag
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md'}`}>
                <span className="text-3xl">{col.emoji}</span>
                <span className="text-xs font-semibold text-center leading-tight dark:text-white">{col.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cuisine chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <button onClick={() => setCuisine('')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors
                  ${cuisine === '' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
          All
        </button>
        {CUISINES.map(c => (
          <button key={c} onClick={() => setCuisine(cuisine === c ? '' : c)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap
                    ${cuisine === c ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {c}
          </button>
        ))}
      </div>

      {recommendations.length > 0 && !search && !citySelected && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 dark:text-white">🤖 {t('recommended')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendations.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        </div>
      )}

      {/* Restaurant grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold dark:text-white">
          {search || citySelected ? `${t('results_for')} "${search || citySelected}"` : t('all_restaurants')}
          {!loading && <span className="text-sm font-normal text-gray-400 ml-2">({list.length} shown)</span>}
        </h2>
        {openNow && (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
            <FiClock size={11} /> {t('open_now')}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🍽️</p>
          <p>{t('no_results')}</p>
          <button onClick={() => { setVegOnly(false); setOpenNow(false); setMaxFee(''); setMinRating(''); setSearch('') }}
                  className="btn-primary mt-4 text-sm">{t('clear_filters')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => doSearch(page - 1)} disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40">← {t('prev')}</button>
          {[...Array(Math.min(totalPages, 7))].map((_, i) => (
            <button key={i} onClick={() => doSearch(i)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium
                      ${page === i ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => doSearch(page + 1)} disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40">{t('next')} →</button>
        </div>
      )}
    </div>
  )
}
