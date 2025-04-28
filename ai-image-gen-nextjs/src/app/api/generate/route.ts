import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ImageGenerationParameters } from '@/lib/image-generation-apis/types';
import Together from "together-ai"; // Import the library
import OpenAI from 'openai'; // <-- Import OpenAI
import { supabase } from '@/lib/supabase/client'; // Import our typed Supabase client
import type { Database } from '@/lib/supabase/database.types'; // Import generated types

// Instantiate the clients
const together = new Together();
const openai = new OpenAI(); // Reads OPENAI_API_KEY from process.env

// Type alias for convenience
type ImageInsert = Database['public']['Tables']['images']['Insert'];

// Refactored function using the together-ai library
async function callTogetherAIWithLibrary(params: ImageGenerationParameters & { model: string }): Promise<{ success: boolean; images?: string[]; error?: string }> {
    console.log(`Calling Together AI Library with model: ${params.model}`);

    // Determine steps based on model - Flux Schnell uses low steps
    const defaultSteps = params.model.includes('Flux') ? 4 : 25; // Example default
    const stepsToUse = params.steps ?? defaultSteps;

    try {
        // Map our params to the library's expected format
        const apiParams: any = {
            model: params.model,
            prompt: params.prompt,
            n: params.numOutputs,
            width: params.width,
            height: params.height,
            steps: stepsToUse,
            response_format: "base64",
        };
        if (params.negativePrompt) {
            apiParams.negative_prompt = params.negativePrompt;
        }
        if (params.seed !== undefined) {
            apiParams.seed = params.seed;
        }
        // Conditionally add guidance_scale if the model supports it (or if supported by API)
        // Flux Schnell might ignore this. SDXL models typically use it.
        if (!params.model.includes('Flux') && params.guidanceScale !== undefined) {
            apiParams.guidance_scale = params.guidanceScale;
        }

        console.log("Together AI Params:", apiParams);
        const response = await together.images.create(apiParams);

        console.log("Together AI Library Response received");

        // Check if data exists and has images (library might return differently)
        // The library might return the base64 string directly or in a different structure.
        // Adjust based on actual library behavior if needed.
        if (response.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0].b64_json) {
             const images = response.data.map((imgData: any) => `data:image/png;base64,${imgData.b64_json}`);

             // --- Remove temporary SELECT test --- 
             // console.log("TEST: Attempting SELECT from images table...");
             // const { data: selectData, error: selectError } = await supabase
             //     .from('images')
             //     .select('id')
             //     .limit(1);
            // if (selectError) {
            //      console.error("TEST: SELECT Error:", selectError);
            //  } else {
            //      console.log("TEST: SELECT Success:", selectData);
            //  }
            // --- End Remove temporary SELECT test ---

            // --- Save to Supabase --- 
            const imageData: ImageInsert = {
                prompt_text: params.prompt,
                negative_prompt: params.negativePrompt,
                image_url: images[0], // Storing base64 directly for now, consider Storage later
                provider: 'Together AI', // Or derive from provider selection if more are added
                model: params.model,
                width: params.width,
                height: params.height,
                seed: params.seed,
                steps: stepsToUse,
                guidance_scale: params.guidanceScale,
                status: 'completed',
                // prompt_id: null, // Set this if linking to a saved prompt
            };

            console.log("Attempting to save image metadata to Supabase...");
            const { data: dbData, error: dbError } = await supabase
                .from('images')
                .insert(imageData)
                .select('id') // Optionally select the ID of the new row
                .single(); // Expecting a single row inserted

            if (dbError) {
                console.error("Supabase insert error:", dbError);
                // Decide how to handle DB errors - log it, maybe still return images?
                // For now, we'll just log it and proceed.
            } else {
                console.log("Saved image metadata to Supabase, ID:", dbData?.id);
            }
            // --- End Save to Supabase ---

            return { success: true, images: images };
        } else {
            // Handle cases where the response structure might be different than expected
            console.error("Unexpected response format or empty data from Together AI library:", response);
            return { success: false, error: "Received unexpected response format or no images from API." };
        }

    } catch (error: any) {
        console.error("Together AI Library call failed:", error);
        const errorMessage = error?.message || (typeof error === 'string' ? error : 'An unknown error occurred with the Together AI library.');
        return { success: false, error: `Failed to generate image via Together AI: ${errorMessage}` };
    }
}

