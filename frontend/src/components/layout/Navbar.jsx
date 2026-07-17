import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '@/features/auth/authSlice'
import { toggleTheme } from '@/features/theme/themeSlice'
import { markAllRead } from '@/features/notifications/notificationsSlice'
import { selectCartCount } from '@/features/cart/cartSlice'
import {
  FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX,
  FiBell, FiSun, FiMoon, FiMapPin, FiGlobe,
  FiHome, FiList, FiHeart, FiDollarSign, FiStar,
  FiGift, FiClock, FiGrid, FiBarChart2, FiSettings,
  FiTruck, FiUsers, FiTag, FiAlertCircle, FiFileText, FiSearch
} from 'react-icons/fi'
import CitySelector from '@/components/ui/CitySelector'
import VoiceSearch from '@/components/VoiceSearch'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',   flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी',   flag: '🇮🇳' },
]

const AUTH_PATHS = ['/login', '/register', '/landing']

const navCls = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary pl-2'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary'
  }`

const TYPE_ICONS = { ORDER_UPDATE: '📦', OFFER: '🎁', DELIVERY_UPDATE: '🛵', SYSTEM: '⚙️', INFO: 'ℹ️' }

export default function Navbar() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { t }     = useTranslation()
  const { user }  = useSelector(s => s.auth)
  const { mode }  = useSelector(s => s.theme)
  const { list: notifs, unreadCount } = useSelector(s => s.notifications)
  const cartCount = useSelector(selectCartCount)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showBell,    setShowBell]    = useState(false)
  const [showLang,    setShowLang]    = useState(false)
  const bellRef = useRef(null)
  const langRef = useRef(null)

  const isCustomer = user?.roles?.includes('ROLE_CUSTOMER')
  const isOwner    = user?.roles?.includes('ROLE_RESTAURANT_OWNER')
  const isAdmin    = user?.roles?.includes('ROLE_ADMIN')
  const isDelivery = user?.roles?.includes('ROLE_DELIVERY_PARTNER')

  const isAuthPage = AUTH_PATHS.includes(location.pathname)

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    const handler = e => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false)
      if (langRef.current && !langRef.current.contains(e.target)) setShowLang(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const changeLang = code => { i18n.changeLanguage(code); localStorage.setItem('lang', code); setShowLang(false) }
  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  if (isAuthPage) return null

  const customerNav = [
    { group: 'Discover', items: [
      { to: '/',                 icon: <FiHome size={16}/>,        label: 'Home' },
      { to: '/search',           icon: <FiSearch size={16}/>,      label: 'Search' },
      { to: '/explore',          icon: <FiGrid size={16}/>,        label: 'Explore' },
    ]},
    { group: 'My Orders', items: [
      { to: '/orders',           icon: <FiList size={16}/>,        label: 'My Orders' },
      { to: '/cart',             icon: <FiShoppingCart size={16}/>,label: 'Cart' },
      { to: '/table-booking',    icon: '🪑',                        label: 'Table Booking' },
      { to: '/scheduled-orders', icon: <FiClock size={16}/>,       label: 'Scheduled Orders' },
    ]},
    { group: 'Rewards', items: [
      { to: '/wallet',           icon: <FiDollarSign size={16}/>,  label: 'Wallet' },
      { to: '/loyalty',          icon: <FiStar size={16}/>,        label: 'Loyalty Points' },
      { to: '/referral',         icon: <FiGift size={16}/>,        label: 'Refer & Earn' },
      { to: '/gift-cards',       icon: <FiGift size={16}/>,        label: 'Gift Cards' },
      { to: '/subscription',     icon: '👑',                        label: 'FoodHub Pro' },
    ]},
    { group: 'Account', items: [
      { to: '/favorites',        icon: <FiHeart size={16}/>,       label: 'Favorites' },
      { to: '/addresses',        icon: <FiMapPin size={16}/>,      label: 'Addresses' },
      { to: '/notifications',    icon: <FiBell size={16}/>,        label: 'Notifications' },
      { to: '/profile',          icon: <FiUser size={16}/>,        label: 'Profile' },
    ]},
  ]

  const ownerNav = [
    { group: 'Restaurant', items: [
      { to: '/owner/dashboard',   icon: <FiGrid size={16}/>,       label: 'Orders Dashboard' },
      { to: '/owner/menu',        icon: <FiList size={16}/>,       label: 'Menu Management' },
      { to: '/owner/restaurants', icon: <FiHome size={16}/>,       label: 'My Restaurants' },
      { to: '/owner/inventory',   icon: <FiList size={16}/>,       label: 'Inventory' },
      { to: '/staff/kitchen',     icon: <FiGrid size={16}/>,       label: 'Kitchen Display' },
    ]},
    { group: 'Business', items: [
      { to: '/owner/analytics',   icon: <FiBarChart2 size={16}/>,  label: 'Analytics' },
      { to: '/owner/payouts',     icon: <FiDollarSign size={16}/>, label: 'Payouts' },
      { to: '/owner/employees',   icon: <FiUsers size={16}/>,      label: 'Employees' },
      { to: '/owner/offers',      icon: <FiTag size={16}/>,        label: 'Offers & Discounts' },
      { to: '/owner/gst',         icon: <FiFileText size={16}/>,   label: 'GST Reports' },
      { to: '/owner/reviews',     icon: <FiStar size={16}/>,       label: 'Customer Reviews' },
    ]},
  ]

  const adminNav = [
    { group: 'Platform', items: [
      { to: '/admin',             icon: <FiGrid size={16}/>,       label: 'Dashboard' },
      { to: '/admin/analytics',   icon: <FiBarChart2 size={16}/>,  label: 'Analytics' },
      { to: '/admin/users',       icon: <FiUsers size={16}/>,      label: 'Users' },
      { to: '/admin/kyc',         icon: <FiFileText size={16}/>,   label: 'KYC Verification' },
      { to: '/admin/collections', icon: <FiGrid size={16}/>,       label: 'Collections' },
    ]},
    { group: 'Operations', items: [
      { to: '/admin/coupons',     icon: <FiTag size={16}/>,        label: 'Coupons' },
      { to: '/admin/complaints',  icon: <FiAlertCircle size={16}/>,label: 'Complaints' },
      { to: '/admin/payouts',     icon: <FiDollarSign size={16}/>, label: 'Payouts' },
      { to: '/admin/commission',  icon: <FiDollarSign size={16}/>, label: 'Commission' },
      { to: '/admin/fraud',       icon: <FiAlertCircle size={16}/>,label: 'Fraud Detection' },
    ]},
    { group: 'Management', items: [
      { to: '/finance',           icon: <FiDollarSign size={16}/>, label: 'Finance' },
      { to: '/marketing',         icon: <FiBarChart2 size={16}/>,  label: 'Marketing' },
      { to: '/support',           icon: <FiUsers size={16}/>,      label: 'Support Portal' },
      { to: '/superadmin',        icon: <FiSettings size={16}/>,   label: 'Super Admin' },
    ]},
  ]

  const deliveryNav = [
    { group: 'Delivery', items: [
      { to: '/delivery/dashboard', icon: <FiTruck size={16}/>,    label: 'Dashboard' },
      { to: '/delivery/kyc',       icon: <FiFileText size={16}/>, label: 'KYC Documents' },
      { to: '/notifications',      icon: <FiBell size={16}/>,     label: 'Notifications' },
      { to: '/profile',            icon: <FiUser size={16}/>,     label: 'Profile' },
    ]},
  ]

  const navGroups = isCustomer ? customerNav : isOwner ? ownerNav : isAdmin ? adminNav : isDelivery ? deliveryNav : []
  const currentLang = LANGS.find(l => l.code === i18n.language) || LANGS[0]
  const roleLabel = isCustomer ? '🛒 Customer'
    : isOwner    ? '🏪 Restaurant Owner'
    : isAdmin    ? '👨‍💼 Admin'
    : isDelivery ? '🛵 Delivery Partner' : 'User'

  return (
    <>
      {/* ── Top Navbar ──────────────────────────────────────────────────── */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Left */}
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => setSidebarOpen(o => !o)}
                      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {sidebarOpen ? <FiX size={20}/> : <FiMenu size={20}/>}
              </button>
            )}
            <Link to={user ? '/' : '/landing'}
                  className="flex items-center gap-1.5 font-extrabold text-primary tracking-tight whitespace-nowrap">
              <span className="text-xl">🍽️</span>
              <span className="text-lg hidden sm:inline">FoodHub Pro</span>
            </Link>
          </div>

          {/* Center: city selector (desktop, customers only) */}
          {user && isCustomer && (
            <div className="hidden md:flex flex-1 max-w-sm items-center gap-2">
              <CitySelector />
            </div>
          )}

          {/* Right */}
          <div className="flex items-center gap-1">
            {!user ? (
              <>
                <Link to="/login"    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-1.5">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-1.5">Sign Up</Link>
              </>
            ) : (
              <>
                {isCustomer && <VoiceSearch />}

                {/* Cart */}
                {isCustomer && (
                  <NavLink to="/cart" className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                    <FiShoppingCart size={20}/>
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </NavLink>
                )}

                {/* Notifications bell */}
                <div className="relative" ref={bellRef}>
                  <button onClick={() => { setShowBell(v => !v); if (!showBell) dispatch(markAllRead()) }}
                          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                    <FiBell size={20}/>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showBell && (
                    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
                        <span className="font-bold text-sm dark:text-white">Notifications</span>
                        <Link to="/notifications" onClick={() => setShowBell(false)} className="text-xs text-primary hover:underline">View all</Link>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifs.length === 0
                          ? <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
                          : notifs.slice(0, 8).map(n => (
                            <div key={n.id} className={`px-4 py-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-orange-50/60 dark:bg-orange-900/10' : ''}`}>
                              <div className="flex gap-3">
                                <span className="text-lg flex-shrink-0">{TYPE_ICONS[n.type] || 'ℹ️'}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold dark:text-white truncate">{n.title}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                </div>
                                {!n.read && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"/>}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>

                {/* Dark mode */}
                <button onClick={() => dispatch(toggleTheme())}
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  {mode === 'dark' ? <FiSun size={18}/> : <FiMoon size={18}/>}
                </button>

                {/* Language */}
                <div className="relative hidden sm:block" ref={langRef}>
                  <button onClick={() => setShowLang(v => !v)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <FiGlobe size={15}/>
                    <span className="hidden lg:inline text-xs font-medium">{currentLang.flag}</span>
                  </button>
                  {showLang && (
                    <div className="absolute right-0 top-11 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 py-1 w-36 overflow-hidden">
                      {LANGS.map(l => (
                        <button key={l.code} onClick={() => changeLang(l.code)}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors
                                  ${i18n.language === l.code ? 'bg-primary/10 text-primary font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                          <span>{l.flag}</span><span>{l.label}</span>
                          {i18n.language === l.code && <span className="ml-auto">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <NavLink to="/profile"
                         className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(user.fullName || user.username || '?')[0].toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300 max-w-20 truncate">
                    {user.fullName?.split(' ')[0] || user.username}
                  </span>
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
          <aside className="relative z-50 w-72 bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {(user?.fullName || user?.username || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm dark:text-white truncate">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium mt-0.5 inline-block">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
                <FiX size={18}/>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
              {navGroups.map(group => (
                <div key={group.group}>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1.5">
                    {group.group}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map(item => (
                      <NavLink key={item.to} to={item.to} className={navCls} end={item.to === '/'}>
                        <span className="flex-shrink-0 w-4 text-center">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer — logout only */}
            <div className="px-3 py-4 border-t dark:border-gray-800 flex-shrink-0">
              <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <FiLogOut size={16}/> <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
