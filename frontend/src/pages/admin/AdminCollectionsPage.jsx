import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

const EMPTY = { title: '', emoji: '', tag: '', description: '', displayOrder: 0, active: true }

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState([])
  const [form,        setForm]        = useState(EMPTY)
  const [editing,     setEditing]     = useState(null) // id

  const load = () => api.get('/collections').then(r => setCollections(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title || !form.emoji || !form.tag) { toast.error('Title, emoji and tag are required'); return }
    try {
      if (editing) {
        await api.put(`/collections/${editing}`, form)
        toast.success('Collection updated')
      } else {
        await api.post('/collections', form)
        toast.success('Collection created')
      }
      setForm(EMPTY); setEditing(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const del = async (id) => {
    if (!confirm('Delete this collection?')) return
    await api.delete(`/collections/${id}`)
    toast.success('Deleted'); load()
  }

  const startEdit = (col) => {
    setEditing(col.id)
    setForm({ title: col.title, emoji: col.emoji, tag: col.tag,
              description: col.description || '', displayOrder: col.displayOrder, active: col.active })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">🍽️ Food Collections</h1>

      {/* Form */}
      <div className="card mb-8">
        <h2 className="font-semibold mb-4 dark:text-white">{editing ? 'Edit Collection' : 'Add Collection'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <input className="input" placeholder="Title *" value={form.title}
                 onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="input" placeholder="Emoji * (e.g. 🍕)" value={form.emoji}
                 onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
          <input className="input" placeholder="Tag * (e.g. Pizza)" value={form.tag}
                 onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
          <input className="input" placeholder="Description" value={form.description}
                 onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input className="input" type="number" placeholder="Display Order" value={form.displayOrder}
                 onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.active}
                   onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                   className="accent-primary" />
            <span className="dark:text-white">Active</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="btn-primary px-6">{editing ? 'Update' : 'Create'}</button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(EMPTY) }}
                    className="btn-outline px-4">Cancel</button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {collections.map(col => (
          <div key={col.id} className="card flex items-center gap-4">
            <span className="text-3xl">{col.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold dark:text-white">{col.title}</p>
              <p className="text-sm text-gray-500">Tag: {col.tag} • Order: {col.displayOrder}</p>
            </div>
            <span className={`badge text-xs ${col.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {col.active ? 'Active' : 'Hidden'}
            </span>
            <button onClick={() => startEdit(col)} className="btn-outline text-sm px-3 py-1.5">Edit</button>
            <button onClick={() => del(col.id)}
                    className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
