import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}
import LandingPage from "@/pages/LandingPage";
import BrandStoryPage from "@/pages/BrandStoryPage";
import ProductsPage from "@/pages/ProductsPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import ChristmasPromoPage from "@/pages/ChristmasPromoPage";
import MemberCenterPage from "@/pages/MemberCenterPage";
import PartnerPage from "@/pages/PartnerPage";
import PartnerDashboardPage from "@/pages/partner/PartnerDashboardPage";
import PartnerReferralsPage from "@/pages/partner/PartnerReferralsPage";
import PartnerMaterialsPage from "@/pages/partner/PartnerMaterialsPage";
import PartnerLyPointsPage from "@/pages/partner/PartnerLyPointsPage";
import PartnerWalletPage from "@/pages/partner/PartnerWalletPage";
import PartnerRwaPage from "@/pages/partner/PartnerRwaPage";
import PartnerEarningsPage from "@/pages/partner/PartnerEarningsPage";
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
import MemberSettingsPage from "@/pages/member/MemberSettingsPage";
import MemberNotificationsPage from "@/pages/member/MemberNotificationsPage";
import MemberHelpPage from "@/pages/member/MemberHelpPage";
import MemberOrdersPage from "@/pages/member/MemberOrdersPage";
import MemberAddressesPage from "@/pages/member/MemberAddressesPage";
import MemberPointsPage from "@/pages/member/MemberPointsPage";
import MemberPaymentPage from "@/pages/member/MemberPaymentPage";
import PartnerJoinPage from "@/pages/PartnerJoinPage";

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={LandingPage} />
      <Route path="/brand" component={BrandStoryPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/order-tracking" component={OrderTrackingPage} />
      <Route path="/christmas" component={ChristmasPromoPage} />
      <Route path="/member" component={MemberCenterPage} />
      <Route path="/member/settings" component={MemberSettingsPage} />
      <Route path="/member/notifications" component={MemberNotificationsPage} />
      <Route path="/member/help" component={MemberHelpPage} />
      <Route path="/member/orders" component={MemberOrdersPage} />
      <Route path="/member/addresses" component={MemberAddressesPage} />
      <Route path="/member/points" component={MemberPointsPage} />
      <Route path="/member/payment" component={MemberPaymentPage} />
      <Route path="/member/partner" component={PartnerDashboardPage} />
      <Route path="/member/partner/referrals" component={PartnerReferralsPage} />
      <Route path="/member/partner/materials" component={PartnerMaterialsPage} />
      <Route path="/member/partner/ly-points" component={PartnerLyPointsPage} />
      <Route path="/member/partner/wallet" component={PartnerWalletPage} />
      <Route path="/member/partner/rwa" component={PartnerRwaPage} />
      <Route path="/member/partner/earnings" component={PartnerEarningsPage} />
      <Route path="/partner" component={PartnerPage} />
      <Route path="/partner/join" component={PartnerJoinPage} />
      <Route path="/partner/dashboard" component={PartnerDashboardPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/partners" component={AdminPartnersPage} />
      <Route path="/admin/orders" component={AdminOrdersPage} />
      <Route path="/admin/products" component={AdminProductsPage} />
      <Route path="/admin/members" component={AdminMembersPage} />
      <Route path="/admin/bonus-pool" component={AdminBonusPoolPage} />
      <Route path="/admin/inventory" component={AdminInventoryPage} />
      <Route path="/admin/production" component={AdminProductionPage} />
      <Route path="/admin/purchase" component={AdminPurchasePage} />
      <Route path="/admin/logistics" component={AdminLogisticsPage} />
      <Route path="/admin/bills" component={AdminBillsPage} />
      <Route path="/admin/finance" component={AdminFinancePage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
