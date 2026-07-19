import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '@/features/auth/authSlice'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, loading } = useSelector(s => s.auth)
  const [tab, setTab]   = useState('password')
  const [form, setForm] = useState({ username: '', password: '' })
  const [otp, setOtp]   = useState({ identifier: '', code: '', sent: false, sending: false })
  const [mob, setMob]   = useState({ phone: '', code: '', sent: false, sending: false })
  const [splash, setSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!user) return
    if (user.roles?.includes('ROLE_ADMIN'))                 navigate('/admin')
    else if (user.roles?.includes('ROLE_RESTAURANT_OWNER')) navigate('/owner/dashboard')
    else if (user.roles?.includes('ROLE_DELIVERY_PARTNER')) navigate('/delivery/dashboard')
    else navigate('/')
  }, [user])

  const handlePasswordLogin = e => {
    e.preventDefault()
    dispatch(login(form))
  }

  // Email/username OTP
  const sendOtp = async () => {
    if (!otp.identifier.trim()) { toast.error('Enter email or username'); return }
    setOtp(o => ({ ...o, sending: true }))
    try {
      await api.post('/auth/otp/send', { identifier: otp.identifier })
      setOtp(o => ({ ...o, sent: true, sending: false }))
      toast.success('OTP sent! Check your email')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
      setOtp(o => ({ ...o, sending: false }))
    }
  }

  const verifyOtp = async e => {
    e.preventDefault()
    try {
      const { data } = await api.post('/auth/otp/verify', { identifier: otp.identifier, otp: otp.code })
      dispatch({ type: 'auth/loginSuccess', payload: data })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    }
  }

  // Mobile OTP
  const sendMobileOtp = async () => {
    const raw = mob.phone.replace(/\D/g, '')
    if (!raw || raw.length < 10) { toast.error('Enter valid 10-digit mobile number'); return }
    const formatted = `+91${raw}`
    setMob(m => ({ ...m, sending: true }))
    try {
      await api.post('/auth/otp/send', { identifier: formatted })
      setMob(m => ({ ...m, sent: true, sending: false, phone: formatted }))
      toast.success(`OTP sent to ${formatted}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
      setMob(m => ({ ...m, sending: false }))
    }
  }

  const verifyMobileOtp = async e => {
    e.preventDefault()
    try {
      const { data } = await api.post('/auth/otp/verify', { identifier: mob.phone, otp: mob.code })
      dispatch({ type: 'auth/loginSuccess', payload: data })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    }
  }

  if (splash) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-orange-500 to-red-500">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
            <span className="text-5xl">🍽️</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-sm">⚡</span>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">FoodHub</h1>
          <p className="text-orange-200 text-sm font-medium tracking-widest uppercase mt-1">Pro</p>
        </div>
        <div className="flex gap-1.5 mt-4">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                 style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
      <p className="absolute bottom-8 text-orange-200 text-xs">Delivering happiness 🚀</p>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">{t('welcome_back')} 👋</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          {[['password','🔑 Password'], ['mobile','📱 Mobile OTP'], ['otp','✉️ Email OTP']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors
                      ${tab === key ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Password tab */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('username')}</label>
              <input className="input" placeholder={t('username')}
                     value={form.username}
                     onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
              <input className="input" type="password" placeholder={t('password')}
                     value={form.password}
                     onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('loading') : t('login')}
            </button>
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
            </div>
          </form>
        )}

        {/* Mobile OTP tab */}
        {tab === 'mobile' && (
          <form onSubmit={verifyMobileOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="flex gap-2">
                <span className="input w-14 text-center bg-gray-50 text-gray-600 text-sm flex items-center justify-center px-2">+91</span>
                <input className="input flex-1" placeholder="9876543210" type="tel" maxLength={10}
                       value={mob.phone.replace('+91', '')}
                       disabled={mob.sent}
                       onChange={e => setMob(m => ({ ...m, phone: e.target.value.replace(/\D/g, '') }))} />
                <button type="button" onClick={sendMobileOtp} disabled={mob.sending || mob.sent}
                        className="btn-outline text-sm px-3 whitespace-nowrap">
                  {mob.sending ? '...' : mob.sent ? '✅ Sent' : 'Send OTP'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">OTP will be sent via SMS to your number</p>
            </div>
            {mob.sent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input className="input tracking-widest text-center text-lg" maxLength={6}
                       placeholder="000000" value={mob.code}
                       onChange={e => setMob(m => ({ ...m, code: e.target.value }))} />
              </div>
            )}
            {mob.sent && <button type="submit" className="btn-primary w-full">Verify & Login</button>}
            {mob.sent && (
              <button type="button" onClick={() => setMob({ phone: '', code: '', sent: false, sending: false })}
                      className="w-full text-sm text-gray-400 hover:text-gray-600">
                Use different number
              </button>
            )}
          </form>
        )}

        {/* Email OTP tab */}
        {tab === 'otp' && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Enter email or username"
                       value={otp.identifier} disabled={otp.sent}
                       onChange={e => setOtp(o => ({ ...o, identifier: e.target.value }))} />
                <button type="button" onClick={sendOtp} disabled={otp.sending || otp.sent}
                        className="btn-outline text-sm px-3 whitespace-nowrap">
                  {otp.sending ? '...' : otp.sent ? '✅ Sent' : 'Send OTP'}
                </button>
              </div>
            </div>
            {otp.sent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input className="input tracking-widest text-center text-lg" maxLength={6}
                       placeholder="000000" value={otp.code}
                       onChange={e => setOtp(o => ({ ...o, code: e.target.value }))} />
              </div>
            )}
            {otp.sent && <button type="submit" className="btn-primary w-full">Verify & Login</button>}
            {otp.sent && (
              <button type="button" onClick={() => setOtp({ identifier: '', code: '', sent: false, sending: false })}
                      className="w-full text-sm text-gray-400 hover:text-gray-600">
                Use different account
              </button>
            )}
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          {t('dont_have_account')}{' '}
          <Link to="/register" className="text-primary font-medium">{t('sign_up')}</Link>
        </p>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-medium mb-1">Demo accounts:</p>
          <p>Admin: admin / Admin@123</p>
          <p>Customer: customer1 / Customer@123</p>
          <p>Owner: owner1 / Owner@123</p>
          <p>Delivery: delivery1 / Delivery@123</p>
        </div>
      </div>
    </div>
  )
}
