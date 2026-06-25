import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ToastContainer from '@/components/Toast';
import ChatModal from '@/components/ChatModal';
import ReturnModal from '@/components/ReturnModal';
import CookieConsent from '@/components/shared/CookieConsent';
import ScrollToTop from '@/components/shared/ScrollToTop';
import HomePage from '@/pages/HomePage';
import ShopPage from '@/pages/ShopPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import MembershipPage from '@/pages/MembershipPage';
import CustomSuitPage from '@/pages/CustomSuitPage';
import AccountPage from '@/pages/AccountPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import AboutPage from '@/pages/AboutPage';
import ReturnsPage from '@/pages/ReturnsPage';
import ContactPage from '@/pages/ContactPage';
import NotFoundPage from '@/pages/NotFoundPage';
import FAQPage from '@/pages/FAQPage';
import ShippingPage from '@/pages/ShippingPage';
import SizeGuidePage from '@/pages/SizeGuidePage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import AccessibilityPage from '@/pages/AccessibilityPage';
import TrackPage from '@/pages/TrackPage';
import ProfilePage from '@/pages/ProfilePage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import WishlistPage from '@/pages/WishlistPage';
import NotificationsPage from '@/pages/NotificationsPage';

import AdminLayout, { ModeratorLayout } from '@/pages/admin/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminMembers from '@/pages/admin/AdminMembers';
import AdminReturns from '@/pages/admin/AdminReturns';
import AdminRiders from '@/pages/admin/AdminRiders';
import AdminMemberships from '@/pages/admin/AdminMemberships';
import AdminContent from '@/pages/admin/AdminContent';
import AdminAuditLog from '@/pages/admin/AdminAuditLog';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminTeam from '@/pages/admin/AdminTeam';
import AdminMessages from '@/pages/admin/AdminMessages';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminBroadcast from '@/pages/admin/AdminBroadcast';
import ModeratorContent from '@/pages/moderator/ModeratorContent';
import ModeratorProducts from '@/pages/moderator/ModeratorProducts';
import ModeratorOrders from '@/pages/moderator/ModeratorOrders';

import RiderLayout from '@/pages/rider/RiderLayout';
import RiderDashboard from '@/pages/rider/RiderDashboard';
import RiderDeliveries from '@/pages/rider/RiderDeliveries';
import RiderDeliveryDetails from '@/pages/rider/RiderDeliveryDetails';
import RiderPickups from '@/pages/rider/RiderPickups';
import RiderEarnings from '@/pages/rider/RiderEarnings';
import RiderProfile from '@/pages/rider/RiderProfile';

import RoleGuard from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/stores/useAuthStore';

function Protected({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <ScrollToTop />
      <Routes>
        {/* Public site */}
        <Route path="/*" element={<PublicSite />} />

        {/* Admin */}
        <Route path="/admin" element={<RoleGuard roles={['admin']}><AdminLayout><AdminOverview /></AdminLayout></RoleGuard>} />
        <Route path="/admin/products" element={<RoleGuard roles={['admin']}><AdminLayout><AdminProducts /></AdminLayout></RoleGuard>} />
        <Route path="/admin/orders" element={<RoleGuard roles={['admin']}><AdminLayout><AdminOrders /></AdminLayout></RoleGuard>} />
        <Route path="/admin/members" element={<RoleGuard roles={['admin']}><AdminLayout><AdminMembers /></AdminLayout></RoleGuard>} />
        <Route path="/admin/returns" element={<RoleGuard roles={['admin']}><AdminLayout><AdminReturns /></AdminLayout></RoleGuard>} />
        <Route path="/admin/riders" element={<RoleGuard roles={['admin']}><AdminLayout><AdminRiders /></AdminLayout></RoleGuard>} />
        <Route path="/admin/memberships" element={<RoleGuard roles={['admin']}><AdminLayout><AdminMemberships /></AdminLayout></RoleGuard>} />
        <Route path="/admin/content" element={<RoleGuard roles={['admin']}><AdminLayout><AdminContent /></AdminLayout></RoleGuard>} />
        <Route path="/admin/team" element={<RoleGuard roles={['admin']}><AdminLayout><AdminTeam /></AdminLayout></RoleGuard>} />
        <Route path="/admin/audit-log" element={<RoleGuard roles={['admin']}><AdminLayout><AdminAuditLog /></AdminLayout></RoleGuard>} />
        <Route path="/admin/messages" element={<RoleGuard roles={['admin']}><AdminLayout><AdminMessages /></AdminLayout></RoleGuard>} />
        <Route path="/admin/notifications" element={<RoleGuard roles={['admin']}><AdminLayout><AdminNotifications /></AdminLayout></RoleGuard>} />
        <Route path="/admin/broadcast" element={<RoleGuard roles={['admin', 'moderator']}><AdminLayout><AdminBroadcast /></AdminLayout></RoleGuard>} />
        <Route path="/admin/settings" element={<RoleGuard roles={['admin']}><AdminLayout><AdminSettings /></AdminLayout></RoleGuard>} />

        {/* Moderator */}
        <Route path="/moderator" element={<RoleGuard roles={['moderator']}><ModeratorLayout><ModeratorContent /></ModeratorLayout></RoleGuard>} />
        <Route path="/moderator/products" element={<RoleGuard roles={['moderator']}><ModeratorLayout><ModeratorProducts /></ModeratorLayout></RoleGuard>} />
        <Route path="/moderator/orders" element={<RoleGuard roles={['moderator']}><ModeratorLayout><ModeratorOrders /></ModeratorLayout></RoleGuard>} />
        <Route path="/moderator/broadcast" element={<RoleGuard roles={['moderator']}><AdminLayout><AdminBroadcast /></AdminLayout></RoleGuard>} />

        {/* Rider */}
        <Route path="/rider" element={<RoleGuard roles={['rider']}><RiderLayout><RiderDashboard /></RiderLayout></RoleGuard>} />
        <Route path="/rider/deliveries" element={<RoleGuard roles={['rider']}><RiderLayout><RiderDeliveries /></RiderLayout></RoleGuard>} />
        <Route path="/rider/deliveries/:id" element={<RoleGuard roles={['rider']}><RiderLayout><RiderDeliveryDetails /></RiderLayout></RoleGuard>} />
        <Route path="/rider/pickups" element={<RoleGuard roles={['rider']}><RiderLayout><RiderPickups /></RiderLayout></RoleGuard>} />
        <Route path="/rider/earnings" element={<RoleGuard roles={['rider']}><RiderLayout><RiderEarnings /></RiderLayout></RoleGuard>} />
        <Route path="/rider/profile" element={<RoleGuard roles={['rider']}><RiderLayout><RiderProfile /></RiderLayout></RoleGuard>} />
      </Routes>
    </div>
  );
}

function PublicSite() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <ToastContainer />
      <ChatModal />
      <ReturnModal />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/custom-request" element={<CustomSuitPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/account" element={<Protected><AccountPage /></Protected>} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
        <Route path="/account/orders/:id" element={<Protected><OrderDetailPage /></Protected>} />
        <Route path="/wishlist" element={<Protected><WishlistPage /></Protected>} />
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route path="/about" element={<AboutPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/faq" element={<FAQPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
        <Route path="/size-guide" element={<SizeGuidePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/track" element={<TrackPage />} />

        <Route path="/admin" element={<Navigate to="/login" replace />} />
        <Route path="/moderator" element={<Navigate to="/login" replace />} />
        <Route path="/rider" element={<Navigate to="/login" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <CookieConsent />
    </>
  );
}