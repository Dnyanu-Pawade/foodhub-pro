import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiUpload } from 'react-icons/fi'

const EMPTY = { name: '', description: '', cuisineType: '', address: '', city: '', pincode: '',
                phone: '', email: '', deliveryFee: 0, minOrderAmount: 0, avgDeliveryTimeMinutes: 30,
                storeType: 'RESTAURANT', logoUrl: '', bannerUrl: '',
                openTime: '09:00', closeTime: '23:00' }

async function uploadImage(file, type) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post(`/upload/${type}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.url
}

export default function OwnerRestaurantPage() {
  const [restaurants, setRestaurants] = useState([])
  const [form, setForm]               = useState(EMPTY)
  const [editing, setEditing]         = useState(null)
  const [showForm, setShowForm]       = useState(false)
  const [uploading, setUploading]     = useState({})
  const [galleryRestaurant, setGalleryRestaurant] = useState(null)
  const [galleryUploading, setGalleryUploading]   = useState(false)

  const handleImageUpload = async (e, field, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(u => ({ ...u, [field]: true }))
    try {
      const url = await uploadImage(file, type)
      setForm(f => ({ ...f, [field]: url }))
      toast.success('Image uploaded')
    } catch { toast.error('Upload failed') }
    finally { setUploading(u => ({ ...u, [field]: false })) }
  }

  useEffect(() => { api.get('/owner/restaurants').then(r => setRestaurants(r.data)) }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setShowForm(true) }
  const openEdit = r  => { setForm(r); setEditing(r.id); setShowForm(true) }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) {
        const { data } = await api.put(`/owner/restaurants/${editing}`, form)
        setRestaurants(rs => rs.map(r => r.id === editing ? data : r))
        toast.success('Restaurant updated')
      } else {
        const { data } = await api.post('/owner/restaurants', form)
        setRestaurants(rs => [...rs, data])
        toast.success('Restaurant registered! Awaiting admin approval.')
      }
      setShowForm(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const STATUS_COLOR = { PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700', APPROVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-600' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">🏠 My Restaurants</h1>
          <p className="text-gray-500 mt-1">{restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Restaurant</button>
      </div>

      <div className="space-y-4">
        {restaurants.map(r => (
          <div key={r.id} className="card flex items-center gap-4">
            {r.logoUrl
              ? <img src={r.logoUrl} alt={r.name} className="w-16 h-16 rounded-lg object-cover" />
              : <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">🍽️</div>
            }
            <div className="flex-1">
              <p className="font-bold">{r.name}</p>
              <p className="text-sm text-gray-500">{r.city} • {r.cuisineType}</p>
              <span className={`badge text-xs mt-1 ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-600'}`}>
                {r.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={async () => {
                const { data } = await api.patch(`/owner/restaurants/${r.id}/toggle-open`)
                setRestaurants(rs => rs.map(x => x.id === r.id ? data : x))
                toast.success(data.open ? 'Restaurant opened' : 'Restaurant closed')
              }} className={`text-sm px-3 py-1.5 rounded-lg border font-medium
                ${r.open ? 'border-green-300 text-green-600 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
                {r.open ? '🟢 Open' : '🔴 Closed'}
              </button>
              <button onClick={() => openEdit(r)} className="btn-outline text-sm px-3 py-1.5">Edit</button>
              <button onClick={() => setGalleryRestaurant(r)} className="btn-outline text-sm px-3 py-1.5">📸 Photos</button>
              <a href={`/api/qr/restaurant/${r.id}`} target="_blank" rel="noreferrer"
                 className="btn-outline text-sm px-3 py-1.5">📷 QR Code</a>
            </div>
          </div>
        ))}
        {restaurants.length === 0 && (
          <div className="text-center py-10 text-gray-400">No restaurants yet. Register your first one!</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 my-4">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Restaurant' : 'Register Restaurant'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="input" placeholder="Restaurant name *" value={form.name} onChange={set('name')} required />
              <input className="input" placeholder="Description" value={form.description} onChange={set('description')} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="Cuisine type" value={form.cuisineType} onChange={set('cuisineType')} />
                <select className="input" value={form.storeType} onChange={set('storeType')}>
                  <option value="RESTAURANT">Restaurant</option>
                  <option value="GROCERY">Grocery</option>
                  <option value="PHARMACY">Pharmacy</option>
                </select>
              </div>
              <input className="input" placeholder="Address *" value={form.address} onChange={set('address')} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="City *" value={form.city} onChange={set('city')} required />
                <input className="input" placeholder="Pincode" value={form.pincode} onChange={set('pincode')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="Phone" value={form.phone} onChange={set('phone')} />
                <input className="input" placeholder="Email" value={form.email} onChange={set('email')} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input className="input" placeholder="Delivery fee" type="number" value={form.deliveryFee} onChange={set('deliveryFee')} />
                <input className="input" placeholder="Min order" type="number" value={form.minOrderAmount} onChange={set('minOrderAmount')} />
                <input className="input" placeholder="Delivery mins" type="number" value={form.avgDeliveryTimeMinutes} onChange={set('avgDeliveryTimeMinutes')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Opening Time</label>
                  <input type="time" className="input" value={form.openTime || '09:00'} onChange={set('openTime')} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Closing Time</label>
                  <input type="time" className="input" value={form.closeTime || '23:00'} onChange={set('closeTime')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <div className="flex gap-2 items-center">
                  <input className="input flex-1" placeholder="Logo URL" value={form.logoUrl} onChange={set('logoUrl')} />
                  <label className="btn-outline cursor-pointer flex items-center gap-1 text-sm px-3 py-2">
                    <FiUpload size={14} />
                    {uploading.logoUrl ? '...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden"
                           onChange={e => handleImageUpload(e, 'logoUrl', 'restaurant-image')} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner</label>
                <div className="flex gap-2 items-center">
                  <input className="input flex-1" placeholder="Banner URL" value={form.bannerUrl} onChange={set('bannerUrl')} />
                  <label className="btn-outline cursor-pointer flex items-center gap-1 text-sm px-3 py-2">
                    <FiUpload size={14} />
                    {uploading.bannerUrl ? '...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden"
                           onChange={e => handleImageUpload(e, 'bannerUrl', 'restaurant-image')} />
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Photo Gallery Modal */}
      {galleryRestaurant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold dark:text-white">📸 {galleryRestaurant.name} — Photos</h2>
              <button onClick={() => setGalleryRestaurant(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(galleryRestaurant.photoUrls || []).map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt={`photo-${i}`} className="w-full h-24 object-cover rounded-lg" />
                  <button onClick={async () => {
                    await api.delete(`/owner/restaurants/${galleryRestaurant.id}/photos?photoUrl=${encodeURIComponent(url)}`)
                    const updated = { ...galleryRestaurant, photoUrls: galleryRestaurant.photoUrls.filter(p => p !== url) }
                    setGalleryRestaurant(updated)
                    setRestaurants(rs => rs.map(r => r.id === updated.id ? updated : r))
                    toast.success('Photo removed')
                  }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hidden group-hover:flex items-center justify-center">✕</button>
                </div>
              ))}
              {(galleryRestaurant.photoUrls || []).length === 0 && (
                <p className="col-span-3 text-center text-gray-400 py-4">No photos yet</p>
              )}
            </div>
            <label className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer">
              <FiUpload size={16} />
              {galleryUploading ? 'Uploading...' : 'Upload Photo'}
              <input type="file" accept="image/*" className="hidden" disabled={galleryUploading}
                     onChange={async e => {
                       const file = e.target.files?.[0]; if (!file) return
                       setGalleryUploading(true)
                       try {
                         const url = await uploadImage(file, 'restaurant-image')
                         const { data } = await api.post(`/owner/restaurants/${galleryRestaurant.id}/photos?photoUrl=${encodeURIComponent(url)}`)
                         setGalleryRestaurant(data)
                         setRestaurants(rs => rs.map(r => r.id === data.id ? data : r))
                         toast.success('Photo added!')
                       } catch { toast.error('Upload failed') }
                       finally { setGalleryUploading(false) }
                     }} />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
