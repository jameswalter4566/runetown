import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import SkeletonArcherPlayerDemo from "./components/SkeletonArcherPlayerDemo";
import PlayerModelTest from "./components/PlayerModelTest";
import { CharacterCreator } from "./components/CharacterCreator";
import { Globe, Shield, Users, HelpCircle, Languages, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HowItWorksPopup } from "@/components/HowItWorksPopup";

const queryClient = new QueryClient();

const App = () => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen">
          {/* Main content area - full page */}
          <main className="relative h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/skeleton-archer-demo" element={<SkeletonArcherPlayerDemo enableDebug={true} />} />
              <Route path="/player-model-test" element={<PlayerModelTest />} />
              <Route path="/character-creator" element={<CharacterCreator />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        
        {/* How It Works Popup */}
        {showHowItWorks && (
          <HowItWorksPopup onClose={() => setShowHowItWorks(false)} />
        )}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
