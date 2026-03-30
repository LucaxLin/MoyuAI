"use client";

import { type GalleryImage } from "@/store/galleryStore";
import { Heart } from "lucide-react";
import { getBlobProxyUrl } from "@/lib/blob-utils";

interface ImageCardProps {
  image: GalleryImage;
  onClick: () => void;
}

export function ImageCard({ image, onClick }: ImageCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer overflow-hidden rounded-xl bg-muted dark:bg-muted"
    >
      <img
        src={getBlobProxyUrl(image.url)}
        alt={image.prompt || "Generated image"}
        className="w-full h-auto object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all">
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {image.prompt && (
            <p className="text-white text-sm truncate">{image.prompt}</p>
          )}
        </div>
        
        {image.isFavorite && (
          <div className="absolute top-2 right-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
          </div>
        )}
      </div>
    </div>
  );
}
