import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchLoyalty = createAsyncThunk('loyalty/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/loyalty')
    return data
  } catch { return rejectWithValue(null) }
})

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState: { availablePoints: 0, totalPoints: 0, worthRupees: 0, history: [], loading: false },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchLoyalty.pending,   state => { state.loading = true })
      .addCase(fetchLoyalty.fulfilled, (state, { payload }) => {
        state.loading         = false
        state.availablePoints = payload.availablePoints
        state.totalPoints     = payload.totalPoints
        state.worthRupees     = payload.worthRupees
        state.history         = payload.history
      })
      .addCase(fetchLoyalty.rejected, state => { state.loading = false })
  }
})

export default loyaltySlice.reducer
