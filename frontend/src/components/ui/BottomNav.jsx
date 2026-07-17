import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiHome, FiSearch, FiShoppingCart, FiList, FiUser } from 'react-icons/fi'
import { selectCartCount } from '@/features/cart/cartSlice'

export default function BottomNav() {
  const { user } = useSelector(s => s.auth)
  const cartCount = useSelector(selectCartCount)

  if (!user?.roles?.includes('ROLE_CUSTOMER')) return null

  const tabs = [
    { to: '/',        icon: FiHome,        label: 'Home' },
    { to: '/search',  icon: FiSearch,      label: 'Search' },
    { to: '/cart',    icon: FiShoppingCart,label: 'Cart',   badge: cartCount },
    { to: '/orders',  icon: FiList,        label: 'Orders' },
    { to: '/profile', icon: FiUser,        label: 'Profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex md:hidden safe-area-pb">
      {tabs.map(({ to, icon: Icon, label, badge }) => (
        <NavLink key={to} to={to} end={to === '/'}
                 className={({ isActive }) =>
                   `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors min-w-0
                    ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
          <div className="relative">
            <Icon size={21}/>
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
          <span className="truncate w-full text-center">{label}</span>
        </NavLink>
      ))}
    </div>
  )
}