// --- New OpenAI Function ---
async function callOpenAI(params: ImageGenerationParameters): Promise<{ success: boolean; images?: string[]; error?: string }> {
    console.log(`Calling OpenAI API (gpt-image-1)`);
    try {
        // Map frontend params to OpenAI API params
        const openAIParams: OpenAI.Images.ImageGenerateParams = {
            model: "gpt-image-1",
            prompt: params.prompt,
            n: 1, // Only n=1 supported
            size: `${params.width}x${params.height}` as OpenAI.Images.ImageGenerateParams['size'], // Ensure format is correct
            quality: "standard", // TODO: Add quality selection (standard/hd) later
            style: "vivid",      // TODO: Add style selection (vivid/natural) later
            response_format: "b64_json",
        };

        // Validate size - DALL-E 3 only supports specific sizes
        const validSizes = ["1024x1024", "1792x1024", "1024x1792"];
        if (!validSizes.includes(openAIParams.size ?? "")) {
            console.error(`Invalid size for DALL·E 3: ${openAIParams.size}`);
            return { success: false, error: `Invalid dimensions for DALL·E 3. Use 1024x1024, 1792x1024, or 1024x1792.` };
        }

        console.log("OpenAI API Params:", { ...openAIParams, prompt: "[PROMPT REDACTED]" });

        const response = await openai.images.generate(openAIParams);

        console.log("OpenAI API Response received");

        if (response.data && response.data.length > 0 && response.data[0].b64_json) {
            const images = response.data.map((imgData: any) => `data:image/png;base64,${imgData.b64_json}`);

            // --- Save to Supabase (Simplified for OpenAI) ---
            const imageData: ImageInsert = {
                prompt_text: params.prompt,
                image_url: images[0], 
                provider: 'OpenAI',
                model: 'gpt-image-1',
                width: params.width,
                height: params.height,
                status: 'completed',
            };

            console.log("Attempting to save OpenAI image metadata to Supabase...");
            const { data: dbData, error: dbError } = await supabase
                .from('images')
                .insert(imageData)
                .select('id')
                .single();

            if (dbError) {
                console.error("Supabase insert error (OpenAI):", dbError);
                // Log and continue
            } else {
                console.log("Saved OpenAI image metadata to Supabase, ID:", dbData?.id);
            }
            // --- End Save to Supabase ---

            return { success: true, images: images };
        } else {
            console.error("Unexpected response format or empty data from OpenAI API:", response);
            return { success: false, error: "Received unexpected response format or no images from OpenAI API." };
        }

    } catch (error: any) {
        console.error("OpenAI API call failed:", error);
        // Attempt to parse OpenAI specific errors
        let errorMessage = 'An unknown error occurred with the OpenAI API.';
        if (error.response) { // Check for Axios-like error structure from the openai lib
             errorMessage = error.response.data?.error?.message || error.message || errorMessage;
        } else if (error instanceof Error) {
             errorMessage = error.message;
        }
        return { success: false, error: `Failed to generate image via OpenAI: ${errorMessage}` };
    }
}

// --- NEW Stub for Direct Flux API Call ---
async function callFluxAPI(params: ImageGenerationParameters): Promise<{ success: boolean; images?: string[]; error?: string }> {
    console.log("Calling Direct Flux API (Not Implemented)");
    // TODO: Implement the actual API call logic to the Flux service endpoint
    // This will likely involve using 'fetch' or another HTTP client 
    // and different parameters/authentication than Together AI or OpenAI.
    return {
        success: false,
        error: "Direct Flux API integration is not implemented yet."
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Basic validation - include new fields if making them mandatory
        if (!body.prompt || !body.provider || !body.width || !body.height ) { // numOutputs not needed for OpenAI
             return NextResponse.json({ error: 'Missing required generation parameters.' }, { status: 400 });
        }

        // Construct parameters including advanced options
        // Note: Not all params are used by all providers
        const params: ImageGenerationParameters = {
            prompt: body.prompt,
            negativePrompt: body.negativePrompt,
            width: body.width,
            height: body.height,
            numOutputs: body.numOutputs || 1, // Default to 1 if not provided
            style: body.style,
            seed: body.seed,
            steps: body.steps,
            guidanceScale: body.guidanceScale,
            apiKey: '', // Handled server-side
        };

        let result;
        let modelToUse: string | null = null;

        // Determine the specific function based on provider selection
        if (body.provider === 'flux') {
            // Call the direct Flux API function
            result = await callFluxAPI(params); 
        } else if (body.provider === 'togetherai') {
            // Continue using Together AI, specifically with their hosted Flux model
            modelToUse = "black-forest-labs/FLUX.1-schnell-Free"; 
            console.log(`Using Together AI model for Flux: ${modelToUse}`);
            result = await callTogetherAIWithLibrary({ ...params, model: modelToUse });
        } else if (body.provider === 'openai') {
            // Check for API key and call OpenAI
            if (!process.env.OPENAI_API_KEY) {
                console.error("OpenAI API key not configured.");
                return NextResponse.json({ error: "OpenAI API key not configured on the server. Please set OPENAI_API_KEY environment variable." }, { status: 500 });
            }
            result = await callOpenAI(params);
        }
         // TODO: Add cases for Replicate, Stability AI etc.
        else {
            return NextResponse.json({ error: `Provider '${body.provider}' not supported yet.` }, { status: 400 });
        }

        if (result.success) {
            return NextResponse.json({ images: result.images });
        } else {
            // Use the error message returned from the specific call
            return NextResponse.json({ error: result.error || 'API call failed internally' }, { status: 500 });
        }

    } catch (error: any) {
        console.error("API Route Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 