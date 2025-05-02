import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ImageGenerationParameters } from '@/lib/image-generation-apis/types';
import Together from "together-ai"; // Import the library
import OpenAI from 'openai'; // <-- Import OpenAI
import { Image as OpenAIImage } from 'openai/resources/images.mjs'; // Explicit import for OpenAI Image type
import Replicate from 'replicate'; // <-- Import Replicate
// import { supabase } from '@/lib/supabase/client'; // <-- OLD Client (Anon Key)
import { supabaseServer as supabase } from '@/lib/supabase/server'; // <-- NEW Client (Service Role Key)
import type { Database } from '@/lib/supabase/database.types'; // Import generated types
import { Buffer } from 'buffer'; // <-- Import Buffer for Base64 decoding
import { v4 as uuidv4 } from 'uuid'; // <-- Import UUID for unique filenames

// Instantiate the clients
const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});
const openai = new OpenAI(); // Reads OPENAI_API_KEY from process.env
const replicate = new Replicate({ // Reads REPLICATE_API_TOKEN from process.env
  auth: process.env.REPLICATE_API_TOKEN,
});

// Type alias for convenience
type ImageInsert = Database['public']['Tables']['images']['Insert'];

// Refactored function using the together-ai library
async function callTogetherAIWithLibrary(params: ImageGenerationParameters & { model: string }): Promise<{ success: boolean; images?: string[]; error?: string }> {
    try {
        console.log(`Calling Together API model: ${params.model}`);

        // Use the API key from params or fallback to environment variable
        const apiKey = params.apiKey || process.env.TOGETHER_API_KEY;
        if (!apiKey) {
            return { success: false, error: "TogetherAI API key not provided" };
        }

        // Initialize Together client properly with the API key
        const together = new Together({
            apiKey: apiKey,
        });

        // Determine steps based on model - Flux Schnell uses low steps
        let stepsToUse: number;
        const isFluxModel = params.model.includes('Flux');

        if (isFluxModel) {
            // Enforce 1-4 steps for Flux models, using provided steps only if valid, otherwise default to 4
            const requestedSteps = params.steps;
            if (requestedSteps !== undefined && requestedSteps >= 1 && requestedSteps <= 4) {
                stepsToUse = requestedSteps;
            } else {
                stepsToUse = 4; // Default for Flux
            }
            console.log(`Flux model detected. Enforced steps: ${stepsToUse} (requested: ${params.steps})`);
        } else {
            // For non-Flux models, use provided steps or default to 25
            stepsToUse = params.steps ?? 25; // Default for other models
        }

        // Log for debugging
        console.log(`Final steps value being sent to Together AI: ${stepsToUse}`);
        
        // Use the official Together client API as shown in docs
        const response = await together.images.create({
            model: params.model,
            prompt: params.prompt,
            n: params.numOutputs,
            width: params.width,
            height: params.height,
            steps: stepsToUse,
            // No response_format needed with the client library
            negative_prompt: params.negativePrompt,
            seed: params.seed,
        });

        console.log("Together AI Library Response received:", response);

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            // Process URLs from the response
            const imageUrls = response.data.map(item => item.url).filter(Boolean);
            const base64Images: string[] = [];
            let storagePath = '';
            
            // Download and process the first image
            try {
                // Fetch the first image
                const firstImageUrl = imageUrls[0];
                if (!firstImageUrl) {
                    throw new Error("No valid image URL returned from API");
                }
                
                console.log("Fetching image from URL:", firstImageUrl);
                
                const imageResponse = await fetch(firstImageUrl);
                if (!imageResponse.ok) {
                    throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
                }
                
                // Get content type and image data
                const contentType = imageResponse.headers.get('content-type') || 'image/png';
                const imageBlob = await imageResponse.blob();
                const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
                
                // Convert to Base64 for frontend display
                const base64ImageData = imageBuffer.toString('base64');
                const base64Image = `data:${contentType};base64,${base64ImageData}`;
                base64Images.push(base64Image);
                
                // Get additional images if needed
                for (let i = 1; i < imageUrls.length; i++) {
                    const imgUrl = imageUrls[i];
                    if (!imgUrl) continue;
                    
                    const imgResponse = await fetch(imgUrl);
                    if (imgResponse.ok) {
                        const imgContentType = imgResponse.headers.get('content-type') || 'image/png';
                        const imgBlob = await imgResponse.blob();
                        const imgBuffer = Buffer.from(await imgBlob.arrayBuffer());
                        const imgBase64 = `data:${imgContentType};base64,${imgBuffer.toString('base64')}`;
                        base64Images.push(imgBase64);
                    }
                }
                
                // Upload to Supabase Storage
                const bucketName = 'images';
                const filePath = `public/togetherai-${params.model.replace(/[^a-zA-Z0-9]/g, '_')}-${uuidv4()}.png`; // Unique path

                console.log(`Uploading to Supabase Storage: ${bucketName}/${filePath}`);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, imageBuffer, {
                        contentType: contentType,
                        upsert: true, 
                    });

                if (uploadError) {
                    throw uploadError;
                }

                if (!uploadData?.path) {
                    throw new Error("Supabase storage upload succeeded but returned no path.");
                }

                storagePath = uploadData.path;
                console.log("Image uploaded successfully to Supabase Storage:", storagePath);

                // Save metadata to Supabase
                const imageData: ImageInsert = {
                    prompt_text: params.prompt,
                    negative_prompt: params.negativePrompt,
                    image_url: storagePath,
                    provider: "Together AI",
                    model: params.model,
                    width: params.width,
                    height: params.height,
                    seed: params.seed,
                    steps: stepsToUse,
                    guidance_scale: params.guidanceScale,
                    status: 'completed',
                    style: params.style,
                };

                console.log("Saving image metadata to Supabase DB");
                const { data: dbData, error: dbError } = await supabase
                    .from('images')
                    .insert(imageData)
                    .select('id')
                    .single();

                if (dbError) {
                    console.error("Supabase DB insert error:", dbError);
                } else {
                    console.log("Saved image metadata to Supabase DB, ID:", dbData?.id);
                }

                return { success: true, images: base64Images };
            } catch (error: any) {
                console.error("Error processing images:", error);
                return { success: false, error: `Failed to process images: ${error.message}` };
            }
        } else {
            console.error("Invalid response from Together AI:", response);
            return { success: false, error: "No valid images returned from API." };
        }
    } catch (error: any) {
        console.error("Together AI call failed:", error);
        const errorMessage = error?.message || 'An unknown error occurred with the Together AI API.';
        return { success: false, error: `Failed to generate image via Together AI: ${errorMessage}` };
    }
}

