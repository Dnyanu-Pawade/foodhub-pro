import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { FiSearch, FiUserX, FiUserCheck, FiTrash2 } from 'react-icons/fi'

const ROLE_COLORS = {
  ROLE_ADMIN:             'bg-red-100 text-red-700',
  ROLE_CUSTOMER:          'bg-blue-100 text-blue-700',
  ROLE_RESTAURANT_OWNER:  'bg-purple-100 text-purple-700',
  ROLE_DELIVERY_PARTNER:  'bg-green-100 text-green-700',
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers]   = useState([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (p = 0, q = search) => {
    setLoading(true)
    try {
      const params = { page: p, size: 20 }
      if (q.trim()) params.search = q.trim()
      const { data } = await api.get('/admin/users', { params })
      setUsers(data.content)
      setTotal(data.totalElements)
      setPage(p)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load(0) }, [])

  const toggleActive = async (id, current) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle-active`)
      setUsers(u => u.map(x => x.id === id ? { ...x, active: data.active } : x))
      toast.success(data.active ? 'User activated' : 'User deactivated')
    } catch { toast.error('Failed') }
  }

  const deleteUser = async (id) => {
    if (!confirm('Soft-delete this user?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(u => u.filter(x => x.id !== id))
      toast.success('User deleted')
    } catch { toast.error('Failed') }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold dark:text-white">👥 {t('user_management')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{total} total users registered</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9 w-full max-w-sm" placeholder={`${t('search')}...`}
               value={search} onChange={e => setSearch(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && load(0, search)} />
        <button onClick={() => load(0, search)} className="btn-primary ml-2 px-4 py-2 text-sm">{t('search')}</button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => (
          <div key={i} className="card animate-pulse h-14 bg-gray-100" />
        ))}</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['ID','Name','Username','Email','Phone','Role','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.fullName || '—'}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {u.roles?.map(r => (
                      <span key={r.name} className={`badge text-xs ${ROLE_COLORS[r.name] || 'bg-gray-100'}`}>
                        {r.name.replace('ROLE_', '')}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleActive(u.id, u.active)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                              title={u.active ? 'Deactivate' : 'Activate'}>
                        {u.active ? <FiUserX size={15} /> : <FiUserCheck size={15} />}
                      </button>
                      <button onClick={() => deleteUser(u.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-400"
                              title="Delete">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(Math.ceil(total / 20))].map((_, i) => (
            <button key={i} onClick={() => load(i)}
                    className={`w-8 h-8 rounded text-sm ${page === i ? 'bg-primary text-white' : 'bg-white border border-gray-200'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
