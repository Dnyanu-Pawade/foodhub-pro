import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function OwnerEmployeePage() {
  const [employees, setEmployees] = useState([])
  const [form, setForm]           = useState({ fullName: '', email: '', phone: '', role: 'CHEF', restaurantId: '' })
  const [restaurants, setRestaurants] = useState([])
  const [showForm, setShowForm]   = useState(false)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) {
        setForm(f => ({ ...f, restaurantId: r.data[0].id }))
        loadEmployees(r.data[0].id)
      }
    })
  }, [])

  const loadEmployees = (restaurantId) => {
    api.get(`/owner/employees?restaurantId=${restaurantId}`).then(r => setEmployees(r.data)).catch(() => setEmployees([]))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/owner/employees', form)
      toast.success('Employee added!')
      setShowForm(false)
      setForm(f => ({ ...f, fullName: '', email: '', phone: '' }))
      loadEmployees(form.restaurantId)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const remove = async (id) => {
    if (!confirm('Remove employee?')) return
    await api.delete(`/owner/employees/${id}`)
    setEmployees(e => e.filter(x => x.id !== id))
    toast.success('Removed')
  }

  const ROLE_BADGE = { CHEF: 'bg-orange-100 text-orange-700', CASHIER: 'bg-blue-100 text-blue-700', MANAGER: 'bg-purple-100 text-purple-700' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">👥 Employee Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Employee</button>
      </div>

      {restaurants.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {restaurants.map(r => (
            <button key={r.id} onClick={() => { setForm(f => ({ ...f, restaurantId: r.id })); loadEmployees(r.id) }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${form.restaurantId === r.id ? 'bg-primary text-white' : 'border-gray-200 dark:border-gray-600 dark:text-white'}`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="card mb-6 space-y-3">
          <h2 className="font-semibold dark:text-white">New Employee</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="Full Name" required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
            <input className="input" placeholder="Email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input className="input" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="CHEF">👨🍳 Chef</option>
              <option value="CASHIER">💰 Cashier</option>
              <option value="MANAGER">👔 Manager</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Adding...' : 'Add Employee'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {employees.length === 0 && <div className="text-center py-10 text-gray-400">No employees added yet</div>}
        {employees.map(emp => (
          <div key={emp.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {emp.fullName?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium dark:text-white">{emp.fullName}</p>
                <p className="text-sm text-gray-500">{emp.email} • {emp.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_BADGE[emp.staffRole] || 'bg-gray-100 text-gray-600'}`}>
                {emp.staffRole}
              </span>
              <button onClick={() => remove(emp.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
