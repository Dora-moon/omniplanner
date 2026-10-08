// src/controllers/useDashboardLayout.ts
// Controller hook managing react-grid-layout dashboard state and debounced Firestore persistence.

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  getDashboardGrid,
  getDashboardLayout,
  saveDashboardGrid,
  resetDashboardLayout,
} from '@/models/layout.model';
import {
  DEFAULT_DASHBOARD_GRID,
  type DashboardBlockId,
  type DashboardLayoutItem,
} from '@/types';

const ALL_BLOCKS: DashboardBlockId[] = [
  'banner',
  'tasks',
  'companion_mini',
  'calendar',
  'timer',
  'stats',
  'music',
  'quote',
];

const DEFAULT_VISIBILITY: Record<DashboardBlockId, boolean> = {
  banner: true,
  tasks: true,
  companion_mini: true,
  calendar: true,
  timer: true,
  stats: true,
  music: true,
  quote: true,
};

export function useDashboardLayout({ uid }: { uid: string }) {
  const [grid, setGrid] = useState<DashboardLayoutItem[]>(DEFAULT_DASHBOARD_GRID);
  const [visibleBlocks, setVisibleBlocks] = useState<Record<DashboardBlockId, boolean>>(DEFAULT_VISIBILITY);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Debounce timer reference
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestGridRef = useRef<DashboardLayoutItem[]>(grid);
  latestGridRef.current = grid;
  const latestVisibilityRef = useRef<Record<DashboardBlockId, boolean>>(visibleBlocks);
  latestVisibilityRef.current = visibleBlocks;

  // Load layout on initial mount or when uid changes
  useEffect(() => {
    if (!uid) {
      setGrid(DEFAULT_DASHBOARD_GRID);
      setVisibleBlocks(DEFAULT_VISIBILITY);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    Promise.all([getDashboardGrid(uid), getDashboardLayout(uid)])
      .then(([savedGrid, savedLayout]) => {
        if (!active) return;
        if (Array.isArray(savedGrid) && savedGrid.length > 0) {
          // Merge with DEFAULT_DASHBOARD_GRID to guarantee all blocks exist
          const existingIds = new Set(savedGrid.map((i) => i.i));
          const missing = DEFAULT_DASHBOARD_GRID.filter((i) => !existingIds.has(i.i));
          setGrid([...savedGrid, ...missing]);
        } else {
          setGrid(DEFAULT_DASHBOARD_GRID);
        }

        if (Array.isArray(savedLayout) && savedLayout.length > 0) {
          const visMap: Record<DashboardBlockId, boolean> = { ...DEFAULT_VISIBILITY };
          savedLayout.forEach((item) => {
            if (item.id in visMap) {
              visMap[item.id] = item.visible;
            }
          });
          setVisibleBlocks(visMap);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard layout:', err);
        if (active) {
          setGrid(DEFAULT_DASHBOARD_GRID);
          setVisibleBlocks(DEFAULT_VISIBILITY);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [uid]);

  // Persist with debounce
  const debouncedSave = useCallback(
    (newGrid: DashboardLayoutItem[], newVisibility?: Record<DashboardBlockId, boolean>) => {
      if (!uid) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setIsSaving(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const vis = newVisibility ?? latestVisibilityRef.current;
          await saveDashboardGrid(uid, newGrid, vis);
        } catch (err) {
          console.error('Failed to save dashboard grid:', err);
        } finally {
          setIsSaving(false);
        }
      }, 700); // 700ms debounce
    },
    [uid]
  );

  // Called by react-grid-layout onLayoutChange
  const handleLayoutChange = useCallback(
    (currentLayout: readonly any[]) => {
      // Map back to our DashboardLayoutItem schema
      const mapped: DashboardLayoutItem[] = currentLayout.map((item) => ({
        i: item.i as DashboardBlockId,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }));

      // Check if actually changed to avoid spurious writes
      const prev = latestGridRef.current;
      const hasChanged = mapped.some((m) => {
        const p = prev.find((x) => x.i === m.i);
        return !p || p.x !== m.x || p.y !== m.y || p.w !== m.w || p.h !== m.h;
      });

      if (hasChanged) {
        // Merge with existing blocks that might have been hidden/unmounted
        const mappedIds = new Set(mapped.map((m) => m.i));
        const unrendered = prev.filter((p) => !mappedIds.has(p.i));
        const fullGrid = [...mapped, ...unrendered];

        setGrid(fullGrid);
        latestGridRef.current = fullGrid;
        debouncedSave(fullGrid);
      }
    },
    [debouncedSave]
  );

  // Toggle visibility of a block
  const toggleBlockVisibility = useCallback(
    (id: DashboardBlockId) => {
      setVisibleBlocks((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        latestVisibilityRef.current = next;
        debouncedSave(latestGridRef.current, next);
        return next;
      });
    },
    [debouncedSave]
  );

  const isBlockVisible = useCallback(
    (id: DashboardBlockId) => {
      return visibleBlocks[id] !== false;
    },
    [visibleBlocks]
  );

  // Reset to default layout
  const handleReset = useCallback(async () => {
    if (!uid) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setGrid(DEFAULT_DASHBOARD_GRID);
    setVisibleBlocks(DEFAULT_VISIBILITY);
    latestGridRef.current = DEFAULT_DASHBOARD_GRID;
    latestVisibilityRef.current = DEFAULT_VISIBILITY;
    setIsSaving(true);
    try {
      await resetDashboardLayout(uid);
    } catch (err) {
      console.error('Failed to reset dashboard grid:', err);
    } finally {
      setIsSaving(false);
    }
  }, [uid]);

  return {
    grid,
    setGrid,
    visibleBlocks,
    toggleBlockVisibility,
    isBlockVisible,
    loading,
    isSaving,
    handleLayoutChange,
    handleReset,
  };
}
