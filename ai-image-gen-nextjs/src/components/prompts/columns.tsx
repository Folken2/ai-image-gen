"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { Database } from "@/lib/supabase/database.types";
import { PromptActionsCell } from './prompt-actions-cell';

// Define the shape of our prompt data based on the Supabase table
// We select specific fields we want to display.
export type Prompt = Pick<
    Database["public"]["Tables"]["prompts"]["Row"],
    'id' | 'created_at' | 'name' | 'prompt_text' | 'negative_prompt' | 'notes' | 'style_tags'
>;

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
      // Render the dedicated cell component
      // Pass the prompt data and potentially a success callback if needed by the parent table
      return <PromptActionsCell prompt={prompt} /* onActionSuccess={refreshCallbackFromParent} */ />
    },
  },
] 