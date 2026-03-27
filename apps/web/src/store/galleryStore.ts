import { create } from "zustand";

export interface GalleryImage {
  id: string;
  url: string;
  prompt?: string | null;
  width?: number | null;
  height?: number | null;
  isFavorite: boolean;
  createdAt: string;
}

interface GalleryState {
  images: GalleryImage[];
  currentImage: GalleryImage | null;
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  filter: string;
  sort: string;
  setImages: (images: GalleryImage[]) => void;
  addImages: (images: GalleryImage[]) => void;
  setCurrentImage: (image: GalleryImage | null) => void;
  updateImage: (id: string, data: Partial<GalleryImage>) => void;
  removeImage: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setFilter: (filter: string) => void;
  setSort: (sort: string) => void;
  reset: () => void;
}

const initialState = {
  images: [],
  currentImage: null,
  isLoading: false,
  page: 1,
  hasMore: true,
  filter: "",
  sort: "desc",
};

export const useGalleryStore = create<GalleryState>()((set) => ({
  ...initialState,
  setImages: (images) => set({ images }),
  addImages: (newImages) =>
    set((state) => ({
      images: [...state.images, ...newImages],
    })),
  setCurrentImage: (currentImage) => set({ currentImage }),
  updateImage: (id, data) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...data } : img
      ),
      currentImage:
        state.currentImage?.id === id
          ? { ...state.currentImage, ...data }
          : state.currentImage,
    })),
  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
      currentImage:
        state.currentImage?.id === id ? null : state.currentImage,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  reset: () => set(initialState),
}));
