"use client"; // <-- Make it a client component

import { useState, useEffect } from 'react'; // <-- Import hooks
import { supabase } from "@/lib/supabase/client";
import { columns, Prompt } from "@/components/prompts/columns";
import { PromptsDataTable } from "@/components/prompts/data-table";
import { SavePromptDialog } from "@/components/prompts/save-prompt-dialog";
// Import UI components needed for the builder
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, ClipboardPaste } from "lucide-react"; // Added ClipboardPaste
import { toast } from "sonner"; // For copy feedback

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // <-- State to trigger refresh

  // --- Prompt Builder State ---
  const [mainSubject, setMainSubject] = useState("");
  const [action, setAction] = useState("");
  const [environment, setEnvironment] = useState("");
  const [styleMood, setStyleMood] = useState("");
  const [detailLevel, setDetailLevel] = useState("");
  const [lightingType, setLightingType] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [cameraAngle, setCameraAngle] = useState("");
  const [artStyle, setArtStyle] = useState("");
  const [builderNegativePrompts, setBuilderNegativePrompts] = useState(""); // This remains the source for negative

  // --- Derived State: Generated Positive Prompt ---
  const generatedPositivePrompt = [
    mainSubject.trim(),
    action.trim(),
    environment.trim() ? `in a ${environment.trim()}` : "",
    styleMood.trim(),
    detailLevel.trim(),
    lightingType.trim() ? `${lightingType.trim()} lighting` : "",
    colorPalette.trim() ? `with a ${colorPalette.trim()} color palette` : "",
    cameraAngle.trim(),
    artStyle.trim() ? `in the style of ${artStyle.trim()}` : "",
  ].filter(part => !!part) // Use !!part for clearer boolean check
   .join(", ");

  // --- Derived State: Generated Negative Prompt (directly from input) ---
  const generatedNegativePrompt = builderNegativePrompts.trim();

  // --- Function to trigger data refetch --- 
  const triggerRefresh = () => {
    console.log("Triggering prompt list refresh...");
    setRefreshKey(prev => prev + 1);
  };

  // --- Fetch Prompts Data (depends on refreshKey) ---
  useEffect(() => {
    async function fetchPrompts() {
      setIsLoading(true);
      setFetchError(null);
      console.log("PromptsPage (Client): Fetching prompts...", { refreshKey }); // Log key
      const { data, error } = await supabase
        .from('prompts')
        .select('id, created_at, name, prompt_text, negative_prompt, notes, style_tags')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching prompts:", error);
        setFetchError(error.message);
        setPrompts([]);
      } else {
        setPrompts(data || []);
      }
      setIsLoading(false);
    }
    fetchPrompts();
  }, [refreshKey]); // <-- Add refreshKey to dependency array

  // --- Handler for Copy Button (Positive Prompt) ---
  const handleCopyPositivePrompt = () => {
    navigator.clipboard.writeText(generatedPositivePrompt)
      .then(() => {
        toast.success("Positive prompt copied!");
      })
      .catch(err => {
        console.error("Failed to copy positive prompt: ", err);
        toast.error("Failed to copy positive prompt.");
      });
  };
  
  // --- Handler for Copy Button (Negative Prompt) ---
  const handleCopyNegativePrompt = () => {
      if (!generatedNegativePrompt) return; // Don't copy if empty
      navigator.clipboard.writeText(generatedNegativePrompt)
          .then(() => {
              toast.success("Negative prompt copied!");
          })
          .catch(err => {
              console.error("Failed to copy negative prompt: ", err);
              toast.error("Failed to copy negative prompt.");
          });
  };

  return (
    // Removed container mx-auto to allow full width for builder?
    // Keep container for now, can adjust later
    <main className="container mx-auto py-10 space-y-8">
      
      {/* --- Prompt Builder Section --- */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt Builder</CardTitle>
          <CardDescription>Construct a detailed prompt using the template.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Reminder (Optional) */}
          {/* <p className="text-sm text-muted-foreground">Template: A [Subject] [Action] in a [Setting], [Style], [Details], [Lighting], [Colors], [Camera], [Inspiration]. --no [Negatives]</p> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Input Fields */}
            <div className="space-y-1">
              <Label htmlFor="mainSubject">Main Subject</Label>
              <Input id="mainSubject" value={mainSubject} onChange={(e) => setMainSubject(e.target.value)} placeholder="e.g., astronaut" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="action">Action</Label>
              <Input id="action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g., riding a horse" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="environment">Environment/Setting</Label>
              <Input id="environment" value={environment} onChange={(e) => setEnvironment(e.target.value)} placeholder="e.g., the moon" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="styleMood">Style & Mood</Label>
              <Input id="styleMood" value={styleMood} onChange={(e) => setStyleMood(e.target.value)} placeholder="e.g., epic, dramatic" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="detailLevel">Detail Level</Label>
              <Input id="detailLevel" value={detailLevel} onChange={(e) => setDetailLevel(e.target.value)} placeholder="e.g., highly detailed, 8k" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lightingType">Lighting Type</Label>
              <Input id="lightingType" value={lightingType} onChange={(e) => setLightingType(e.target.value)} placeholder="e.g., cinematic, volumetric" />
            </div>
             <div className="space-y-1">
              <Label htmlFor="colorPalette">Color Palette</Label>
              <Input id="colorPalette" value={colorPalette} onChange={(e) => setColorPalette(e.target.value)} placeholder="e.g., vibrant neon" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cameraAngle">Camera Angle/Technique</Label>
              <Input id="cameraAngle" value={cameraAngle} onChange={(e) => setCameraAngle(e.target.value)} placeholder="e.g., wide angle shot" />
            </div>
             <div className="space-y-1">
              <Label htmlFor="artStyle">Art Style/Inspiration</Label>
              <Input id="artStyle" value={artStyle} onChange={(e) => setArtStyle(e.target.value)} placeholder="e.g., Greg Rutkowski" />
            </div>
          </div>
          
          {/* Negative Prompt Input (directly feeds generatedNegativePrompt) */}
           <div className="space-y-1 pt-4">
              <Label htmlFor="builderNegativePrompts">Negative Prompts (Optional)</Label>
              <Input 
                id="builderNegativePrompts" 
                value={builderNegativePrompts} 
                onChange={(e) => setBuilderNegativePrompts(e.target.value)} 
                placeholder="e.g., blurry, text, extra limbs, deformed" 
              />
            </div>

          {/* Generated Prompt Display (Split Positive/Negative) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* Positive Prompt Area */}
            <div className="space-y-1">
              <Label htmlFor="generatedPositivePrompt">Generated Positive Prompt</Label>
              <div className="flex gap-2 items-start"> {/* Align items start */}
                <Textarea 
                  id="generatedPositivePrompt" 
                  value={generatedPositivePrompt} 
                  readOnly 
                  rows={4} // Increased rows slightly
                  className="flex-grow bg-muted/50 resize-none" // Prevent manual resize
                />
                <Button variant="outline" size="icon" onClick={handleCopyPositivePrompt} title="Copy Positive Prompt">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Negative Prompt Area */}
             <div className="space-y-1">
              <Label htmlFor="generatedNegativePrompt">Generated Negative Prompt</Label>
              <div className="flex gap-2 items-start"> {/* Align items start */} 
                <Textarea 
                  id="generatedNegativePrompt" 
                  value={generatedNegativePrompt} 
                  readOnly 
                  rows={4} // Increased rows slightly
                  className="flex-grow bg-muted/50 resize-none" 
                  placeholder="No negative prompts entered."
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleCopyNegativePrompt} 
                  title="Copy Negative Prompt"
                  disabled={!generatedNegativePrompt} // Disable if empty
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Existing Prompt Database Section --- */}
      <div> { /* Added wrapper div */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Prompt Database</h1>
          <SavePromptDialog onSuccess={triggerRefresh} />
        </div>
        {isLoading ? (
          <p>Loading prompts...</p> // Add a loading state
        ) : fetchError ? (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
            <p>Error loading prompts: {fetchError}</p>
          </div>
        ) : (
          <PromptsDataTable columns={columns} data={prompts} />
        )}
      </div>
    </main>
  );
} 