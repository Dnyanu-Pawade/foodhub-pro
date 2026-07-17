const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
)

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export function MenuItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  )
}

export function PageSkeleton({ count = 4, Card = RestaurantCardSkeleton }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => <Card key={i} />)}
    </div>
  )
}

// ── Empty state illustrations ──────────────────────────────────────────────
const EMPTY_CONFIGS = {
  orders:     { emoji: '📦', title: 'No orders yet',       sub: 'Your order history will appear here' },
  favorites:  { emoji: '💔', title: 'No favorites yet',    sub: 'Heart restaurants you love to save them here' },
  cart:       { emoji: '🛒', title: 'Your cart is empty',  sub: 'Add items from a restaurant to get started' },
  search:     { emoji: '🔍', title: 'No results found',    sub: 'Try a different search term or filter' },
  reviews:    { emoji: '⭐', title: 'No reviews yet',      sub: 'Be the first to review this restaurant' },
  bookings:   { emoji: '🪑', title: 'No bookings yet',     sub: 'Book a table at your favourite restaurant' },
  default:    { emoji: '😕', title: 'Nothing here yet',    sub: 'Check back later' },
}

export function EmptyState({ type = 'default', action, actionLabel }) {
  const cfg = EMPTY_CONFIGS[type] || EMPTY_CONFIGS.default
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* SVG illustration plate */}
      <div className="relative mb-6">
        <div className="w-32 h-32 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
          <span className="text-6xl">{cfg.emoji}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl">
          ✨
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{cfg.title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">{cfg.sub}</p>
      {action && (
        <button onClick={action}
                className="btn-primary mt-6 px-8">
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  )
}

export function FullPageLoader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  )
}

export default Skeleton
