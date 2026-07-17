import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function OwnerOffersPage() {
  const [coupons, setCoupons]     = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [restaurantId, setRestaurantId] = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', usageLimit: '', expiresAt: '', restaurantId: '' })

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) { setRestaurantId(r.data[0].id); setForm(f => ({ ...f, restaurantId: r.data[0].id })) }
    })
    api.get('/admin/coupons').then(r => setCoupons(r.data)).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/coupons', form)
      toast.success('Offer created!')
      setShowForm(false)
      api.get('/admin/coupons').then(r => setCoupons(r.data))
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const toggle = async (id, active) => {
    await api.patch(`/admin/coupons/${id}/toggle?active=${!active}`)
    setCoupons(c => c.map(x => x.id === id ? { ...x, active: !active } : x))
    toast.success(active ? 'Offer deactivated' : 'Offer activated')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">🎁 Offers & Discounts</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Create Offer</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 space-y-3">
          <h2 className="font-semibold dark:text-white">New Offer</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="Coupon Code (e.g. SAVE20)" required value={form.code}
                   onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <select className="input" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat Amount (₹)</option>
            </select>
            <input className="input" type="number" placeholder="Discount Value" required value={form.discountValue}
                   onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} />
            <input className="input" type="number" placeholder="Min Order Amount (₹)" value={form.minOrderAmount}
                   onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
            <input className="input" type="number" placeholder="Max Discount (₹)" value={form.maxDiscountAmount}
                   onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} />
            <input className="input" type="number" placeholder="Usage Limit" value={form.usageLimit}
                   onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
            <input className="input" type="datetime-local" placeholder="Expires At" value={form.expiresAt}
                   onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            {restaurants.length > 1 && (
              <select className="input" value={form.restaurantId} onChange={e => setForm(f => ({ ...f, restaurantId: e.target.value }))}>
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Create Offer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {coupons.length === 0 && <div className="text-center py-10 text-gray-400">No offers yet</div>}
        {coupons.map(c => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-primary text-lg">{c.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                {c.minOrderAmount ? ` • Min ₹${c.minOrderAmount}` : ''}
                {c.expiresAt ? ` • Expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
              </p>
              <p className="text-xs text-gray-400">Used {c.usageCount || 0} / {c.usageLimit || '∞'} times</p>
            </div>
            <button onClick={() => toggle(c.id, c.active)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium ${c.active ? 'bg-red-50 text-red-600 border border-red-200' : 'btn-primary'}`}>
              {c.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
