"use server" // Mark this file's exports as Server Actions

import { z } from "zod"
import { revalidatePath } from "next/cache"
// Use the proper server client
// import { supabase } from "@/lib/supabase/client"; // <-- OLD Client (Anon Key)
import { supabaseServer } from "@/lib/supabase/server"; // <-- NEW Server Client (Service Role Key)
import type { Database } from "@/lib/supabase/database.types"

// Define the schema for the prompt form using Zod
const promptSchema = z.object({
  id: z.string().uuid().optional(), // Allow ID for updates
  name: z.string().optional(),
  prompt_text: z.string().min(1, "Prompt text cannot be empty"),
  negative_prompt: z.string().optional(),
  notes: z.string().optional(),
  // Add style_tags later if needed in the form
})

// Type alias for Supabase prompt insert/update
type PromptUpsert = Database["public"]["Tables"]["prompts"]["Insert"]; // Insert type works for update too if ID included

// The Server Action function for saving NEW prompts
export async function savePromptAction(formData: FormData) {
  const supabase = supabaseServer; // Use server client

  // Validate form data against the schema (excluding ID for new prompts)
  const validatedFields = promptSchema.omit({ id: true }).safeParse({
    name: formData.get('name') || undefined,
    prompt_text: formData.get('prompt_text'),
    negative_prompt: formData.get('negative_prompt') || undefined,
    notes: formData.get('notes') || undefined,
  });

  // If validation fails, return error details
  if (!validatedFields.success) {
    console.error("Server Action Validation Error (Save):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Validation failed. Check fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Prepare data for Supabase insert
  const promptData: PromptUpsert = {
    name: validatedFields.data.name,
    prompt_text: validatedFields.data.prompt_text,
    negative_prompt: validatedFields.data.negative_prompt,
    notes: validatedFields.data.notes,
  };

  try {
    console.log("Server Action: Saving prompt to Supabase:", promptData);
    const { error } = await supabase.from('prompts').insert(promptData);

    if (error) {
      console.error("Supabase Insert Error (Server Action):", error);
      return {
        success: false,
        message: `Database Error: ${error.message}`,
      }
    }

    revalidatePath('/prompts');
    console.log("Server Action: Prompt saved successfully.");
    return { success: true, message: "Prompt saved successfully!" }

  } catch (e: any) {
    console.error("Server Action Unexpected Error (Save):", e);
    return {
      success: false,
      message: `An unexpected error occurred: ${e.message}`,
    }
  }
}

// --- NEW Update Prompt Action --- 
export async function updatePromptAction(formData: FormData) {
    const supabase = supabaseServer; // Use server client

    // Validate form data against the schema (INCLUDING ID)
    const validatedFields = promptSchema.safeParse({
      id: formData.get('id'), // Get the ID from the form
      name: formData.get('name') || undefined,
      prompt_text: formData.get('prompt_text'),
      negative_prompt: formData.get('negative_prompt') || undefined,
      notes: formData.get('notes') || undefined,
    });

    if (!validatedFields.success) {
        console.error("Server Action Validation Error (Update):", validatedFields.error.flatten().fieldErrors);
        return {
            success: false,
            message: "Validation failed. Check fields.",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Extract the ID and the rest of the data
    const { id, ...promptDataToUpdate } = validatedFields.data;

    if (!id) { // Double check ID presence after validation
         return { success: false, message: "Prompt ID is missing for update." };
    }

    try {
        console.log(`Server Action: Updating prompt ID ${id} in Supabase with:`, promptDataToUpdate);
        const { error } = await supabase
            .from('prompts')
            .update(promptDataToUpdate)
            .match({ id: id });

        if (error) {
            console.error("Supabase Update Error (Server Action):", error);
             return {
                success: false,
                message: `Database Error: ${error.message}`,
            }
        }

        revalidatePath('/prompts');
        console.log(`Server Action: Prompt ${id} updated successfully.`);
        return { success: true, message: "Prompt updated successfully!" }

    } catch (e: any) {
        console.error("Server Action Unexpected Error (Update):", e);
        return {
            success: false,
            message: `An unexpected error occurred: ${e.message}`,
        }
    }
}

// --- Delete Prompt Action --- 
export async function deletePromptAction(promptId: string) {
     const supabase = supabaseServer; // Use server client

     if (!promptId || typeof promptId !== 'string' || !promptId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) { // Basic UUID check
         return { success: false, message: "Invalid Prompt ID provided." };
     }
 
     try {
         console.log(`Server Action: Deleting prompt with ID: ${promptId}`);
         const { error } = await supabase
             .from('prompts')
             .delete()
             .match({ id: promptId }); // Match the ID to delete
 
         if (error) {
             console.error("Supabase Delete Error (Server Action):", error);
             return {
                 success: false,
                 message: `Database Error: ${error.message}`,
             }
         }
 
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

// --- Get Saved Prompts Action --- 
export async function getSavedPrompts() {
     const supabase = supabaseServer; // Use server client

     try {
         console.log("Server Action: Fetching saved prompts...");
         const { data, error } = await supabase
             .from('prompts')
             .select('id, name, prompt_text, negative_prompt') // Select fields needed for generate page dropdown
             .order('created_at', { ascending: false }); 

         if (error) {
             console.error("Supabase Fetch Error (Server Action):", error);
             return { success: false, message: `Database Error: ${error.message}`, data: [] }; 
         }

         console.log(`Server Action: Fetched ${data?.length || 0} prompts.`);
         return { success: true, data: data || [] };

     } catch (e: any) {
         console.error("Server Action Unexpected Error (Fetch):", e);
         return { success: false, message: `An unexpected error occurred: ${e.message}`, data: [] };
     }
} 