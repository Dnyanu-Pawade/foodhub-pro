import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const searchRestaurants = createAsyncThunk(
  'restaurant/search',
  async ({ city, storeType, search, sortBy, vegOnly, maxDeliveryFee, minRating, openNow, page = 0 }) => {
    const params = new URLSearchParams()
    if (city)          params.append('city', city)
    if (storeType)     params.append('storeType', storeType)
    if (search)        params.append('search', search)
    if (sortBy)        params.append('sortBy', sortBy)
    if (vegOnly)       params.append('vegOnly', vegOnly)
    if (maxDeliveryFee) params.append('maxDeliveryFee', maxDeliveryFee)
    if (minRating)     params.append('minRating', minRating)
    if (openNow)       params.append('openNow', openNow)
    params.append('page', page)
    params.append('size', 12)
    const { data } = await api.get(`/restaurants?${params}`)
    return data
  }
)

export const fetchRestaurant = createAsyncThunk(
  'restaurant/fetchOne',
  async (id) => {
    const [restaurant, menu, reviews] = await Promise.all([
      api.get(`/restaurants/${id}`),
      api.get(`/restaurants/${id}/menu`),
      api.get(`/restaurants/${id}/reviews`),
    ])
    return { restaurant: restaurant.data, menu: menu.data, reviews: reviews.data }
  }
)

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState: {
    list:       [],
    totalPages: 0,
    current:    null,
    menu:       [],
    reviews:    [],
    loading:    false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(searchRestaurants.pending,   state => { state.loading = true })
      .addCase(searchRestaurants.fulfilled, (state, { payload }) => {
        state.loading    = false
        state.list       = payload.content
        state.totalPages = payload.totalPages
      })
      .addCase(searchRestaurants.rejected,  state => { state.loading = false })
      .addCase(fetchRestaurant.pending,     state => { state.loading = true })
      .addCase(fetchRestaurant.fulfilled,   (state, { payload }) => {
        state.loading = false
        state.current = payload.restaurant
        state.menu    = payload.menu
        state.reviews = payload.reviews
      })
      .addCase(fetchRestaurant.rejected,    state => { state.loading = false })
  }
})

export default restaurantSlice.reducer
