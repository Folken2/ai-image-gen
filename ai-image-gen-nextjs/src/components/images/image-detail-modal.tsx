import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DownloadIcon, XIcon } from 'lucide-react';
import { ImageRecord } from '@/types/images'; // <-- Import shared type

// // Re-use the ImageRecord type or define it if not globally available (REMOVED)
// // If defined elsewhere (e.g., in the page), import it
// interface ImageRecord {
//     id: number;
//     image_url: string;
//     prompt_text?: string | null;
//     negative_prompt?: string | null;
//     model?: string | null;
//     seed?: number | null;
//     created_at?: string;
//     provider?: string; 
//     width?: number;
//     height?: number;
//     style?: string | null;
//     steps?: number | null;
//     guidance_scale?: number | null;
// }

interface ImageDetailModalProps {
    image: ImageRecord; // Assume image is provided when open
    isOpen: boolean; // Control visibility explicitly
    imageUrl: string; // Pass the constructed public URL
    onClose: () => void;
}

export function ImageDetailModal({ image, isOpen, imageUrl, onClose }: ImageDetailModalProps) {
    // if (!image) return null; // Don't render if no image is selected

    // Function to handle download
    const handleDownload = async () => {
        if (!imageUrl || imageUrl === '/placeholder.png') return;
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            const filename = `image_${image.id}.${blob.type.split('/')[1] || 'png'}`;
            link.download = filename;

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error("Error downloading image:", error);
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col gap-0 p-4">
                <div className="w-full flex-shrink-0 bg-muted flex items-center justify-center relative border-b mb-4 mt-6 rounded-lg overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={image.prompt_text || `Generated image ${image.id}`}
                        width={image.width || 1024}
                        height={image.height || 1024}
                        style={{ objectFit: "contain" }}
                        className="max-w-full max-h-[55vh]"
                        onError={(e) => {
                            console.error(`Failed to load image in modal: ${imageUrl}`);
                        }}
                    />
                </div>

                <div className="w-full flex flex-col flex-grow overflow-hidden">
                    <DialogHeader className="border-b flex-shrink-0 pb-2 mb-2">
                        <DialogTitle>Image Details</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-grow overflow-y-auto pr-2">
                        <div className="space-y-3 text-sm">
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
                            {image.style && (
                                <div>
                                    <strong className="block font-medium">Style:</strong>
                                    <p className="text-muted-foreground">{image.style}</p>
                                </div>
                            )}
                            {image.steps !== null && image.steps !== undefined && (
                                <div>
                                    <strong className="block font-medium">Steps:</strong>
                                    <p className="text-muted-foreground">{image.steps}</p>
                                </div>
                            )}
                            {image.guidance_scale !== null && image.guidance_scale !== undefined && (
                                <div>
                                    <strong className="block font-medium">Guidance Scale:</strong>
                                    <p className="text-muted-foreground">{image.guidance_scale}</p>
                                </div>
                            )}
                            {image.negative_prompt && (
                                <div>
                                    <strong className="block font-medium">Negative Prompt:</strong>
                                    <p className="text-muted-foreground break-words">{image.negative_prompt}</p>
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
                        </div>
                    </ScrollArea>
                    <DialogFooter className="border-t flex-shrink-0 pt-2 mt-2">
                        <Button onClick={handleDownload} variant="default" size="sm">
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
} 