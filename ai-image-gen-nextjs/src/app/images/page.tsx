"use client"; // <-- Add this directive

import { useState, useEffect } from 'react'; // Import hooks
import { supabase } from "@/lib/supabase/client"; // Using client for consistency
import Image from 'next/image'; // Use Next.js Image component for optimization
import { ImageDetailModal } from '@/components/images/image-detail-modal'; // Import the modal component

// Define the expected shape of an image object from Supabase
interface ImageRecord {
    id: number;
    image_url: string;
    provider: string;
    width: number;
    height: number;
    prompt_text?: string | null;
    negative_prompt?: string | null;
    model?: string | null;
    seed?: number | null;
    created_at?: string;
    // Add other relevant fields from your 'images' table here
}

// Async function to fetch images from Supabase
async function getImages(): Promise<{ images: ImageRecord[] | null; error: string | null }> {
    console.log("Fetching images from Supabase...");
    try {
        // Select additional metadata columns
        const columnsToSelect = 'id, image_url, prompt_text, negative_prompt, model, provider, width, height, seed, created_at';
        console.log(`Selecting columns: ${columnsToSelect}`);

        const { data, error } = await supabase
            .from('images') // Target the 'images' table
            .select(columnsToSelect) // Fetch specified columns
            .order('created_at', { ascending: false }); // Example: newest first

        if (error) {
            console.error("Supabase fetch error (images):", error);
            if (error.code === '42P01') { // Table doesn't exist
                 return { images: null, error: "Database Error: The 'images' table was not found." };
            }
             if (error.code === '42501') { // RLS error
                 return { images: null, error: `Database Permission Error: ${error.message}. Ensure RLS allows reads on 'images'.` };
             }
             if (error.code === '42703') { // Column doesn't exist
                 return { images: null, error: `Database Error: One or more requested columns (e.g., prompt_text, negative_prompt, model_used, seed) do not exist in the 'images' table. ${error.message}` };
             }
            return { images: null, error: `Database Error: ${error.message}` };
        }

        // Explicitly check for null data before asserting type
        if (!data) {
            console.log("Supabase returned null data, returning empty array.");
            return { images: [], error: null }; // Return empty array instead of null
        }

        console.log(`Fetched ${data.length} images with extended metadata.`);
        // Use a less strict type assertion to bypass the linter warning
        // This assumes the selected columns DO exist in the database table.
        return { images: data as any as ImageRecord[], error: null };
    } catch (e: any) {
        console.error("Unexpected error fetching images:", e);
        return { images: null, error: `An unexpected error occurred: ${e.message}` };
    }
}

// The Page component (Server Component by default)
export default function ImagesPage() {
    // State for loading, images, errors, and the selected image for modal
    const [images, setImages] = useState<ImageRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);

    // Fetch images on component mount
    useEffect(() => {
        async function fetchImages() {
            setIsLoading(true);
            setError(null);
            console.log("Fetching images from Supabase (Client Component)...");
            try {
                const columnsToSelect = 'id, image_url, prompt_text, negative_prompt, model, provider, width, height, seed, created_at';
                const { data, error: dbError } = await supabase
                    .from('images')
                    .select(columnsToSelect)
                    .order('created_at', { ascending: false });

                if (dbError) {
                    console.error("Supabase fetch error object:", JSON.stringify(dbError, null, 2));
                    console.error("Error message:", dbError.message);
                    console.error("Error code:", dbError.code);
                    console.error("Error details:", dbError.details);
                    console.error("Error hint:", dbError.hint);
                    let errorMessage = `Database Error: ${dbError.message || 'Unknown error'}`;
                    if (dbError.code === '42P01') { errorMessage = "Database Error: The 'images' table was not found."; }
                    if (dbError.code === '42501') { errorMessage = `Database Permission Error: ${dbError.message}. Ensure RLS allows reads on 'images'.`; }
                    if (dbError.code === '42703') { errorMessage = `Database Error: One or more requested columns do not exist in the 'images' table. ${dbError.message}`; }
                    throw new Error(errorMessage);
                }

                if (!data) {
                     console.log("Supabase returned null data.");
                     setImages([]);
                } else {
                     console.log(`Fetched ${data.length} images with extended metadata.`);
                     if (data.length > 0) {
                         console.log("***** DEBUG: Data for first image from Supabase: *****", JSON.stringify(data[0], null, 2));
                     }
                     setImages(data as ImageRecord[]);
                }

            } catch (e: any) {
                console.error("Unexpected error fetching images:", e);
                setError(`An unexpected error occurred: ${e.message}`);
                setImages([]); // Clear images on error
            } finally {
                setIsLoading(false);
            }
        }

        fetchImages();
    }, []); // Empty dependency array means run once on mount

    // Function to open the modal
    const handleImageClick = (image: ImageRecord) => {
        setSelectedImage(image);
    };

    // Function to close the modal
    const handleCloseModal = () => {
        setSelectedImage(null);
    };

    // --- Render Logic --- 
    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Generated Images</h1>

            {/* Loading State */} 
            {isLoading && (
                 <div className="text-center py-10">
                     <p>Loading images...</p>
                     {/* Optional: Add a spinner component */}
                 </div>
            )}

            {/* Error Display */} 
            {!isLoading && error && (
                 <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-6">
                    <p>{error}</p>
                </div>
            )}

            {/* No Images Found */} 
            {!isLoading && !error && images.length === 0 && (
                <div className="w-full bg-muted p-8 rounded-lg text-center">
                    <p className="text-muted-foreground">No images found in the database yet.</p>
                 </div>
            )}

            {/* Image Grid */} 
            {!isLoading && !error && images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                        // Make the container clickable
                        <div key={image.id} 
                             className="border rounded-lg overflow-hidden shadow-lg group relative cursor-pointer" 
                             onClick={() => handleImageClick(image)} // Attach click handler
                        >
                            <div className="relative w-full aspect-square"> 
                                <Image
                                    src={image.image_url}
                                    alt={image.prompt_text || `Generated image ${image.id}`}
                                    layout="fill"
                                    objectFit="cover"
                                    className="transition-transform duration-300 group-hover:scale-105"
                                    // Add placeholder/blurDataURL if desired
                                />
                            </div>
                            {/* Subtle overlay/text on hover (optional) */}
                             <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                 <p className="text-white text-xs truncate" title={image.prompt_text || ''}> 
                                     {image.prompt_text || 'No prompt'} 
                                 </p> 
                             </div> 
                       </div>
                    ))}
                </div>
            )}

            {/* --- Render the Modal --- */}
            <ImageDetailModal image={selectedImage} onClose={handleCloseModal} /> 

        </main>
    );
} 