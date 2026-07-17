import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
}

export default function AdminKycPage() {
  const [kycs, setKycs]       = useState([])
  const [filter, setFilter]   = useState('PENDING')
  const [note, setNote]       = useState({})

  const load = () => api.get(`/kyc/admin/list?status=${filter}`).then(r => setKycs(r.data))
  useEffect(() => { load() }, [filter])

  const review = async (id, status) => {
    try {
      await api.patch(`/kyc/admin/${id}/review?status=${status}&note=${note[id] || ''}`)
      toast.success(`KYC ${status}`)
      load()
    } catch { toast.error('Failed') }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-2 dark:text-white">✅ KYC Verification</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Review and approve delivery partner documents</p>

      <div className="flex gap-2 mb-6">
        {['PENDING','APPROVED','REJECTED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium
                    ${filter === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {kycs.length === 0 && <div className="text-center py-10 text-gray-400">No KYC requests</div>}
        {kycs.map(k => (
          <div key={k.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold dark:text-white">{k.user?.fullName || k.user?.username}</p>
                <p className="text-sm text-gray-500">{k.documentType} • {new Date(k.submittedAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[k.status]}`}>{k.status}</span>
            </div>
            <div className="flex gap-3 mb-3">
              {k.documentUrl && (
                <a href={k.documentUrl} target="_blank" rel="noreferrer"
                   className="text-sm text-primary underline">View Document</a>
              )}
              {k.selfieUrl && (
                <a href={k.selfieUrl} target="_blank" rel="noreferrer"
                   className="text-sm text-primary underline">View Selfie</a>
              )}
            </div>
            {k.status === 'PENDING' && (
              <div className="flex gap-2 items-center">
                <input className="input flex-1 text-sm" placeholder="Admin note (optional)"
                       value={note[k.id] || ''} onChange={e => setNote(n => ({ ...n, [k.id]: e.target.value }))} />
                <button onClick={() => review(k.id, 'REJECTED')}
                        className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                  Reject
                </button>
                <button onClick={() => review(k.id, 'APPROVED')} className="btn-primary text-sm px-3 py-1.5">
                  Approve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
