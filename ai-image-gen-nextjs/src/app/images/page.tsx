"use client"; // <-- Add this directive

import { useState, useEffect } from 'react'; // Import hooks
import { supabase } from "@/lib/supabase/client"; // Using client for consistency
import Image from 'next/image'; // Use Next.js Image component for optimization
import { ImageDetailModal } from '@/components/images/image-detail-modal'; // Import the modal component
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import definitions from generate page to populate filters
import { availableProvidersDisplay, availableStyles } from '@/app/generate/constants'; // Corrected import path
import { ImageRecord } from '@/types/images'; // <-- Import shared type

// Define Generic Providers for Filtering
const genericProviders = [
  { key: "all", name: "All Providers" },
  { key: "OpenAI", name: "OpenAI" },
  { key: "Together AI", name: "Together AI" },
  { key: "Replicate", name: "Replicate" },
];

// Extract Model list for filtering (can be refined later)
const allModels = Object.entries(availableProvidersDisplay).map(([key, value]) => ({ key: key, name: value.name }));

// The Page component (Server Component by default)
export default function ImagesPage() {
    // State for loading, images, errors, and the selected image for modal
    const [images, setImages] = useState<ImageRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);

    // --- State for Filters and Sorting ---
    const [filterProvider, setFilterProvider] = useState<string>("all");
    const [filterModel, setFilterModel] = useState<string>("all"); // New state for model filter
    const [filterStyle, setFilterStyle] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<string>("newest");

    // Fetch images on component mount (or when filters/sort change)
    useEffect(() => {
        async function fetchImages() {
            setIsLoading(true);
            setError(null);
            console.log(`Fetching images (Provider: ${filterProvider}, Model: ${filterModel}, Style: ${filterStyle}, Sort: ${sortOrder})...`); // Log new filter
            try {
                const columnsToSelect = 'id, image_url, prompt_text, negative_prompt, model, provider, width, height, seed, created_at, style';
                
                let query = supabase.from('images').select(columnsToSelect);

                // Apply filters
                if (filterProvider !== "all") {
                    query = query.eq('provider', filterProvider);
                }
                 if (filterModel !== "all") { 
                    query = query.eq('model', filterModel); // Filter by model column
                }
                if (filterStyle !== "all") {
                    query = query.eq('style', filterStyle);
                }

                // Apply sorting
                query = query.order('created_at', { ascending: sortOrder === 'oldest' });

                const { data, error: dbError } = await query;

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

            } catch (e: unknown) {
                console.error("Unexpected error fetching images:", e);
                const message = e instanceof Error ? e.message : String(e);
                setError(`An unexpected error occurred: ${message}`);
                setImages([]); // Clear images on error
            } finally {
                setIsLoading(false);
            }
        }

        fetchImages();
    }, [filterProvider, filterModel, filterStyle, sortOrder]); // Add filterModel to dependencies

    // Function to open the modal
    const handleImageClick = (image: ImageRecord) => {
        setSelectedImage(image);
    };

    // Function to close the modal
    const handleCloseModal = () => {
        setSelectedImage(null);
    };

    // Helper function to get public URL safely
    const getImageUrl = (imagePath: string | null): string => {
        if (!imagePath) {
            return '/placeholder.png'; // Default placeholder
        }
        // Check if it's already a full URL (e.g., from Replicate before change, or potentially Base64 during transition)
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
            // console.warn(`Image URL is not a storage path: ${imagePath}`); // Optional warning
            return imagePath; // Return as is, but ideally this shouldn't happen long term
        }
        try {
            const { data } = supabase.storage.from('images').getPublicUrl(imagePath);
            if (!data?.publicUrl) {
                 console.error(`Could not get public URL for path: ${imagePath}`);
                 return '/placeholder.png'; // Fallback on error
            }
            return data.publicUrl;
        } catch (e) {
            console.error(`Error getting public URL for ${imagePath}:`, e);
            return '/placeholder.png';
        }
    };

    // --- Render Logic --- 
    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Generated Images</h1>

            {/* --- Filter and Sort Controls --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50"> {/* Adjusted grid columns */} 
                 {/* Provider Filter */} 
                 <div className="space-y-1">
                    <Label htmlFor="filter-provider">Provider</Label>
                     <Select value={filterProvider} onValueChange={setFilterProvider}> 
                        <SelectTrigger id="filter-provider">
                            <SelectValue placeholder="Filter by provider..." />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Use genericProviders list */}
                            {genericProviders.map((p) => (
                                <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                 {/* Model Filter */} 
                 <div className="space-y-1">
                    <Label htmlFor="filter-model">Model</Label>
                     <Select value={filterModel} onValueChange={setFilterModel}> 
                        <SelectTrigger id="filter-model">
                            <SelectValue placeholder="Filter by model..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Models</SelectItem>
                            {/* Populate from allModels list - TODO: filter by provider? */} 
                            {allModels.map((m) => (
                                <SelectItem key={m.key} value={m.key}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                 {/* Style Filter */} 
                 <div className="space-y-1">
                    <Label htmlFor="filter-style">Style</Label>
                     <Select value={filterStyle} onValueChange={setFilterStyle}> 
                        <SelectTrigger id="filter-style">
                            <SelectValue placeholder="Filter by style..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Styles</SelectItem>
                             {/* Add "None" option if needed */}
                             {/* <SelectItem value="none">None</SelectItem> */} 
                            {/* Populate from availableStyles */} 
                            {availableStyles.map((style) => (
                                <SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                 {/* Sort Order */} 
                 <div className="space-y-1">
                    <Label htmlFor="sort-order">Sort By</Label>
                     <Select value={sortOrder} onValueChange={setSortOrder}> 
                        <SelectTrigger id="sort-order">
                            <SelectValue placeholder="Sort order..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                             {/* Add other sort options later if needed (e.g., by prompt) */} 
                        </SelectContent>
                    </Select>
                </div>
            </div>

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
                <div className="text-center py-10">
                    <p>No images found matching your criteria.</p>
                </div>
            )}

            {/* Image Grid */} 
            {!isLoading && !error && images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            className="group relative cursor-pointer aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            onClick={() => handleImageClick(image)}
                        >
                            <Image
                                src={getImageUrl(image.image_url)}
                                alt={image.prompt_text ?? 'Generated image'}
                                width={300}
                                height={300}
                                className="object-cover w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-105"
                                priority={false}
                                onError={(e) => {
                                    console.warn(`Failed to load image: ${getImageUrl(image.image_url)}`);
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Image Details */}
            {selectedImage && (
                <ImageDetailModal
                    image={selectedImage}
                    isOpen={!!selectedImage}
                    onClose={handleCloseModal}
                    imageUrl={getImageUrl(selectedImage.image_url)}
                />
            )}

        </main>
    );
} 