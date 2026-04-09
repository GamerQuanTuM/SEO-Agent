import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientProvider } from "./context/ClientContext";
import Index from "./pages/Index";
import Actions from "./pages/Actions";
import OffPage from "./pages/OffPage";
import NotFound from "./pages/NotFound";
import Technical from "./pages/Technical";
import ContentCreation from "./pages/ContentCreation";
import OnPageAgent from "./pages/OnPageAgent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ClientProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/actions" element={<Actions />} />
            <Route path="/off-page" element={<OffPage />} />
            <Route path="/technical" element={<Technical />} />
            <Route path="/content" element={<ContentCreation />} />
            <Route path="/on-page" element={<OnPageAgent />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ClientProvider>
  </QueryClientProvider>
);

export default App;
