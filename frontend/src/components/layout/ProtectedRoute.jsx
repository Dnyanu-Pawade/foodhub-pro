import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute({ children, roles }) {
  const { user, accessToken } = useSelector(s => s.auth)
  if (!user || !accessToken) return <Navigate to="/login" replace />
  if (roles && !roles.some(r => user.roles?.includes(r)))
    return <Navigate to="/login" replace />
  return children
}
