import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface AdminSwitchProps {
  id: number;
  initialChecked: boolean;
  onToggle: (id: number, newValue: boolean) => void;
  isPending?: boolean;
}

export function AdminSwitch({
  id,
  initialChecked,
  onToggle,
  isPending = false,
}: AdminSwitchProps) {
  // Maintain internal state for the switch
  const [isChecked, setIsChecked] = useState<boolean>(initialChecked);

  // Update internal state when props change
  useEffect(() => {
    // This is critical - we must update our internal state when the server updates the data
    console.log(`AdminSwitch for user ${id} received initialChecked update: ${initialChecked}`);
    setIsChecked(initialChecked);
  }, [initialChecked, id]);

  const handleChange = () => {
    // We won't update our state directly anymore - we'll let the props update from the parent
    // when the refetch completes after toggling
    
    // Just call the callback to initiate the toggle
    onToggle(id, !isChecked);
  };

  if (isPending) {
    return (
      <div className="h-6 w-6 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Switch
      checked={isChecked}
      onCheckedChange={handleChange}
      id={`admin-toggle-${id}`}
    />
  );
}