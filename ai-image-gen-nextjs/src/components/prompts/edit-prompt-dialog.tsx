"use client"

import { Button } from "@/components/ui/button"
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
}

export function EditPromptDialog({ prompt, children }: EditPromptDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          {/* Render the edit form, passing initial data and close callback */}
          <EditPromptForm 
            initialData={prompt} 
            onFormSubmit={() => setIsOpen(false)} // Close dialog on successful submit
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 