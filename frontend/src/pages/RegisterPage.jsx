import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/features/auth/authSlice'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector(s => s.auth)
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', phone: '', role: 'customer', referralCode: ''
  })
  const [step, setStep]           = useState('form')   // 'form' | 'otp'
  const [otp, setOtp]             = useState('')
  const [otpSent, setOtpSent]     = useState(false)
  const [otpLoading, setOtpLoading] = useState(false
  )
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const sendOtp = async () => {
    if (!form.email) { toast.error('Enter email first'); return }
    setOtpLoading(true)
    try {
      await api.post('/auth/otp/send', { identifier: form.email })
      setOtpSent(true)
      setStep('otp')
      toast.success('OTP sent to your email!')
    } catch { toast.error('Failed to send OTP') }
    finally { setOtpLoading(false) }
  }

  const verifyAndRegister = async e => {
    e.preventDefault()
    // Verify OTP first
    setOtpLoading(true)
    try {
      await api.post('/auth/otp/verify-only', { identifier: form.email, otp })
    } catch {
      toast.error('Invalid OTP')
      setOtpLoading(false)
      return
    }
    setOtpLoading(false)
    // Now register
    const result = await dispatch(register(form))
    if (!result.error) {
      // Apply referral code if provided
      if (form.referralCode) {
        try {
          await api.post('/referral/apply', { code: form.referralCode })
          toast.success('Referral code applied! Rs.50 added to wallet')
        } catch {}
      }
      toast.success('Account created!')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-8">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">Create Account</h1>

        {step === 'form' ? (
          <form onSubmit={e => { e.preventDefault(); sendOtp() }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input className="input" placeholder="John Doe" value={form.fullName} onChange={set('fullName')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input className="input" placeholder="9999999999" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input className="input" placeholder="username" value={form.username} onChange={set('username')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input className="input" type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a...</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="customer">Customer</option>
                <option value="restaurant_owner">Restaurant Owner</option>
                <option value="delivery_partner">Delivery Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referral Code (optional)</label>
              <input className="input" placeholder="Enter referral code" value={form.referralCode}
                     onChange={e => setForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))} />
            </div>
            <button type="submit" disabled={otpLoading} className="btn-primary w-full">
              {otpLoading ? 'Sending OTP...' : 'Continue →'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyAndRegister} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">📧</p>
              <p className="font-semibold dark:text-white">Verify your email</p>
              <p className="text-sm text-gray-500">OTP sent to <span className="font-medium">{form.email}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter OTP</label>
              <input className="input text-center text-2xl font-bold tracking-widest" maxLength={6}
                     placeholder="------" value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading || otpLoading} className="btn-primary w-full">
              {loading || otpLoading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
            <button type="button" onClick={() => setStep('form')}
                    className="w-full text-sm text-gray-500 hover:text-primary">
              ← Back
            </button>
            <button type="button" onClick={sendOtp} disabled={otpLoading}
                    className="w-full text-sm text-primary hover:underline">
              Resend OTP
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium">Login</Link>
        </p>
      </div>
    </div>
  )
}
