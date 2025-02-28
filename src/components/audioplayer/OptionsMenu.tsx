import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, ArrowDownToLine } from "lucide-react";

interface OptionsMenuProps {
  mergedAudioUrl: string | null;
}

const OptionsMenu: React.FC<OptionsMenuProps> = ({ mergedAudioUrl }) => {
  const downloadAudio = () => {
    if (!mergedAudioUrl) return;
    const link = document.createElement("a");
    link.href = mergedAudioUrl;
    // You can change the filename and extension as needed.
    link.download = "downloaded_audio.wav";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="p-3 rounded-full">
          <EllipsisVertical />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white rounded shadow p-2 min-w-[150px] border border-gray-200"
          sideOffset={5}
        >
          {mergedAudioUrl ? (
            <DropdownMenu.Item
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded flex items-center"
              onSelect={downloadAudio}
            >
              <ArrowDownToLine className="w-5 h-5 mr-2" />
              Download
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              className="px-3 py-2 text-gray-400 cursor-not-allowed rounded"
              disabled
            >
              Download Unavailable
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default OptionsMenu;
