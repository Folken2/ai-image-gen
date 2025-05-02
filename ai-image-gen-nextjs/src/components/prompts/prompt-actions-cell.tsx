"use client"

import { useState } from 'react'
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

import type { Prompt } from "./columns"; // Import Prompt type from columns
import { deletePromptAction } from "@/app/prompts/actions";
import { EditPromptDialog } from "./edit-prompt-dialog";

// Helper function (could be moved to a utils file later)
const copyToClipboard = (text: string | null | undefined, message: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        toast.success(message);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        toast.error("Failed to copy text.");
    });
};

interface PromptActionsCellProps {
    prompt: Prompt;
    // Add any other props needed, like a refresh callback
    onActionSuccess?: () => void; 
}

export const PromptActionsCell: React.FC<PromptActionsCellProps> = ({ prompt, onActionSuccess }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    // Define click handlers
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
                onActionSuccess?.(); // Call the callback on success
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
            {/* Pass the success callback to the Edit dialog */}
             <EditPromptDialog prompt={prompt} onSaveSuccess={onActionSuccess}>
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
                             &quot;{prompt.name || (prompt.prompt_text ?? '').substring(0, 30) + '...'}&quot;. 
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
} 