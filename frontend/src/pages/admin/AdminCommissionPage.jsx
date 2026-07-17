import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function AdminCommissionPage() {
  const [restaurants, setRestaurants] = useState([])
  const [editing, setEditing]         = useState({})

  useEffect(() => {
    api.get('/admin/commissions').then(r => setRestaurants(r.data)).catch(() => {})
  }, [])

  const save = async (id) => {
    try {
      await api.patch(`/admin/commissions/${id}`, { commissionRate: editing[id] })
      setRestaurants(r => r.map(x => x.id === id ? { ...x, commissionRate: editing[id] } : x))
      setEditing(e => { const n = { ...e }; delete n[id]; return n })
      toast.success('Commission updated')
    } catch { toast.error('Failed') }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">💸 Commission Management</h1>
      <div className="card mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Commission is deducted from restaurant payouts. Default is 15%. Changes apply to future payouts.
        </p>
      </div>
      <div className="space-y-3">
        {restaurants.length === 0 && <div className="text-center py-10 text-gray-400">No restaurants</div>}
        {restaurants.map(r => (
          <div key={r.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium dark:text-white">{r.name}</p>
              <p className="text-sm text-gray-500">{r.city} • {r.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <input
                  type="number" min="0" max="50" step="0.5"
                  className="input w-20 text-center"
                  value={editing[r.id] ?? r.commissionRate ?? 15}
                  onChange={e => setEditing(prev => ({ ...prev, [r.id]: e.target.value }))}
                />
                <span className="text-gray-500 dark:text-gray-400">%</span>
              </div>
              {editing[r.id] !== undefined && (
                <button onClick={() => save(r.id)} className="btn-primary text-sm px-3 py-1.5">Save</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
