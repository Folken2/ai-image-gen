'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Helper to safely access sessionStorage (avoids SSR issues)
const getSessionItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(key);
  }
  return null;
};

// Helper to safely set sessionStorage item
const setSessionItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(key, value);
  }
};

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [togetheraiKey, setTogetheraiKey] = useState<string>('');
  
  // Load keys from sessionStorage on component mount
  useEffect(() => {
    const savedOpenaiKey = getSessionItem('openai_api_key');
    const savedTogetheraiKey = getSessionItem('togetherai_api_key');
    
    if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
    if (savedTogetheraiKey) setTogetheraiKey(savedTogetheraiKey);
  }, []);

  const handleSaveKeys = () => {
    // Save keys to sessionStorage (not localStorage to avoid persistence)
    setSessionItem('openai_api_key', openaiKey);
    setSessionItem('togetherai_api_key', togetheraiKey);
    
    // Notify user
    toast.success("API Keys Saved", {
      description: "Your API keys have been saved for this session only.",
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Enter your API keys for paid model access. These keys are stored in session storage only and will be deleted when you close the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
              />
              <p className="text-sm text-muted-foreground">
                Required for accessing OpenAI GPT-4o Vision model.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="togetherai-key">TogetherAI API Key</Label>
              <Input
                id="togetherai-key"
                type="password"
                value={togetheraiKey}
                onChange={(e) => setTogetheraiKey(e.target.value)}
                placeholder="..."
              />
              <p className="text-sm text-muted-foreground">
                Required for accessing paid TogetherAI models. For the free Flux Schnell model, you can provide your own key or use the server's key if available.
              </p>
            </div>
            
            <Button onClick={handleSaveKeys}>Save Keys</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>About API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            <strong>Important:</strong> Your API keys are stored only in your browser's session storage. 
            They will be automatically deleted when you close this tab or browser.
          </p>
          <p className="text-sm mt-2">
            Your keys are never sent to our servers except when making direct API calls to the 
            respective services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 