import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiSend } from 'react-icons/fi'

export default function OwnerReviewsPage() {
  const [restaurants, setRestaurants] = useState([])
  const [selected,    setSelected]    = useState(null)
  const [reviews,     setReviews]     = useState([])
  const [stats,       setStats]       = useState(null)
  const [replyInputs, setReplyInputs] = useState({})
  const [replying,    setReplying]    = useState({})

  useEffect(() => {
    api.get('/owner/restaurants').then(r => {
      setRestaurants(r.data)
      if (r.data.length > 0) setSelected(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    api.get(`/reviews/restaurant/${selected.id}`).then(r => setReviews(r.data)).catch(() => setReviews([]))
    api.get(`/reviews/restaurant/${selected.id}/stats`).then(r => setStats(r.data)).catch(() => {})
  }, [selected])

  const submitReply = async (reviewId) => {
    const text = replyInputs[reviewId]?.trim()
    if (!text) return
    setReplying(r => ({ ...r, [reviewId]: true }))
    try {
      await api.post(`/reviews/${reviewId}/reply`, { reply: text })
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ownerReply: text } : r))
      setReplyInputs(r => ({ ...r, [reviewId]: '' }))
      toast.success('Reply posted!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply')
    } finally { setReplying(r => ({ ...r, [reviewId]: false })) }
  }

  const stars = (n) => '⭐'.repeat(n) + '☆'.repeat(5 - n)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">⭐ Customer Reviews</h1>

      {restaurants.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {restaurants.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${selected?.id === r.id ? 'bg-primary text-white' : 'border-gray-200 dark:border-gray-600 dark:text-white'}`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      {stats && (
        <div className="card mb-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{Number(stats.avgRating).toFixed(1)}</p>
              <p className="text-yellow-500 text-xl mt-1">{stars(Math.round(stats.avgRating))}</p>
              <p className="text-sm text-gray-500 mt-1">{stats.totalReviews} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5,4,3,2,1].map(n => {
                const count = stats.ratingBreakdown?.[n] || 0
                const pct = stats.totalReviews > 0 ? (count / stats.totalReviews * 100) : 0
                return (
                  <div key={n} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-gray-500">{n}</span>
                    <span className="text-yellow-400">⭐</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-gray-500">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviews.length === 0 && <div className="text-center py-10 text-gray-400">No reviews yet</div>}
        {reviews.map(r => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                  {r.customerName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm dark:text-white">{r.customerName}</p>
                  <p className="text-yellow-500 text-xs">{stars(r.rating)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>

            {r.comment && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{r.comment}</p>}
            {r.photoUrl && <img src={r.photoUrl} alt="review" className="mb-3 h-24 w-24 object-cover rounded-lg" />}

            {/* Owner reply */}
            {r.ownerReply ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mt-2">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">🏪 Your reply</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">{r.ownerReply}</p>
              </div>
            ) : (
              <div className="flex gap-2 mt-2">
                <input className="input flex-1 text-sm py-1.5"
                       placeholder="Reply to this review..."
                       value={replyInputs[r.id] || ''}
                       onChange={e => setReplyInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                       onKeyDown={e => e.key === 'Enter' && submitReply(r.id)} />
                <button onClick={() => submitReply(r.id)}
                        disabled={replying[r.id] || !replyInputs[r.id]?.trim()}
                        className="btn-primary px-3 py-1.5 text-sm flex items-center gap-1 disabled:opacity-50">
                  <FiSend size={13} /> {replying[r.id] ? '...' : 'Reply'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
