import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

let _store = null
export const setStore = (store) => { _store = store }

api.interceptors.request.use(config => {
  const token = _store?.getState().auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let _refreshing = false
let _queue = []

const processQueue = (error, token = null) => {
  _queue.forEach(p => error ? p.reject(error) : p.resolve(token))
  _queue = []
}

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    const status   = error.response?.status
    const isRefreshUrl = original.url?.includes('/auth/refresh')
    const isAuthUrl    = original.url?.includes('/auth/')

    // Refresh endpoint itself failed — clear session, go to login
    if (isRefreshUrl || (isAuthUrl && status === 401)) {
      _store?.dispatch({ type: 'auth/logout' })
      return Promise.reject(error)
    }

    if (status === 401 && !original._retry && !isAuthUrl) {
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _queue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }).catch(err => Promise.reject(err))
      }

      original._retry = true
      _refreshing = true

      const refreshToken = _store?.getState().auth.refreshToken
      if (!refreshToken) {
        _store?.dispatch({ type: 'auth/logout' })
        _refreshing = false
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        _store.dispatch({ type: 'auth/setTokens', payload: data })
        original.headers.Authorization = `Bearer ${data.accessToken}`
        processQueue(null, data.accessToken)
        return api(original)
      } catch (err) {
        processQueue(err, null)
        _store?.dispatch({ type: 'auth/logout' })
        return Promise.reject(err)
      } finally {
        _refreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
