import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '@/services/api'
import RestaurantCard from '@/components/ui/RestaurantCard'
import { RestaurantCardSkeleton } from '@/components/ui/Skeletons'

const SECTIONS = [
  { key: 'top_rated', label: '⭐ Top Rated',        sortBy: 'rating' },
  { key: 'fastest',   label: '⚡ Fastest Delivery', sortBy: 'delivery_time' },
  { key: 'free_del',  label: '🆓 Free Delivery',    sortBy: 'delivery_fee' },
]

const MOODS = [
  { emoji: '😋', label: 'Hungry',      query: 'Biryani' },
  { emoji: '🎉', label: 'Celebrating', query: 'Cake' },
  { emoji: '💪', label: 'Healthy',     query: 'Salad' },
  { emoji: '🌙', label: 'Late Night',  query: 'Pizza' },
  { emoji: '☕', label: 'Chill',       query: 'Cafe' },
  { emoji: '🔥', label: 'Spicy',       query: 'Spicy' },
]

const CUISINES = [
  { emoji: '🍱', name: 'Biryani' }, { emoji: '🍕', name: 'Pizza' },
  { emoji: '🍔', name: 'Burger' }, { emoji: '🍜', name: 'Chinese' },
  { emoji: '🥗', name: 'Healthy' }, { emoji: '🍦', name: 'Desserts' },
  { emoji: '☕', name: 'Cafe' }, { emoji: '🌮', name: 'Snacks' },
  { emoji: '🥞', name: 'South Indian' }, { emoji: '🍣', name: 'Sushi' },
  { emoji: '🍛', name: 'North Indian' }, { emoji: '🥙', name: 'Wraps' },
]

function HorizontalScroll({ items, loading }) {
  if (loading) return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {[...Array(4)].map((_, i) => <div key={i} className="flex-shrink-0 w-56"><RestaurantCardSkeleton /></div>)}
    </div>
  )
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {items.slice(0, 10).map(r => (
        <div key={r.id} className="flex-shrink-0 w-56"><RestaurantCard restaurant={r} /></div>
      ))}
    </div>
  )
}

export default function ExplorePage() {
  const navigate = useNavigate()
  const { selected: city } = useSelector(s => s.city)
  const [sections,    setSections]    = useState({})
  const [loading,     setLoading]     = useState({})
  const [mood,        setMood]        = useState(null)
  const [moodResults, setMoodResults] = useState([])
  const [moodLoading, setMoodLoading] = useState(false)

  useEffect(() => {
    SECTIONS.forEach(sec => {
      setLoading(l => ({ ...l, [sec.key]: true }))
      api.get(`/restaurants?sortBy=${sec.sortBy}&size=10${city ? `&city=${encodeURIComponent(city)}` : ''}`)
        .then(r => setSections(s => ({ ...s, [sec.key]: r.data.content || [] })))
        .catch(() => setSections(s => ({ ...s, [sec.key]: [] })))
        .finally(() => setLoading(l => ({ ...l, [sec.key]: false })))
    })
  }, [city])

  const pickMood = async (m) => {
    setMood(m)
    setMoodLoading(true)
    try {
      const { data } = await api.get(`/restaurants?search=${encodeURIComponent(m.query)}&size=8`)
      setMoodResults(data.content || [])
    } catch { setMoodResults([]) }
    finally { setMoodLoading(false) }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold dark:text-white">🧭 Explore</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Discover the best food near you</p>
      </div>

      {/* Mood picker */}
      <div>
        <h2 className="text-lg font-bold mb-4 dark:text-white">What's your mood?</h2>
        <div className="flex gap-3 flex-wrap">
          {MOODS.map(m => (
            <button key={m.label} onClick={() => pickMood(m)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-semibold text-sm transition-all
                      ${mood?.label === m.label
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary hover:scale-105'}`}>
              <span className="text-xl">{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>

        {mood && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3 dark:text-white">{mood.emoji} {mood.label} food near you</h3>
            {moodLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {[...Array(4)].map((_, i) => <div key={i} className="flex-shrink-0 w-56"><RestaurantCardSkeleton /></div>)}
              </div>
            ) : moodResults.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {moodResults.map(r => (
                  <div key={r.id} className="flex-shrink-0 w-56"><RestaurantCard restaurant={r} /></div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4">No results found. Try a different mood!</p>
            )}
          </div>
        )}
      </div>

      {/* Dynamic sections */}
      {SECTIONS.map(sec => (
        <div key={sec.key}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">{sec.label}</h2>
            <button onClick={() => navigate(`/?sortBy=${sec.sortBy}`)}
                    className="text-sm text-primary font-medium hover:underline">
              See all →
            </button>
          </div>
          <HorizontalScroll items={sections[sec.key] || []} loading={!!loading[sec.key]} />
        </div>
      ))}

      {/* Cuisine explorer */}
      <div>
        <h2 className="text-xl font-bold mb-4 dark:text-white">🍽️ Explore by Cuisine</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {CUISINES.map(c => (
            <button key={c.name} onClick={() => navigate(`/?search=${encodeURIComponent(c.name)}`)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary hover:shadow-md transition-all group">
              <span className="text-3xl group-hover:scale-110 transition-transform">{c.emoji}</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table booking CTA */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-extrabold mb-2">🪑 Book a table for dine-in</h2>
          <p className="text-orange-100">Reserve your spot at top restaurants. No waiting, no hassle.</p>
        </div>
        <button onClick={() => navigate('/table-booking')}
                className="bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl hover:bg-orange-50 transition whitespace-nowrap shadow-lg">
          Book Now →
        </button>
      </div>
    </div>
  )
}
