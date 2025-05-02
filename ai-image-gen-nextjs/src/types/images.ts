// src/types/images.ts

// Define the expected shape of an image object from Supabase
// Used in gallery page and detail modal
export interface ImageRecord {
    id: number;
    image_url: string;
    provider?: string | null; 
    model?: string | null;
    width?: number | null;
    height?: number | null;
    prompt_text?: string | null;
    negative_prompt?: string | null;
    seed?: number | null;
    created_at?: string;
    style?: string | null;
    steps?: number | null;
    guidance_scale?: number | null;
} 