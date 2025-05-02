"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner";
import { useState, useTransition, useEffect } from "react"; // Added useEffect

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
import { updatePromptAction } from "@/app/prompts/actions"; // Import the UPDATE Server Action
import type { Prompt } from "./columns"; // Import the Prompt type

// Define the form schema including the ID (required for update)
const formSchema = z.object({
  id: z.string().uuid("Invalid ID"), // ID is required for update
  name: z.string().optional(),
  prompt_text: z.string().min(1, "Prompt is required."),
  negative_prompt: z.string().optional(),
  notes: z.string().optional(),
})

type EditPromptFormProps = {
    initialData: Prompt; // Receive the prompt data to edit
    onFormSubmit?: () => void; // Optional callback after successful submit
};

export function EditPromptForm({ initialData, onFormSubmit }: EditPromptFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // Set default values from the initialData prop
    defaultValues: {
      id: initialData.id,
      name: initialData.name || "",
      prompt_text: initialData.prompt_text || "", // Should always exist based on Prompt type
      negative_prompt: initialData.negative_prompt || "",
      notes: initialData.notes || "",
    },
  });

  // Optional: Reset form if initialData changes (though unlikely within a modal)
  useEffect(() => {
      form.reset({
          id: initialData.id,
          name: initialData.name || "",
          prompt_text: initialData.prompt_text || "",
          negative_prompt: initialData.negative_prompt || "",
          notes: initialData.notes || "",
      });
  }, [initialData, form]);

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setServerError(null); 

    const formData = new FormData();
    // Append all form values, including the ID
    formData.append("id", values.id);
    formData.append("prompt_text", values.prompt_text);
    if (values.name) formData.append("name", values.name);
    if (values.negative_prompt) formData.append("negative_prompt", values.negative_prompt);
    if (values.notes) formData.append("notes", values.notes);

    startTransition(async () => {
        // Call the update action
        const result = await updatePromptAction(formData);

        if (result.success) {
            toast.success(result.message);
            // Optionally reset form to these new values, or just close dialog
            // form.reset(values); // Reset with the updated values
            if (onFormSubmit) {
                onFormSubmit(); // Call callback (e.g., to close dialog)
            }
        } else {
            console.error("Update prompt failed:", result.message, result.errors);
            toast.error(result.message || "Failed to update prompt.");
            setServerError(result.message);
        }
    });
  }

  return (
    <Form {...form}>
      {/* IMPORTANT: Add hidden input for the ID */}
      <input type="hidden" {...form.register("id")} />
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Fields (Name, Prompt, Negative, Notes) - structure same as SavePromptForm */}
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
        {/* Change button text */}
        <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update Prompt"}
        </Button>
      </form>
    </Form>
  )
} 