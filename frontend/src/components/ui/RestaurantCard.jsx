import { Link } from 'react-router-dom'
import { FiStar, FiClock, FiTruck } from 'react-icons/fi'

export default function RestaurantCard({ restaurant }) {
  const { id, name, cuisineType, logoUrl, bannerUrl, avgRating, totalRatings,
          avgDeliveryTimeMinutes, deliveryFee, storeType, isOpen, minOrderAmount,
          isPromoted, recentOrderCount, openTime, createdAt } = restaurant

  const storeIcon = { RESTAURANT: '🍽️', GROCERY: '🛒', PHARMACY: '💊' }[storeType] || '🍽️'

  // "NEW" badge — added within last 7 days
  const isNew = createdAt && (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000

  // Offer badge — free delivery or promoted
  const offerText = deliveryFee === 0 ? '🆓 Free Delivery'
                  : isPromoted       ? '🔥 20% OFF upto ₹100'
                  : null

  // Cuisine tags — split by comma, max 2
  const cuisineTags = cuisineType?.split(',').map(c => c.trim()).filter(Boolean).slice(0, 2) || []

  // Format open time
  const formatTime = (t) => {
    if (!t) return null
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  return (
    <Link to={`/restaurant/${id}`}
          className={`block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group
            ${!isOpen ? 'opacity-75' : ''}`}>

      {/* Image */}
      <div className="h-36 bg-gray-100 relative overflow-hidden">
        {bannerUrl || logoUrl
          ? <img src={bannerUrl || logoUrl} alt={name}
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center text-5xl bg-orange-50">{storeIcon}</div>
        }

        {/* Closed overlay */}
        {!isOpen && (
          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">Closed Now</span>
            {openTime && (
              <span className="text-white text-xs opacity-90">Opens at {formatTime(openTime)}</span>
            )}
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {isNew && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
          )}
          {isPromoted && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">Ad</span>
          )}
        </div>

        {/* Social proof */}
        {recentOrderCount > 0 && isOpen && (
          <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
            🔥 {recentOrderCount} orders today
          </span>
        )}

        {/* Rating pill — top right */}
        {avgRating > 0 && (
          <span className="absolute top-2 right-2 bg-white/95 dark:bg-gray-800/95 text-gray-800 dark:text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
            <FiStar size={10} className="text-yellow-500 fill-yellow-500" />
            {avgRating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm leading-tight">{name}</h3>
          {avgRating === 0 && (
            <span className="text-xs text-gray-400 flex-shrink-0">New</span>
          )}
        </div>

        {/* Cuisine tags */}
        {cuisineTags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {cuisineTags.map(tag => (
              <span key={tag} className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Offer badge */}
        {offerText && isOpen && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-md font-medium">
              {offerText}
            </span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2 mt-1">
          <span className="flex items-center gap-0.5">
            <FiClock size={11} /> {avgDeliveryTimeMinutes} min
          </span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="flex items-center gap-0.5">
            <FiTruck size={11} />
            {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
          </span>
          {minOrderAmount > 0 && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>Min ₹{minOrderAmount}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
