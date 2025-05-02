"use client"

import { useState } from 'react'
import { ColumnDef } from "@tanstack/react-table"
import { Copy, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DialogTrigger } from "@/components/ui/dialog"

import type { Database } from "@/lib/supabase/database.types";
import { deletePromptAction } from "@/app/prompts/actions";
import { EditPromptDialog } from "./edit-prompt-dialog";

// Define the shape of our prompt data based on the Supabase table
// We select specific fields we want to display.
export type Prompt = Pick<
    Database["public"]["Tables"]["prompts"]["Row"],
    'id' | 'created_at' | 'name' | 'prompt_text' | 'negative_prompt' | 'notes' | 'style_tags'
>;

// Helper function to copy text to clipboard
const copyToClipboard = (text: string | null | undefined, message: string) => {
    if (!text) return; // Guard against null/undefined
    navigator.clipboard.writeText(text).then(() => {
        toast.success(message);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        toast.error("Failed to copy text.");
    });
};

// Define the columns for the DataTable
export const columns: ColumnDef<Prompt>[] = [
  // TODO: Add Checkbox column for selection later if needed
  // TODO: Add Actions column (Edit, Delete) later

  {
    accessorKey: "name",
    header: "Name",
    // Optional: Add cell formatting if needed
    cell: ({ row }) => <div className="font-medium">{row.getValue("name") || "-"}</div>,
  },
  {
    accessorKey: "prompt_text",
    header: "Prompt",
    cell: ({ row }) => (
      <TooltipProvider delayDuration={100}>
         <Tooltip>
           <TooltipTrigger asChild>
             <div className="truncate max-w-xs cursor-default">{row.getValue("prompt_text")}</div>
           </TooltipTrigger>
           <TooltipContent className="max-w-md break-words">
             <p>{row.getValue("prompt_text")}</p>
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
     ),
  },
  {
    accessorKey: "negative_prompt",
    header: "Negative Prompt",
    cell: ({ row }) => (
       <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="truncate max-w-xs cursor-default">{row.getValue("negative_prompt") || "-"}</div>
            </TooltipTrigger>
            <TooltipContent className="max-w-md break-words">
              <p>{row.getValue("negative_prompt") || "-"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      const formatted = date.toLocaleDateString() // Basic date formatting
      return <div className="text-muted-foreground">{formatted}</div>
    },
  },
  // Add columns for notes, style_tags etc. later if desired

  // Add Actions column
  {
    id: "actions",
    cell: ({ row }) => {
      const prompt = row.original // Get the full prompt data for this row
      const [isDeleting, setIsDeleting] = useState(false);

      // Define click handlers outside JSX for clarity and type safety
      const handleCopyPrompt = () => {
          copyToClipboard(prompt.prompt_text, "Prompt copied!");
      };

      const handleCopyNegativePrompt = () => {
          copyToClipboard(prompt.negative_prompt, "Negative Prompt copied!");
      };
      
      const handleDelete = async () => {
          setIsDeleting(true);
          try {
              const result = await deletePromptAction(prompt.id);
              if (result.success) {
                  toast.success(result.message);
                  // No need to manually remove from table, revalidatePath handles it
              } else {
                  toast.error(result.message || "Failed to delete prompt.");
              }
          } catch (error) {
              console.error("Delete action failed:", error);
              toast.error("An unexpected error occurred during deletion.");
          } finally {
              setIsDeleting(false);
          }
      };

      return (
        <div className="flex items-center space-x-1 justify-end">
          {/* Copy Prompt Button */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyPrompt} >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy Prompt</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Copy Prompt</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Copy Negative Prompt Button */}
          {prompt.negative_prompt && (
             <TooltipProvider delayDuration={100}>
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyNegativePrompt} >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Copy Negative Prompt</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Copy Negative Prompt</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
          )}

          {/* Edit Button: Dialog Trigger wraps Tooltip Trigger (without asChild) */}
          <EditPromptDialog prompt={prompt}>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                 {/* DialogTrigger wraps TooltipTrigger */}
                <DialogTrigger asChild>
                   {/* TooltipTrigger does NOT use asChild */}
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Prompt</span>
                    </Button>
                  </TooltipTrigger>
                </DialogTrigger>
                <TooltipContent><p>Edit Prompt</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </EditPromptDialog>

          {/* Delete Button with Confirmation */}
           <AlertDialog>
             <TooltipProvider delayDuration={100}>
               <Tooltip>
                  <TooltipTrigger asChild>
                    {/* Use AlertDialogTrigger to open the confirmation dialog */}
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isDeleting}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Prompt</span>
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>Delete Prompt</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the prompt
                    "{prompt.name || (prompt.prompt_text ?? '').substring(0, 30) + '...'}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  {/* Call handleDelete when the confirmation action is clicked */}
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      )
    },
  },
] 