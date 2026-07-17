import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '@/services/api'
import toast from 'react-hot-toast'

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function SubscriptionPage() {
  const { t } = useTranslation()
  const [status, setStatus]   = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/subscription/status').then(r => setStatus(r.data)).catch(() => {})
  }, [])

  const subscribe = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/subscription/initiate')

      // Simulate mode — skip Razorpay
      if (!data.keyId || data.keyId === 'simulate') {
        const { data: res } = await api.post('/subscription/activate', { paymentId: 'sim_' + Date.now() })
        toast.success(res.message || 'Pro activated!')
        api.get('/subscription/status').then(r => setStatus(r.data))
        setLoading(false)
        return
      }

      const ok = await loadRazorpay()
      if (!ok) { toast.error('Payment gateway failed to load'); setLoading(false); return }
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: data.name,
        description: data.description,
        handler: async (response) => {
          try {
            const { data: res } = await api.post('/subscription/activate', {
              paymentId: response.razorpay_payment_id || 'manual'
            })
            toast.success(res.message)
            api.get('/subscription/status').then(r => setStatus(r.data))
          } catch { toast.error('Activation failed') }
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: '#f97316' }
      })
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white mb-2">FoodHub {t('pro')}</h1>
        <p className="text-gray-500">Unlock the best food delivery experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Free plan */}
        <div className="card border-2 border-gray-200 dark:border-gray-700">
          <p className="text-lg font-bold mb-1 dark:text-white">{t('free')}</p>
          <p className="text-3xl font-bold mb-4 dark:text-white">₹0<span className="text-sm font-normal text-gray-400">/month</span></p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {['Access to all restaurants', 'Standard delivery fees', 'Basic support'].map(b => (
              <li key={b} className="flex items-center gap-2"><span className="text-gray-400">○</span>{b}</li>
            ))}
          </ul>
          {!status?.isPro && (
            <div className="mt-4 py-2 text-center text-sm font-medium text-primary border border-primary rounded-lg">
              {t('current_plan')}
            </div>
          )}
        </div>

        {/* Pro plan */}
        <div className={`card border-2 relative overflow-hidden ${status?.isPro ? 'border-primary' : 'border-orange-300'}`}>
          <div className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-bold">
            POPULAR
          </div>
          <p className="text-lg font-bold mb-1 text-primary">Pro ⚡</p>
          <p className="text-3xl font-bold mb-4 dark:text-white">₹99<span className="text-sm font-normal text-gray-400">/month</span></p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {status?.benefits?.map(b => (
              <li key={b} className="flex items-center gap-2"><span className="text-green-500">✓</span>{b}</li>
            ))}
          </ul>
          {status?.isPro ? (
            <div className="mt-4 py-2 text-center text-sm font-medium text-white bg-primary rounded-lg">
              ✅ Active — expires {new Date(status.expiresAt).toLocaleDateString()}
            </div>
          ) : (
            <button onClick={subscribe} disabled={loading}
                    className="btn-primary w-full mt-4">
              {loading ? t('processing') : `${t('upgrade_pro')} — ₹99/month`}
            </button>
          )}
        </div>
      </div>

      {/* Benefits detail */}
      <div className="card">
        <h2 className="font-bold mb-4 dark:text-white">Why upgrade to Pro?</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '🚚', title: 'Free Delivery', desc: 'Zero delivery fee on every order' },
            { icon: '💰', title: '10% Discount', desc: 'Extra 10% off on every order' },
            { icon: '⚡', title: 'Priority Support', desc: 'Faster response to complaints' },
            { icon: '🏅', title: 'Pro Badge', desc: 'Stand out with a Pro profile badge' },
          ].map(b => (
            <div key={b.title} className="flex gap-3">
              <span className="text-2xl">{b.icon}</span>
              <div>
                <p className="font-semibold text-sm dark:text-white">{b.title}</p>
                <p className="text-xs text-gray-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
