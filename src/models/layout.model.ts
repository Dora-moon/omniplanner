// src/models/layout.model.ts
// Data access layer (Model) for dashboard layout arrangement and block visibility in Firestore.

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { DEFAULT_DASHBOARD_BLOCKS, type DashboardBlockConfig } from '@/types';

export async function getDashboardLayout(uid: string): Promise<DashboardBlockConfig[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    const data = snap.data();
    if (Array.isArray(data.dashboardLayout) && data.dashboardLayout.length > 0) {
      return data.dashboardLayout as DashboardBlockConfig[];
    }
  }
  return DEFAULT_DASHBOARD_BLOCKS;
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
