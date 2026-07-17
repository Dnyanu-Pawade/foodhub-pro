import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    restaurantId:   null,
    restaurantName: '',
    items:          [],   // { id, name, price, quantity, imageUrl, instructions }
    couponCode:     null,
    discount:       0,
    useWallet:      false,
    tip:            0,
  },
  reducers: {
    addItem(state, { payload }) {
      // Enforce single-restaurant cart
      if (state.restaurantId && state.restaurantId !== payload.restaurantId) {
        state.items = []
        state.couponCode = null
        state.discount = 0
      }
      state.restaurantId   = payload.restaurantId
      state.restaurantName = payload.restaurantName
      // key = itemId + sorted addon ids so same item with different addons = different cart entry
      const key = payload.cartKey || String(payload.id)
      const existing = state.items.find(i => i.cartKey === key)
      if (existing) existing.quantity += 1
      else state.items.push({ ...payload, cartKey: key, quantity: 1 })
    },
    removeItem(state, { payload }) {
      // payload can be cartKey string or numeric id (legacy)
      const item = state.items.find(i => i.cartKey === payload || i.id === payload)
      if (item) {
        if (item.quantity > 1) item.quantity -= 1
        else state.items = state.items.filter(i => i.cartKey !== item.cartKey)
      }
    },
    clearCart(state) {
      state.items = []; state.restaurantId = null; state.restaurantName = ''
      state.couponCode = null; state.discount = 0; state.useWallet = false
    },
    applyCoupon(state, { payload }) {
      state.couponCode = payload.code
      state.discount   = payload.discountAmount
    },
    removeCoupon(state) {
      state.couponCode = null; state.discount = 0
    },
    toggleWallet(state) {
      state.useWallet = !state.useWallet
    },
    setTip(state, { payload }) {
      state.tip = payload
    },
    setItemInstructions(state, { payload: { id, instructions } }) {
      const item = state.items.find(i => i.cartKey === id || i.id === id)
      if (item) item.instructions = instructions
    }
  }
})

export const { addItem, removeItem, clearCart, applyCoupon, removeCoupon, toggleWallet, setTip, setItemInstructions } = cartSlice.actions

export const selectCartTotal = state =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

export const selectCartCount = state =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0)

export default cartSlice.reducer
