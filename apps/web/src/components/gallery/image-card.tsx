"use client";

import { type GalleryImage } from "@/store/galleryStore";
import { Heart } from "lucide-react";

interface ImageCardProps {
  image: GalleryImage;
  onClick: () => void;
}

export function ImageCard({ image, onClick }: ImageCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      <img
        src={image.url}
        alt={image.prompt || "Generated image"}
        className="w-full h-auto object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all">
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {image.prompt && (
            <p className="text-white text-sm truncate">{image.prompt}</p>
          )}
        </div>
        
        {image.isFavorite && (
          <div className="absolute top-2 right-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          </div>
        )}
      </div>
    </div>
  );
}
