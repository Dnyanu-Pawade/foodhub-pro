import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const placeOrder = createAsyncThunk('order/place', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/orders', payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to place order')
  }
})

export const fetchMyOrders = createAsyncThunk('order/myOrders', async (page = 0) => {
  const { data } = await api.get(`/orders/my?page=${page}&size=10`)
  return data
})

export const fetchOrderById = createAsyncThunk('order/fetchOne', async (id) => {
  const { data } = await api.get(`/orders/${id}`)
  return data
})

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    current:    null,
    list:       [],
    totalPages: 0,
    loading:    false,
    error:      null,
  },
  reducers: {
    updateOrderStatus(state, { payload }) {
      if (state.current?.id === payload.id) state.current = payload
      const idx = state.list.findIndex(o => o.id === payload.id)
      if (idx !== -1) state.list[idx] = payload
    }
  },
  extraReducers: builder => {
    builder
      .addCase(placeOrder.pending,    state => { state.loading = true; state.error = null })
      .addCase(placeOrder.fulfilled,  (state, { payload }) => {
        state.loading = false; state.current = payload
        toast.success('Order placed successfully! 🎉')
      })
      .addCase(placeOrder.rejected,   (state, { payload }) => {
        state.loading = false; state.error = payload
        toast.error(payload)
      })
      .addCase(fetchMyOrders.fulfilled, (state, { payload, meta }) => {
        const page = meta.arg || 0
        state.list = page === 0 ? payload.content : [...state.list, ...payload.content]
        state.totalPages = payload.totalPages
      })
      .addCase(fetchOrderById.fulfilled, (state, { payload }) => {
        state.current = payload
      })
  }
})

export const { updateOrderStatus } = orderSlice.actions
export default orderSlice.reducer
