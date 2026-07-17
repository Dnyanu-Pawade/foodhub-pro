import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function ReferralPage() {
  const { t } = useTranslation()
  const [info, setInfo]         = useState(null)
  const [referrals, setReferrals] = useState([])
  const [applyCode, setApplyCode] = useState('')
  const [applying, setApplying]   = useState(false)
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    api.get('/referral/my-code').then(r => setInfo(r.data)).catch(() => {})
    api.get('/referral/my-referrals').then(r => setReferrals(r.data)).catch(() => {})
  }, [])

  const copyCode = () => {
    navigator.clipboard.writeText(info.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Code copied!')
  }

  const shareCode = () => {
    if (navigator.share) {
      navigator.share({ title: 'FoodHub Pro', text: info.shareText, url: window.location.origin })
    } else {
      navigator.clipboard.writeText(info.shareText)
      toast.success('Share text copied!')
    }
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🍔 Hey! I'm using FoodHub Pro for food delivery. Use my code *${info.code}* to get ₹50 off your first order! 🎉\n\n${window.location.origin}/register`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleApply = async () => {
    if (!applyCode.trim()) { toast.error('Enter a referral code'); return }
    setApplying(true)
    try {
      const { data } = await api.post('/referral/apply', { code: applyCode.trim() })
      toast.success(data.message)
      setApplyCode('')
      api.get('/referral/my-code').then(r => setInfo(r.data))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply code')
    } finally { setApplying(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 dark:text-white">{t('refer_earn')}</h1>
      <p className="text-gray-500 mb-6">Invite friends and both of you get <span className="font-bold text-primary">Rs.50</span> wallet credit!</p>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: '🔗', title: 'Share Code', desc: 'Share your unique referral code with friends' },
          { icon: '👤', title: 'Friend Joins', desc: 'Friend registers and applies your code' },
          { icon: '💰', title: 'Both Earn', desc: 'You both get Rs.50 wallet credit instantly' },
        ].map(s => (
          <div key={s.title} className="card text-center">
            <p className="text-3xl mb-2">{s.icon}</p>
            <p className="font-semibold text-sm dark:text-white">{s.title}</p>
            <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Your referral code */}
      {info && (
        <div className="card mb-6 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200">
          <p className="text-sm text-gray-500 mb-2">{t('your_code')}</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold tracking-widest text-primary">{info.code}</span>
            <button onClick={copyCode}
                    className="px-3 py-1.5 text-sm border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
              {copied ? `✅ ${t('copied')}` : `📋 ${t('copy')}`}
            </button>
            <button onClick={shareCode} className="btn-primary text-sm px-3 py-1.5">
              📤 {t('share')}
            </button>
            <button onClick={shareWhatsApp}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium">
              <span>💬</span> WhatsApp
            </button>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold text-primary">{info.successfulReferrals}</p>
              <p className="text-gray-500">Successful Referrals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">Rs.{info.totalEarned}</p>
              <p className="text-gray-500">Total Earned</p>
            </div>
          </div>
        </div>
      )}

      {/* Apply a referral code */}
      <div className="card mb-6">
        <p className="font-semibold mb-3 dark:text-white">Have a referral code?</p>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Enter referral code"
            value={applyCode}
            onChange={e => setApplyCode(e.target.value.toUpperCase())}
          />
          <button onClick={handleApply} disabled={applying} className="btn-primary px-4">
            {applying ? t('processing') : t('apply')}
          </button>
        </div>
      </div>

      {/* Referral history */}
      {referrals.length > 0 && (
        <div className="card">
          <p className="font-semibold mb-3 dark:text-white">Your Referrals ({referrals.length})</p>
          <div className="space-y-2">
            {referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm dark:text-white">{r.name}</p>
                  <p className="text-xs text-gray-400">{new Date(r.joinedAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.rewarded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {r.rewarded ? '+Rs.50 earned' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
