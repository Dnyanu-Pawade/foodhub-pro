import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function AdminFraudPage() {
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/fraud/alerts').then(r => setAlerts(r.data)).catch(() => setAlerts([])).finally(() => setLoading(false))
  }, [])

  const dismiss = async (id) => {
    await api.patch(`/admin/fraud/alerts/${id}/dismiss`)
    setAlerts(a => a.filter(x => x.id !== id))
    toast.success('Alert dismissed')
  }

  const blockUser = async (userId) => {
    if (!confirm('Block this user?')) return
    await api.patch(`/admin/users/${userId}/block`)
    toast.success('User blocked')
    setAlerts(a => a.filter(x => x.userId !== userId))
  }

  const SEVERITY_COLOR = { HIGH: 'border-red-400 bg-red-50 dark:bg-red-900/10', MEDIUM: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10', LOW: 'border-gray-200' }
  const SEVERITY_BADGE = { HIGH: 'bg-red-100 text-red-700', MEDIUM: 'bg-yellow-100 text-yellow-700', LOW: 'bg-gray-100 text-gray-600' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">🚨 Fraud Detection</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'High Risk', count: alerts.filter(a => a.severity === 'HIGH').length, color: 'text-red-600' },
          { label: 'Medium Risk', count: alerts.filter(a => a.severity === 'MEDIUM').length, color: 'text-yellow-600' },
          { label: 'Low Risk', count: alerts.filter(a => a.severity === 'LOW').length, color: 'text-gray-600' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading && <div className="text-center py-10 text-gray-400">Loading alerts...</div>}

      <div className="space-y-3">
        {!loading && alerts.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">✅</p><p>No fraud alerts detected</p>
          </div>
        )}
        {alerts.map(alert => (
          <div key={alert.id} className={`card border-2 ${SEVERITY_COLOR[alert.severity] || ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[alert.severity]}`}>{alert.severity}</span>
                <span className="font-semibold dark:text-white">{alert.type?.replace(/_/g, ' ')}</span>
              </div>
              <span className="text-xs text-gray-400">{new Date(alert.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{alert.description}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">User: {alert.userName} ({alert.userEmail})</p>
              <div className="flex gap-2">
                <button onClick={() => dismiss(alert.id)} className="btn-outline text-sm px-3 py-1.5">Dismiss</button>
                <button onClick={() => blockUser(alert.userId)} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Block User</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
