import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED:  'bg-green-100 text-green-700',
  REJECTED:   'bg-red-100 text-red-600',
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([])
  const [notes, setNotes]     = useState({})

  const load = () => api.get('/admin/payouts').then(r => setPayouts(r.data))
  useEffect(() => { load() }, [])

  const process = async (id, status) => {
    try {
      await api.patch(`/admin/payouts/${id}/process?status=${status}&note=${notes[id] || ''}`)
      toast.success(`Payout ${status}`)
      load()
    } catch { toast.error('Failed') }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Payout Requests</h1>
      <div className="space-y-4">
        {payouts.length === 0 && <div className="text-center py-10 text-gray-400">No payout requests</div>}
        {payouts.map(p => (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold dark:text-white">{p.restaurant?.name}</p>
                <p className="text-sm text-gray-500">
                  ₹{Number(p.amount).toFixed(0)} • {p.accountHolderName} • {p.bankAccount} • {p.ifscCode}
                </p>
                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>{p.status}</span>
            </div>
            {p.status === 'PENDING' && (
              <div className="flex gap-2 items-center mt-2">
                <input className="input flex-1 text-sm" placeholder="Note (optional)"
                       value={notes[p.id] || ''} onChange={e => setNotes(n => ({ ...n, [p.id]: e.target.value }))} />
                <button onClick={() => process(p.id, 'REJECTED')}
                        className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                  Reject
                </button>
                <button onClick={() => process(p.id, 'PROCESSING')}
                        className="btn-outline text-sm px-3 py-1.5">Processing</button>
                <button onClick={() => process(p.id, 'COMPLETED')} className="btn-primary text-sm px-3 py-1.5">
                  Complete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
