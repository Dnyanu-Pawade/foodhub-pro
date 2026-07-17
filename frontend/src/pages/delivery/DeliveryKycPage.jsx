import { useEffect, useState } from 'react'
import api from '@/services/api'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  PENDING:       'bg-yellow-100 text-yellow-700',
  APPROVED:      'bg-green-100 text-green-700',
  REJECTED:      'bg-red-100 text-red-600',
  NOT_SUBMITTED: 'bg-gray-100 text-gray-600',
}

export default function DeliveryKycPage() {
  const [status, setStatus]       = useState(null)
  const [docType, setDocType]     = useState('AADHAAR')
  const [docFile, setDocFile]     = useState(null)
  const [selfieFile, setSelfie]   = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    api.get('/kyc/my-status').then(r => setStatus(r.data)).catch(() => {})
  }, [])

  const submit = async e => {
    e.preventDefault()
    if (!docFile) { toast.error('Please select document file'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('documentType', docType)
      fd.append('document', docFile)
      if (selfieFile) fd.append('selfie', selfieFile)
      const { data } = await api.post('/kyc/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(data.message)
      api.get('/kyc/my-status').then(r => setStatus(r.data))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-2 dark:text-white">💼 KYC Verification</h1>
      <p className="text-gray-500 mb-8">Complete KYC to start accepting deliveries</p>

      {status && (
        <div className={`card mb-6 flex items-center gap-3 border-2 ${status.status === 'APPROVED' ? 'border-green-400' : 'border-gray-200'}`}>
          <span className="text-3xl">{status.status === 'APPROVED' ? '✅' : status.status === 'REJECTED' ? '❌' : '⏳'}</span>
          <div>
            <p className="font-semibold dark:text-white">KYC Status</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status.status]}`}>
              {status.status}
            </span>
            {status.adminNote && <p className="text-sm text-gray-500 mt-1">Note: {status.adminNote}</p>}
          </div>
        </div>
      )}

      {(!status || status.status === 'NOT_SUBMITTED' || status.status === 'REJECTED') && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold dark:text-white">Submit KYC Documents</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</label>
            <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="AADHAAR">Aadhaar Card</option>
              <option value="LICENSE">Driving License</option>
              <option value="PAN">PAN Card</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Photo *</label>
            <input type="file" accept="image/*" className="input" required
                   onChange={e => setDocFile(e.target.files[0])} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selfie (optional)</label>
            <input type="file" accept="image/*" capture="user" className="input"
                   onChange={e => setSelfie(e.target.files[0])} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </form>
      )}
    </div>
  )
}
