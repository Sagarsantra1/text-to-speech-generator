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

const SettingsPopup = () => {
  const { device, setDevice } = useTTSWorker();
  const [selectedDevice, setSelectedDevice] = useState(device);
  const [open, setOpen] = useState(false);

  // When the dialog closes, reset the temporary selection.
  useEffect(() => {
    if (!open) {
      setSelectedDevice(device);
    }
  }, [open, device]);

  const handleSave = useCallback(() => {
    setDevice(selectedDevice);
    setOpen(false);
  }, [selectedDevice, setDevice]);

  return (
    <Dialog open={open} onOpenChange={setOpen} >
      <DialogTrigger asChild  className="fixed top-5 right-5">
        <Button variant="ghost" size="icon" className="p-3 rounded-full flec justify-center items-center">
        <Settings className=" h-4 w-4 cursor-pointer" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Device Settings</DialogTitle>
          <DialogDescription>
            Choose your preferred device for text-to-speech processing.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
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
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPopup;
