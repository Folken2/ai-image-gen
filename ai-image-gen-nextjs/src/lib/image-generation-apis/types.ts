// src/lib/image-generation-apis/types.ts

export interface ImageGenerationParameters {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  numOutputs: number;
  style?: string; // Provider-specific interpretation
  seed?: number;
  steps?: number;
  guidanceScale?: number;
  apiKey?: string; // Should be handled server-side mostly
  provider?: string; // <-- Add provider key/ID
  // Add other common parameters as needed
}

export interface ImageGenerationResult {
  success: boolean;
  images?: string[]; // Array of image URLs or base64 strings
  error?: string;
  provider?: string; // Optional: Indicate which provider generated the image
}

export interface ImageGenerationProvider {
  generateImage: (params: ImageGenerationParameters) => Promise<ImageGenerationResult>;
} 