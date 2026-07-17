import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload } from 'react-icons/fi'

const EMPTY = { name: '', description: '', price: '', category: '', isVeg: true, isAvailable: true, imageUrl: '' }
const EMPTY_ADDON = { groupName: '', name: '', extraPrice: 0, isDefault: false }

async function uploadMenuImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post('/upload/menu-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data.url
}

function AddonModal({ item, onClose }) {
  const [addons, setAddons] = useState([])
  const [form,   setForm]   = useState(EMPTY_ADDON)

  useEffect(() => {
    api.get(`/menu/${item.id}/addons`).then(r => setAddons(r.data)).catch(() => {})
  }, [item.id])

  const handleSave = async e => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/owner/menu/${item.id}/addons`, { ...form, extraPrice: Number(form.extraPrice) })
      setAddons(a => [...a, data])
      setForm(EMPTY_ADDON)
      toast.success('Addon saved')
    } catch { toast.error('Failed to save addon') }
  }

  const handleDelete = async id => {
    await api.delete(`/owner/menu/addons/${id}`)
    setAddons(a => a.filter(x => x.id !== id))
    toast.success('Addon deleted')
  }

  const groups = addons.reduce((acc, a) => {
    if (!acc[a.groupName]) acc[a.groupName] = []
    acc[a.groupName].push(a)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold dark:text-white">⚙️ Addons — {item.name}</h2>
          <button onClick={onClose}><FiX /></button>
        </div>

        {/* Existing addons grouped */}
        {Object.entries(groups).map(([g, opts]) => (
          <div key={g} className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">{g}</p>
            <div className="space-y-1">
              {opts.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm font-medium dark:text-white">{a.name}</span>
                    {a.extraPrice > 0 && <span className="text-xs text-primary ml-2">+₹{a.extraPrice}</span>}
                    {a.isDefault && <span className="text-xs text-green-600 ml-2">default</span>}
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {addons.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4 mb-4">No addons yet. Add options below.</p>
        )}

        {/* Add new addon */}
        <div className="border-t dark:border-gray-700 pt-4">
          <p className="text-sm font-semibold dark:text-white mb-3">Add Option</p>
          <form onSubmit={handleSave} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input className="input text-sm" placeholder="Group (e.g. Size)" required
                     value={form.groupName} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))} />
              <input className="input text-sm" placeholder="Option (e.g. Large)" required
                     value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input text-sm" placeholder="Extra price (₹)" type="number" min="0"
                     value={form.extraPrice} onChange={e => setForm(f => ({ ...f, extraPrice: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm dark:text-gray-300 px-2">
                <input type="checkbox" checked={form.isDefault}
                       onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
                Default
              </label>
            </div>
            <button type="submit" className="btn-primary w-full text-sm">Add Option</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function OwnerMenuPage() {
  const [restaurants,   setRestaurants]   = useState([])
  const [selected,      setSelected]      = useState(null)
  const [menu,          setMenu]          = useState([])
  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [form,          setForm]          = useState(EMPTY)
  const [imgUploading,  setImgUploading]  = useState(false)
  const [addonItem,     setAddonItem]     = useState(null)

  const handleImageUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgUploading(true)
    try {
      const url = await uploadMenuImage(file)
      setForm(f => ({ ...f, imageUrl: url }))
      toast.success('Image uploaded')
    } catch { toast.error('Upload failed') }
    finally { setImgUploading(false) }
  }

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) setSelected(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (selected) api.get(`/restaurants/${selected.id}/menu`).then(r => setMenu(r.data))
  }, [selected])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setShowForm(true) }
  const openEdit = item => { setForm({ ...item, price: String(item.price) }); setEditing(item.id); setShowForm(true) }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) {
        const { data } = await api.put(`/owner/menu/${editing}`, { ...form, price: Number(form.price) })
        setMenu(m => m.map(i => i.id === editing ? data : i))
        toast.success('Item updated')
      } else {
        const { data } = await api.post(`/owner/restaurants/${selected.id}/menu`, { ...form, price: Number(form.price) })
        setMenu(m => [...m, data])
        toast.success('Item added')
      }
      setShowForm(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDelete = async id => {
    if (!confirm('Delete this item?')) return
    await api.delete(`/owner/menu/${id}`)
    setMenu(m => m.filter(i => i.id !== id))
    toast.success('Item deleted')
  }

  const toggleAvailability = async id => {
    try {
      const { data } = await api.patch(`/owner/menu/${id}/toggle-availability`)
      setMenu(m => m.map(i => i.id === id ? data : i))
    } catch { toast.error('Failed to toggle') }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold dark:text-white">🍕 Menu Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{menu.length} items • {selected?.name}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
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

      <div className="space-y-3">
        {menu.map(item => (
          <div key={item.id} className="card flex items-center gap-4">
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {item.isVeg ? '🥗' : '🍗'}
                </div>
            }
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-sm border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                  <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                </span>
                <p className="font-medium dark:text-white">{item.name}</p>
                {!item.isAvailable && <span className="badge bg-red-100 text-red-600 text-xs">Unavailable</span>}
                {item.addons?.length > 0 && (
                  <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                    {item.addons.length} addon{item.addons.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">₹{item.price} • {item.category}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setAddonItem(item)}
                      className="p-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                      title="Manage addons">
                ⚙️ Addons
              </button>
              <button onClick={() => toggleAvailability(item.id)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        item.isAvailable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}>
                {item.isAvailable ? '✅' : '❌'}
              </button>
              <button onClick={() => openEdit(item)} className="p-2 text-gray-500 hover:text-primary">
                <FiEdit2 />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-500">
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
        {menu.length === 0 && <div className="text-center py-10 text-gray-400">No menu items yet. Add your first item!</div>}
      </div>

      {/* Item form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold dark:text-white">{editing ? 'Edit Item' : 'Add Menu Item'}</h2>
              <button onClick={() => setShowForm(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="input" placeholder="Item name *" value={form.name} onChange={set('name')} required />
              <input className="input" placeholder="Description" value={form.description} onChange={set('description')} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="Price *" type="number" value={form.price} onChange={set('price')} required />
                <input className="input" placeholder="Category" value={form.category} onChange={set('category')} />
              </div>
              <div className="flex gap-2 items-center">
                <input className="input flex-1" placeholder="Image URL (optional)" value={form.imageUrl} onChange={set('imageUrl')} />
                <label className="btn-outline cursor-pointer flex items-center gap-1 text-sm px-3 py-2">
                  <FiUpload size={14} />{imgUploading ? '...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                  <input type="checkbox" checked={form.isVeg} onChange={e => setForm(f => ({ ...f, isVeg: e.target.checked }))} />
                  Vegetarian
                </label>
                <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                  <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} />
                  Available
                </label>
              </div>
              <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Add Item'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Addon manager modal */}
      {addonItem && <AddonModal item={addonItem} onClose={() => setAddonItem(null)} />}
    </div>
  )
}
