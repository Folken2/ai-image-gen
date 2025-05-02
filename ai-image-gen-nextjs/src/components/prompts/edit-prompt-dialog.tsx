"use client"

// Imports are handled in PromptActionsCell now
// import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { EditPromptForm } from "./edit-prompt-form"
import { useState } from "react";
import type { Prompt } from "./columns"; // Import the Prompt type

interface EditPromptDialogProps {
    prompt: Prompt; // The prompt data to edit
    // We use children to allow flexible trigger elements (e.g., an icon button)
    children: React.ReactNode; 
    onSaveSuccess?: () => void; // Add optional callback prop
}

export function EditPromptDialog({ prompt, children, onSaveSuccess }: EditPromptDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false); // Close the dialog
    onSaveSuccess?.(); // Call the optional success callback
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* The DialogTrigger wraps the button passed as children */}
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Prompt</DialogTitle>
          <DialogDescription>
            Update the details for your prompt below. Click update when done.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* Render the edit form, passing initial data and the new success handler */}
          <EditPromptForm
            initialData={prompt}
            onFormSubmit={handleSuccess} // Use the combined handler
          />
        </div>
        {/* Remove unused DialogFooter/DialogClose, assuming the form handles closing */}
        {/* <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  )
} 