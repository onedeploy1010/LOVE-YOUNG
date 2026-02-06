import { Switch, Route, useLocation } from "wouter";
import { useEffect, type ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import { useAuthStore, initAuthListener } from "@/stores/authStore";
import { AdminRoute, PartnerRoute, MemberRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingReferralButton } from "@/components/FloatingReferralButton";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import AuthLoginPage from "@/pages/auth/AuthLoginPage";
import AuthCallbackPage from "@/pages/auth/AuthCallbackPage";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

// Public pages
import LandingPage from "@/pages/LandingPage";
import BrandStoryPage from "@/pages/BrandStoryPage";
import ProductsPage from "@/pages/ProductsPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import ChristmasPromoPage from "@/pages/ChristmasPromoPage";
import PartnerPage from "@/pages/PartnerPage";
import PartnerJoinPage from "@/pages/PartnerJoinPage";
import CheckoutSuccessPage from "@/pages/CheckoutSuccessPage";

// Member pages
import MemberCenterPage from "@/pages/MemberCenterPage";
import MemberSettingsPage from "@/pages/member/MemberSettingsPage";
import MemberNotificationsPage from "@/pages/member/MemberNotificationsPage";
import MemberHelpPage from "@/pages/member/MemberHelpPage";
import MemberOrdersPage from "@/pages/member/MemberOrdersPage";
import MemberAddressesPage from "@/pages/member/MemberAddressesPage";
import MemberPointsPage from "@/pages/member/MemberPointsPage";
import MemberPaymentPage from "@/pages/member/MemberPaymentPage";
import MemberReferralsPage from "@/pages/member/MemberReferralsPage";

// Partner pages
import PartnerDashboardPage from "@/pages/partner/PartnerDashboardPage";
import PartnerReferralsPage from "@/pages/partner/PartnerReferralsPage";
import PartnerMaterialsPage from "@/pages/partner/PartnerMaterialsPage";
import PartnerLyPointsPage from "@/pages/partner/PartnerLyPointsPage";
import PartnerWalletPage from "@/pages/partner/PartnerWalletPage";
import PartnerRwaPage from "@/pages/partner/PartnerRwaPage";
import PartnerEarningsPage from "@/pages/partner/PartnerEarningsPage";

// Admin pages
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminPartnersPage from "@/pages/admin/AdminPartnersPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminMembersPage from "@/pages/admin/AdminMembersPage";
import AdminBonusPoolPage from "@/pages/admin/AdminBonusPoolPage";
import AdminInventoryPage from "@/pages/admin/AdminInventoryPage";
import AdminPurchasePage from "@/pages/admin/AdminPurchasePage";
import AdminLogisticsPage from "@/pages/admin/AdminLogisticsPage";
import AdminBillsPage from "@/pages/admin/AdminBillsPage";
import AdminFinancePage from "@/pages/admin/AdminFinancePage";
import AdminProductionPage from "@/pages/admin/AdminProductionPage";
import AdminWithdrawalsPage from "@/pages/admin/AdminWithdrawalsPage";
import AdminSiteSettingsPage from "@/pages/admin/AdminSiteSettingsPage";
import AdminMetaAdsPage from "@/pages/admin/AdminMetaAdsPage";
import AdminXiaohongshuPage from "@/pages/admin/AdminXiaohongshuPage";
import AdminMediaPlanPage from "@/pages/admin/AdminMediaPlanPage";
import AdminAdPlacementPage from "@/pages/admin/AdminAdPlacementPage";
import AdminPerformanceReportsPage from "@/pages/admin/AdminPerformanceReportsPage";
import AdminWhatsappConfigPage from "@/pages/admin/AdminWhatsappConfigPage";
import AdminWhatsappOrdersPage from "@/pages/admin/AdminWhatsappOrdersPage";
import AdminWhatsappMembersPage from "@/pages/admin/AdminWhatsappMembersPage";
import AdminAiCustomerServicePage from "@/pages/admin/AdminAiCustomerServicePage";
import AdminContentCreationPage from "@/pages/admin/AdminContentCreationPage";
import AdminWhatsappAdminPage from "@/pages/admin/AdminWhatsappAdminPage";
import AdminSystemHealthPage from "@/pages/admin/AdminSystemHealthPage";

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* Public routes */}
        <Route path="/" component={LandingPage} />
        <Route path="/brand" component={BrandStoryPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/order-tracking" component={OrderTrackingPage} />
        <Route path="/christmas" component={ChristmasPromoPage} />
        <Route path="/partner/join" component={PartnerJoinPage} />
        <Route path="/partner" component={PartnerPage} />
        <Route path="/checkout/success" component={CheckoutSuccessPage} />
        <Route path="/auth/login" component={AuthLoginPage} />
        <Route path="/auth/callback" component={AuthCallbackPage} />

        {/* Member routes - require member role */}
        <Route path="/member">
          <MemberRoute><MemberCenterPage /></MemberRoute>
        </Route>
        <Route path="/member/settings">
          <MemberRoute><MemberSettingsPage /></MemberRoute>
        </Route>
        <Route path="/member/notifications">
          <MemberRoute><MemberNotificationsPage /></MemberRoute>
        </Route>
        <Route path="/member/help">
          <MemberRoute><MemberHelpPage /></MemberRoute>
        </Route>
        <Route path="/member/orders">
          <MemberRoute><MemberOrdersPage /></MemberRoute>
        </Route>
        <Route path="/member/addresses">
          <MemberRoute><MemberAddressesPage /></MemberRoute>
        </Route>
        <Route path="/member/points">
          <MemberRoute><MemberPointsPage /></MemberRoute>
        </Route>
        <Route path="/member/payment">
          <MemberRoute><MemberPaymentPage /></MemberRoute>
        </Route>
        <Route path="/member/referrals">
          <MemberRoute><MemberReferralsPage /></MemberRoute>
        </Route>
        <Route path="/member/materials">
          <MemberRoute><PartnerMaterialsPage /></MemberRoute>
        </Route>

        {/* Partner routes - require partner role */}
        <Route path="/member/partner">
          <PartnerRoute><PartnerDashboardPage /></PartnerRoute>
        </Route>
        <Route path="/member/partner/referrals">
          <PartnerRoute><PartnerReferralsPage /></PartnerRoute>
        </Route>
        <Route path="/member/partner/materials">
          <PartnerRoute><PartnerMaterialsPage /></PartnerRoute>
        </Route>
        <Route path="/member/partner/ly-points">
          <PartnerRoute><PartnerLyPointsPage /></PartnerRoute>
        </Route>
        <Route path="/member/partner/wallet">
          <PartnerRoute><PartnerWalletPage /></PartnerRoute>
        </Route>
        <Route path="/member/partner/rwa">
          <PartnerRoute><PartnerRwaPage /></PartnerRoute>
        </Route>
        <Route path="/member/partner/earnings">
          <PartnerRoute><PartnerEarningsPage /></PartnerRoute>
        </Route>
        <Route path="/partner/dashboard">
          <PartnerRoute><PartnerDashboardPage /></PartnerRoute>
        </Route>

        {/* Admin routes - require admin role */}
        <Route path="/admin">
          <AdminRoute><AdminDashboardPage /></AdminRoute>
        </Route>
        <Route path="/admin/partners">
          <AdminRoute><AdminPartnersPage /></AdminRoute>
        </Route>
        <Route path="/admin/orders">
          <AdminRoute><AdminOrdersPage /></AdminRoute>
        </Route>
        <Route path="/admin/products">
          <AdminRoute><AdminProductsPage /></AdminRoute>
        </Route>
        <Route path="/admin/members">
          <AdminRoute><AdminMembersPage /></AdminRoute>
        </Route>
        <Route path="/admin/bonus-pool">
          <AdminRoute><AdminBonusPoolPage /></AdminRoute>
        </Route>
        <Route path="/admin/inventory">
          <AdminRoute><AdminInventoryPage /></AdminRoute>
        </Route>
        <Route path="/admin/production">
          <AdminRoute><AdminProductionPage /></AdminRoute>
        </Route>
        <Route path="/admin/purchase">
          <AdminRoute><AdminPurchasePage /></AdminRoute>
        </Route>
        <Route path="/admin/logistics">
          <AdminRoute><AdminLogisticsPage /></AdminRoute>
        </Route>
        <Route path="/admin/bills">
          <AdminRoute><AdminBillsPage /></AdminRoute>
        </Route>
        <Route path="/admin/finance">
          <AdminRoute><AdminFinancePage /></AdminRoute>
        </Route>
        <Route path="/admin/withdrawals">
          <AdminRoute><AdminWithdrawalsPage /></AdminRoute>
        </Route>
        <Route path="/admin/site-settings">
          <AdminRoute><AdminSiteSettingsPage /></AdminRoute>
        </Route>

        {/* Marketing Management routes */}
        <Route path="/admin/marketing/content">
          <AdminRoute><AdminContentCreationPage /></AdminRoute>
        </Route>
        <Route path="/admin/marketing/meta-ads">
          <AdminRoute><AdminMetaAdsPage /></AdminRoute>
        </Route>
        <Route path="/admin/marketing/xiaohongshu">
          <AdminRoute><AdminXiaohongshuPage /></AdminRoute>
        </Route>
        <Route path="/admin/marketing/media-plan">
          <AdminRoute><AdminMediaPlanPage /></AdminRoute>
        </Route>
        <Route path="/admin/marketing/ad-placement">
          <AdminRoute><AdminAdPlacementPage /></AdminRoute>
        </Route>
        <Route path="/admin/marketing/reports">
          <AdminRoute><AdminPerformanceReportsPage /></AdminRoute>
        </Route>

        {/* WhatsApp Business routes */}
        <Route path="/admin/whatsapp/config">
          <AdminRoute><AdminWhatsappConfigPage /></AdminRoute>
        </Route>
        <Route path="/admin/whatsapp/orders">
          <AdminRoute><AdminWhatsappOrdersPage /></AdminRoute>
        </Route>
        <Route path="/admin/whatsapp/members">
          <AdminRoute><AdminWhatsappMembersPage /></AdminRoute>
        </Route>
        <Route path="/admin/whatsapp/ai-service">
          <AdminRoute><AdminAiCustomerServicePage /></AdminRoute>
        </Route>
        <Route path="/admin/whatsapp/admins">
          <AdminRoute><AdminWhatsappAdminPage /></AdminRoute>
        </Route>
        <Route path="/admin/system-health">
          <AdminRoute><AdminSystemHealthPage /></AdminRoute>
        </Route>

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

/**
 * AuthGate: the single loading gate for auth state.
 * Blocks all routes until auth is ready (loading=false or cached user exists).
 * All children can trust that auth state is stable.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const loading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    initAuthListener();
  }, []);

  // Cached user → render immediately (initAuthListener already set loading=false)
  // No cached user → wait for loading=false (safety timeout in initAuthListener caps at 3s)
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <AuthGate>
              <Router />
              <FloatingReferralButton />
            </AuthGate>
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
