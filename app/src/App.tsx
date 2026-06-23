import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ToastContainer from '@/components/Toast';
import ChatModal from '@/components/ChatModal';
import ReturnModal from '@/components/ReturnModal';
import HomePage from '@/pages/HomePage';
import ShopPage from '@/pages/ShopPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import MembershipPage from '@/pages/MembershipPage';
import CustomSuitPage from '@/pages/CustomSuitPage';
import AccountPage from '@/pages/AccountPage';
import LoginPage from '@/pages/LoginPage';
import AboutPage from '@/pages/AboutPage';
import ReturnsPage from '@/pages/ReturnsPage';
import ContactPage from '@/pages/ContactPage';
import NotFoundPage from '@/pages/NotFoundPage';

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

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* Public site */}
        <Route path="/*" element={<PublicSite />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminOverview /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminProducts /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminOrders /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/members"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminMembers /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/returns"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminReturns /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/riders"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminRiders /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/memberships"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminMemberships /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/content"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminContent /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/team"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminTeam /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/audit-log"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminAuditLog /></AdminLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleGuard roles={['admin']}>
              <AdminLayout><AdminSettings /></AdminLayout>
            </RoleGuard>
          }
        />

        {/* Moderator */}
        <Route
          path="/moderator"
          element={
            <RoleGuard roles={['moderator']}>
              <ModeratorLayout><ModeratorContent /></ModeratorLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/moderator/products"
          element={
            <RoleGuard roles={['moderator']}>
              <ModeratorLayout><ModeratorProducts /></ModeratorLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/moderator/orders"
          element={
            <RoleGuard roles={['moderator']}>
              <ModeratorLayout><ModeratorOrders /></ModeratorLayout>
            </RoleGuard>
          }
        />

        {/* Rider */}
        <Route
          path="/rider"
          element={
            <RoleGuard roles={['rider']}>
              <RiderLayout><RiderDashboard /></RiderLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/rider/deliveries"
          element={
            <RoleGuard roles={['rider']}>
              <RiderLayout><RiderDeliveries /></RiderLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/rider/deliveries/:id"
          element={
            <RoleGuard roles={['rider']}>
              <RiderLayout><RiderDeliveryDetails /></RiderLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/rider/pickups"
          element={
            <RoleGuard roles={['rider']}>
              <RiderLayout><RiderPickups /></RiderLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/rider/earnings"
          element={
            <RoleGuard roles={['rider']}>
              <RiderLayout><RiderEarnings /></RiderLayout>
            </RoleGuard>
          }
        />
        <Route
          path="/rider/profile"
          element={
            <RoleGuard roles={['rider']}>
              <RiderLayout><RiderProfile /></RiderLayout>
            </RoleGuard>
          }
        />
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
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<Navigate to="/login" replace />} />
        <Route path="/moderator" element={<Navigate to="/login" replace />} />
        <Route path="/rider" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  );
}
