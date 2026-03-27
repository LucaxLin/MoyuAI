"use client";

import { useCallback } from "react";
import { useGalleryStore, type GalleryImage } from "@/store/galleryStore";
import { imageApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export function useGallery() {
  const {
    images,
    currentImage,
    isLoading,
    page,
    hasMore,
    filter,
    sort,
    setImages,
    addImages,
    setCurrentImage,
    updateImage,
    removeImage,
    setLoading,
    setPage,
    setHasMore,
    setFilter,
    setSort,
  } = useGalleryStore();

  const fetchImages = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      
      const result = await imageApi.list({
        page: currentPage,
        limit: 20,
        filter,
        sort,
      });
      
      if (result.success && result.data) {
        const newImages = result.data.images as GalleryImage[];
        const pagination = result.data.pagination as {
          hasMore: boolean;
          total: number;
        };
        
        if (reset) {
          setImages(newImages);
        } else {
          addImages(newImages);
        }
        
        setHasMore(pagination.hasMore);
        if (pagination.hasMore) {
          setPage(currentPage + 1);
        }
      }
    } catch (error) {
      toast.error("获取图片列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, filter, sort, setImages, addImages, setLoading, setPage, setHasMore]);

  const fetchImage = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const result = await imageApi.get(id);
      
      if (result.success && result.data?.image) {
        setCurrentImage(result.data.image as GalleryImage);
        return { success: true };
      } else {
        toast.error(result.error?.message || "获取图片失败");
        return { success: false };
      }
    } catch (error) {
      toast.error("获取图片失败");
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [setCurrentImage, setLoading]);

  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const result = await imageApi.toggleFavorite(id);
      
      if (result.success && result.data?.image) {
        updateImage(id, { isFavorite: (result.data.image as GalleryImage).isFavorite });
        toast.success("操作成功");
        return { success: true };
      } else {
        toast.error(result.error?.message || "操作失败");
        return { success: false };
      }
    } catch (error) {
      toast.error("操作失败");
      return { success: false };
    }
  }, [updateImage]);

  const deleteImage = useCallback(async (id: string) => {
    try {
      const result = await imageApi.delete(id);
      
      if (result.success) {
        removeImage(id);
        toast.success("删除成功");
        return { success: true };
      } else {
        toast.error(result.error?.message || "删除失败");
        return { success: false };
      }
    } catch (error) {
      toast.error("删除失败");
      return { success: false };
    }
  }, [removeImage]);

  const updateFilter = useCallback((newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
    setHasMore(true);
  }, [setFilter, setPage, setHasMore]);

  const updateSort = useCallback((newSort: string) => {
    setSort(newSort);
    setPage(1);
    setHasMore(true);
  }, [setSort, setPage, setHasMore]);

  return {
    images,
    currentImage,
    isLoading,
    hasMore,
    fetchImages,
    fetchImage,
    toggleFavorite,
    deleteImage,
    updateFilter,
    updateSort,
    setCurrentImage,
    reset: () => {
      setImages([]);
      setPage(1);
      setHasMore(true);
    },
  };
}
