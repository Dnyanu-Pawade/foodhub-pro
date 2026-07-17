import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED:  'bg-green-100 text-green-700',
  REJECTED:   'bg-red-100 text-red-600',
}

export default function OwnerPayoutPage() {
  const [restaurants, setRestaurants] = useState([])
  const [selected, setSelected]       = useState(null)
  const [summary, setSummary]         = useState(null)
  const [payouts, setPayouts]         = useState([])
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState({ bankAccount: '', ifscCode: '', accountHolderName: '' })
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) setSelected(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    api.get(`/owner/payouts/${selected.id}/summary`).then(r => setSummary(r.data))
    api.get(`/owner/payouts/${selected.id}`).then(r => setPayouts(r.data))
  }, [selected])

  const requestPayout = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/owner/payouts/${selected.id}/request`, form)
      toast.success('Payout request submitted!')
      setShowForm(false)
      api.get(`/owner/payouts/${selected.id}`).then(r => setPayouts(r.data))
      api.get(`/owner/payouts/${selected.id}/summary`).then(r => setSummary(r.data))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-2 dark:text-white">💸 Payout Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Track earnings and request payouts</p>

      {restaurants.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {restaurants.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium
                      ${selected?.id === r.id ? 'bg-primary text-white' : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Revenue',   value: `₹${Number(summary.totalRevenue).toFixed(0)}`,  color: 'text-blue-600' },
              { label: `Commission (${summary.commissionRate}%)`, value: `₹${Number(summary.commission).toFixed(0)}`, color: 'text-red-500' },
              { label: 'Net Earnings',    value: `₹${Number(summary.netEarnings).toFixed(0)}`,   color: 'text-green-600' },
              { label: 'Pending Payout',  value: `₹${Number(summary.pendingPayout).toFixed(0)}`, color: 'text-primary' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold dark:text-white">Payout History</h2>
            {Number(summary.pendingPayout) >= 100 && (
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4">
                💸 Request Payout
              </button>
            )}
          </div>
        </>
      )}

      <div className="space-y-3">
        {payouts.length === 0
          ? <div className="text-center py-10 text-gray-400">No payout requests yet</div>
          : payouts.map(p => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold dark:text-white">₹{Number(p.amount).toFixed(0)}</p>
                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()} • {p.bankAccount}</p>
                {p.adminNote && <p className="text-xs text-gray-500 mt-0.5">Note: {p.adminNote}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                {p.status}
              </span>
            </div>
          ))
        }
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 dark:text-white">Request Payout — ₹{Number(summary?.pendingPayout).toFixed(0)}</h2>
            <form onSubmit={requestPayout} className="space-y-3">
              <input className="input" placeholder="Account Holder Name *" required
                     value={form.accountHolderName} onChange={e => setForm(f => ({ ...f, accountHolderName: e.target.value }))} />
              <input className="input" placeholder="Bank Account Number *" required
                     value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} />
              <input className="input" placeholder="IFSC Code *" required
                     value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
