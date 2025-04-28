"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // Import if needed for separate actions
  DialogClose, // To close the dialog
} from "@/components/ui/dialog"
import { SavePromptForm } from "./save-prompt-form"
import { useState } from "react";

export function SavePromptDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
         {/* The Button that opens the dialog */}
        <Button>Save New Prompt</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]"> {/* Adjust width as needed */}
        <DialogHeader>
          <DialogTitle>Save New Prompt</DialogTitle>
          <DialogDescription>
            Enter the details for your new prompt below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <SavePromptForm onFormSubmit={() => setIsOpen(false)} /> {/* Pass callback to close dialog */}
        </div>
         {/* Optional Footer with explicit close button if needed */}
         {/* <DialogFooter>
             <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancel</Button>
             </DialogClose>
         </DialogFooter> */}
      </DialogContent>
    </Dialog>
  )
} 