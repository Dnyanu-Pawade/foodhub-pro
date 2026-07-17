import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2, FiEdit2, FiMapPin, FiStar, FiMap } from 'react-icons/fi'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const EMPTY = { label: 'Home', fullAddress: '', city: '', pincode: '', isDefault: false }
const LABELS = ['Home', 'Work', 'Other']
const LABEL_ICONS = { Home: '🏠', Work: '💼', Other: '📍' }

function MapPicker({ onPick }) {
  const mapRef  = useRef(null)
  const mapObj  = useRef(null)
  const marker  = useRef(null)

  useEffect(() => {
    if (mapObj.current) return
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(map)
    mapObj.current = map

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng
      if (marker.current) marker.current.setLatLng([lat, lng])
      else marker.current = L.marker([lat, lng]).addTo(map)

      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        const d = await r.json()
        const a = d.address || {}
        const parts = [a.house_number, a.road || a.pedestrian,
                       a.suburb || a.neighbourhood || a.village,
                       a.city || a.town || a.county, a.state, a.postcode].filter(Boolean)
        onPick({
          fullAddress: parts.slice(0, -2).join(', '),
          city:        a.city || a.town || a.county || '',
          pincode:     a.postcode || '',
        })
        marker.current.bindPopup(parts.slice(0, 3).join(', ')).openPopup()
      } catch {
        onPick({ fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: '', pincode: '' })
      }
    })

    // Try to center on user location
    navigator.geolocation?.getCurrentPosition(pos => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 15)
    }, () => {})
  }, [])

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <FiMapPin size={12} /> Click on the map to pin your delivery location
      </p>
      <div ref={mapRef} style={{ height: '220px', borderRadius: '12px', border: '1px solid #e5e7eb' }} />
    </div>
  )
}

export default function AddressPage() {
  const { t } = useTranslation()
  const [addresses, setAddresses] = useState([])
  const [showForm,  setShowForm]  = useState(false)
  const [showMap,   setShowMap]   = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY)

  useEffect(() => { load() }, [])

  const load = () => api.get('/addresses').then(r => setAddresses(r.data)).catch(() => {})

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setShowForm(true); setShowMap(false) }
  const openEdit = a  => { setForm(a); setEditing(a.id); setShowForm(true); setShowMap(false) }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) {
        const { data } = await api.put(`/addresses/${editing}`, form)
        setAddresses(a => a.map(x => x.id === editing ? data : x))
        toast.success('Address updated')
      } else {
        const { data } = await api.post('/addresses', form)
        setAddresses(a => [...a, data])
        toast.success('Address saved')
      }
      setShowForm(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDelete = async id => {
    await api.delete(`/addresses/${id}`)
    setAddresses(a => a.filter(x => x.id !== id))
    toast.success('Address removed')
  }

  const setDefault = async id => {
    await api.patch(`/addresses/${id}/set-default`)
    load()
    toast.success('Default address set')
  }

  const handleMapPick = ({ fullAddress, city, pincode }) => {
    setForm(f => ({ ...f, fullAddress, city, pincode }))
    toast.success('📍 Location pinned!')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">{t('saved_addresses')}</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> {t('add_address')}
        </button>
      </div>

      <div className="space-y-3">
        {addresses.map(a => (
          <div key={a.id} className={`card flex items-start gap-3 ${a.default ? 'border-primary border-2' : ''}`}>
            <div className="text-2xl mt-1">{LABEL_ICONS[a.label] || '📍'}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm dark:text-white">{a.label}</span>
                {a.default && <span className="badge bg-primary/10 text-primary text-xs">{t('default')}</span>}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{a.fullAddress}</p>
              <p className="text-xs text-gray-400">{a.city} {a.pincode}</p>
            </div>
            <div className="flex gap-1">
              {!a.default && (
                <button onClick={() => setDefault(a.id)}
                        className="p-1.5 rounded hover:bg-yellow-50 text-gray-400 hover:text-yellow-500" title="Set as default">
                  <FiStar size={15} />
                </button>
              )}
              <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                <FiEdit2 size={15} />
              </button>
              <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                <FiTrash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FiMapPin size={40} className="mx-auto mb-3 opacity-30" />
            <p>No saved addresses yet</p>
            <button onClick={openAdd} className="btn-primary mt-4">Add your first address</button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 my-4">
            <h2 className="text-lg font-bold mb-4 dark:text-white">{editing ? t('edit_address') : t('add_address')}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Label */}
              <div className="flex gap-2">
                {LABELS.map(l => (
                  <button key={l} type="button" onClick={() => setForm(f => ({ ...f, label: l }))}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                            ${form.label === l ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                    {LABEL_ICONS[l]} {l}
                  </button>
                ))}
              </div>

              {/* Map toggle */}
              <button type="button" onClick={() => setShowMap(m => !m)}
                      className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors">
                <FiMap size={15} /> {showMap ? 'Hide Map' : '📍 Pick location on map'}
              </button>

              {showMap && <MapPicker onPick={handleMapPick} />}

              <textarea className="input resize-none" rows={2} placeholder="Full address *" required
                        value={form.fullAddress} onChange={e => setForm(f => ({ ...f, fullAddress: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="City *" required
                       value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                <input className="input" placeholder="Pincode"
                       value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-gray-300">
                <input type="checkbox" checked={form.isDefault}
                       onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
                {t('set_default')}
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">{t('cancel')}</button>
                <button type="submit" className="btn-primary flex-1">{editing ? t('edit') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
