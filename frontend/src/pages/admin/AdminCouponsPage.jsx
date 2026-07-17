import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiTrash2 } from 'react-icons/fi'

const EMPTY = { code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '',
                maxUsageCount: '', perUserLimit: 1, expiryDate: '' }

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm]       = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { api.get('/admin/coupons').then(r => setCoupons(r.data)) }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCreate = async e => {
    e.preventDefault()
    try {
      const { data } = await api.post('/admin/coupons', {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        maxUsageCount: Number(form.maxUsageCount),
        perUserLimit: Number(form.perUserLimit),
      })
      setCoupons(c => [...c, data])
      setForm(EMPTY); setShowForm(false)
      toast.success('Coupon created')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDelete = async id => {
    await api.delete(`/admin/coupons/${id}`)
    setCoupons(c => c.filter(x => x.id !== id))
    toast.success('Coupon deactivated')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">🎟️ Coupon Management</h1>
          <p className="text-gray-500 mt-1">{coupons.length} coupons total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Create Coupon</button>
      </div>

      <div className="space-y-3">
        {coupons.map(c => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <span className="font-bold text-primary text-lg">{c.code}</span>
              <span className={`badge ml-2 ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.active ? 'Active' : 'Inactive'}
              </span>
              <p className="text-sm text-gray-600 mt-1">
                {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                {c.minOrderAmount > 0 && ` • Min order ₹${c.minOrderAmount}`}
                {c.expiryDate && ` • Expires ${new Date(c.expiryDate).toLocaleDateString()}`}
              </p>
              <p className="text-xs text-gray-400">Used: {c.usageCount || 0} / {c.maxUsageCount || '∞'}</p>
            </div>
            <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500">
              <FiTrash2 />
            </button>
          </div>
        ))}
        {coupons.length === 0 && <div className="text-center py-10 text-gray-400">No coupons yet</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Create Coupon</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className="input" placeholder="Coupon code (e.g. SAVE20) *" value={form.code}
                     onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
              <div className="grid grid-cols-2 gap-3">
                <select className="input" value={form.discountType} onChange={set('discountType')}>
                  <option value="PERCENTAGE">Percentage %</option>
                  <option value="FLAT">Flat ₹</option>
                </select>
                <input className="input" placeholder="Discount value *" type="number" value={form.discountValue} onChange={set('discountValue')} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="Min order amount" type="number" value={form.minOrderAmount} onChange={set('minOrderAmount')} />
                <input className="input" placeholder="Max usage count" type="number" value={form.maxUsageCount} onChange={set('maxUsageCount')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="Per user limit" type="number" value={form.perUserLimit} onChange={set('perUserLimit')} />
                <input className="input" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
