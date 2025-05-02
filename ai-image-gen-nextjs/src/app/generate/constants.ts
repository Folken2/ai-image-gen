// Define interfaces for structure
export interface StyleOption {
  id: string;
  name: string;
  imageUrl: string;
}

export interface ModelCapabilities {
  supportsNegativePrompt: boolean;
  supportsGuidanceScale: boolean;
  supportedSteps: { min: number; max: number; default: number } | null;
  supportedDimensions: string[] | null;
  maxImageCount: number;
}

export interface ProviderDisplayInfo {
    name: string;
    capabilities: ModelCapabilities;
}

// Default capabilities (apply if a provider isn't explicitly listed)
export const defaultCapabilities: ModelCapabilities = {
  supportsNegativePrompt: true,
  supportsGuidanceScale: true,
  supportedSteps: { min: 10, max: 50, default: 25 },
  supportedDimensions: ["1024x1024", "1024x1792", "1792x1024"],
  maxImageCount: 4,
};

const dallECapabilities: ModelCapabilities = {
  supportsNegativePrompt: false, // DALL-E 3 API doesn't explicitly take negative_prompt
  supportsGuidanceScale: false,
  supportedSteps: null, // Not applicable
  supportedDimensions: ["1024x1024", "1024x1792", "1792x1024"], // Specific required sizes
  maxImageCount: 1,
};

const sdxlCapabilities: ModelCapabilities = {
  supportsNegativePrompt: true,
  supportsGuidanceScale: true,
  supportedSteps: { min: 1, max: 50, default: 20 }, // Example ranges
  supportedDimensions: ["1024x1024", "1152x896", "896x1152", "1216x832", "832x1216", "1344x768", "768x1344", "1536x640", "640x1536"], // Common SDXL sizes
  maxImageCount: 4,
};

const sdxlLightningCapabilities: ModelCapabilities = {
  ...sdxlCapabilities, // Inherits base SDXL capabilities
  supportedSteps: { min: 1, max: 8, default: 4 }, // Specific low steps
  supportsGuidanceScale: false, // Often not used or effective with lightning
};

// --- Define specific capabilities for Flux Schnell ---
const fluxSchnellCapabilities: ModelCapabilities = {
  supportsNegativePrompt: true,
  supportsGuidanceScale: false, // Flux Schnell typically doesn't use/need CFG
  supportedSteps: { min: 1, max: 4, default: 4 }, // Correct range and default for Flux
  supportedDimensions: ["1024x1024", "1024x1792", "1792x1024"], // Assuming same as DALL-E/Default
  maxImageCount: 1, // Often 1 for faster models
};

// Define the structure and capabilities for each provider/model
export const availableProvidersDisplay: { [key: string]: ProviderDisplayInfo } = {
  // Key should match the value used in state/API calls
  togetherai: { name: "Together AI (Flux Schnell - Free)", capabilities: fluxSchnellCapabilities }, // <-- Use specific capabilities
  openai: { name: "OpenAI (DALL-E 3)", capabilities: dallECapabilities },
  "replicate/stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc": { name: "Replicate (SDXL)", capabilities: sdxlCapabilities },
  "replicate/bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe": { name: "Replicate (SDXL Lightning)", capabilities: sdxlLightningCapabilities },
  // Add other models with their specific capabilities here
};

// Define available styles
export const availableStyles: StyleOption[] = [
  // { id: "none", name: "None", imageUrl: "/style-placeholders/none.png" }, // Removed "None" style
  { id: "cinematic", name: "Cinematic", imageUrl: "/style-placeholders/cinematic.png" },
  { id: "photographic", name: "Photographic", imageUrl: "/style-placeholders/photographic.png" },
  { id: "anime", name: "Anime", imageUrl: "/style-placeholders/anime.png" },
  { id: "digital-art", name: "Digital Art", imageUrl: "/style-placeholders/digital-art.png" },
  { id: "cyberpunk", name: "Cyberpunk", imageUrl: "/style-placeholders/cyberpunk.png" },
  { id: "sketch", name: "Sketch", imageUrl: "/style-placeholders/sketch.png" },
  // Add more styles here
  { id: "cartoon", name: "Cartoon", imageUrl: "/style-placeholders/cartoon.png" },
  { id: "3d-cartoon", name: "3D Cartoon", imageUrl: "/style-placeholders/3d-cartoon.png" },
  { id: "ghibli-esque", name: "Ghibli-esque", imageUrl: "/style-placeholders/ghibli.png" },
]; 