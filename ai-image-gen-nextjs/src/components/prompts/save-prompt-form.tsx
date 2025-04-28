"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"; // Using sonner for toasts
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { savePromptAction } from "@/app/prompts/actions"; // Import the Server Action

// Define the form schema based on the Server Action schema
const formSchema = z.object({
  name: z.string().optional(),
  prompt_text: z.string().min(1, "Prompt is required."),
  negative_prompt: z.string().optional(),
  notes: z.string().optional(),
})

type SavePromptFormProps = {
    onFormSubmit?: () => void; // Optional callback after successful submit
};

export function SavePromptForm({ onFormSubmit }: SavePromptFormProps) {
  const [isPending, startTransition] = useTransition(); // For loading state
  const [serverError, setServerError] = useState<string | null>(null);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      prompt_text: "",
      negative_prompt: "",
      notes: "",
    },
  })

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setServerError(null); // Clear previous server errors

    // Use FormData for Server Action
    const formData = new FormData();
    formData.append("prompt_text", values.prompt_text);
    if (values.name) formData.append("name", values.name);
    if (values.negative_prompt) formData.append("negative_prompt", values.negative_prompt);
    if (values.notes) formData.append("notes", values.notes);

    startTransition(async () => {
        const result = await savePromptAction(formData);

        if (result.success) {
            toast.success(result.message);
            form.reset(); // Reset form fields
            if (onFormSubmit) {
                onFormSubmit(); // Call callback (e.g., to close dialog)
            }
        } else {
            console.error("Save prompt failed:", result.message, result.errors);
            toast.error(result.message || "Failed to save prompt.");
            setServerError(result.message);
            // TODO: Optionally map validation errors back to form fields if needed
        }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Astronaut Horse" {...field} />
              </FormControl>
              <FormDescription>
                A short name to easily identify this prompt.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Prompt Text Field */}
        <FormField
          control={form.control}
          name="prompt_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea
                    placeholder="Enter the main generation prompt..."
                    className="resize-y min-h-[100px]"
                    {...field}
                 />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         {/* Negative Prompt Field */}
        <FormField
          control={form.control}
          name="negative_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Negative Prompt (Optional)</FormLabel>
              <FormControl>
                <Textarea
                    placeholder="Enter things to avoid..."
                    className="resize-y min-h-[60px]"
                    {...field}
                 />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         {/* Notes Field */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                    placeholder="Any notes about this prompt..."
                    className="resize-y min-h-[60px]"
                     {...field}
                 />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {serverError && (
            <p className="text-sm font-medium text-destructive">{serverError}</p>
        )}
        <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Prompt"}
        </Button>
      </form>
    </Form>
  )
} 