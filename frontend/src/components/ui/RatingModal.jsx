import { useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function RatingModal({ order, onClose }) {
  const [rating, setRating]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [photo, setPhoto]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handlePhoto = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async () => {
    if (!rating) { toast.error('Please select a rating'); return }
    setLoading(true)
    try {
      let photoUrl = null
      if (photo) {
        const fd = new FormData()
        fd.append('file', photo)
        const { data } = await api.post('/upload/review-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        photoUrl = data.url
      }
      await api.post(`/restaurants/${order.restaurantId}/reviews`, { rating, comment, photoUrl })
      toast.success('Thanks for your review!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Already reviewed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-lg font-bold mb-1 dark:text-white">Rate your order</h2>
        <p className="text-sm text-gray-500 mb-4">{order.restaurantName}</p>

        {/* Stars */}
        <div className="flex gap-2 justify-center mb-4">
          {[1,2,3,4,5].map(s => (
            <button key={s}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(s)}
                    className="text-4xl transition-transform hover:scale-110">
              {s <= (hovered || rating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tell us about your experience (optional)"
          rows={3}
          className="input w-full mb-3 resize-none"
        />

        {/* Photo upload */}
        <div className="mb-4">
          <label className="cursor-pointer flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition">
            <span>📷</span>
            <span>{photo ? photo.name : 'Add a photo (optional)'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          {preview && (
            <div className="relative mt-2">
              <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-lg" />
              <button onClick={() => { setPhoto(null); setPreview(null) }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 text-xs">✕</button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">Skip</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
