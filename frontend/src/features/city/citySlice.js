import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/services/api'

export const fetchCities = createAsyncThunk('city/fetchCities', async () => {
  const { data } = await api.get('/cities')
  return data
})

const saved = localStorage.getItem('selectedCity') || ''

const citySlice = createSlice({
  name: 'city',
  initialState: { cities: [], selected: saved },
  reducers: {
    setCity: (state, action) => {
      state.selected = action.payload
      localStorage.setItem('selectedCity', action.payload)
    },
  },
  extraReducers: b => b.addCase(fetchCities.fulfilled, (state, action) => {
    state.cities = action.payload
  }),
})

export const { setCity } = citySlice.actions
export default citySlice.reducer
