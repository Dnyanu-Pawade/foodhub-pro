import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import RestaurantCard from '@/components/ui/RestaurantCard'
import { EmptyState, RestaurantCardSkeleton } from '@/components/ui/Skeletons'
import toast from 'react-hot-toast'

export default function FavoritesPage() {
  const { t } = useTranslation()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading]     = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/favorites').then(r => setFavorites(r.data)).finally(() => setLoading(false))
  }, [])

  const removeFavorite = async (restaurantId) => {
    await api.post(`/favorites/${restaurantId}`)
    setFavorites(f => f.filter(r => r.id !== restaurantId))
    toast.success('Removed from favorites')
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <RestaurantCardSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">❤️ {t('my_favorites')}</h1>
      {favorites.length === 0 ? (
        <EmptyState type="favorites" action={() => navigate('/')} actionLabel={t('browse_restaurants')} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map(r => (
            <div key={r.id} className="relative">
              <RestaurantCard restaurant={r} />
              <button onClick={() => removeFavorite(r.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-red-500 hover:bg-red-50">
                ❤️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
