import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchMyOrders } from '@/features/order/orderSlice'
import { addItem } from '@/features/cart/cartSlice'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import RatingModal from '@/components/ui/RatingModal'
import { EmptyState, OrderCardSkeleton } from '@/components/ui/Skeletons'
import toast from 'react-hot-toast'
import api from '@/services/api'

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better option',
  'Delivery taking too long',
  'Wrong items in order',
  'Other',
]

function CancelModal({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [other,  setOther]  = useState('')
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="font-bold text-lg mb-1 dark:text-white">Cancel Order #{order.id}?</h2>
        <p className="text-sm text-gray-500 mb-4">Please tell us why you're cancelling</p>
        <div className="space-y-2 mb-4">
          {CANCEL_REASONS.map(r => (
            <label key={r} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <input type="radio" name="reason" value={r} checked={reason === r}
                     onChange={() => setReason(r)} className="accent-primary" />
              <span className="text-sm dark:text-gray-300">{r}</span>
            </label>
          ))}
        </div>
        {reason === 'Other' && (
          <textarea className="input resize-none mb-4" rows={2} placeholder="Tell us more..."
                    value={other} onChange={e => setOther(e.target.value)} />
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">Keep Order</button>
          <button onClick={() => onConfirm(reason === 'Other' ? other || 'Other' : reason)}
                  disabled={!reason}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold disabled:opacity-40 hover:bg-red-600 transition">
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderHistoryPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { list, totalPages, loading } = useSelector(s => s.order)

  const [ratingOrder,  setRatingOrder]  = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [page, setPage] = useState(0)

  useEffect(() => { dispatch(fetchMyOrders(0)); setPage(0) }, [])

  const loadMore = () => {
    const next = page + 1
    dispatch(fetchMyOrders(next))
    setPage(next)
  }

  const handleReorder = (order) => {
    order.items.forEach(item => dispatch(addItem({
      id: item.menuItemId, name: item.itemName, price: Number(item.unitPrice),
      restaurantId: order.restaurantId, restaurantName: order.restaurantName
    })))
    toast.success('Items added to cart!')
    navigate('/cart')
  }

  const confirmCancel = async (reason) => {
    try {
      await api.post(`/orders/${cancelTarget.id}/cancel`, null, { params: { reason } })
      toast.success('Order cancelled')
      setCancelTarget(null)
      dispatch(fetchMyOrders(0)); setPage(0)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel')
    }
  }

  const downloadInvoice = (orderId) => window.open(`/api/orders/${orderId}/invoice`, '_blank')

  if (loading && list.length === 0)
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse mb-6" />
        {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
      </div>
    )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">{t('my_orders')}</h1>
      {list.length === 0 ? (
        <EmptyState type="orders" action={() => navigate('/')} actionLabel="Order Now" />
      ) : (
        <div className="space-y-4">
          {list.map(order => (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold dark:text-white">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">{order.restaurantName}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {order.items?.map(i => `${i.itemName} ×${i.quantity}`).join(', ')}
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-lg dark:text-white">₹{order.totalAmount}</span>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => downloadInvoice(order.id)}
                          className="btn-outline text-sm px-3 py-1.5">
                    📄 {t('invoice')}
                  </button>
                  <button onClick={() => navigate(`/orders/${order.id}`)}
                          className="btn-outline text-sm px-3 py-1.5">
                    {t('track')}
                  </button>
                  {['PLACED','CONFIRMED'].includes(order.status) && (
                    <button onClick={() => setCancelTarget(order)}
                            className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                      {t('cancel')}
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <button onClick={() => setRatingOrder(order)}
                            className="btn-outline text-sm px-3 py-1.5">
                      ⭐ {t('rate')}
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <button onClick={() => handleReorder(order)}
                            className="btn-primary text-sm px-3 py-1.5">
                      {t('reorder')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More */}
          {page < totalPages - 1 && (
            <div className="text-center pt-2">
              <button onClick={loadMore} disabled={loading}
                      className="btn-outline px-8 py-2 text-sm">
                {loading ? 'Loading...' : 'Load More Orders'}
              </button>
            </div>
          )}
        </div>
      )}
      {ratingOrder  && <RatingModal order={ratingOrder} onClose={() => setRatingOrder(null)} />}
      {cancelTarget && <CancelModal order={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={confirmCancel} />}
    </div>
  )
}
