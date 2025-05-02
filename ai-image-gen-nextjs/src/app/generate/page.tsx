"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSavedPrompts } from '@/app/prompts/actions';

// --- Exported Definitions ---

// Define the structure for a style option
export interface StyleOption {
  id: string;
  name: string;
  imageUrl: string; // Placeholder image URL for now
}

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

// Define available providers (for display purposes)
export const availableProvidersDisplay: { [key: string]: { name: string } } = {
  // --- Reordered List ---
  togetherai: { name: "Together AI (Flux1.1 Schnell - Free)" },
  "black-forest-labs/FLUX.1.1-pro": { name: "Together AI (FLUX 1.1 Pro)" },
  openai: { name: "OpenAI (gpt-image-1)" },
  // stabilityai: { name: "Stability AI" }, // Removed generic entry
  // --- Replicate Models ---
  "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe": { name: "Replicate (SDXL Lightning 4-Step)" },
  "google/imagen-3": { name: "Replicate (Google Imagen 3 - Needs Access)" }, // Placeholder, Imagen 3 might not be public/available via Replicate API
  "ai-forever/kandinsky-2.2:ad9d7879fbffa2874e1d909d1d37d9bc682889cc65b31f7bb00d2362619f194a": { name: "Replicate (Kandinsky 2.2)" },
  "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc": { name: "Replicate (Stability AI SDXL)" },
  "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4": { name: "Replicate (Stable Diffusion 1.5)" },
  // "ideogram-ai/ideogram-v2": { name: "Replicate (Ideogram V2 - Needs Access)" }, // Removed
};

// Define the structure for a saved prompt (based on action's select)
interface SavedPrompt {
  id: string;
  name?: string | null;
  prompt_text: string | null; // Allow null based on potential DB schema
}

// Define model capabilities (can be expanded)
interface ModelCapabilities {
  supportsNegativePrompt: boolean;
  supportsGuidanceScale: boolean;
  supportedSteps: { min: number; max: number; default: number } | null; // null if not applicable
  supportedDimensions: string[] | null; // null if standard 1024x* options are fine
  maxImageCount: number;
}

// Map providers/models to capabilities
const modelCapabilities: Record<string, ModelCapabilities> = {
  // --- Default/Fallback --- 
  default: {
    supportsNegativePrompt: true,
    supportsGuidanceScale: true,
    supportedSteps: { min: 1, max: 50, default: 25 },
    supportedDimensions: null, // Use standard list
    maxImageCount: 4,
  },
  // --- OpenAI ---
  openai: {
    supportsNegativePrompt: false,
    supportsGuidanceScale: false,
    supportedSteps: null, // Not user-configurable
    supportedDimensions: ["1024x1024", "1792x1024", "1024x1792"],
    maxImageCount: 1,
  },
  // --- Together AI ---
  togetherai: { // Flux Schnell Free
    supportsNegativePrompt: true,
    supportsGuidanceScale: false, // Flux models typically don't use CFG
    supportedSteps: { min: 1, max: 10, default: 4 }, // Flux uses few steps
    supportedDimensions: null,
    maxImageCount: 4,
  },
  "black-forest-labs/FLUX.1.1-pro": {
    supportsNegativePrompt: true,
    supportsGuidanceScale: false, // Flux models typically don't use CFG
    supportedSteps: { min: 1, max: 10, default: 8 }, // Pro might allow slightly more?
    supportedDimensions: null,
    maxImageCount: 4,
  },
  // --- Replicate Models ---
  "bytedance/sdxl-lightning-4step": {
    supportsNegativePrompt: true,
    supportsGuidanceScale: true, // Often low values like 1-2 work best
    supportedSteps: { min: 1, max: 8, default: 4 }, // Fixed at 4 essentially
    supportedDimensions: null,
    maxImageCount: 4,
  },
  "ai-forever/kandinsky-2.2": {
    supportsNegativePrompt: true,
    supportsGuidanceScale: true,
    supportedSteps: { min: 1, max: 100, default: 50 },
    supportedDimensions: null,
    maxImageCount: 4,
  },
  "stability-ai/sdxl": {
    supportsNegativePrompt: true,
    supportsGuidanceScale: true,
    supportedSteps: { min: 1, max: 50, default: 25 },
    supportedDimensions: null,
    maxImageCount: 4,
  },
  "stability-ai/stable-diffusion": { // Assuming v1.5
    supportsNegativePrompt: true,
    supportsGuidanceScale: true,
    supportedSteps: { min: 1, max: 100, default: 50 },
    supportedDimensions: null,
    maxImageCount: 4,
  },
  "google/imagen-3": { // Assuming Imagen 3 capabilities
      supportsNegativePrompt: true, // Usually supported
      supportsGuidanceScale: false, // Imagen doesn't typically use CFG scale
      supportedSteps: null, // Not typically configurable
      supportedDimensions: ["1024x1024", "1792x1024", "1024x1792", "1024x1536", "1536x1024"], // Example sizes, verify!
      maxImageCount: 1, // Often limited
  },
  // Add other specific model IDs as needed
};

