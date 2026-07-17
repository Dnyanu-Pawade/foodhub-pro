import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiUpload, FiUser, FiEdit2, FiShoppingBag, FiHeart, FiStar,
         FiDollarSign, FiGift, FiMapPin, FiBell, FiLogOut, FiChevronRight,
         FiShield, FiClock } from 'react-icons/fi'
import { loginSuccess, logout } from '@/features/auth/authSlice'
import { toggleTheme } from '@/features/theme/themeSlice'

export default function ProfilePage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const { mode } = useSelector(s => s.theme)
  const loyalty  = useSelector(s => s.loyalty)
  const wallet   = useSelector(s => s.wallet)

  const [editing,   setEditing]   = useState(false)
  const [form,      setForm]      = useState({ fullName: user?.fullName || '', phone: user?.phone || '' })
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatar,    setAvatar]    = useState(user?.profileImageUrl || null)

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/users/profile', form)
      dispatch(loginSuccess(data))
      toast.success('Profile updated!')
      setEditing(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally { setSaving(false) }
  }

  const handleAvatarUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/upload/restaurant-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await api.put('/users/profile', { profileImageUrl: data.url })
      setAvatar(data.url)
      toast.success('Profile picture updated!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  const isCustomer = user?.roles?.includes('ROLE_CUSTOMER')

  const QUICK_LINKS = [
    { icon: FiShoppingBag, label: 'My Orders',       to: '/orders',           color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: FiHeart,       label: 'Favourites',      to: '/favorites',        color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
    { icon: FiStar,        label: 'Loyalty Points',  to: '/loyalty',          color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { icon: FiDollarSign,  label: 'Wallet',          to: '/wallet',           color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
    { icon: FiGift,        label: 'Refer & Earn',    to: '/referral',         color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { icon: FiMapPin,      label: 'Saved Addresses', to: '/addresses',        color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { icon: FiClock,       label: 'Scheduled Orders',to: '/scheduled-orders', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { icon: FiBell,        label: 'Notifications',   to: '/notifications',    color: 'text-pink-500',   bg: 'bg-pink-50 dark:bg-pink-900/20' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">

      {/* Profile Header */}
      <div className="card mb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {avatar
              ? <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20" />
              : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-600 text-white flex items-center justify-center text-3xl font-bold ring-4 ring-primary/20">
                  {user?.fullName?.[0]?.toUpperCase() || <FiUser />}
                </div>
            }
            <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1.5 cursor-pointer shadow-md hover:bg-gray-50 transition">
              {uploading ? <span className="text-xs">⏳</span> : <FiUpload size={11} />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold dark:text-white truncate">{user?.fullName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.phone || 'No phone added'}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {user?.roles?.[0]?.replace('ROLE_', '').replace('_', ' ')}
            </span>
          </div>
          <button onClick={() => setEditing(e => !e)}
                  className="p-2 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-primary hover:border-primary transition flex-shrink-0">
            <FiEdit2 size={16} />
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <form onSubmit={handleSave} className="mt-4 pt-4 border-t dark:border-gray-700 space-y-3">
            <input className="input" placeholder="Full Name"
                   value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
            <input className="input" placeholder="Phone Number"
                   value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="btn-outline flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stats row — customers only */}
      {isCustomer && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Link to="/orders" className="card text-center hover:shadow-md transition p-3">
            <p className="text-2xl font-bold text-primary">—</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Orders</p>
          </Link>
          <Link to="/loyalty" className="card text-center hover:shadow-md transition p-3">
            <p className="text-2xl font-bold text-yellow-500">{loyalty?.availablePoints || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Points</p>
          </Link>
          <Link to="/wallet" className="card text-center hover:shadow-md transition p-3">
            <p className="text-2xl font-bold text-green-600">₹{Number(wallet?.balance || 0).toFixed(0)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Wallet</p>
          </Link>
        </div>
      )}

      {/* Quick links grid */}
      {isCustomer && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {QUICK_LINKS.map(({ icon: Icon, label, to, color, bg }) => (
            <Link key={to} to={to}
                  className="card flex flex-col items-center gap-2 p-3 hover:shadow-md transition text-center">
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Settings */}
      <div className="card mb-4">
        <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Settings</h3>
        <div className="space-y-1">
          {/* Dark mode toggle */}
          <div className="flex items-center justify-between py-2.5 px-1">
            <div className="flex items-center gap-3">
              <span className="text-lg">{mode === 'dark' ? '🌙' : '☀️'}</span>
              <span className="text-sm font-medium dark:text-white">{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <button onClick={() => dispatch(toggleTheme())}
                    className={`w-12 h-6 rounded-full transition-colors relative ${mode === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${mode === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {[
            { icon: FiShield, label: 'Privacy Policy',    to: '/privacy' },
            { icon: FiShield, label: 'Terms of Service',  to: '/terms' },
          ].map(({ icon: Icon, label, to }) => (
            <Link key={to} to={to}
                  className="flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition">
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-gray-400" />
                <span className="text-sm dark:text-white">{label}</span>
              </div>
              <FiChevronRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
              className="w-full card flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-semibold py-3">
        <FiLogOut size={18} /> Sign Out
      </button>

      <p className="text-center text-xs text-gray-400 mt-4">FoodHub Pro v1.0.0</p>
    </div>
  )
}
