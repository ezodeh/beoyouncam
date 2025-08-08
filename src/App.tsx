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
import Gallery from "./pages/Gallery";
import ManageDashboard from "./pages/ManageDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
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
          <Route path="/gallery/:token" element={<Gallery />} />
          <Route path="/manage/:token" element={<ManageDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
