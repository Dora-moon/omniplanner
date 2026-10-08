// src/models/layout.model.ts
// Data access layer (Model) for dashboard layout arrangement and block visibility in Firestore.
//
// Two representations are persisted per user:
//   - `dashboardLayout`: ordered list of { id, visible, order } (legacy / fallback).
//   - `dashboardGrid`:   react-grid-layout items [{ i, x, y, w, h }] — the source of
//     truth for position + size once the user has edited the dashboard.
//
// `getDashboardLayout` prefers the grid, falling back to the legacy array, and
// finally to the built-in default grid.

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  DEFAULT_DASHBOARD_BLOCKS,
  DEFAULT_DASHBOARD_GRID,
  type DashboardBlockConfig,
  type DashboardBlockId,
  type DashboardLayoutItem,
} from '@/types';

export async function getDashboardLayout(uid: string): Promise<DashboardBlockConfig[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    const data = snap.data();
    const grid = data?.dashboardGrid as DashboardLayoutItem[] | undefined;
    if (Array.isArray(grid) && grid.length > 0) {
      return gridToBlockConfigs(grid);
    }
    const legacy = data?.dashboardLayout as DashboardBlockConfig[] | undefined;
    if (Array.isArray(legacy) && legacy.length > 0) {
      return legacy;
    }
  }
  return DEFAULT_DASHBOARD_BLOCKS;
}

export async function getDashboardGrid(uid: string): Promise<DashboardLayoutItem[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    const grid = snap.data()?.dashboardGrid as DashboardLayoutItem[] | undefined;
    if (Array.isArray(grid) && grid.length > 0) {
      return grid;
    }
  }
  return DEFAULT_DASHBOARD_GRID;
}

export async function saveDashboardLayout(
  uid: string,
  layout: DashboardBlockConfig[]
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    dashboardLayout: layout,
    updatedAt: Date.now(),
  });
}

export async function saveDashboardGrid(
  uid: string,
  grid: DashboardLayoutItem[],
  visibilityMap?: Partial<Record<DashboardBlockId, boolean>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    dashboardGrid: grid,
    dashboardLayout: gridToBlockConfigs(grid, visibilityMap),
    updatedAt: Date.now(),
  });
}

/** Converts a grid layout into the ordered block-config list with visibility. */
export function gridToBlockConfigs(
  grid: DashboardLayoutItem[],
  visibilityMap?: Partial<Record<DashboardBlockId, boolean>>
): DashboardBlockConfig[] {
  return grid
    .slice()
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0))
    .map((item, index) => ({
      id: item.i,
      visible: visibilityMap ? (visibilityMap[item.i] ?? true) : true,
      order: index,
    }));
}

export async function resetDashboardLayout(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    dashboardLayout: DEFAULT_DASHBOARD_BLOCKS,
    dashboardGrid: DEFAULT_DASHBOARD_GRID,
    updatedAt: Date.now(),
  });
}