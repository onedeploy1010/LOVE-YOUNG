import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/routes";
import Index from "./pages/Index";
import Brand from "./pages/Brand";
import Products from "./pages/Products";
import RWAPlan from "./pages/RWAPlan";
import MemberCenter from "./pages/MemberCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path={ROUTE_PATHS.HOME} element={<Index />} />
          <Route path={ROUTE_PATHS.BRAND} element={<Brand />} />
          <Route path={ROUTE_PATHS.PRODUCTS} element={<Products />} />
          <Route path={ROUTE_PATHS.RWA_PLAN} element={<RWAPlan />} />
          <Route path={ROUTE_PATHS.MEMBER_CENTER} element={<MemberCenter />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
