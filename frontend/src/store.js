import { configureStore } from '@reduxjs/toolkit'
import authReducer          from '@/features/auth/authSlice'
import cartReducer          from '@/features/cart/cartSlice'
import orderReducer         from '@/features/order/orderSlice'
import restaurantReducer    from '@/features/restaurant/restaurantSlice'
import walletReducer        from '@/features/wallet/walletSlice'
import themeReducer         from '@/features/theme/themeSlice'
import notificationsReducer from '@/features/notifications/notificationsSlice'
import loyaltyReducer       from '@/features/loyalty/loyaltySlice'
import cityReducer          from '@/features/city/citySlice'

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    cart:          cartReducer,
    order:         orderReducer,
    restaurant:    restaurantReducer,
    wallet:        walletReducer,
    theme:         themeReducer,
    notifications: notificationsReducer,
    loyalty:       loyaltyReducer,
    city:          cityReducer,
  }
})
