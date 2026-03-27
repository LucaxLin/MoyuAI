"use client";

import { useGallery } from "@/hooks/useGallery";
import { useEffect } from "react";
import { ImageDetailPage } from "@/components/gallery/image-detail-page";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{
    imageId: string;
  }>;
}

export default function ImageDetail({ params }: PageProps) {
  const router = useRouter();
  const { fetchImage } = useGallery();

  useEffect(() => {
    params.then(({ imageId }) => {
      fetchImage(imageId);
    });
  }, [params, fetchImage]);

  return <ImageDetailPageWrapper params={params} onBack={() => router.push("/gallery")} />;
}

function ImageDetailPageWrapper({ params, onBack }: { params: Promise<{ imageId: string }>; onBack: () => void }) {
  const [imageId, setImageId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ imageId }) => setImageId(imageId));
  }, [params]);

  if (!imageId) return null;

  return <ImageDetailPage imageId={imageId} onBack={onBack} />;
}

import { useState } from "react";