// --- New OpenAI Function ---
async function callOpenAI(params: ImageGenerationParameters): Promise<{ success: boolean; images?: string[]; error?: string }> {
    console.log(`Calling OpenAI API (gpt-image-1)`);
    try {
        // Initialize the OpenAI client with API key from params
        const openai = new OpenAI({
            apiKey: params.apiKey,
        });

        // Map frontend params to OpenAI API params
        const openAIParams: OpenAI.Images.ImageGenerateParams = {
            model: "gpt-image-1",
            prompt: params.prompt,
            n: params.numOutputs || 1, // Support multiple images (up to 10)
            size: `${params.width}x${params.height}` as OpenAI.Images.ImageGenerateParams['size'], // Ensure format is correct
            quality: "medium", // Valid values: 'low', 'medium', 'high', 'auto'
        };

        // Validate size - DALL-E 3 only supports specific sizes
        const validSizes = ["1024x1024", "1792x1024", "1024x1792"];
        if (!validSizes.includes(openAIParams.size ?? "")) {
            console.error(`Invalid size for GPT-4o Vision: ${openAIParams.size}`);
            return { success: false, error: `Invalid dimensions for GPT-4o Vision. Use 1024x1024, 1792x1024, or 1024x1792.` };
        }

        console.log("OpenAI API Params:", { ...openAIParams, prompt: "[PROMPT REDACTED]" });

        const response = await openai.images.generate(openAIParams);

        console.log("OpenAI API Response received");

        if (response.data && response.data.length > 0) {
            // For gpt-image-1, the response contains URLs instead of base64 data
            const imageUrls = response.data.map((imgData: any) => imgData.url);
            
            // We need to download the images from the URLs to store them
            const base64Images: string[] = [];
            let imageBuffer: Buffer;
            let storagePath = ''; // Variable to store the path
            
            try {
                // Download the first image
                const firstImageUrl = imageUrls[0];
                console.log("Fetching image data from OpenAI URL:", firstImageUrl);
                
                const imageResponse = await fetch(firstImageUrl);
                if (!imageResponse.ok) {
                    throw new Error(`Failed to fetch image from OpenAI URL: ${imageResponse.statusText}`);
                }
                
                // Get content type for storage upload
                const contentType = imageResponse.headers.get('content-type') || 'image/png';
                const imageBlob = await imageResponse.blob();
                imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
                
                // Convert to Base64 for frontend return
                const base64ImageData = imageBuffer.toString('base64');
                const base64Image = `data:${contentType};base64,${base64ImageData}`;
                
                // Add to our array of base64 images
                base64Images.push(base64Image);
                
                // If there are more images, fetch and convert them too
                for (let i = 1; i < imageUrls.length; i++) {
                    const imgUrl = imageUrls[i];
                    const imgResponse = await fetch(imgUrl);
                    if (imgResponse.ok) {
                        const imgContentType = imgResponse.headers.get('content-type') || 'image/png';
                        const imgBlob = await imgResponse.blob();
                        const imgBuffer = Buffer.from(await imgBlob.arrayBuffer());
                        const imgBase64 = `data:${imgContentType};base64,${imgBuffer.toString('base64')}`;
                        base64Images.push(imgBase64);
                    }
                }
                
                // --- Upload to Supabase Storage ---
                const bucketName = 'images'; // <-- Use your actual bucket name
                const filePath = `public/openai-gpt4o-vision-${uuidv4()}.png`; // Unique path

                console.log(`Attempting to upload OpenAI image to Supabase Storage: ${bucketName}/${filePath}`);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, imageBuffer, {
                        contentType: 'image/png',
                        upsert: true,
                    });

                if (uploadError) {
                    throw uploadError; // Re-throw storage error
                }

                if (!uploadData?.path) {
                    throw new Error("Supabase storage upload succeeded but returned no path.");
                }

                storagePath = uploadData.path; // Store the file path
                console.log("OpenAI image uploaded successfully to Supabase Storage:", storagePath);

            } catch (storageError: any) {
                console.error("Error processing OpenAI images:", storageError);
                return { success: false, error: `Failed to process OpenAI images: ${storageError.message}` };
            }

            // --- Save metadata to Supabase DB ---
            const imageData: ImageInsert = {
                prompt_text: params.prompt,
                image_url: storagePath, // <-- NEW: Store the Supabase storage path
                provider: "OpenAI", // <-- Use Generic Provider Name
                model: 'gpt-image-1', // OpenAI model is fixed here
                width: params.width,
                height: params.height,
                status: 'completed',
                style: params.style,
                // Note: GPT-4o Vision doesn't expose all parameters like seed, steps, guidance
                negative_prompt: null, // Not applicable or controlled for GPT-4o Vision via basic API
                seed: null, // Not returned by GPT-4o Vision API
                steps: null, // Not applicable for GPT-4o Vision
                guidance_scale: null, // Not applicable for GPT-4o Vision
            };

            console.log("Attempting to save OpenAI image metadata to Supabase DB with storage path...");
            const { data: dbData, error: dbError } = await supabase
                .from('images')
                .insert(imageData)
                .select('id')
                .single();

            if (dbError) {
                console.error("Supabase DB insert error (OpenAI):", dbError);
                 // Log and continue, but consider rollback/delete from storage
            } else {
                console.log("Saved OpenAI image metadata to Supabase DB, ID:", dbData?.id);
            }
            // --- End Save to Supabase DB ---

            // Return the original base64 for the frontend
            return { success: true, images: base64Images };
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

// --- New Replicate Function ---
async function callReplicateModel(modelId: string, params: ImageGenerationParameters): Promise<{ success: boolean; images?: string[]; error?: string }> {
    console.log(`Calling Replicate API with model: ${modelId}`);

    // --- Parameter Mapping (Model Specific Logic) --- 
    const input: { [key: string]: any } = {
        prompt: params.prompt, // Common parameter
        // Initialize potentially model-specific parameters
    };

    // Map common parameters IF they exist in params and are expected by the model
    if (params.negativePrompt) {
        // Default name, might change per model
        input.negative_prompt = params.negativePrompt;
    }
    if (params.seed !== undefined) {
        input.seed = params.seed; // Common parameter
    }
    if (params.numOutputs !== undefined) {
        input.num_outputs = params.numOutputs; // Common, but check model limits
    }

    // --- Model Specific Mapping --- 
    if (modelId.startsWith('bytedance/sdxl-lightning-4step')) {
        input.width = params.width;
        input.height = params.height;
        input.num_inference_steps = 4; // Specific to this model
        // guidance_scale might be less relevant or handled differently
        if (params.guidanceScale !== undefined) {
             input.guidance_scale = params.guidanceScale; // Add if supported
        }
        // It might have a specific scheduler, using default if not specified

    } else if (modelId.startsWith('ai-forever/kandinsky-2.2')) {
        // Mapping for Kandinsky 2.2 (verify parameter names if testing fails)
        input.width = params.width;
        input.height = params.height;
        if (params.steps !== undefined) {
            input.num_inference_steps = params.steps; // Common Replicate name for steps
        }
        if (params.guidanceScale !== undefined) {
             input.guidance_scale = params.guidanceScale;
        }
         // Assuming standard negative_prompt name, Kandinsky sometimes uses others
         if (params.negativePrompt) {
            input.negative_prompt = params.negativePrompt;
         }

    } else if (modelId.startsWith('stability-ai/sdxl')) {
        // Mapping for Stability AI SDXL
        input.width = params.width;
        input.height = params.height;
        if (params.steps !== undefined) {
             input.num_inference_steps = params.steps;
        }
        if (params.guidanceScale !== undefined) {
             input.guidance_scale = params.guidanceScale;
        }
         if (params.negativePrompt) {
            input.negative_prompt = params.negativePrompt;
         }
         input.refine = "no_refiner"; // Default to no refinement for simplicity
         input.apply_watermark = false; // Optional: disable watermark
         // input.disable_safety_checker = true; // Optional: disable safety checker if needed

    } else if (modelId.startsWith('stability-ai/stable-diffusion')) {
        // Mapping for Stability AI Stable Diffusion (e.g., v1.5)
        input.width = params.width;
        input.height = params.height;
        if (params.steps !== undefined) {
             input.num_inference_steps = params.steps;
        }
        if (params.guidanceScale !== undefined) {
             input.guidance_scale = params.guidanceScale;
        }
         if (params.negativePrompt) {
            input.negative_prompt = params.negativePrompt;
         }

    } else if (modelId.startsWith('google/imagen-3')) {
        // Mapping for Imagen 3 (verify parameter names from Replicate API tab)
        console.warn("Using assumed Imagen 3 parameter mapping - please verify.");
        // Aspect ratio is common for Imagen, map width/height heuristically
        const aspectRatio = params.width / params.height;
        if (Math.abs(aspectRatio - (16 / 9)) < 0.1) input.aspect_ratio = "16:9";
        else if (Math.abs(aspectRatio - (9 / 16)) < 0.1) input.aspect_ratio = "9:16";
        else if (Math.abs(aspectRatio - (3 / 2)) < 0.1) input.aspect_ratio = "3:2";
        else if (Math.abs(aspectRatio - (2 / 3)) < 0.1) input.aspect_ratio = "2:3";
        else input.aspect_ratio = "1:1"; // Default to 1:1

        if (params.negativePrompt) {
            input.negative_prompt = params.negativePrompt; // Assuming standard name
        }
        // It likely doesn't use steps/guidance scale like SD

    } else {
        // Fallback for unknown models - use basic params
        console.warn(`Unknown Replicate model ID: ${modelId}. Using default parameter names.`);
        input.width = params.width;
        input.height = params.height;
        if (params.steps !== undefined) input.num_inference_steps = params.steps;
        if (params.guidanceScale !== undefined) input.guidance_scale = params.guidanceScale;
    }
    // --- End Model Specific Mapping ---

    console.log("Replicate API Input:", { model: modelId, input: { ...input, prompt: "[PROMPT REDACTED]" } });

    try {
        // --- Use replicate.run() which handles creation and waiting --- 
        const output = await replicate.run(modelId as `${string}/${string}:${string}`, { input });

        console.log("Replicate run finished. Output:", output);

        // --- Process output from replicate.run() ---
        if (output && Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
             const images = output as string[]; // Assuming output is array of image URLs

            // --- Download Image, Upload to Storage, Save Path ---
            let storagePath = '';
            let base64ImageForFrontend = ''; // We need base64 to return for consistency
            try {
                const firstImageUrl = images[0];
                console.log("Fetching image data from Replicate URL:", firstImageUrl);

                // Fetch the image data from the URL
                const imageResponse = await fetch(firstImageUrl);
                if (!imageResponse.ok) {
                    throw new Error(`Failed to fetch image from Replicate URL: ${imageResponse.statusText}`);
                }
                // Get content type for storage upload
                const contentType = imageResponse.headers.get('content-type') || 'image/png'; // Default if not provided
                const imageBlob = await imageResponse.blob();
                const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());

                // Convert to Base64 for frontend return
                base64ImageForFrontend = `data:${contentType};base64,${imageBuffer.toString('base64')}`;

                // Upload to Supabase Storage
                const bucketName = 'images'; // <-- Use your actual bucket name
                const fileExtension = contentType.split('/')[1] || 'png'; // Extract extension
                const filePath = `public/replicate-${modelId.split('/')[1].replace(/[^a-zA-Z0-9]/g, '_')}-${uuidv4()}.${fileExtension}`; // Unique path

                console.log(`Attempting to upload Replicate image to Supabase Storage: ${bucketName}/${filePath}`);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, imageBuffer, {
                        contentType: contentType,
                        upsert: true,
                    });

                if (uploadError) {
                    throw uploadError; // Re-throw storage error
                }

                if (!uploadData?.path) {
                    throw new Error("Supabase storage upload succeeded but returned no path.");
                }

                storagePath = uploadData.path; // Store the file path
                console.log("Replicate image uploaded successfully to Supabase Storage:", storagePath);

            } catch (fetchOrStorageError: any) {
                 console.error("Error fetching Replicate image or uploading to Supabase Storage:", fetchOrStorageError);
                 return { success: false, error: `Failed processing Replicate image: ${fetchOrStorageError.message}` };
            }
            // --- End Download/Upload/Save Path ---


            // --- Save metadata to Supabase DB ---
            const imageData: ImageInsert = {
                prompt_text: params.prompt,
                negative_prompt: params.negativePrompt,
                image_url: storagePath, // <-- Save the storage path
                provider: "Replicate",
                model: modelId, // Use the full model ID from Replicate
                width: params.width,
                height: params.height,
                seed: params.seed,
                steps: params.steps, // Assuming steps were mapped correctly in 'input'
                guidance_scale: params.guidanceScale, // Assuming mapped correctly
                status: 'completed',
                style: params.style,
            };

            console.log("Attempting to save Replicate image metadata to Supabase DB with storage path...");
            const { data: dbData, error: dbError } = await supabase
                .from('images')
                .insert(imageData)
                .select('id')
                .single();

            if (dbError) {
                console.error("Supabase DB insert error (Replicate):", dbError);
                // Log and continue, consider rollback
            } else {
                console.log("Saved Replicate image metadata to Supabase DB, ID:", dbData?.id);
            }
            // --- End Save to Supabase DB ---

            // Return the BASE64 version for the frontend preview consistency
            return { success: true, images: [base64ImageForFrontend] };
        } else {
            console.error("Unexpected output format from Replicate run:", output);
            return { success: false, error: "Received unexpected output format or no images from Replicate API." };
        }

    } catch (error: any) {
        console.error("Replicate API call failed:", error);
        const errorMessage = error?.message || (typeof error === 'string' ? error : 'An unknown error occurred with the Replicate API.');
        return { success: false, error: `Failed to generate image via Replicate: ${errorMessage}` };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.prompt || !body.provider || !body.width || !body.height) {
            return NextResponse.json({ error: 'Missing required generation parameters.' }, { status: 400 });
        }

        // Get API keys from headers if provided by client
        const openaiApiKey = request.headers.get('x-openai-api-key') || process.env.OPENAI_API_KEY;
        const togetheraiApiKey = request.headers.get('x-togetherai-api-key') || process.env.TOGETHER_API_KEY;
        const replicateApiKey = process.env.REPLICATE_API_TOKEN; // Keep using env for Replicate

        // --- API Key Checks ---
        // Check if Replicate API key is needed and missing
        if (body.provider.includes('/') && !replicateApiKey) { // Heuristic for Replicate models
             console.error("Replicate API key not configured.");
             return NextResponse.json({ error: "Replicate API key not configured on the server. Please set REPLICATE_API_TOKEN environment variable." }, { status: 500 });
        }
        // Check if OpenAI API key is needed and missing
        if (body.provider === 'openai' && !openaiApiKey) {
             console.error("OpenAI API key not configured.");
             return NextResponse.json({ error: "OpenAI API key not provided. Please add your OpenAI API key in Settings." }, { status: 400 });
        }
        // Check for TogetherAI API key if needed
        if (body.provider === 'togetherai') {
            // For the free Flux Schnell model, check environment first, then fall back to user-provided key
            if (!process.env.TOGETHER_API_KEY && !togetheraiApiKey) {
                console.error("TogetherAI API key not configured on server for free model and not provided by user.");
                return NextResponse.json({ 
                    error: "Please provide a TogetherAI API key in Settings. You can get a free API key at together.ai" 
                }, { status: 400 });
            }
            // If either env or user key is available, we'll continue
        } else if (body.provider === "black-forest-labs/FLUX.1.1-pro" && !togetheraiApiKey) {
            // Only require user's API key for the paid/pro models
            console.error("TogetherAI API key not provided for paid model.");
            return NextResponse.json({ error: "TogetherAI API key not provided. Please add your TogetherAI API key in Settings." }, { status: 400 });
        }

        // Construct parameters
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
            apiKey: '', // Will be set based on provider
            provider: body.provider, // Add provider key/ID to params
        };

        // Set appropriate API key based on provider
        if (body.provider === 'openai') {
            params.apiKey = openaiApiKey || '';
        } else if (body.provider === 'togetherai') {
            // For free model, try environment variable first, then fall back to user-provided key
            params.apiKey = process.env.TOGETHER_API_KEY || togetheraiApiKey || '';
        } else if (body.provider === "black-forest-labs/FLUX.1.1-pro") {
            // For paid model, use user-provided key
            params.apiKey = togetheraiApiKey || '';
        }

        // --- Define style keywords ---
        const styleKeywords: { [key: string]: string } = {
            cinematic: ", cinematic style",
            photographic: ", photographic style",
            anime: ", anime style",
            digitalArt: ", digital art style",
            cyberpunk: ", cyberpunk style",
            sketch: ", sketch style",
            cartoon: ", cartoon style",
            "3dCartoon": ", Pixar-like3D cartoon ",
            ghibliEsque: ", in the style of Studio Ghibli",
        };

        // --- Modify prompt based on style ---
        if (params.style && styleKeywords[params.style]) {
            params.prompt += styleKeywords[params.style];
            console.log(`Applied style '${params.style}'. New prompt: ${params.prompt}`);
        }

        let result;
        let modelToUse: string | null = null;

        // Determine the specific function based on provider selection
        if (body.provider.includes('/')) { // Heuristic for Replicate model IDs
            // Check for specific Together AI models passed as full IDs
            if (body.provider === "black-forest-labs/FLUX.1.1-pro") {
                console.log(`Using Together AI model: ${body.provider}`);
                result = await callTogetherAIWithLibrary({ ...params, model: body.provider });
            } else {
                 // Assume it's a Replicate model
                 result = await callReplicateModel(body.provider, params);
            }
        } else if (body.provider === 'togetherai') {
            // Original handling for 'togetherai' provider key (using Flux Schnell)
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