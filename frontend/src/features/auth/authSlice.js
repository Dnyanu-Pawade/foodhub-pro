import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import toast from 'react-hot-toast'

// Validate saved auth — clear if tokens missing to avoid stale state
const raw = localStorage.getItem('auth')
let saved = null
try {
  const parsed = JSON.parse(raw || 'null')
  if (parsed?.accessToken && parsed?.refreshToken) saved = parsed
  else if (raw) localStorage.removeItem('auth')
} catch { localStorage.removeItem('auth') }

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await axios.post('/api/auth/login', credentials)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axios.post('/api/auth/register', payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:         saved?.user         || null,
    accessToken:  saved?.accessToken  || null,
    refreshToken: saved?.refreshToken || null,
    loading:      false,
    error:        null,
  },
  reducers: {
    setTokens(state, { payload }) {
      state.accessToken  = payload.accessToken
      state.refreshToken = payload.refreshToken
      localStorage.setItem('auth', JSON.stringify({
        user: state.user, accessToken: payload.accessToken, refreshToken: payload.refreshToken
      }))
    },
    loginSuccess(state, { payload }) {
      state.user = { id: payload.id, username: payload.username, email: payload.email,
                     fullName: payload.fullName, phone: payload.phone, roles: payload.roles }
      state.accessToken  = payload.accessToken
      state.refreshToken = payload.refreshToken
      localStorage.setItem('auth', JSON.stringify({
        user: state.user, accessToken: payload.accessToken, refreshToken: payload.refreshToken
      }))
      toast.success(`Welcome, ${payload.fullName || payload.username}!`)
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      localStorage.removeItem('auth')
    }
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending,   state => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false
        state.user = { id: payload.id, username: payload.username, email: payload.email,
                       fullName: payload.fullName, phone: payload.phone, roles: payload.roles }
        state.accessToken  = payload.accessToken
        state.refreshToken = payload.refreshToken
        localStorage.setItem('auth', JSON.stringify({
          user: state.user, accessToken: payload.accessToken, refreshToken: payload.refreshToken
        }))
        toast.success(`Welcome back, ${payload.fullName || payload.username}!`)
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload
        toast.error(payload)
      })
      .addCase(register.pending,   state => { state.loading = true; state.error = null })
      .addCase(register.fulfilled, state => {
        state.loading = false
        toast.success('Registration successful! Please login.')
      })
      .addCase(register.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload
        toast.error(payload)
      })
  }
})

export const { setTokens, loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
