import React from "react";
import SettingsPopup from "@/components/SettingsPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";

const Header: React.FC = () => {
  const { currentPageName } = useNavigation();

  return (
    <div className="fixed w-full z-10 bg-background/95 backdrop-blur-sm border-b">
      <div className="container flex items-center justify-between py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className=" font-bold text-xl">
              {currentPageName} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="text-xl">
            <DropdownMenuItem asChild>
              <Link to="/">TTS Generator</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/story">Story Mode</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SettingsPopup />
      </div>
    </div>
  );
};

export default Header;
