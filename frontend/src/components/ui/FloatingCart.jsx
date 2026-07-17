import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { selectCartTotal, selectCartCount } from '@/features/cart/cartSlice'

export default function FloatingCart() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const count     = useSelector(selectCartCount)
  const total     = useSelector(selectCartTotal)
  const cartName  = useSelector(s => s.cart.restaurantName)
  const { user }  = useSelector(s => s.auth)

  // Only show for customers, when cart has items, not on cart page
  if (!user?.roles?.includes('ROLE_CUSTOMER')) return null
  if (count === 0 || location.pathname === '/cart') return null

  return (
    // Show on both mobile and desktop — above bottom nav on mobile
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <button onClick={() => navigate('/cart')}
              className="w-full bg-primary text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-2xl shadow-primary/30 hover:bg-orange-600 active:scale-95 transition-all">
        <div className="flex items-center gap-3">
          <span className="bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {count}
          </span>
          <span className="font-semibold text-sm truncate">{cartName || 'View Cart'}</span>
        </div>
        <span className="font-bold flex-shrink-0">₹{total.toFixed(0)} →</span>
      </button>
    </div>
  )
}
