"use server" // Mark this file's exports as Server Actions

import { z } from "zod"
import { revalidatePath } from "next/cache"
// Use client client for now to bypass server/cookie issues - ** REVISIT LATER **
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

// Define the schema for the prompt form using Zod
const promptSchema = z.object({
  name: z.string().optional(),
  prompt_text: z.string().min(1, "Prompt text cannot be empty"),
  negative_prompt: z.string().optional(),
  notes: z.string().optional(),
  // Add style_tags later if needed in the form
})

// Type alias for Supabase prompt insert
type PromptInsert = Database["public"]["Tables"]["prompts"]["Insert"];

// The Server Action function
export async function savePromptAction(formData: FormData) {
  // const supabase = createClient(); // ** Using client client instead **

  // Validate form data against the schema
  const validatedFields = promptSchema.safeParse({
    name: formData.get('name') || undefined,
    prompt_text: formData.get('prompt_text'),
    negative_prompt: formData.get('negative_prompt') || undefined,
    notes: formData.get('notes') || undefined,
  });

  // If validation fails, return error details
  if (!validatedFields.success) {
    console.error("Server Action Validation Error:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Validation failed. Check fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Prepare data for Supabase insert
  const promptData: PromptInsert = {
    name: validatedFields.data.name,
    prompt_text: validatedFields.data.prompt_text,
    negative_prompt: validatedFields.data.negative_prompt,
    notes: validatedFields.data.notes,
    // created_at defaults to now() in the DB
    // id defaults to gen_random_uuid() in the DB
  };

  try {
    console.log("Server Action (using client): Saving prompt to Supabase:", promptData);
    // Use the imported client supabase instance
    const { error } = await supabase.from('prompts').insert(promptData);

    if (error) {
      console.error("Supabase Insert Error (Server Action):", error);
      // Check for specific RLS errors if necessary
      if (error.code === '42501') { // 42501 is typically permission denied/RLS
           return {
              success: false,
              message: `Database Permission Error: ${error.message}. Please ensure policies allow inserts.`,
            }
      }
      return {
        success: false,
        message: `Database Error: ${error.message}`,
      }
    }

    // Revalidate the prompts page path to refresh the data table
    revalidatePath('/prompts');

    console.log("Server Action (using client): Prompt saved successfully.");
    return { success: true, message: "Prompt saved successfully!" }

  } catch (e: any) {
    console.error("Server Action Unexpected Error:", e);
    return {
      success: false,
      message: `An unexpected error occurred: ${e.message}`,
    }
  }
}

// --- Delete Prompt Action --- 
export async function deletePromptAction(promptId: string) {
     // Basic validation for ID
     if (!promptId || typeof promptId !== 'string') {
         return { success: false, message: "Invalid Prompt ID provided." };
     }
 
     // ** IMPORTANT: Still using client Supabase instance for now **
     // const supabase = createClient(); 
 
     try {
         console.log(`Server Action: Deleting prompt with ID: ${promptId}`);
         const { error } = await supabase
             .from('prompts')
             .delete()
             .match({ id: promptId }); // Match the ID to delete
 
         if (error) {
             console.error("Supabase Delete Error (Server Action):", error);
             // Check for specific RLS errors if necessary
             if (error.code === '42501') {
                 return {
                     success: false,
                     message: `Database Permission Error: ${error.message}. Please ensure policies allow deletes.`,
                 }
             }
             return {
                 success: false,
                 message: `Database Error: ${error.message}`,
             }
         }
 
         // Revalidate the prompts page path to refresh the data table
         revalidatePath('/prompts');
 
         console.log(`Server Action: Prompt ${promptId} deleted successfully.`);
         return { success: true, message: "Prompt deleted successfully!" }
 
     } catch (e: any) {
         console.error("Server Action Unexpected Error (Delete):", e);
         return {
             success: false,
             message: `An unexpected error occurred: ${e.message}`,
         }
     }
 } 