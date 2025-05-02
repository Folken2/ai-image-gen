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
// --- Import Constants ---
import {
    availableProvidersDisplay,
    availableStyles,
    defaultCapabilities,
    ModelCapabilities, // Import the interface if needed for type annotations
    ProviderDisplayInfo // Import the interface if needed for type annotations
} from './constants';

// Define interfaces for structure used within this page
interface SavedPrompt {
  id: string;
  name?: string | null;
  prompt_text: string | null;
  negative_prompt?: string | null; // Added based on getSavedPrompts action
}

// BASE DEFAULTS (Used if capabilities don't specify)
const BASE_DEFAULT_STEPS = 25;
const BASE_DEFAULT_GUIDANCE_SCALE = 7;

// Get initial capabilities based on the default selected provider
const initialProviderKey = "togetherai";
const initialCapabilities = availableProvidersDisplay[initialProviderKey]?.capabilities || defaultCapabilities;

export default function Home() {
  // --- State Variables ---
  const [selectedProvider, setSelectedProvider] = useState<string>(initialProviderKey);
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [dimensions, setDimensions] = useState<string>("1024x1024");
  // Initialize steps based on the initial provider's default
  const [steps, setSteps] = useState<number[]>([initialCapabilities.supportedSteps?.default ?? BASE_DEFAULT_STEPS]);
  const [guidanceScale, setGuidanceScale] = useState<number[]>([BASE_DEFAULT_GUIDANCE_SCALE]);
  const [seed, setSeed] = useState<string | number>("");
  const [imageCount, setImageCount] = useState<string>("1");
  const [selectedStyle, setSelectedStyle] = useState<string>("cinematic"); // Default style ID
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  // --- State for Dynamic UI Control ---
  const [currentCapabilities, setCurrentCapabilities] = useState<ModelCapabilities>(
      initialCapabilities // Use initial capabilities
  );
  // Initialize stepsConfig based on initial capabilities
  const [stepsConfig, setStepsConfig] = useState<{ min: number; max: number; disabled: boolean }>({
     min: initialCapabilities.supportedSteps?.min ?? 1,
     max: initialCapabilities.supportedSteps?.max ?? 50,
     disabled: !initialCapabilities.supportedSteps
  });
  // Initialize guidanceConfig based on initial capabilities
  const [guidanceConfig, setGuidanceConfig] = useState<{ min: number; max: number; disabled: boolean }>({
      min: 0,
      max: 20,
      disabled: !initialCapabilities.supportsGuidanceScale
  });
  const [dimensionOptions, setDimensionOptions] = useState<string[]>(
      initialCapabilities.supportedDimensions || ["1024x1024", "1024x1792", "1792x1024"]
  );

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

   // --- Update UI based on selected provider capabilities
   useEffect(() => {
    const newCaps = availableProvidersDisplay[selectedProvider]?.capabilities || defaultCapabilities;
    setCurrentCapabilities(newCaps);

    // --- Update Steps --- 
    if (!newCaps.supportedSteps) {
        // Provider does not support steps
        setSteps([BASE_DEFAULT_STEPS]); // Reset to a base default maybe?
        setStepsConfig({ min: 1, max: 50, disabled: true });
    } else {
        // Provider supports steps - update config and value
        setStepsConfig({ min: newCaps.supportedSteps.min, max: newCaps.supportedSteps.max, disabled: false });
        const currentStepVal = steps[0];
        // If current value is invalid OR if the provider just changed to Flux, reset to its default
        if (currentStepVal < newCaps.supportedSteps.min || currentStepVal > newCaps.supportedSteps.max || selectedProvider === 'togetherai') {
            setSteps([newCaps.supportedSteps.default]);
        }
         // Else, keep the current valid step value
    }

    // --- Update Guidance Scale ---
    setGuidanceConfig({ min: 0, max: 20, disabled: !newCaps.supportsGuidanceScale });
    if (!newCaps.supportsGuidanceScale) {
        setGuidanceScale([BASE_DEFAULT_GUIDANCE_SCALE]); // Reset if not supported
    } // No need to reset if supported, user's value might be valid

    // --- Update Dimensions ---
    const standardDimensions = ["1024x1024", "1024x1792", "1792x1024"];
    const newDimensionOptions = newCaps.supportedDimensions || standardDimensions;
    setDimensionOptions(newDimensionOptions);
    if (!newDimensionOptions.includes(dimensions)) {
        setDimensions(newDimensionOptions[0]);
    }

    // --- Update Image Count ---
    if (parseInt(imageCount) > newCaps.maxImageCount) {
        setImageCount(String(newCaps.maxImageCount));
    }
    // Reset to 1 if max is 1 (like DALL-E)
    if (imageCount !== "1" && newCaps.maxImageCount === 1) {
        setImageCount("1");
    }


    // --- Update Negative Prompt ---
    if (!newCaps.supportsNegativePrompt && negativePrompt !== "") {
        setNegativePrompt("");
    }

  }, [selectedProvider]); // **IMPORTANT: Only run this effect when selectedProvider changes**

  // Separate effect to handle step value changes potentially caused by direct slider interaction
  // This might not be strictly necessary if the slider component handles clamping itself
  // useEffect(() => {
  //   if (currentCapabilities.supportedSteps) {
  //     const currentStepVal = steps[0];
  //     if (currentStepVal < currentCapabilities.supportedSteps.min) {
  //       setSteps([currentCapabilities.supportedSteps.min]);
  //     } else if (currentStepVal > currentCapabilities.supportedSteps.max) {
  //       setSteps([currentCapabilities.supportedSteps.max]);
  //     }
  //   }
  // }, [steps, currentCapabilities]);

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
        // Ensure result.error is treated as string or default message
        const errorMessage = typeof result?.error === 'string' ? result.error : `API Error (${response.status})`;
        throw new Error(errorMessage);
      }

      // Ensure result.images is an array of strings
      if (result.images && Array.isArray(result.images) && result.images.every((i: unknown) => typeof i === 'string')) {
        setGeneratedImages(result.images as string[]);
      } else {
         throw new Error("Invalid image data format from server.");
      }

    } catch (err: unknown) {
      console.error("Frontend API Call failed:", err);
      // Add type check
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "An unexpected error occurred during generation.");
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
                           {/* Corrected apostrophe */}
                          <p>Things you don&apos;t want in the image (e.g., blurry, text).</p>
                        </TooltipContent>
                      </Tooltip>
                      <Textarea
                        id="negative-prompt"
                        placeholder="e.g., blurry, low quality, text, watermark"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
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
