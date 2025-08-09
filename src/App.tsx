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
import EventFinalSubmit from "./pages/EventFinalSubmit";
import ThemeProvider from "@/components/theme/ThemeProvider";
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
const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/choose-plan" element={<ChoosePlan />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/event/:token" element={<EventCapture />} />
            <Route path="/event/:token/welcome" element={<EventWelcome />} />
            <Route path="/event/:token/soon" element={<EventSoon />} />
            <Route path="/event/:token/ended" element={<EventEnded />} />
            <Route path="/event/:token/camera" element={<EventCamera />} />
            <Route path="/event/:token/submit" element={<EventFinalSubmit />} />
            <Route path="/gallery/:token" element={<Gallery />} />
            <Route path="/album/:token/intro" element={<EventAlbumIntro />} />
            <Route path="/album/:token" element={<EventAlbum />} />
            <Route path="/album/:token/by/:name" element={<EventAlbumByEyes />} />
            <Route path="/event/:token/invites" element={<Invites />} />
            <Route path="/manage/:token" element={<ManageDashboard />} />
            <Route path="/account" element={<Account />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/billing" element={<BillingHistory />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
