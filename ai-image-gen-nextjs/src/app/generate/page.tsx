"use client";

import { useState } from 'react';
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

// Define the structure for a style option
interface StyleOption {
  id: string;
  name: string;
  imageUrl: string; // Placeholder image URL for now
}

// Define available styles
const availableStyles: StyleOption[] = [
  // { id: "none", name: "None", imageUrl: "/style-placeholders/none.png" }, // Removed "None" style
  { id: "cinematic", name: "Cinematic", imageUrl: "/style-placeholders/cinematic.png" },
  { id: "photographic", name: "Photographic", imageUrl: "/style-placeholders/photographic.png" },
  { id: "anime", name: "Anime", imageUrl: "/style-placeholders/anime.png" },
  { id: "digital-art", name: "Digital Art", imageUrl: "/style-placeholders/digital-art.png" },
  { id: "cyberpunk", name: "Cyberpunk", imageUrl: "/style-placeholders/cyberpunk.png" },
  { id: "sketch", name: "Sketch", imageUrl: "/style-placeholders/sketch.png" },
  // Add more styles here
];

// Define available providers (for display purposes)
const availableProvidersDisplay: { [key: string]: { name: string } } = {
  openai: { name: "OpenAI (gpt-image-1)" },
  replicate: { name: "Replicate" },
  stabilityai: { name: "Stability AI" },
  flux: { name: "Flux" },
  togetherai: { name: "Together AI (Flux1.1 Schnell)" }, // Can add specific model later
};

// Default values for advanced options
const DEFAULT_STEPS = 4; // Default for Flux Schnell
const DEFAULT_GUIDANCE_SCALE = 7;

export default function Home() {
  // --- State Variables ---
  const [selectedProvider, setSelectedProvider] = useState<string>("flux");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState<number | string>(""); // Use string for input, number for API
  const [steps, setSteps] = useState<number[]>([DEFAULT_STEPS]);
  const [guidanceScale, setGuidanceScale] = useState<number[]>([DEFAULT_GUIDANCE_SCALE]);
  const [dimensions, setDimensions] = useState("1024x1024");
  const [imageCount, setImageCount] = useState("1");
  const [selectedStyle, setSelectedStyle] = useState<string>("cinematic");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      negativePrompt: negativePrompt.trim() || undefined,
      width,
      height,
      numOutputs,
      style: selectedStyle === "none" ? undefined : selectedStyle,
      seed: seedValue,
      steps: steps[0], // Get value from slider array
      guidanceScale: guidanceScale[0], // Get value from slider array
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
    setSteps([DEFAULT_STEPS]);
    setGuidanceScale([DEFAULT_GUIDANCE_SCALE]);
    setDimensions("1024x1024");
    setImageCount("1");
    setSelectedStyle("cinematic");
    setSelectedProvider("flux");
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
                <Select value={selectedProvider} onValueChange={setSelectedProvider} defaultValue="flux">
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
                  <Select value={dimensions} onValueChange={setDimensions} defaultValue="1024x1024">
                    <SelectTrigger id="dimensions">
                      <SelectValue placeholder="Select dimensions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">1024 x 1024</SelectItem>
                      <SelectItem value="1024x1792">1024 x 1792</SelectItem>
                      <SelectItem value="1792x1024">1792 x 1024</SelectItem>
                      {/* Add more dimensions as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-count">Image count</Label>
                  <Select value={imageCount} onValueChange={setImageCount} defaultValue="1">
                    <SelectTrigger id="image-count">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
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
                    <div className="space-y-3">
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
                        min={1}
                        max={50}
                        step={1}
                        value={steps}
                        onValueChange={setSteps}
                      />
                    </div>

                    {/* Guidance Scale Slider */}
                    <div className="space-y-3">
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
                        min={1}
                        max={20}
                        step={0.5}
                        value={guidanceScale}
                        onValueChange={setGuidanceScale}
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
