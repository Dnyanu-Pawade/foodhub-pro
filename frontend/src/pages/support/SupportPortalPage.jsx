import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  OPEN:        'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED:    'bg-green-100 text-green-700',
  CLOSED:      'bg-gray-100 text-gray-600',
}

export default function SupportPortalPage() {
  const [complaints, setComplaints] = useState([])
  const [selected, setSelected]     = useState(null)
  const [reply, setReply]           = useState('')
  const [filter, setFilter]         = useState('OPEN')
  const [stats, setStats]           = useState(null)

  useEffect(() => {
    api.get('/admin/complaints').then(r => setComplaints(r.data)).catch(() => setComplaints([]))
    api.get('/admin/complaints/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/complaints/${id}/status?status=${status}`)
    setComplaints(c => c.map(x => x.id === id ? { ...x, status } : x))
    if (selected?.id === id) setSelected(s => ({ ...s, status }))
    toast.success(`Ticket ${status.toLowerCase()}`)
  }

  const sendReply = async (id) => {
    if (!reply.trim()) return
    await api.post(`/admin/complaints/${id}/reply`, { message: reply })
    toast.success('Reply sent')
    setReply('')
  }

  const processRefund = async (orderId, amount) => {
    if (!confirm(`Issue refund of ₹${amount}?`)) return
    await api.post('/admin/refunds', { orderId, amount })
    toast.success('Refund processed!')
  }

  const filtered = complaints.filter(c => filter === 'ALL' || c.status === filter)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">🎧 Customer Support Portal</h1>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Open', value: stats.open || 0, color: 'text-red-600' },
            { label: 'In Progress', value: stats.inProgress || 0, color: 'text-yellow-600' },
            { label: 'Resolved Today', value: stats.resolvedToday || 0, color: 'text-green-600' },
            { label: 'Avg Response', value: `${stats.avgResponseHours || 0}h`, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
            {s.replace('_', ' ')} {s !== 'ALL' && `(${complaints.filter(c => c.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Ticket list */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && <div className="text-center py-10 text-gray-400">No tickets</div>}
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)}
                 className={`card cursor-pointer transition-all ${selected?.id === c.id ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium dark:text-white text-sm">#{c.id} — {c.subject}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status]}`}>{c.status}</span>
              </div>
              <p className="text-xs text-gray-500">{c.customerName} • {new Date(c.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{c.description}</p>
            </div>
          ))}
        </div>

        {/* Ticket detail */}
        {selected ? (
          <div className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold dark:text-white">#{selected.id} — {selected.subject}</h2>
                <p className="text-sm text-gray-500">{selected.customerName} • {selected.customerEmail}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[selected.status]}`}>{selected.status}</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-sm dark:text-gray-300">{selected.description}</p>
              {selected.orderId && (
                <p className="text-xs text-gray-500 mt-2">Related Order: #{selected.orderId}</p>
              )}
            </div>

            {selected.orderId && (
              <button onClick={() => processRefund(selected.orderId, selected.orderAmount)}
                      className="w-full py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                💸 Process Refund (₹{selected.orderAmount || '?'})
              </button>
            )}

            <div className="flex gap-2 flex-wrap">
              {['IN_PROGRESS','RESOLVED','CLOSED'].map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                  → {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <textarea className="input flex-1 text-sm" rows={3} placeholder="Type reply..."
                        value={reply} onChange={e => setReply(e.target.value)} />
              <button onClick={() => sendReply(selected.id)} className="btn-primary px-4 self-end">Send</button>
            </div>
          </div>
        ) : (
          <div className="card flex items-center justify-center text-gray-400 min-h-[200px]">
            Select a ticket to view details
          </div>
        )}
      </div>
    </div>
  )
}
