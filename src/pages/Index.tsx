import TTSGenerator from "@/components/TTSGenerator";
import StoryMode from "@/components/StoryMode";
import SettingsPopup from "@/components/SettingsPopup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-background max-w-4xl mx-auto p-5">
      <Tabs defaultValue="TTSGenerator">
        <TabsList className="w-full">
          <TabsTrigger className="w-1/2" value="TTSGenerator">
            Text To Speech
          </TabsTrigger>
          <TabsTrigger className="w-1/2" value="StoryMode">
            Story Mode
          </TabsTrigger>
        </TabsList>
        <TabsContent value="TTSGenerator">
          <TTSGenerator />
        </TabsContent>
        <TabsContent value="StoryMode">
          <StoryMode />
        </TabsContent>
      </Tabs>
      <SettingsPopup />
    </div>
  );
};

export default Index;
