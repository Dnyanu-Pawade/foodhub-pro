import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function MarketingDashboard() {
  const [tab, setTab]           = useState('push')
  const [stats, setStats]       = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [form, setForm] = useState({ title: '', message: '', channel: 'PUSH', targetRole: 'ROLE_CUSTOMER', scheduledAt: '' })
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    api.get('/admin/marketing/stats').then(r => setStats(r.data)).catch(() => {})
    api.get('/admin/marketing/campaigns').then(r => setCampaigns(r.data)).catch(() => setCampaigns([]))
  }, [])

  const sendCampaign = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/admin/marketing/campaigns', form)
      toast.success('Campaign sent!')
      setForm({ title: '', message: '', channel: 'PUSH', targetRole: 'ROLE_CUSTOMER', scheduledAt: '' })
      api.get('/admin/marketing/campaigns').then(r => setCampaigns(r.data)).catch(() => {})
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSending(false) }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">📈 Marketing Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Push Sent', value: stats.pushSent || 0, color: 'text-blue-600' },
            { label: 'Emails Sent', value: stats.emailsSent || 0, color: 'text-green-600' },
            { label: 'SMS Sent', value: stats.smsSent || 0, color: 'text-purple-600' },
            { label: 'Active Coupons', value: stats.activeCoupons || 0, color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {[['push','📲 Push'],['email','📧 Email'],['sms','💬 SMS'],['history','📋 History']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === k ? 'bg-primary text-white' : 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {['push','email','sms'].includes(tab) && (
        <form onSubmit={sendCampaign} className="card space-y-4">
          <h2 className="font-semibold dark:text-white">
            {tab === 'push' ? '📲 Push Notification Campaign' : tab === 'email' ? '📧 Email Campaign' : '💬 SMS Campaign'}
          </h2>
          <input className="input" placeholder="Campaign Title" required value={form.title}
                 onChange={e => setForm(f => ({ ...f, title: e.target.value, channel: tab.toUpperCase() }))} />
          <textarea className="input min-h-[100px]" placeholder="Message content..." required value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          <div className="grid md:grid-cols-2 gap-3">
            <select className="input" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}>
              <option value="ROLE_CUSTOMER">All Customers</option>
              <option value="ROLE_RESTAURANT_OWNER">All Restaurant Owners</option>
              <option value="ROLE_DELIVERY_PARTNER">All Delivery Partners</option>
              <option value="ALL">Everyone</option>
            </select>
            <input type="datetime-local" className="input" placeholder="Schedule (optional)" value={form.scheduledAt}
                   onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <button type="submit" disabled={sending} className="btn-primary">
            {sending ? 'Sending...' : form.scheduledAt ? '📅 Schedule Campaign' : '🚀 Send Now'}
          </button>
        </form>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {campaigns.length === 0 && <div className="text-center py-10 text-gray-400">No campaigns sent yet</div>}
          {campaigns.map(c => (
            <div key={c.id} className="card flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium dark:text-white">{c.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.channel === 'PUSH' ? 'bg-blue-100 text-blue-700' :
                    c.channel === 'EMAIL' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>{c.channel}</span>
                </div>
                <p className="text-sm text-gray-500">{c.message?.slice(0, 80)}...</p>
                <p className="text-xs text-gray-400 mt-1">Target: {c.targetRole} • Sent to {c.sentCount || 0} users</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-4">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
