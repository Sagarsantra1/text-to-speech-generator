import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TTSWorkerProvider } from "@/context/TTSWorkerContext";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import StoryMode from "@/components/StoryMode";
import TTSGenerator from "@/components/TTSGenerator";

const App = () => {
  return (
    <TTSWorkerProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <Header />
        <div style={{ paddingTop: '4rem' }}> {/* Added paddingTop to create space below header */}
          <div>
            <Routes>
              <Route path="/" element={<TTSGenerator />} />
              <Route path="/story" element={<StoryMode />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </TooltipProvider>
    </TTSWorkerProvider>
  );
};

export default App;
