import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import { FiSearch, FiX, FiClock, FiFilter } from 'react-icons/fi'
import toast from 'react-hot-toast'

const RECENT_KEY = 'foodhub_recent_searches'
const TRENDING = ['Biryani', 'Pizza', 'Burger', 'Paneer', 'Noodles', 'Dosa', 'Rolls', 'Thali']

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'rating',    label: '⭐ Rating' },
  { key: 'delivery',  label: '⚡ Delivery Time' },
  { key: 'cost_low',  label: '💰 Cost: Low to High' },
]

const FILTERS = [
  { key: 'veg',       label: '🟢 Pure Veg' },
  { key: 'top_rated', label: '⭐ Rating 4.0+' },
  { key: 'fast',      label: '⚡ Under 30 min' },
  { key: 'free_del',  label: '🚚 Free Delivery' },
  { key: 'open',      label: '🟩 Open Now' },
]

const CUISINE_FILTERS = [
  '🍕 Pizza','🍔 Burger','🍱 Biryani','🍜 Chinese',
  '🥗 Healthy','🌮 Snacks','🍦 Desserts','☕ Cafe',
  '🍛 North Indian','🥘 South Indian','🍣 Sushi','🥙 Wraps',
]

export default function SearchPage() {
  const { t } = useTranslation()
  const [query,         setQuery]         = useState('')
  const [suggestions,   setSuggestions]   = useState([])
  const [results,       setResults]       = useState([])
  const [tab,           setTab]           = useState('restaurants')
  const [loading,       setLoading]       = useState(false)
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  )
  const [sortBy,        setSortBy]        = useState('relevance')
  const [activeFilters, setActiveFilters] = useState(new Set())
  const [cuisineFilter, setCuisineFilter] = useState('')
  const [showFilters,   setShowFilters]   = useState(false)
  const [nearMe,        setNearMe]        = useState(false)
  const [nearMeLoading, setNearMeLoading] = useState(false)
  const inputRef    = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const saveRecent = (q) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 6)
    setRecentSearches(updated)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  }

  const handleInput = (val) => {
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (val.length < 2) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search/autocomplete?q=${encodeURIComponent(val)}`)
        setSuggestions(data)
      } catch {}
    }, 250)
  }

  const doNearMe = () => {
    if (!navigator.geolocation) { toast.error('GPS not supported'); return }
    setNearMeLoading(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setNearMe(true)
        setLoading(true)
        try {
          const { data } = await api.get(`/restaurants?lat=${lat}&lng=${lng}&radius=10&size=20`)
          setResults(data.content || [])
          setQuery('')
          toast.success('📍 Showing restaurants near you!')
        } catch {
          toast.error('Could not load nearby restaurants')
        } finally { setLoading(false) }
        setNearMeLoading(false)
      },
      () => { toast.error('Location access denied'); setNearMeLoading(false) },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const doSearch = async (q = query) => {
    if (!q.trim()) return
    saveRecent(q)
    setSuggestions([])
    setLoading(true)
    try {
      if (tab === 'dishes') {
        const { data } = await api.get(`/search/dishes?q=${encodeURIComponent(q)}`)
        setResults(data)
      } else {
        const { data } = await api.get(`/restaurants?search=${encodeURIComponent(q)}&size=20`)
        setResults(data.content || [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  const clearRecent = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_KEY)
  }

  const toggleFilter = (key) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const applyFiltersAndSort = (data) => {
    let out = [...data]
    if (activeFilters.has('veg'))       out = out.filter(r => r.isVeg || r.pureVeg)
    if (activeFilters.has('top_rated')) out = out.filter(r => (r.avgRating || 0) >= 4.0)
    if (activeFilters.has('fast'))      out = out.filter(r => (r.avgDeliveryTimeMinutes || 99) <= 30)
    if (activeFilters.has('free_del'))  out = out.filter(r => r.deliveryFee === 0)
    if (activeFilters.has('open'))      out = out.filter(r => r.isOpen)
    if (cuisineFilter) out = out.filter(r => r.cuisineType?.toLowerCase().includes(cuisineFilter.toLowerCase().replace(/^\S+\s/, '')))
    if (sortBy === 'rating')   out.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
    if (sortBy === 'delivery') out.sort((a, b) => (a.avgDeliveryTimeMinutes || 99) - (b.avgDeliveryTimeMinutes || 99))
    if (sortBy === 'cost_low') out.sort((a, b) => (a.minOrderAmount || 0) - (b.minOrderAmount || 0))
    return out
  }

  const displayed = tab === 'restaurants' ? applyFiltersAndSort(results) : results

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Search bar */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input ref={inputRef}
               className="input pl-11 pr-10 py-3 text-base rounded-xl dark:bg-gray-800 dark:text-white"
               placeholder={t('search_placeholder')}
               value={query}
               onChange={e => handleInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && doSearch()} />
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); setResults([]) }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <FiX size={18} />
          </button>
        )}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 mt-1">
            {suggestions.map(s => (
              <button key={s} onClick={() => { setQuery(s); doSearch(s) }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm dark:text-white">
                <FiSearch size={14} className="text-gray-400" /> {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Near Me button */}
      <button onClick={doNearMe} disabled={nearMeLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors mb-4
                ${nearMe ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 dark:text-gray-300 dark:border-gray-600 hover:border-primary hover:text-primary'}`}>
        {nearMeLoading ? '⏳' : '📍'} {nearMeLoading ? 'Getting location...' : nearMe ? 'Showing Near You' : 'Near Me'}
        {nearMe && <button type="button" onClick={e => { e.stopPropagation(); setNearMe(false); setResults([]) }}
                           className="ml-1 text-white/80 hover:text-white">✕</button>}
      </button>

      {/* Tabs + Filter button */}
      <div className="flex gap-2 mb-4 items-center">
        {[['restaurants','🍽️ Restaurants'], ['dishes','🥘 Dishes']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); if (query) doSearch() }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${tab === key ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
            {label}
          </button>
        ))}
        {tab === 'restaurants' && (
          <button onClick={() => setShowFilters(f => !f)}
                  className={`ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border transition-colors
                    ${showFilters || activeFilters.size > 0 ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
            <FiFilter size={14} /> Filters {activeFilters.size > 0 && `(${activeFilters.size})`}
          </button>
        )}
      </div>

      {/* Filter + Sort panel */}
      {showFilters && tab === 'restaurants' && (
        <div className="card mb-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">FILTER BY</p>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => toggleFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                          ${activeFilters.has(f.key) ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">CUISINE</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCuisineFilter('')}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                        ${!cuisineFilter ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                All
              </button>
              {CUISINE_FILTERS.map(c => (
                <button key={c} onClick={() => setCuisineFilter(cuisineFilter === c ? '' : c)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                          ${cuisineFilter === c ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">SORT BY</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                          ${sortBy === s.key ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent searches */}
      {!query && recentSearches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('recent_searches')}</span>
            <button onClick={clearRecent} className="text-xs text-red-400 hover:text-red-600">{t('clear')}</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map(s => (
              <button key={s} onClick={() => { setQuery(s); doSearch(s) }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                <FiClock size={12} className="text-gray-400" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {!query && (
        <div className="mb-6">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2">🔥 Trending</span>
          <div className="flex flex-wrap gap-2">
            {TRENDING.map(s => (
              <button key={s} onClick={() => { setQuery(s); doSearch(s) }}
                      className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 rounded-full text-sm hover:bg-orange-100 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-20 bg-gray-100 dark:bg-gray-700" />)}
        </div>
      ) : displayed.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{displayed.length} {t('results_for')} "{query}"</p>
          {tab === 'restaurants' ? displayed.map(r => (
            <Link key={r.id} to={`/restaurant/${r.id}`}
                  className="card flex items-center gap-4 hover:shadow-md transition-shadow block">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {r.logoUrl
                  ? <img src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                }
              </div>
              <div className="flex-1">
                <p className="font-semibold dark:text-white">{r.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{r.cuisineType} • {r.city}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span>⭐ {r.avgRating?.toFixed(1) || 'New'}</span>
                  <span>🕐 {r.avgDeliveryTimeMinutes} min</span>
                  <span>{r.deliveryFee === 0 ? '🆓 Free delivery' : `₹${r.deliveryFee}`}</span>
                </div>
              </div>
              {!r.isOpen && <span className="badge bg-red-100 text-red-600 text-xs flex-shrink-0">Closed</span>}
            </Link>
          )) : displayed.map(item => (
            <Link key={item.id} to={`/restaurant/${item.restaurant?.id}`}
                  className="card flex items-center gap-4 hover:shadow-md transition-shadow block">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">{item.isVeg ? '🥗' : '🍗'}</div>
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                    <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </span>
                  <p className="font-semibold dark:text-white">{item.name}</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.restaurant?.name} • {item.category}</p>
                <p className="text-primary font-semibold text-sm mt-0.5">₹{item.price}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : query && !loading ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p>No results for "{query}"</p>
          <p className="text-sm mt-2">Try a different search term</p>
        </div>
      ) : null}
    </div>
  )
}
