import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, markAllRead } from '@/features/notifications/notificationsSlice'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiBell, FiTrash2, FiCheckCircle } from 'react-icons/fi'

const TYPE_ICONS = {
  ORDER_UPDATE:    '📦',
  OFFER:           '🎁',
  DELIVERY_UPDATE: '🛵',
  SYSTEM:          '⚙️',
  INFO:            'ℹ️',
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { list, unreadCount, loading } = useSelector(s => s.notifications)

  useEffect(() => { dispatch(fetchNotifications()) }, [])

  const handleMarkAllRead = async () => {
    await dispatch(markAllRead())
    toast.success('All marked as read')
  }

  const handleDelete = async (id) => {
    await api.delete(`/notifications/${id}`)
    dispatch(fetchNotifications())
  }

  const handleRead = async (id) => {
    await api.patch(`/notifications/${id}/read`)
    dispatch(fetchNotifications())
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold dark:text-white">{t('notifications')}</h1>
          {unreadCount > 0 && (
            <span className="badge bg-primary text-white">{unreadCount} {t('new_orders').split(' ')[0].toLowerCase()}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-sm text-primary hover:underline">
            <FiCheckCircle size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse h-16 bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FiBell size={48} className="mx-auto mb-4 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(n => (
            <div key={n.id}
                 className={`card flex items-start gap-3 cursor-pointer transition-colors
                   ${!n.read ? 'border-l-4 border-l-primary bg-orange-50 dark:bg-orange-900/10' : ''}`}
                 onClick={() => !n.read && handleRead(n.id)}>
              <span className="text-2xl flex-shrink-0">{TYPE_ICONS[n.type] || 'ℹ️'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm dark:text-white">{n.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                <button onClick={e => { e.stopPropagation(); handleDelete(n.id) }}
                        className="p-1 text-gray-400 hover:text-red-500">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
