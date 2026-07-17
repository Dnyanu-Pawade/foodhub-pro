import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  OPEN:        'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED:    'bg-green-100 text-green-700',
  CLOSED:      'bg-gray-100 text-gray-500',
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [resolving,  setResolving]  = useState(null)
  const [response,   setResponse]   = useState('')
  const [loading,    setLoading]    = useState(false)

  useEffect(() => { load(0) }, [statusFilter])

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const params = { page: p, size: 20 }
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/admin/complaints', { params })
      setComplaints(data.content)
      setTotal(data.totalElements)
      setPage(p)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const resolve = async () => {
    try {
      const { data } = await api.patch(`/admin/complaints/${resolving.id}/resolve`, { response })
      setComplaints(c => c.map(x => x.id === resolving.id ? data : x))
      toast.success('Complaint resolved')
      setResolving(null)
      setResponse('')
    } catch { toast.error('Failed') }
  }

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/admin/complaints/${id}/status?status=${status}`)
      setComplaints(c => c.map(x => x.id === id ? data : x))
      toast.success('Status updated')
    } catch { toast.error('Failed') }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">🎧 Complaints</h1>
          <p className="text-gray-500 mt-1">{total} total complaints</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${statusFilter === s ? 'bg-primary text-white' : 'bg-white border border-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => (
          <div key={i} className="card animate-pulse h-20 bg-gray-100" />
        ))}</div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">#{c.id}</span>
                    <span className={`badge text-xs ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                    <span className="badge bg-gray-100 text-gray-600 text-xs">{c.type?.replace(/_/g, ' ')}</span>
                    {c.orderId && <span className="text-xs text-gray-400">Order #{c.orderId}</span>}
                  </div>
                  <p className="text-sm text-gray-700">{c.description}</p>
                  {c.adminResponse && (
                    <p className="text-sm text-green-700 mt-1 bg-green-50 rounded p-2">
                      ✅ Admin: {c.adminResponse}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {c.status === 'OPEN' && (
                    <button onClick={() => updateStatus(c.id, 'IN_PROGRESS')}
                            className="btn-outline text-xs px-2 py-1 whitespace-nowrap">
                      In Progress
                    </button>
                  )}
                  {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && (
                    <button onClick={() => { setResolving(c); setResponse('') }}
                            className="btn-primary text-xs px-2 py-1">
                      Resolve
                    </button>
                  )}
                  {c.status === 'RESOLVED' && (
                    <button onClick={() => updateStatus(c.id, 'CLOSED')}
                            className="btn-outline text-xs px-2 py-1">
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {complaints.length === 0 && (
            <div className="text-center py-12 text-gray-400">No complaints found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(Math.ceil(total / 20))].map((_, i) => (
            <button key={i} onClick={() => load(i)}
                    className={`w-8 h-8 rounded text-sm ${page === i ? 'bg-primary text-white' : 'bg-white border border-gray-200'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Resolve modal */}
      {resolving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="font-bold mb-3">Resolve Complaint #{resolving.id}</h2>
            <p className="text-sm text-gray-600 mb-3">{resolving.description}</p>
            <textarea className="input resize-none w-full mb-4" rows={3}
                      placeholder="Write your response to the customer..."
                      value={response} onChange={e => setResponse(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setResolving(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={resolve} disabled={!response.trim()} className="btn-primary flex-1">
                Resolve & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
