import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchWallet = createAsyncThunk('wallet/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/payments/wallet')
    return data
  } catch { return rejectWithValue(null) }
})

const walletSlice = createSlice({
  name: 'wallet',
  initialState: { balance: 0, pendingCashback: 0, transactions: [], loading: false },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchWallet.pending,   state => { state.loading = true })
      .addCase(fetchWallet.fulfilled, (state, { payload }) => {
        state.loading        = false
        state.balance        = payload.balance
        state.pendingCashback = payload.pendingCashback
        state.transactions   = payload.transactions
      })
      .addCase(fetchWallet.rejected,  state => { state.loading = false })
  }
})

export default walletSlice.reducer
