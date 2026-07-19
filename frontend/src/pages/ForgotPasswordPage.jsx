import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(1) // 1=email, 2=otp+newpass
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)

  const sendOtp = async e => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Enter your email'); return }
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('OTP sent to your email!')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const resetPassword = async e => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 6)  { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, otp, password })
      toast.success('Password reset successfully! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-4xl">🔐</span>
          <h1 className="text-2xl font-bold mt-2 dark:text-white">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1
              ? 'Enter your email to receive a reset OTP'
              : `OTP sent to ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input className="input" type="email" placeholder="you@example.com"
                     value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending OTP...' : 'Send Reset OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OTP</label>
              <input className="input tracking-widest text-center text-xl" maxLength={6}
                     placeholder="000000" value={otp}
                     onChange={e => setOtp(e.target.value)} required />
              <p className="text-xs text-gray-400 mt-1">Check your email inbox (also check spam)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input className="input" type="password" placeholder="Min 6 characters"
                     value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
              <input className="input" type="password" placeholder="Repeat password"
                     value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => setStep(1)}
                    className="w-full text-sm text-gray-400 hover:text-gray-600">
              ← Use different email
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Remember your password?{' '}
          <Link to="/login" className="text-primary font-medium">Login</Link>
        </p>
      </div>
    </div>
  )
}
