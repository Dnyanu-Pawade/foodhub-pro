import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function ScheduledOrdersPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/orders/scheduled').then(r => setOrders(r.data)).catch(() => setOrders([])).finally(() => setLoading(false))
  }, [])

  const cancel = async (id) => {
    if (!confirm('Cancel this scheduled order?')) return
    await api.delete(`/orders/scheduled/${id}`)
    setOrders(o => o.filter(x => x.id !== id))
    toast.success('Scheduled order cancelled')
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">⏰ Scheduled Orders</h1>
        <button onClick={() => navigate('/')} className="btn-primary text-sm">+ Schedule New Order</button>
      </div>

      <div className="card mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 text-sm text-blue-700 dark:text-blue-300">
        📅 Schedule orders up to 7 days in advance. Your order will be placed automatically at the scheduled time.
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">⏰</p>
          <p className="font-medium mb-2">No scheduled orders</p>
          <p className="text-sm">Browse restaurants and schedule your next meal!</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">Browse Restaurants</button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold dark:text-white">{o.restaurantName}</p>
                  <p className="text-sm text-gray-500">{o.items?.map(i => `${i.itemName} ×${i.quantity}`).join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">₹{o.totalAmount}</p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Scheduled</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <span>📅</span>
                  <span>{new Date(o.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <button onClick={() => cancel(o.id)} className="text-sm text-red-500 hover:text-red-700">Cancel</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
