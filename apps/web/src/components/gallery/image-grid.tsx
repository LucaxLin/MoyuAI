"use client";

import { type GalleryImage } from "@/store/galleryStore";
import { ImageCard } from "./image-card";

interface ImageGridProps {
  images: GalleryImage[];
  onImageClick: (imageId: string) => void;
}

export function ImageGrid({ images, onImageClick }: ImageGridProps) {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {images.map((image) => (
        <div key={image.id} className="break-inside-avoid">
          <ImageCard image={image} onClick={() => onImageClick(image.id)} />
        </div>
      ))}
    </div>
  );
}
