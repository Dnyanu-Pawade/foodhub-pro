import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWallet } from '@/features/wallet/walletSlice'
import { fetchNotifications } from '@/features/notifications/notificationsSlice'
import { fetchLoyalty } from '@/features/loyalty/loyaltySlice'
import { usePushNotifications } from '@/hooks/usePushNotifications'

import Navbar            from '@/components/layout/Navbar'
import Footer            from '@/components/layout/Footer'
import ProtectedRoute    from '@/components/layout/ProtectedRoute'
import PwaInstallBanner  from '@/components/ui/PwaInstallBanner'
import ErrorBoundary     from '@/components/ErrorBoundary'

import LoginPage         from '@/pages/LoginPage'
import RegisterPage      from '@/pages/RegisterPage'
import SearchPage        from '@/pages/SearchPage'

import HomePage          from '@/pages/customer/HomePage'
import RestaurantPage    from '@/pages/customer/RestaurantPage'
import CartPage          from '@/pages/customer/CartPage'
import OrderTrackingPage from '@/pages/customer/OrderTrackingPage'
import OrderHistoryPage  from '@/pages/customer/OrderHistoryPage'
import WalletPage        from '@/pages/customer/WalletPage'
import FavoritesPage     from '@/pages/customer/FavoritesPage'
import ProfilePage       from '@/pages/customer/ProfilePage'
import AddressPage       from '@/pages/customer/AddressPage'
import NotificationsPage from '@/pages/customer/NotificationsPage'
import LoyaltyPage       from '@/pages/customer/LoyaltyPage'
import ReferralPage      from '@/pages/customer/ReferralPage'
import SubscriptionPage  from '@/pages/customer/SubscriptionPage'

import OwnerDashboard      from '@/pages/owner/OwnerDashboard'
import OwnerMenuPage       from '@/pages/owner/OwnerMenuPage'
import OwnerRestaurantPage from '@/pages/owner/OwnerRestaurantPage'
import OwnerInventoryPage  from '@/pages/owner/OwnerInventoryPage'
import OwnerAnalyticsPage  from '@/pages/owner/OwnerAnalyticsPage'
import OwnerPayoutPage     from '@/pages/owner/OwnerPayoutPage'

import DeliveryDashboard from '@/pages/delivery/DeliveryDashboard'
import DeliveryKycPage   from '@/pages/delivery/DeliveryKycPage'
import DeliveryPayoutPage from '@/pages/delivery/DeliveryPayoutPage'

import AdminDashboard      from '@/pages/admin/AdminDashboard'
import AdminAnalyticsPage  from '@/pages/admin/AdminAnalyticsPage'
import AdminCouponsPage    from '@/pages/admin/AdminCouponsPage'
import AdminUsersPage      from '@/pages/admin/AdminUsersPage'
import AdminComplaintsPage from '@/pages/admin/AdminComplaintsPage'
import AdminKycPage        from '@/pages/admin/AdminKycPage'
import AdminPayoutsPage    from '@/pages/admin/AdminPayoutsPage'
import AdminCommissionPage from '@/pages/admin/AdminCommissionPage'
import AdminFraudPage      from '@/pages/admin/AdminFraudPage'

import StaffKitchenPage    from '@/pages/staff/StaffKitchenPage'

import FinanceDashboard    from '@/pages/finance/FinanceDashboard'
import SuperAdminPage      from '@/pages/superadmin/SuperAdminPage'
import MarketingDashboard  from '@/pages/marketing/MarketingDashboard'
import SupportPortalPage   from '@/pages/support/SupportPortalPage'

import InvoicePage         from '@/pages/customer/InvoicePage'
import ExplorePage         from '@/pages/ExplorePage'
import OrderSuccessPage    from '@/pages/customer/OrderSuccessPage'
import TableBookingPage    from '@/pages/customer/TableBookingPage'
import ChatPage            from '@/pages/customer/ChatPage'
import AdminCollectionsPage from '@/pages/admin/AdminCollectionsPage'
import ScheduledOrdersPage from '@/pages/customer/ScheduledOrdersPage'
import GiftCardsPage       from '@/pages/customer/GiftCardsPage'
import GroupOrderPage      from '@/pages/customer/GroupOrderPage'

