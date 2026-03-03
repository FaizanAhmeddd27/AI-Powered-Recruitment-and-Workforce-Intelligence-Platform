import { useState, useEffect, useRef, useCallback } from "react";

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  totalItems: number;
  overscan?: number;
}

export function useVirtualScroll({
  itemHeight,
  containerHeight,
  totalItems,
  overscan = 3,
}: UseVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      index: i,
      offsetY: i * itemHeight,
    });
  }

  const totalHeight = totalItems * itemHeight;

  return {
    containerRef,
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
  };
}