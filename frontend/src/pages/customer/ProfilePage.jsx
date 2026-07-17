import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiUpload, FiUser } from 'react-icons/fi'
import { loginSuccess } from '@/features/auth/authSlice'

export default function ProfilePage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone:    user?.phone    || '',
  })
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatar,    setAvatar]    = useState(user?.profileImageUrl || null)

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/users/profile', form)
      dispatch(loginSuccess(data))
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally { setSaving(false) }
  }

  const handleAvatarUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/upload/restaurant-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await api.put('/users/profile', { profileImageUrl: data.url })
      setAvatar(data.url)
      toast.success('Profile picture updated!')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('my_profile')}</h1>

      {/* Avatar */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="relative">
          {avatar
            ? <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            : <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold">
                {user?.fullName?.[0]?.toUpperCase() || <FiUser />}
              </div>
          }
          <label className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full p-1 cursor-pointer shadow">
            <FiUpload size={12} />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div>
          <p className="font-semibold">{user?.fullName}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-xs text-gray-400">{user?.roles?.[0]?.replace('ROLE_', '')}</p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('full_name')}</label>
          <input className="input" value={form.fullName}
                 onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
          <input className="input" value={form.phone}
                 onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
          <input className="input bg-gray-50" value={user?.email} disabled />
          <p className="text-xs text-gray-400 mt-1">{t('email')} cannot be changed</p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? t('saving') : t('save_changes')}
        </button>
      </form>
    </div>
  )
}
