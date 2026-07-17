import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function SuperAdminPage() {
  const [tab, setTab]             = useState('settings')
  const [settings, setSettings]   = useState({})
  const [flags, setFlags]         = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [plans, setPlans]         = useState([])
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    api.get('/admin/platform/settings').then(r => setSettings(r.data)).catch(() => {})
    api.get('/admin/platform/feature-flags').then(r => setFlags(r.data)).catch(() => setFlags([]))
    api.get('/admin/platform/audit-logs').then(r => setAuditLogs(r.data)).catch(() => setAuditLogs([]))
    api.get('/api/subscription/plans').then(r => setPlans(r.data)).catch(() => setPlans([]))
  }, [])

  const saveSetting = async (key, value) => {
    setSaving(true)
    try {
      await api.patch('/admin/platform/settings', { key, value })
      setSettings(s => ({ ...s, [key]: value }))
      toast.success('Setting saved')
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const toggleFlag = async (key, enabled) => {
    await api.patch(`/admin/platform/feature-flags/${key}?enabled=${!enabled}`)
    setFlags(f => f.map(x => x.key === key ? { ...x, enabled: !enabled } : x))
    toast.success(`${key} ${!enabled ? 'enabled' : 'disabled'}`)
  }

  const TABS = [
    { key: 'settings', label: '⚙️ Settings' },
    { key: 'flags', label: '🚩 Feature Flags' },
    { key: 'plans', label: '📦 Subscription Plans' },
    { key: 'audit', label: '📋 Audit Logs' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">🌐 Super Admin Portal</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-primary text-white' : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div className="space-y-4">
          {[
            { key: 'platformName', label: 'Platform Name', type: 'text' },
            { key: 'supportEmail', label: 'Support Email', type: 'email' },
            { key: 'supportPhone', label: 'Support Phone', type: 'text' },
            { key: 'defaultCommissionRate', label: 'Default Commission Rate (%)', type: 'number' },
            { key: 'deliveryFeePerKm', label: 'Delivery Fee Per KM (₹)', type: 'number' },
            { key: 'minOrderAmount', label: 'Min Order Amount (₹)', type: 'number' },
            { key: 'maxDeliveryRadius', label: 'Max Delivery Radius (KM)', type: 'number' },
          ].map(field => (
            <div key={field.key} className="card flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-48 shrink-0">{field.label}</label>
              <div className="flex gap-2 flex-1">
                <input type={field.type} className="input flex-1"
                       value={settings[field.key] ?? ''}
                       onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))} />
                <button onClick={() => saveSetting(field.key, settings[field.key])}
                        disabled={saving} className="btn-primary text-sm px-3 py-1.5">Save</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'flags' && (
        <div className="space-y-3">
          {flags.length === 0 && (
            <div className="card space-y-3">
              {[
                { key: 'SURGE_PRICING', label: 'Surge Pricing', desc: 'Dynamic delivery fee during peak hours' },
                { key: 'LOYALTY_POINTS', label: 'Loyalty Points', desc: 'Earn & redeem points on orders' },
                { key: 'REFERRAL_PROGRAM', label: 'Referral Program', desc: 'Refer friends and earn rewards' },
                { key: 'WHATSAPP_NOTIFICATIONS', label: 'WhatsApp Notifications', desc: 'Send order updates via WhatsApp' },
                { key: 'AI_RECOMMENDATIONS', label: 'AI Recommendations', desc: 'Personalized food recommendations' },
                { key: 'SCHEDULED_ORDERS', label: 'Scheduled Orders', desc: 'Allow customers to schedule orders' },
                { key: 'GROUP_ORDERING', label: 'Group Ordering', desc: 'Multiple people add to one cart' },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium dark:text-white">{f.label}</p>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Configure in DB</span>
                </div>
              ))}
            </div>
          )}
          {flags.map(f => (
            <div key={f.key} className="card flex items-center justify-between">
              <div>
                <p className="font-medium dark:text-white">{f.label || f.key}</p>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
              <button onClick={() => toggleFlag(f.key, f.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.enabled ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${f.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'plans' && (
        <div className="grid md:grid-cols-3 gap-4">
          {plans.length === 0 && <div className="col-span-3 text-center py-10 text-gray-400">No subscription plans configured</div>}
          {plans.map(p => (
            <div key={p.id} className="card border-2 border-primary/20">
              <p className="text-xl font-bold dark:text-white mb-1">{p.name}</p>
              <p className="text-3xl font-bold text-primary mb-3">₹{p.price}<span className="text-sm text-gray-500">/{p.durationDays}d</span></p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {(p.features || '').split(',').map((f, i) => <li key={i}>✅ {f.trim()}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-2">
          {auditLogs.length === 0 && <div className="text-center py-10 text-gray-400">No audit logs</div>}
          {auditLogs.map((log, i) => (
            <div key={i} className="card flex items-start justify-between text-sm">
              <div>
                <span className="font-medium dark:text-white">{log.action}</span>
                <span className="text-gray-500 ml-2">by {log.performedBy}</span>
                {log.details && <p className="text-gray-400 text-xs mt-0.5">{log.details}</p>}
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-4">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
