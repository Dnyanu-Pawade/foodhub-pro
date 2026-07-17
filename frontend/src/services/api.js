import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Lazy store accessor to avoid circular dependency
let _store = null
export const setStore = (store) => { _store = store }

api.interceptors.request.use(config => {
  const token = _store?.getState().auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    // Never retry auth endpoints to avoid loops
    const isAuthUrl = original.url?.includes('/auth/')
    if (error.response?.status === 401 && !original._retry && !isAuthUrl) {
      original._retry = true
      const refreshToken = _store?.getState().auth.refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken })
          _store.dispatch({ type: 'auth/setTokens', payload: data })
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        } catch {
          _store.dispatch({ type: 'auth/logout' })
        }
      } else {
        _store?.dispatch({ type: 'auth/logout' })
      }
    }
    return Promise.reject(error)
  }
)

export default api
