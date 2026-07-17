import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiUpload } from 'react-icons/fi'

const STEPS = ['Restaurant Info', 'Location & Hours', 'Menu Items', 'Done!']

async function uploadImage(file, type) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post(`/upload/${type}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data.url
}

export default function OwnerOnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(0)
  const [saving, setSaving]   = useState(false)
  const [restaurant, setRestaurant] = useState(null)

  const [info, setInfo] = useState({
    name: '', description: '', cuisineType: '', storeType: 'RESTAURANT',
    phone: '', email: '', logoUrl: '', bannerUrl: ''
  })
  const [location, setLocation] = useState({
    address: '', city: '', pincode: '',
    openTime: '09:00', closeTime: '23:00',
    deliveryFee: 0, minOrderAmount: 0, avgDeliveryTimeMinutes: 30
  })
  const [menuItems, setMenuItems] = useState([
    { name: '', price: '', category: '', isVeg: true }
  ])
  const [uploading, setUploading] = useState({})

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(u => ({ ...u, [field]: true }))
    try {
      const url = await uploadImage(file, 'restaurant-image')
      setInfo(f => ({ ...f, [field]: url }))
      toast.success('Image uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(u => ({ ...u, [field]: false })) }
  }

  const saveRestaurant = async () => {
    setSaving(true)
    try {
      const { data } = await api.post('/owner/restaurants', { ...info, ...location })
      setRestaurant(data)
      toast.success('Restaurant registered! Awaiting approval.')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save restaurant')
    } finally { setSaving(false) }
  }

  const saveMenu = async () => {
    if (!restaurant) { setStep(3); return }
    setSaving(true)
    try {
      const valid = menuItems.filter(i => i.name.trim() && i.price)
      await Promise.all(valid.map(item =>
        api.post(`/owner/restaurants/${restaurant.id}/menu`, {
          name: item.name, price: parseFloat(item.price),
          category: item.category || 'Main', isVeg: item.isVeg, isAvailable: true
        })
      ))
      toast.success(`${valid.length} menu items added!`)
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save menu')
    } finally { setSaving(false) }
  }

  const addMenuItem = () => setMenuItems(m => [...m, { name: '', price: '', category: '', isVeg: true }])
  const updateItem  = (i, k, v) => setMenuItems(m => m.map((item, idx) => idx === i ? { ...item, [k]: v } : item))
  const removeItem  = (i) => setMenuItems(m => m.filter((_, idx) => idx !== i))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-1 rounded ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          {STEPS.map(s => <span key={s} className="flex-1 text-center">{s}</span>)}
        </div>
      </div>

      {/* Step 0: Restaurant Info */}
      {step === 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 dark:text-white">🏪 Tell us about your restaurant</h2>
          <div className="space-y-3">
            <input className="input" placeholder="Restaurant name *" value={info.name}
                   onChange={e => setInfo(f => ({ ...f, name: e.target.value }))} required />
            <textarea className="input resize-none" rows={2} placeholder="Description"
                      value={info.description} onChange={e => setInfo(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Cuisine type (e.g. Biryani)"
                     value={info.cuisineType} onChange={e => setInfo(f => ({ ...f, cuisineType: e.target.value }))} />
              <select className="input" value={info.storeType} onChange={e => setInfo(f => ({ ...f, storeType: e.target.value }))}>
                <option value="RESTAURANT">Restaurant</option>
                <option value="GROCERY">Grocery</option>
                <option value="PHARMACY">Pharmacy</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Phone" value={info.phone}
                     onChange={e => setInfo(f => ({ ...f, phone: e.target.value }))} />
              <input className="input" placeholder="Email" value={info.email}
                     onChange={e => setInfo(f => ({ ...f, email: e.target.value }))} />
            </div>
            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo</label>
              <div className="flex gap-2">
                <input className="input flex-1 text-sm" placeholder="Logo URL or upload"
                       value={info.logoUrl} onChange={e => setInfo(f => ({ ...f, logoUrl: e.target.value }))} />
                <label className="btn-outline cursor-pointer flex items-center gap-1 text-sm px-3 py-2">
                  <FiUpload size={14} /> {uploading.logoUrl ? '...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logoUrl')} />
                </label>
              </div>
            </div>
            {/* Banner upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banner</label>
              <div className="flex gap-2">
                <input className="input flex-1 text-sm" placeholder="Banner URL or upload"
                       value={info.bannerUrl} onChange={e => setInfo(f => ({ ...f, bannerUrl: e.target.value }))} />
                <label className="btn-outline cursor-pointer flex items-center gap-1 text-sm px-3 py-2">
                  <FiUpload size={14} /> {uploading.bannerUrl ? '...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'bannerUrl')} />
                </label>
              </div>
            </div>
          </div>
          <button onClick={() => { if (!info.name.trim()) { toast.error('Enter restaurant name'); return } setStep(1) }}
                  className="btn-primary w-full mt-6">Next →</button>
        </div>
      )}

      {/* Step 1: Location & Hours */}
      {step === 1 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 dark:text-white">📍 Location & Hours</h2>
          <div className="space-y-3">
            <input className="input" placeholder="Full address *" value={location.address}
                   onChange={e => setLocation(f => ({ ...f, address: e.target.value }))} required />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="City *" value={location.city}
                     onChange={e => setLocation(f => ({ ...f, city: e.target.value }))} required />
              <input className="input" placeholder="Pincode" value={location.pincode}
                     onChange={e => setLocation(f => ({ ...f, pincode: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Time</label>
                <input type="time" className="input" value={location.openTime}
                       onChange={e => setLocation(f => ({ ...f, openTime: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Closing Time</label>
                <input type="time" className="input" value={location.closeTime}
                       onChange={e => setLocation(f => ({ ...f, closeTime: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Delivery Fee (₹)</label>
                <input type="number" className="input" value={location.deliveryFee}
                       onChange={e => setLocation(f => ({ ...f, deliveryFee: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Order (₹)</label>
                <input type="number" className="input" value={location.minOrderAmount}
                       onChange={e => setLocation(f => ({ ...f, minOrderAmount: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Delivery (mins)</label>
                <input type="number" className="input" value={location.avgDeliveryTimeMinutes}
                       onChange={e => setLocation(f => ({ ...f, avgDeliveryTimeMinutes: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(0)} className="btn-outline flex-1">← Back</button>
            <button onClick={() => { if (!location.address || !location.city) { toast.error('Enter address and city'); return } saveRestaurant() }}
                    disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save & Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Menu Items */}
      {step === 2 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-1 dark:text-white">🍽️ Add Menu Items</h2>
          <p className="text-sm text-gray-500 mb-4">Add at least 3 items to get started. You can add more later.</p>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {menuItems.map((item, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input className="input flex-1 text-sm" placeholder="Item name *"
                         value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                  <input className="input w-24 text-sm" placeholder="₹ Price"
                         type="number" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                  {menuItems.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">✕</button>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <input className="input flex-1 text-sm" placeholder="Category (e.g. Biryani)"
                         value={item.category} onChange={e => updateItem(i, 'category', e.target.value)} />
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" checked={item.isVeg} onChange={e => updateItem(i, 'isVeg', e.target.checked)}
                           className="accent-green-500" />
                    <span className="text-green-600 font-medium">Veg</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addMenuItem} className="btn-outline w-full mt-3 text-sm">+ Add Another Item</button>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(1)} className="btn-outline flex-1">← Back</button>
            <button onClick={saveMenu} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Menu & Finish →'}
            </button>
          </div>
          <button onClick={() => setStep(3)} className="w-full text-sm text-gray-400 hover:text-gray-600 mt-2">
            Skip for now
          </button>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div className="card text-center py-8">
          <p className="text-6xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold dark:text-white mb-2">You're all set!</h2>
          <p className="text-gray-500 mb-2">Your restaurant has been submitted for admin approval.</p>
          <p className="text-sm text-orange-600 bg-orange-50 rounded-lg px-4 py-2 mb-6 inline-block">
            ⏳ Approval usually takes 24 hours. You'll be notified once approved.
          </p>
          <div className="space-y-3">
            <button onClick={() => navigate('/owner/dashboard')} className="btn-primary w-full">
              Go to Dashboard
            </button>
            <button onClick={() => navigate('/owner/menu')} className="btn-outline w-full">
              Manage Menu
            </button>
            <button onClick={() => navigate('/owner/restaurants')} className="btn-outline w-full">
              View My Restaurants
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
