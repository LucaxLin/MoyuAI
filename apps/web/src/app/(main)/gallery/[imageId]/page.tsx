import { ImageDetailPage } from "@/components/gallery/image-detail-page";

interface ImageDetailPageProps {
  params: {
    imageId: string;
  };
}

export default function GalleryImagePage({ params }: ImageDetailPageProps) {
  return <ImageDetailPage imageId={params.imageId} />;
}
