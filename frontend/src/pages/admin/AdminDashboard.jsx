import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiUsers, FiShoppingBag, FiDollarSign, FiHome, FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats,  setStats]   = useState(null)
  const [pending, setPending] = useState([])
  const [surge,  setSurge]   = useState(null)

  useEffect(() => {
    api.get('/admin/analytics/dashboard').then(r => setStats(r.data)).catch(() => {})
    api.get('/restaurants?status=PENDING_APPROVAL&size=20').then(r => setPending(r.data.content || [])).catch(() => {})
    api.get('/surge/status').then(r => setSurge(r.data)).catch(() => {})
  }, [])

  const toggleSurge = async () => {
    const { data } = await api.post(`/surge/admin/toggle?enabled=${!surge.active}`)
    setSurge(prev => ({ ...prev, active: data.active }))
    toast.success(data.message)
  }

  const approve = async id => {
    await api.patch(`/admin/restaurants/${id}/approve`)
    setPending(prev => prev.filter(r => r.id !== id))
    toast.success('Restaurant approved ✅')
  }

  const reject = async id => {
    await api.patch(`/admin/restaurants/${id}/reject`)
    setPending(prev => prev.filter(r => r.id !== id))
    toast.success('Restaurant rejected')
  }

  const STAT_CARDS = stats ? [
    { label: t('total_orders'),   value: stats.totalOrders,      icon: <FiShoppingBag size={20}/>, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200' },
    { label: t('delivered'),      value: stats.deliveredOrders,  icon: <FiCheckCircle size={20}/>, color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200' },
    { label: t('revenue'),  value: `₹${Number(stats.totalRevenue || 0).toFixed(0)}`, icon: <FiDollarSign size={20}/>, color: 'text-primary', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200' },
    { label: 'Restaurants',    value: stats.totalRestaurants, icon: <FiHome size={20}/>,        color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200' },
    { label: t('customers'),      value: stats.totalCustomers,   icon: <FiUsers size={20}/>,       color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200' },
    { label: t('pending'),    value: stats.pendingOrders,    icon: <FiClock size={20}/>,       color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200' },
  ] : []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold dark:text-white">📊 {t('admin_dashboard')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Platform overview and management</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { to: '/admin/users',       label: '👥 Users',        color: 'bg-blue-500' },
          { to: '/admin/analytics',   label: '📈 Analytics',    color: 'bg-green-500' },
          { to: '/finance',           label: '💰 Finance',      color: 'bg-purple-500' },
          { to: '/admin/complaints',  label: '🎧 Complaints',   color: 'bg-orange-500' },
          { to: '/admin/coupons',     label: '🎟️ Coupons',     color: 'bg-pink-500' },
          { to: '/admin/kyc',         label: '✅ KYC',          color: 'bg-teal-500' },
          { to: '/admin/collections', label: '🍽️ Collections', color: 'bg-yellow-500' },
          { to: '/marketing',         label: '📣 Marketing',    color: 'bg-indigo-500' },
          { to: '/superadmin',        label: '🌐 Super Admin',  color: 'bg-red-500' },
        ].map(l => (
          <Link key={l.to} to={l.to}
                className={`${l.color} text-white rounded-xl px-4 py-3 text-sm font-semibold text-center hover:opacity-90 transition-opacity shadow-sm`}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Surge pricing */}
      {surge && (
        <div className={`card mb-6 flex items-center justify-between border-2 ${surge.active ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="font-bold dark:text-white">Surge Pricing</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {surge.active ? `🔴 Active — ${surge.reason} (${surge.multiplier}x delivery fee)` : `🟢 Inactive — normal delivery fees`}
              </p>
            </div>
          </div>
          <button onClick={toggleSurge}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${surge.active ? 'bg-red-500 text-white hover:bg-red-600' : 'btn-primary'}`}>
            {surge.active ? t('disable_surge') : t('enable_surge')}
          </button>
        </div>
      )}

      {/* Stat cards */}
      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {STAT_CARDS.map(s => (
            <div key={s.label} className={`card border ${s.border} ${s.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={s.color}>{s.icon}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">All time</span>
              </div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100 dark:bg-gray-700"/>)}
        </div>
      )}

      {/* Orders by status */}
      {stats?.ordersByStatus && (
        <div className="card mb-8">
          <h2 className="font-bold text-lg mb-4 dark:text-white">Orders by Status</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="font-extrabold text-xl dark:text-white">{count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{status.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending approvals */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg dark:text-white">
            🏪 {t('pending_approvals')}
          </h2>
          {pending.length > 0 && (
            <span className="badge bg-yellow-100 text-yellow-700 font-bold">{pending.length} pending</span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FiCheckCircle size={32} className="mx-auto mb-2 text-green-400"/>
            <p>All caught up! No pending approvals.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div>
                  <p className="font-semibold dark:text-white">{r.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{r.city} • {r.storeType} • {r.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reject(r.id)}
                          className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">
                    ✕ {t('reject')}
                  </button>
                  <button onClick={() => approve(r.id)} className="btn-primary text-sm px-3 py-1.5">
                    ✓ {t('approve')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
