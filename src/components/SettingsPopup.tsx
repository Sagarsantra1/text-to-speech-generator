import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import { useTTSWorker } from "@/context/TTSWorkerContext";

// Define device options to simplify future extensions.
const deviceOptions = [
  { value: "webgpu", label: "WebGPU" },
  { value: "wasm", label: "WASM" },
];

// Define theme options for the dropdown.
const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];


const SettingsPopup = () => {
  const { device, setDevice } = useTTSWorker();
  const [selectedDevice, setSelectedDevice] = useState(device);
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("system"); // Default to system theme

  // Load theme from localStorage or default to system
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'system';
    setSelectedTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  // Apply theme function
  const applyTheme = (theme: string) => {
    if (theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.dataset.theme = 'dark';

      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.dataset.theme = 'light';
      }
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.dataset.theme = 'light';
    }
  };


  // When the dialog closes, reset the temporary selections.
  useEffect(() => {
    if (!open) {
      setSelectedDevice(device);
      setSelectedTheme(localStorage.getItem('theme') || 'system'); // Reset theme on close
    }
  }, [open, device]);

  const handleSave = useCallback(() => {
    setDevice(selectedDevice);
    localStorage.setItem('theme', selectedTheme);
    applyTheme(selectedTheme);
    setOpen(false);
  }, [selectedDevice, setDevice, selectedTheme]);

  return (
    <Dialog open={open} onOpenChange={setOpen} >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="p-3 rounded-full flec justify-center items-center">
        <Settings className=" h-4 w-4 cursor-pointer" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <h4 className="text-sm font-medium leading-none peer-disabled:opacity-70 mb-2">Device</h4>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a device" />
            </SelectTrigger>
            <SelectContent>
              {deviceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="py-2">
          <h4 className="text-sm font-medium leading-none peer-disabled:opacity-70 mb-2">Theme</h4>
          <Select value={selectedTheme} onValueChange={setSelectedTheme}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="System" />
            </SelectTrigger>
            <SelectContent>
              {themeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPopup;
