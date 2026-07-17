import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    const [list, count] = await Promise.all([
      api.get('/notifications'),
      api.get('/notifications/unread-count'),
    ])
    return { list: list.data, unreadCount: count.data.count }
  } catch { return rejectWithValue(null) }
})

export const markAllRead = createAsyncThunk('notifications/markAllRead', async () => {
  await api.patch('/notifications/read-all')
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { list: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification(state, { payload }) {
      state.list.unshift(payload)
      state.unreadCount += 1
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.list        = payload.list
        state.unreadCount = payload.unreadCount
        state.loading     = false
      })
      .addCase(fetchNotifications.pending, state => { state.loading = true })
      .addCase(markAllRead.fulfilled, state => {
        state.unreadCount = 0
        state.list = state.list.map(n => ({ ...n, read: true }))
      })
  }
})

export const { addNotification } = notificationsSlice.actions
export default notificationsSlice.reducer
