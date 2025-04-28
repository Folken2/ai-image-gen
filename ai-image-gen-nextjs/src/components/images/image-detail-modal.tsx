import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DownloadIcon, XIcon } from 'lucide-react';

// Re-use the ImageRecord type or define it if not globally available
// If defined elsewhere (e.g., in the page), import it
interface ImageRecord {
    id: number;
    image_url: string;
    prompt_text?: string | null;
    negative_prompt?: string | null;
    model?: string | null;
    seed?: number | null;
    created_at?: string;
    // Include provider, width, height if needed from page.tsx changes
    provider?: string; 
    width?: number;
    height?: number;
}

interface ImageDetailModalProps {
    image: ImageRecord | null; // Image can be null initially
    onClose: () => void;
}

export function ImageDetailModal({ image, onClose }: ImageDetailModalProps) {
    if (!image) return null; // Don't render if no image is selected

    // Function to handle download
    const handleDownload = async () => {
        if (!image.image_url) return;
        try {
            // Fetch the image as a blob
            const response = await fetch(image.image_url);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            // Suggest a filename (e.g., based on ID or prompt)
            const filename = `image_${image.id}.${blob.type.split('/')[1] || 'png'}`;
            link.download = filename;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error("Error downloading image:", error);
            // Optionally show an error message to the user
            alert("Failed to download image.");
        }
    };

    // Helper to format date (optional)
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString; // Return original if parsing fails
        }
    };

    return (
        <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}> 
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col sm:flex-row p-0 gap-0"> 
                {/* Image Section */} 
                <div className="w-full sm:w-1/2 md:w-2/3 flex-shrink-0 bg-muted flex items-center justify-center p-4 relative"> 
                    <Image
                        src={image.image_url}
                        alt={image.prompt_text || `Generated image ${image.id}`}
                        width={image.width || 800} // Use actual width if available
                        height={image.height || 800} // Use actual height if available
                        objectFit="contain"
                        className="max-w-full max-h-[80vh] rounded-md"
                    />
                </div>

                {/* Metadata Section */} 
                <div className="w-full sm:w-1/2 md:w-1/3 flex flex-col"> 
                    <DialogHeader className="p-4 border-b"> 
                        <DialogTitle>Image Details</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-grow p-4"> 
                        <div className="space-y-3 text-sm"> 
                            {/* Display Metadata - adjust keys/labels as needed */}
                            {image.prompt_text && (
                                <div>
                                    <strong className="block font-medium">Prompt:</strong>
                                    <p className="text-muted-foreground break-words">{image.prompt_text}</p>
                                </div>
                            )}
                           
                            {image.model && (
                                <div>
                                    <strong className="block font-medium">Model:</strong>
                                    <p className="text-muted-foreground">{image.model}</p>
                                </div>
                            )}
                            {image.provider && (
                                <div>
                                    <strong className="block font-medium">Provider:</strong>
                                    <p className="text-muted-foreground">{image.provider}</p>
                                </div>
                            )}
                            {image.width && image.height && (
                                <div>
                                    <strong className="block font-medium">Dimensions:</strong>
                                    <p className="text-muted-foreground">{`${image.width} x ${image.height}`}</p>
                                </div>
                            )}
                            {image.seed !== null && image.seed !== undefined && (
                                <div>
                                    <strong className="block font-medium">Seed:</strong>
                                    <p className="text-muted-foreground">{image.seed}</p>
                                </div>
                            )}
                            <div>
                                <strong className="block font-medium">Created At:</strong>
                                <p className="text-muted-foreground">{formatDate(image.created_at)}</p>
                            </div>
                            <div>
                                <strong className="block font-medium">ID:</strong>
                                <p className="text-muted-foreground">{image.id}</p>
                            </div>
                             {/* Add more fields if needed */}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="p-4 border-t mt-auto"> 
                        <Button onClick={handleDownload} variant="default" size="sm">
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                         {/* Close button can be removed if using DialogClose */} 
                         {/* <Button onClick={onClose} variant="outline" size="sm">Close</Button> */}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
} 