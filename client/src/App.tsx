import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import BrandStoryPage from "@/pages/BrandStoryPage";
import ProductsPage from "@/pages/ProductsPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import ChristmasPromoPage from "@/pages/ChristmasPromoPage";
import MemberCenterPage from "@/pages/MemberCenterPage";
import PartnerPage from "@/pages/PartnerPage";
import PartnerDashboardPage from "@/pages/PartnerDashboardPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/brand" component={BrandStoryPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/order-tracking" component={OrderTrackingPage} />
      <Route path="/christmas" component={ChristmasPromoPage} />
      <Route path="/member" component={MemberCenterPage} />
      <Route path="/partner" component={PartnerPage} />
      <Route path="/partner/dashboard" component={PartnerDashboardPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route component={NotFound} />
    </Switch>
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
