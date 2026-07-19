import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED:  'bg-green-100 text-green-700',
  REJECTED:   'bg-red-100 text-red-600',
}

export default function DeliveryPayoutPage() {
  const [earnings, setEarnings] = useState(null)
  const [payouts,  setPayouts]  = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ bankAccount: '', ifscCode: '', accountHolderName: '', upiId: '' })
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    api.get('/delivery/earnings').then(r => setEarnings(r.data)).catch(() => {})
    api.get('/delivery/payouts').then(r => setPayouts(r.data)).catch(() => {})
  }, [])

  const requestPayout = async e => {
    e.preventDefault()
    if (!form.bankAccount && !form.upiId) { toast.error('Enter bank account or UPI ID'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/delivery/payouts/request', form)
      setPayouts(p => [data, ...p])
      toast.success('Payout request submitted!')
      setShowForm(false)
      setForm({ bankAccount: '', ifscCode: '', accountHolderName: '', upiId: '' })
      api.get('/delivery/earnings').then(r => setEarnings(r.data))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request')
    } finally { setLoading(false) }
  }

  const pendingAmount = earnings ? Number(earnings.totalEarnings) - payouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((s, p) => s + Number(p.amount), 0) : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 dark:text-white">💸 Earnings & Payouts</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Request withdrawal of your delivery earnings</p>

      {earnings && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Total Earned',    value: `₹${Number(earnings.totalEarnings)}`,  color: 'text-green-600' },
            { label: 'Pending Payout',  value: `₹${Math.max(0, pendingAmount)}`,      color: 'text-primary' },
            { label: 'Total Deliveries', value: earnings.totalDeliveries,             color: 'text-blue-600' },
            { label: 'This Month',      value: `₹${Number(earnings.monthEarnings)}`,  color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold dark:text-white">Payout History</h2>
        {pendingAmount >= 100 && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4">
            💸 Request Payout
          </button>
        )}
        {pendingAmount < 100 && pendingAmount > 0 && (
          <p className="text-xs text-gray-400">Min ₹100 required (have ₹{Math.max(0, pendingAmount).toFixed(0)})</p>
        )}
      </div>

      <div className="space-y-3">
        {payouts.length === 0
          ? <div className="text-center py-10 text-gray-400">No payout requests yet. Complete deliveries to earn!</div>
          : payouts.map(p => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold dark:text-white">₹{Number(p.amount).toFixed(0)}</p>
                <p className="text-xs text-gray-400">
                  {new Date(p.createdAt).toLocaleDateString()} •{' '}
                  {p.upiId ? `UPI: ${p.upiId}` : p.bankAccount}
                </p>
                {p.adminNote && <p className="text-xs text-gray-500 mt-0.5">Note: {p.adminNote}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status] || 'bg-gray-100 text-gray-600'}`}>
                {p.status}
              </span>
            </div>
          ))
        }
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-1 dark:text-white">Request Payout — ₹{Math.max(0, pendingAmount).toFixed(0)}</h2>
            <p className="text-sm text-gray-500 mb-4">Fill bank details or UPI ID</p>
            <form onSubmit={requestPayout} className="space-y-3">
              <input className="input" placeholder="Account Holder Name"
                     value={form.accountHolderName} onChange={e => setForm(f => ({ ...f, accountHolderName: e.target.value }))} />
              <input className="input" placeholder="Bank Account Number"
                     value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} />
              <input className="input" placeholder="IFSC Code"
                     value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))} />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="flex-1 border-t dark:border-gray-600" />
                <span>OR</span>
                <div className="flex-1 border-t dark:border-gray-600" />
              </div>
              <input className="input" placeholder="UPI ID (e.g. name@upi)"
                     value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} />
              <div className="flex gap-2 pt-1">
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