import OwnerEmployeePage   from '@/pages/owner/OwnerEmployeePage'
import OwnerOffersPage     from '@/pages/owner/OwnerOffersPage'
import OwnerGstPage        from '@/pages/owner/OwnerGstPage'
import OwnerReviewsPage    from '@/pages/owner/OwnerReviewsPage'
import OwnerOnboardingPage from '@/pages/owner/OwnerOnboardingPage'

import AiChatbot           from '@/components/AiChatbot'
import FloatingCart        from '@/components/ui/FloatingCart'
import BottomNav           from '@/components/ui/BottomNav'

import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import QrOrderPage   from '@/pages/QrOrderPage'
import NotFoundPage  from '@/pages/NotFoundPage'
import TermsPage     from '@/pages/TermsPage'
import PrivacyPage   from '@/pages/PrivacyPage'
import LandingPage   from '@/pages/LandingPage'

const PR = (roles, El) => <ProtectedRoute roles={roles}><El /></ProtectedRoute>
const ALL = ['ROLE_CUSTOMER','ROLE_RESTAURANT_OWNER','ROLE_DELIVERY_PARTNER','ROLE_ADMIN']

export default function App() {
  const dispatch = useDispatch()
  const { user, accessToken } = useSelector(s => s.auth)

  usePushNotifications()


  useEffect(() => {
    if (!user || !accessToken) return
    dispatch(fetchNotifications())
    if (user.roles?.includes('ROLE_CUSTOMER')) {
      dispatch(fetchWallet())
      dispatch(fetchLoyalty())
    }
  }, [user?.id])

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 flex flex-col">
      <Navbar />
      <PwaInstallBanner />
      <AiChatbot />
      <FloatingCart />
      <BottomNav />
      <div className="flex-1 pb-16 md:pb-0">
      <Routes>
        {/* Public */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/search"         element={<SearchPage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/landing"        element={<LandingPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Customer */}
        <Route path="/"                   element={PR(['ROLE_CUSTOMER'], HomePage)} />
        <Route path="/cart"               element={PR(['ROLE_CUSTOMER'], CartPage)} />
        <Route path="/orders"             element={PR(['ROLE_CUSTOMER'], OrderHistoryPage)} />
        <Route path="/orders/:id"         element={PR(['ROLE_CUSTOMER'], OrderTrackingPage)} />
        <Route path="/wallet"             element={PR(['ROLE_CUSTOMER'], WalletPage)} />
        <Route path="/favorites"          element={PR(['ROLE_CUSTOMER'], FavoritesPage)} />
        <Route path="/loyalty"            element={PR(['ROLE_CUSTOMER'], LoyaltyPage)} />
        <Route path="/referral"           element={PR(['ROLE_CUSTOMER'], ReferralPage)} />
        <Route path="/subscription"       element={PR(['ROLE_CUSTOMER'], SubscriptionPage)} />
        <Route path="/addresses"          element={PR(['ROLE_CUSTOMER'], AddressPage)} />
        <Route path="/invoice"            element={PR(['ROLE_CUSTOMER'], InvoicePage)} />
        <Route path="/explore"            element={<ExplorePage />} />
        <Route path="/order-success"       element={<OrderSuccessPage />} />
        <Route path="/table-booking"        element={PR(['ROLE_CUSTOMER'], TableBookingPage)} />
        <Route path="/chat/:restaurantId"   element={PR(['ROLE_CUSTOMER'], ChatPage)} />
        <Route path="/scheduled-orders"   element={PR(['ROLE_CUSTOMER'], ScheduledOrdersPage)} />
        <Route path="/gift-cards"         element={PR(['ROLE_CUSTOMER'], GiftCardsPage)} />
        <Route path="/group-order/:code"   element={<GroupOrderPage />} />
        <Route path="/group-order"         element={PR(['ROLE_CUSTOMER'], GroupOrderPage)} />
        <Route path="/notifications"      element={<ProtectedRoute roles={ALL}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile"            element={<ProtectedRoute roles={ALL}><ProfilePage /></ProtectedRoute>} />

        {/* Owner */}
        <Route path="/owner/dashboard"   element={PR(['ROLE_RESTAURANT_OWNER'], OwnerDashboard)} />
        <Route path="/owner/onboarding"   element={PR(['ROLE_RESTAURANT_OWNER'], OwnerOnboardingPage)} />
        <Route path="/owner/menu"        element={PR(['ROLE_RESTAURANT_OWNER'], OwnerMenuPage)} />
        <Route path="/owner/restaurants" element={PR(['ROLE_RESTAURANT_OWNER'], OwnerRestaurantPage)} />
        <Route path="/owner/inventory"   element={PR(['ROLE_RESTAURANT_OWNER'], OwnerInventoryPage)} />
        <Route path="/owner/analytics"   element={PR(['ROLE_RESTAURANT_OWNER'], OwnerAnalyticsPage)} />
        <Route path="/owner/payouts"     element={PR(['ROLE_RESTAURANT_OWNER'], OwnerPayoutPage)} />
        <Route path="/owner/employees"   element={PR(['ROLE_RESTAURANT_OWNER'], OwnerEmployeePage)} />
        <Route path="/owner/offers"      element={PR(['ROLE_RESTAURANT_OWNER'], OwnerOffersPage)} />
        <Route path="/owner/gst"         element={PR(['ROLE_RESTAURANT_OWNER'], OwnerGstPage)} />
        <Route path="/owner/reviews"     element={PR(['ROLE_RESTAURANT_OWNER'], OwnerReviewsPage)} />

        {/* Staff */}
        <Route path="/staff/kitchen" element={PR(['ROLE_RESTAURANT_OWNER','ROLE_ADMIN'], StaffKitchenPage)} />

        {/* Delivery */}
        <Route path="/delivery/dashboard" element={PR(['ROLE_DELIVERY_PARTNER'], DeliveryDashboard)} />
        <Route path="/delivery/kyc"       element={PR(['ROLE_DELIVERY_PARTNER'], DeliveryKycPage)} />
        <Route path="/delivery/payouts"   element={PR(['ROLE_DELIVERY_PARTNER'], DeliveryPayoutPage)} />

        {/* Admin */}
        <Route path="/admin"             element={PR(['ROLE_ADMIN'], AdminDashboard)} />
        <Route path="/admin/analytics"   element={PR(['ROLE_ADMIN'], AdminAnalyticsPage)} />
        <Route path="/admin/coupons"     element={PR(['ROLE_ADMIN'], AdminCouponsPage)} />
        <Route path="/admin/users"       element={PR(['ROLE_ADMIN'], AdminUsersPage)} />
        <Route path="/admin/complaints"  element={PR(['ROLE_ADMIN'], AdminComplaintsPage)} />
        <Route path="/admin/kyc"         element={PR(['ROLE_ADMIN'], AdminKycPage)} />
        <Route path="/admin/payouts"     element={PR(['ROLE_ADMIN'], AdminPayoutsPage)} />
        <Route path="/admin/commission"  element={PR(['ROLE_ADMIN'], AdminCommissionPage)} />
        <Route path="/admin/fraud"       element={PR(['ROLE_ADMIN'], AdminFraudPage)} />

        <Route path="/admin/collections"  element={PR(['ROLE_ADMIN'], AdminCollectionsPage)} />

        {/* Finance / Marketing / Support / SuperAdmin */}
        <Route path="/finance"    element={PR(['ROLE_ADMIN'], FinanceDashboard)} />
        <Route path="/marketing"  element={PR(['ROLE_ADMIN'], MarketingDashboard)} />
        <Route path="/support"    element={PR(['ROLE_ADMIN'], SupportPortalPage)} />
        <Route path="/superadmin" element={PR(['ROLE_ADMIN'], SuperAdminPage)} />

        {/* Public info pages */}
        <Route path="/terms"   element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/order"   element={<QrOrderPage />} />
        <Route path="/qr-order" element={<QrOrderPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </div>
      <Footer />
    </div>
    </ErrorBoundary>
  )
}
