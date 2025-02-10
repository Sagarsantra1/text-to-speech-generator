import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVertical } from "lucide-react";

const OptionsMenu: React.FC = () => {
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
          <DropdownMenu.Item
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded"
            onSelect={() => console.log("Settings Option 1 selected")}
          >
            Settings Option 1
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default OptionsMenu;
