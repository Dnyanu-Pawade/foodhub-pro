import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiAlertTriangle } from 'react-icons/fi'

const EMPTY = { name: '', unit: 'kg', quantity: 0, lowStockThreshold: 10, category: '' }

export default function OwnerInventoryPage() {
  const [restaurants, setRestaurants] = useState([])
  const [selected, setSelected]       = useState(null)
  const [items, setItems]             = useState([])
  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState(EMPTY)

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) setSelected(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (selected) api.get(`/owner/restaurants/${selected.id}/inventory`).then(r => setItems(r.data))
  }, [selected])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) {
        const { data } = await api.patch(`/owner/restaurants/${selected.id}/inventory/${editing}`,
          { quantity: Number(form.quantity) })
        setItems(i => i.map(x => x.id === editing ? data : x))
        toast.success('Updated')
      } else {
        const { data } = await api.post(`/owner/restaurants/${selected.id}/inventory`,
          { ...form, quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold) })
        setItems(i => [...i, data])
        toast.success('Item added')
      }
      setShowForm(false); setEditing(null); setForm(EMPTY)
    } catch (err) { toast.error('Failed') }
  }

  const handleDelete = async id => {
    await api.delete(`/owner/restaurants/${selected.id}/inventory/${id}`)
    setItems(i => i.filter(x => x.id !== id))
    toast.success('Deleted')
  }

  const lowStock = items.filter(i => i.quantity <= i.lowStockThreshold)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">📦 Inventory Management</h1>
          <p className="text-gray-500 mt-1">{items.length} items • {lowStock.length > 0 ? <span className="text-red-500">{lowStock.length} low stock</span> : 'All stocked'}</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Item
        </button>
      </div>

      {restaurants.length > 1 && (
        <div className="flex gap-2 mb-6">
          {restaurants.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium
                      ${selected?.id === r.id ? 'bg-primary text-white' : 'bg-white border border-gray-200'}`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="card bg-red-50 border-red-200 mb-6">
          <div className="flex items-center gap-2 text-red-600 font-semibold mb-2">
            <FiAlertTriangle /> Low Stock Alert ({lowStock.length} items)
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="badge bg-red-100 text-red-700">{i.name}: {i.quantity} {i.unit}</span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="card flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{item.name}</p>
                {item.quantity <= item.lowStockThreshold && (
                  <span className="badge bg-red-100 text-red-600 text-xs">Low Stock</span>
                )}
              </div>
              <p className="text-sm text-gray-500">{item.category} • {item.quantity} {item.unit} • Min: {item.lowStockThreshold}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setForm({ ...item }); setEditing(item.id); setShowForm(true) }}
                      className="p-2 text-gray-500 hover:text-primary"><FiEdit2 /></button>
              <button onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-500 hover:text-red-500"><FiTrash2 /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-10 text-gray-400">No inventory items yet</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Update Quantity' : 'Add Inventory Item'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {!editing && (
                <>
                  <input className="input" placeholder="Item name *" value={form.name} onChange={set('name')} required />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Category" value={form.category} onChange={set('category')} />
                    <select className="input" value={form.unit} onChange={set('unit')}>
                      {['kg','litre','pieces','grams','ml','dozen'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <input className="input" placeholder="Low stock threshold" type="number"
                         value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
                </>
              )}
              <input className="input" placeholder="Quantity *" type="number" value={form.quantity} onChange={set('quantity')} required />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
