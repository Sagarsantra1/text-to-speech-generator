import React from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatTime } from "@/utils/formatTime";

interface TTSStatusProps {
  error: string;
  isGenerating: boolean;
  chunkProgress: { total: number; completed: number };
  generationStartTime: number | null;
  generationEndTime: number | null;
}

const TTSStatus: React.FC<TTSStatusProps> = ({
  error,
  isGenerating,
  chunkProgress,
  generationStartTime,
  generationEndTime,
}) => {
  return (
    <div className="mt-4 space-y-2">
      {isGenerating && (
        <Progress
          value={
            chunkProgress.total > 0
              ? (chunkProgress.completed / chunkProgress.total) * 100
              : 0
          }
          className="mt-2"
        />
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generationStartTime && generationEndTime && (
        <p className="text-sm text-muted-foreground">
          Generation time: {formatTime((generationEndTime - generationStartTime)/1000)}m
        </p>
      )}
    </div>
  );
};

export default TTSStatus;