// Default values for advanced options (will be overridden by useEffect)
const BASE_DEFAULT_STEPS = 25;
const BASE_DEFAULT_GUIDANCE_SCALE = 7;

export default function Home() {
  // --- State Variables ---
  const [selectedProvider, setSelectedProvider] = useState<string>("togetherai"); // Default to free flux
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState<number | string>("");
  const [steps, setSteps] = useState<number[]>([BASE_DEFAULT_STEPS]);
  const [guidanceScale, setGuidanceScale] = useState<number[]>([BASE_DEFAULT_GUIDANCE_SCALE]);
  const [dimensions, setDimensions] = useState("1024x1024");
  const [imageCount, setImageCount] = useState("1");
  const [selectedStyle, setSelectedStyle] = useState<string>("cinematic");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  // --- State for Dynamic UI Control ---
  const [currentCapabilities, setCurrentCapabilities] = useState<ModelCapabilities>(modelCapabilities.togetherai); // Initialize with default provider
  const [stepsConfig, setStepsConfig] = useState<{ min: number; max: number; disabled: boolean }>({ min: 1, max: 50, disabled: false });
  const [guidanceConfig, setGuidanceConfig] = useState<{ min: number; max: number; disabled: boolean }>({ min: 0, max: 20, disabled: false });
  const [dimensionOptions, setDimensionOptions] = useState<string[]>(["1024x1024", "1024x1792", "1792x1024"]); // Default options

  // --- Fetch Saved Prompts on Mount ---
  useEffect(() => {
    async function fetchPrompts() {
      setLoadingPrompts(true);
      try {
        const result = await getSavedPrompts();
        if (result.success && result.data) {
          // Filter out any prompts with null text just in case, though it shouldn't happen based on schema
          const validPrompts = result.data.filter(p => p.prompt_text !== null) as SavedPrompt[]; 
          setSavedPrompts(validPrompts);
        } else {
          console.error("Failed to fetch saved prompts:", result.message);
          setSavedPrompts([]); // Ensure state is an empty array on error
        }
      } catch (err) {
        console.error("Error fetching saved prompts:", err);
        setSavedPrompts([]); // Ensure state is an empty array on error
      }
      setLoadingPrompts(false);
    }
    fetchPrompts();
  }, []); // Empty dependency array means run once on mount

   // --- Update UI based on Provider/Model Change ---
   useEffect(() => {
    const providerKey = selectedProvider.includes('/') ? selectedProvider.split(':')[0] : selectedProvider; // Use base ID or full ID if versioned
    const capabilities = modelCapabilities[providerKey] || modelCapabilities[selectedProvider] || modelCapabilities.default;
    setCurrentCapabilities(capabilities);
    console.log(`Provider changed to: ${selectedProvider}, Capabilites:`, capabilities);

    // Update Steps Slider
    if (capabilities.supportedSteps) {
      setStepsConfig({ min: capabilities.supportedSteps.min, max: capabilities.supportedSteps.max, disabled: false });
      // Reset steps to default if current value is out of new range
      if (steps[0] < capabilities.supportedSteps.min || steps[0] > capabilities.supportedSteps.max) {
          setSteps([capabilities.supportedSteps.default]);
      }
    } else {
      setStepsConfig({ min: 1, max: 1, disabled: true }); // Disable if not applicable
      setSteps([1]);
    }

    // Update Guidance Scale Slider
    setGuidanceConfig({ min: 0, max: 20, disabled: !capabilities.supportsGuidanceScale });
    if (!capabilities.supportsGuidanceScale) {
        setGuidanceScale([BASE_DEFAULT_GUIDANCE_SCALE]); // Reset to base default if disabled
    }

    // Update Dimension Options
    const standardDimensions = ["1024x1024", "1024x1792", "1792x1024"];
    const newDimensionOptions = capabilities.supportedDimensions || standardDimensions;
    setDimensionOptions(newDimensionOptions);
    // Reset dimension if current selection is no longer valid
    if (!newDimensionOptions.includes(dimensions)) {
        setDimensions(newDimensionOptions[0]); // Default to the first available option
    }

     // Update Image Count
    if (imageCount !== "1" && capabilities.maxImageCount === 1) {
        setImageCount("1");
    }

    // Clear negative prompt if not supported
    if (!capabilities.supportsNegativePrompt && negativePrompt !== "") {
        setNegativePrompt("");
    }

  }, [selectedProvider]); // Rerun ONLY when provider changes

  // --- Handlers ---
  const handleGenerate = async () => {
    setError(null);
    setGeneratedImages([]);
    setIsLoading(true);

    const [widthStr, heightStr] = dimensions.split('x');
    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);
    const numOutputs = parseInt(imageCount, 10);

    if (isNaN(width) || isNaN(height) || isNaN(numOutputs)) {
        setError("Invalid dimensions or image count.");
        setIsLoading(false);
        return;
    }

    // Process seed: empty string means no seed, otherwise parse as number
    const seedValue = typeof seed === 'string' && seed.trim() === '' ? undefined : parseInt(String(seed), 10);
    if (typeof seed === 'string' && seed.trim() !== '' && isNaN(seedValue as number)) {
        setError("Invalid Seed value. Must be a number or empty.");
        setIsLoading(false);
        return;
    }

    // Prepare data for the API route
    const requestBody = {
      provider: selectedProvider,
      prompt,
      negativePrompt: currentCapabilities.supportsNegativePrompt ? (negativePrompt.trim() || undefined) : undefined,
      width,
      height,
      numOutputs,
      style: selectedStyle === "none" ? undefined : selectedStyle,
      seed: seedValue,
      steps: currentCapabilities.supportedSteps ? steps[0] : undefined,
      guidanceScale: currentCapabilities.supportsGuidanceScale ? guidanceScale[0] : undefined,
    };

    console.log("Sending request to /api/generate:", requestBody);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API Error (${response.status})`);
      }

      if (result.images && Array.isArray(result.images)) {
        setGeneratedImages(result.images);
      } else {
         throw new Error("Invalid response format from server.");
      }

    } catch (err: any) {
      console.error("Frontend API Call failed:", err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPrompt("");
    setNegativePrompt("");
    setSeed("");
    setSteps([BASE_DEFAULT_STEPS]);
    setGuidanceScale([BASE_DEFAULT_GUIDANCE_SCALE]);
    setDimensions("1024x1024");
    setImageCount("1");
    setSelectedStyle("cinematic");
    setSelectedProvider("togetherai");
    setGeneratedImages([]);
    setError(null);
    setIsLoading(false);
  };

  // Handler for seed input to allow only numbers or empty string
  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]+$/.test(value)) {
        setSeed(value);
    }
  };

  return (
    <TooltipProvider>
      <main className="p-4 md:p-8 flex flex-col items-center">
        {/* Removed h1 title */}
        {/* <h1 className="text-3xl font-bold mb-8">AI Image Generator</h1> */}

        {/* Revert to grid, remove max-width if present */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Card 1: Controls - Restore md:col-span-1 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Generation Settings</CardTitle>
              <CardDescription>Configure your image generation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* --- Provider Selection --- */}
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(availableProvidersDisplay).map(([key, provider]) => (
                      <SelectItem key={key} value={key}>{provider.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* --- Saved Prompt Selector --- */}
              <div className="space-y-2">
                <Label htmlFor="saved-prompt">Load Saved Prompt</Label>
                <Select
                  value={savedPrompts.find(p => p.prompt_text === prompt)?.id || ""} // Set current value if prompt matches
                  onValueChange={(value) => {
                    const selected = savedPrompts.find(p => p.id === value);
                    // Ensure prompt_text is not null before setting
                    if (selected && selected.prompt_text) { 
                      setPrompt(selected.prompt_text);
                      // Optionally update negative prompt too if saved?
                    }
                  }}
                  disabled={loadingPrompts || savedPrompts.length === 0}
                >
                  <SelectTrigger id="saved-prompt">
                    <SelectValue placeholder={loadingPrompts ? "Loading prompts..." : "Select a saved prompt..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {savedPrompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name || `Prompt ${p.id.substring(0, 6)}...`} 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* --- Main Prompt Input --- */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., A photo of an astronaut riding a horse on the moon"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Select value={dimensions} onValueChange={setDimensions}>
                    <SelectTrigger id="dimensions">
                      <SelectValue placeholder="Select dimensions" />
                    </SelectTrigger>
                    <SelectContent>
                       {/* Dynamically generate options */} 
                       {dimensionOptions.map((dim) => (
                          <SelectItem key={dim} value={dim}>{dim.replace('x', ' x ')}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-count">Image count</Label>
                   <Select value={imageCount} onValueChange={setImageCount} disabled={currentCapabilities.maxImageCount === 1}>
                    <SelectTrigger id="image-count">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                       {/* Generate options up to max count */} 
                       {Array.from({ length: currentCapabilities.maxImageCount }, (_, i) => i + 1).map(count => (
                           <SelectItem key={count} value={String(count)}>{count}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* --- Style Selection --- */}
              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {availableStyles.map((style) => (
                    <Tooltip key={style.id} delayDuration={100}>
                       <TooltipTrigger asChild>
                         <Button
                           variant={selectedStyle === style.id ? "secondary" : "outline"}
                           onClick={() => setSelectedStyle(style.id)}
                           className={`h-auto p-1 border-2 ${selectedStyle === style.id ? 'border-primary' : 'border-transparent'}`}
                         >
                           <div className="relative flex flex-col items-center space-y-1 aspect-square w-full overflow-hidden rounded-md">
                             <Image
                               src={style.imageUrl}
                               alt={style.name}
                               fill
                               sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 10vw"
                               className="object-cover"
                             />
                           </div>
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>{style.name}</p>
                       </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* --- Advanced Options Accordion --- */}
              <Accordion type="single" collapsible className="w-full pt-2">
                <AccordionItem value="advanced-options">
                  <AccordionTrigger className="text-sm font-semibold">Advanced Options</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    {/* Negative Prompt */}
                    <div className="space-y-2">
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <Label htmlFor="negative-prompt">Negative Prompt (?)</Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Describe what you *don't* want to see in the image (e.g., blurry, text, extra limbs).</p>
                        </TooltipContent>
                      </Tooltip>
                      <Textarea
                        id="negative-prompt"
                        placeholder="e.g., low quality, blurry, extra limbs, multiple heads, bad hands, missing fingers, watermark, text, distorted faces, bad anatomy, cropped faces, bad proportions."
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        rows={2}
                        disabled={!currentCapabilities.supportsNegativePrompt}
                      />
                    </div>

                    {/* Seed Input */}
                    <div className="space-y-2">
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                           <Label htmlFor="seed">Seed (?)</Label>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p className="max-w-xs">A specific number to initialize the generation process. Using the same seed and prompt usually produces similar images. Leave empty for random.</p>
                        </TooltipContent>
                       </Tooltip>
                      <Input
                        id="seed"
                        type="text"
                        placeholder="Random (leave empty)"
                        value={seed}
                        onChange={handleSeedChange}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>

                    {/* Steps Slider */}
                    <div className={`space-y-3 ${stepsConfig.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex justify-between items-center">
                         <Tooltip delayDuration={100}>
                           <TooltipTrigger asChild>
                             <Label htmlFor="steps">Steps (?)</Label>
                           </TooltipTrigger>
                           <TooltipContent>
                             <p className="max-w-xs">Number of refinement steps during generation. More steps can improve detail but take longer. Flux models often use very few steps.</p>
                           </TooltipContent>
                         </Tooltip>
                        <span className="text-sm text-muted-foreground">{steps[0]}</span>
                      </div>
                      <Slider
                        id="steps"
                        min={stepsConfig.min}
                        max={stepsConfig.max}
                        step={1}
                        value={steps}
                        onValueChange={setSteps}
                        disabled={stepsConfig.disabled}
                      />
                    </div>

                    {/* Guidance Scale Slider */}
                    <div className={`space-y-3 ${guidanceConfig.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex justify-between items-center">
                         <Tooltip delayDuration={100}>
                           <TooltipTrigger asChild>
                             <Label htmlFor="guidance-scale">Guidance Scale (CFG) (?)</Label>
                           </TooltipTrigger>
                           <TooltipContent>
                             <p className="max-w-xs">How strongly the image generation should follow the prompt. Higher values mean stricter adherence, lower values allow more creativity. (May not be supported by all models).</p>
                           </TooltipContent>
                         </Tooltip>
                        <span className="text-sm text-muted-foreground">{guidanceScale[0]}</span>
                      </div>
                      <Slider
                        id="guidance-scale"
                        min={guidanceConfig.min}
                        max={guidanceConfig.max}
                        step={0.5}
                        value={guidanceScale}
                        onValueChange={setGuidanceScale}
                        disabled={guidanceConfig.disabled}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleClear}>Clear</Button>
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : "Generate"}
              </Button>
            </CardFooter>
          </Card>

          {/* Card 2: Image Display Area - Restore md:col-span-2 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Generated Images</CardTitle>
              <CardDescription>
                  Using: {availableProvidersDisplay[selectedProvider]?.name || 'Selected Provider'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col justify-center items-center min-h-[400px] bg-muted/50 rounded-md p-4 space-y-4">
              {error && (
                <div className="text-center text-destructive dark:text-red-400 bg-destructive/10 dark:bg-red-900/20 p-4 rounded-md w-full border border-destructive/20">
                  <p className="font-semibold mb-1">Error Generating Image</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {isLoading ? (
                <div className="flex flex-col items-center text-center text-muted-foreground space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Generating with {availableProvidersDisplay[selectedProvider]?.name || 'selected provider'}...</p>
                  <p className="text-xs">(This may take a moment)</p>
                </div>
              ) : generatedImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {generatedImages.map((imgSrc, index) => (
                     <div key={index} className="relative aspect-square bg-muted rounded-md overflow-hidden shadow-sm">
                       <Image
                         src={imgSrc}
                         alt={`Generated image ${index + 1} using ${availableProvidersDisplay[selectedProvider]?.name}`}
                         fill
                         sizes="(max-width: 640px) 100vw, 50vw"
                         style={{ objectFit: "contain" }}
                         className="rounded-md"
                       />
                     </div>
                  ))}
                </div>
              ) : (
                 !error && (
                   <div className="text-center text-muted-foreground">
                     <p>Your generated images will appear here.</p>
                     <p className="text-sm">Configure settings and click Generate.</p>
                   </div>
                 )
              )}
            </CardContent>
             <CardFooter className="flex justify-end gap-2 pt-4">
               <Button variant="secondary" disabled={generatedImages.length === 0 || isLoading}>
                 Upscale
               </Button>
             </CardFooter>
          </Card>
        </div>
         <footer className="mt-12 text-center text-muted-foreground text-sm">
           Built with Next.js and shadcn/ui
         </footer>
      </main>
    </TooltipProvider>
  );
}
