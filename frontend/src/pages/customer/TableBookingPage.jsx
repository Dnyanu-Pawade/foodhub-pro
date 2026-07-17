import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiCalendar, FiClock, FiUsers } from 'react-icons/fi'

const TIMES = ['12:00','12:30','13:00','13:30','14:00','18:00','18:30','19:00','19:30','20:00','20:30','21:00']
const GUESTS = [1,2,3,4,5,6,7,8]

export default function TableBookingPage() {
  const { t } = useTranslation()
  const { user } = useSelector(s => s.auth)
  const [restaurants, setRestaurants] = useState([])
  const [bookings,    setBookings]    = useState([])
  const [tab,         setTab]         = useState('new')
  const [form, setForm] = useState({
    restaurantId: '', date: '', time: '', guests: 2, specialRequest: ''
  })
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    api.get('/restaurants?size=50').then(r => setRestaurants(r.data.content || [])).catch(() => {})
    loadBookings()
  }, [])

  const loadBookings = () =>
    api.get('/table-bookings/my').then(r => setBookings(r.data)).catch(() => {})

  const submit = async e => {
    e.preventDefault()
    if (!form.restaurantId || !form.date || !form.time) { toast.error('Fill all required fields'); return }
    setLoading(true)
    try {
      await api.post('/table-bookings', {
        restaurantId: Number(form.restaurantId),
        bookingDate: form.date,
        bookingTime: form.time,
        numberOfGuests: form.guests,
        specialRequest: form.specialRequest,
      })
      toast.success('Table booked! 🎉')
      setForm({ restaurantId: '', date: '', time: '', guests: 2, specialRequest: '' })
      loadBookings()
      setTab('my')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally { setLoading(false) }
  }

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await api.patch(`/table-bookings/${id}/cancel`)
      toast.success('Booking cancelled')
      loadBookings()
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel') }
  }

  const STATUS_COLOR = {
    PENDING:   'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-600',
    COMPLETED: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 dark:text-white">🪑 Table Booking</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Reserve a table for dine-in</p>

      <div className="flex gap-2 mb-6">
        {[['new','📅 New Booking'],['my','📋 My Bookings']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium
                    ${tab === key ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <form onSubmit={submit} className="card space-y-4">
          {/* Restaurant */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Restaurant *</label>
            <select className="input" value={form.restaurantId}
                    onChange={e => setForm(f => ({ ...f, restaurantId: e.target.value }))} required>
              <option value="">Select a restaurant</option>
              {restaurants.filter(r => r.isOpen).map(r => (
                <option key={r.id} value={r.id}>{r.name} — {r.city}</option>
              ))}
            </select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                <FiCalendar className="inline mr-1" size={13} />Date *
              </label>
              <input type="date" className="input" min={today} value={form.date}
                     onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                <FiClock className="inline mr-1" size={13} />Time *
              </label>
              <select className="input" value={form.time}
                      onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required>
                <option value="">Select time</option>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Guests */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              <FiUsers className="inline mr-1" size={13} />Number of Guests
            </label>
            <div className="flex gap-2 flex-wrap">
              {GUESTS.map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, guests: n }))}
                        className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors
                          ${form.guests === n ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Special request */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Special Request (optional)</label>
            <textarea className="input resize-none" rows={2}
                      placeholder="e.g. Window seat, birthday celebration, wheelchair access..."
                      value={form.specialRequest}
                      onChange={e => setForm(f => ({ ...f, specialRequest: e.target.value }))} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Booking...' : '🪑 Confirm Booking'}
          </button>
        </form>
      )}

      {tab === 'my' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">🪑</p>
              <p>No bookings yet</p>
              <button onClick={() => setTab('new')} className="btn-primary mt-4">Book a Table</button>
            </div>
          ) : bookings.map(b => (
            <div key={b.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold dark:text-white">{b.restaurantName}</p>
                  <p className="text-sm text-gray-500">
                    📅 {b.bookingDate} at {b.bookingTime} • 👥 {b.numberOfGuests} guests
                  </p>
                  {b.specialRequest && (
                    <p className="text-xs text-gray-400 mt-1">📝 {b.specialRequest}</p>
                  )}
                </div>
                <span className={`badge text-xs font-semibold ${STATUS_COLOR[b.status] || 'bg-gray-100 text-gray-600'}`}>
                  {b.status}
                </span>
              </div>
              {b.status === 'PENDING' && (
                <button onClick={() => cancel(b.id)}
                        className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 mt-1">
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
