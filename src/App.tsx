
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ChoosePlan from "./pages/ChoosePlan";
import Payment from "./pages/Payment";
import CreateEvent from "./pages/CreateEvent";
import EventCapture from "./pages/EventCapture";
import EventCamera from "./pages/EventCamera";
import Gallery from "./pages/Gallery";
import ManageDashboard from "./pages/ManageDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EventAlbum from "./pages/EventAlbum";
import EventAlbumIntro from "./pages/EventAlbumIntro";
import EventAlbumByEyes from "./pages/EventAlbumByEyes";
import EventAlbumPrivate from "./pages/EventAlbumPrivate";
import EventFinalSubmit from "./pages/EventFinalSubmit";
import EventSubmitSuccess from "./pages/EventSubmitSuccess";
import ThemeProvider from "@/components/theme/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Invites from "./pages/Invites";
import EventWelcome from "./pages/EventWelcome";
import EventSoon from "./pages/EventSoon";
import EventEnded from "./pages/EventEnded";
import Account from "./pages/Account";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Settings from "./pages/Settings";
import Scanner from "./pages/Scanner";
import BillingHistory from "./pages/BillingHistory";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider } from "@/hooks/useAuth";
import RequireAuth from "@/components/auth/RequireAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

console.log("🚀 App: Starting application...");

const App = () => {
  console.log("🚀 App: Rendering main App component");
  
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/choose-plan" element={<RequireAuth><ChoosePlan /></RequireAuth>} />
                <Route path="/payment" element={<RequireAuth><Payment /></RequireAuth>} />
                <Route path="/create-event" element={<RequireAuth><CreateEvent /></RequireAuth>} />
                <Route path="/event/:token" element={<EventCapture />} />
                <Route path="/event/:token/welcome" element={<EventWelcome />} />
                <Route path="/event/:token/soon" element={<EventSoon />} />
                <Route path="/event/:token/ended" element={<EventEnded />} />
                <Route path="/event/:token/camera" element={<EventCamera />} />
                <Route path="/event/:token/submit" element={<EventFinalSubmit />} />
                <Route path="/event/:token/submit-success" element={<EventSubmitSuccess />} />
                <Route path="/gallery/:token" element={<Gallery />} />
                <Route path="/album/:token/intro" element={<EventAlbumIntro />} />
                <Route path="/album/:token" element={<EventAlbum />} />
                <Route path="/album/:token/private" element={<EventAlbumPrivate />} />
                <Route path="/album/:token/by/:name" element={<EventAlbumByEyes />} />
                <Route path="/event/:token/invites" element={<RequireAuth><Invites /></RequireAuth>} />
                <Route path="/manage/:token" element={<RequireAuth><ManageDashboard /></RequireAuth>} />
                <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/billing" element={<RequireAuth><BillingHistory /></RequireAuth>} />
                <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
