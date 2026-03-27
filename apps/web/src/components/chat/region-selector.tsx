"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Undo, X } from "lucide-react";

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RegionSelectorProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onConfirm: (region: Region) => void;
  onCancel: () => void;
}

export function RegionSelector({
  imageUrl,
  imageWidth,
  imageHeight,
  onConfirm,
  onCancel,
}: RegionSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDisplaySize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDisplaySize({ width: rect.width, height: rect.height });
      }
    };

    updateDisplaySize();
    window.addEventListener("resize", updateDisplaySize);
    return () => window.removeEventListener("resize", updateDisplaySize);
  }, []);

  const getNormalizedCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
      };
    },
    []
  );

  const getRegionFromPoints = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }): Region => {
      return {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      };
    },
    []
  );

  const minRegionSize = 0.1;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const coords = getNormalizedCoords(e.clientX, e.clientY);
      setIsDrawing(true);
      setStartPoint(coords);
      setCurrentRegion({
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
      });
    },
    [getNormalizedCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !startPoint) return;
      const coords = getNormalizedCoords(e.clientX, e.clientY);
      setCurrentRegion(getRegionFromPoints(startPoint, coords));
    },
    [isDrawing, startPoint, getNormalizedCoords, getRegionFromPoints]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentRegion) return;
    setIsDrawing(false);

    if (
      currentRegion.width >= minRegionSize &&
      currentRegion.height >= minRegionSize
    ) {
      setRegions((prev) => [...prev, currentRegion]);
    }
    setCurrentRegion(null);
    setStartPoint(null);
  }, [isDrawing, currentRegion]);

  const handleUndo = useCallback(() => {
    setRegions((prev) => prev.slice(0, -1));
  }, []);

  const handleConfirm = useCallback(() => {
    if (regions.length > 0) {
      onConfirm(regions[regions.length - 1]);
    }
  }, [regions, onConfirm]);

  const toPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            选择编辑区域
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          在图片上拖动鼠标选择要编辑的区域（至少选择图片的10%）
        </p>

        <div
          ref={containerRef}
          className="relative cursor-crosshair select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Select region"
            className="w-full h-auto"
            draggable={false}
          />

          {regions.map((region, index) => (
            <div
              key={index}
              className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20"
              style={{
                left: toPercent(region.x),
                top: toPercent(region.y),
                width: toPercent(region.width),
                height: toPercent(region.height),
              }}
            />
          ))}

          {currentRegion && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/30"
              style={{
                left: toPercent(currentRegion.x),
                top: toPercent(currentRegion.y),
                width: toPercent(currentRegion.width),
                height: toPercent(currentRegion.height),
              }}
            />
          )}
        </div>

        {regions.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            已选择 {regions.length} 个区域
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleUndo}
            disabled={regions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Undo className="w-4 h-4" />
            撤销
          </button>

          <div className="flex-1" />

          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            取消
          </button>

          <button
            onClick={handleConfirm}
            disabled={regions.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            确认编辑
          </button>
        </div>
      </div>
    </div>
  );
}
