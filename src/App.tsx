import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner
          theme='dark'
          toastOptions={{
            style: {
              background: "hsl(270 50% 8%)",
              border: "1px solid hsl(270 40% 20%)",
              color: "hsl(180 100% 95%)",
            },
          }}
        />
        {/*
          Use the Vite-provided BASE_URL as the basename so that React Router
          works correctly when the app is served from a sub-path on GitHub
          Pages, e.g. https://suke2004.github.io/aether/.
        */}
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path='/' element={<Index />} />
            <Route path='/auth' element={<Auth />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
