// src/controllers/useTodayDashboard.ts
// Controller hook managing dashboard metrics, task actions, and Edit Mode layout persistence.

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  addTask,
  deleteTask,
  toggleTaskCompleted,
} from '@/models/task.model';
import { saveDashboardLayout } from '@/models/layout.model';
import {
  DEFAULT_DASHBOARD_BLOCKS,
  type DashboardBlockConfig,
  type DashboardBlockId,
  type Habit,
  type Language,
  type Task,
  type TaskCategory,
  type UserProfile,
} from '@/types';

export function useTodayDashboard({
  uid,
  profile,
  tasks,
  habits,
}: {
  uid: string;
  profile: UserProfile;
  tasks: Task[];
  habits: Habit[];
}) {
  // Quick task modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('work');
  const [activeTaskMenu, setActiveTaskMenu] = useState<string | null>(null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [blocks, setBlocks] = useState<DashboardBlockConfig[]>(() => {
    if (Array.isArray(profile.dashboardLayout) && profile.dashboardLayout.length > 0) {
      return profile.dashboardLayout;
    }
    return DEFAULT_DASHBOARD_BLOCKS;
  });
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  // Sync blocks if profile loads fresh layout
  useEffect(() => {
    if (Array.isArray(profile.dashboardLayout) && profile.dashboardLayout.length > 0) {
      setBlocks(profile.dashboardLayout);
    }
  }, [profile.dashboardLayout]);

  // Today's tasks filtering
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.date === todayISO),
    [tasks, todayISO]
  );
  const completedCount = todaysTasks.filter((t) => t.completed).length;
  const tasksLeftCount = todaysTasks.length - completedCount;

  // Streak calculation
  const streak =
    habits.reduce((max, h) => Math.max(max, h.currentStreak), 0) || 7;

  // Actions
  async function handleToggleTask(task: Task) {
    await toggleTaskCompleted(uid, task.id, !task.completed);
  }

  async function handleDeleteTask(taskId: string) {
    await deleteTask(uid, taskId);
    setActiveTaskMenu(null);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await addTask(uid, {
      title: newTaskTitle.trim(),
      date: todayISO,
      time: newTaskTime.trim() || null,
      category: newTaskCategory,
      completed: false,
      source: 'manual',
    });

    setNewTaskTitle('');
    setNewTaskTime('');
    setShowAddModal(false);
  }

  // Edit Mode Block Operations
  const toggleBlockVisibility = useCallback(
    async (id: DashboardBlockId) => {
      const nextBlocks = blocks.map((b) =>
        b.id === id ? { ...b, visible: !b.visible } : b
      );
      setBlocks(nextBlocks);
      await saveDashboardLayout(uid, nextBlocks);
    },
    [blocks, uid]
  );

  const reorderBlocks = useCallback(
    async (newOrder: DashboardBlockConfig[]) => {
      const indexed = newOrder.map((b, idx) => ({ ...b, order: idx }));
      setBlocks(indexed);
      await saveDashboardLayout(uid, indexed);
    },
    [uid]
  );

  const moveBlockUp = useCallback(
    async (index: number) => {
      if (index <= 0) return;
      const next = [...blocks];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      await reorderBlocks(next);
    },
    [blocks, reorderBlocks]
  );

  const moveBlockDown = useCallback(
    async (index: number) => {
      if (index >= blocks.length - 1) return;
      const next = [...blocks];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      await reorderBlocks(next);
    },
    [blocks, reorderBlocks]
  );

  const resetToDefaultLayout = useCallback(async () => {
    setBlocks(DEFAULT_DASHBOARD_BLOCKS);
    await saveDashboardLayout(uid, DEFAULT_DASHBOARD_BLOCKS);
  }, [uid]);

  return {
    todayISO,
    todaysTasks,
    completedCount,
    tasksLeftCount,
    streak,
    showAddModal,
    setShowAddModal,
    newTaskTitle,
    setNewTaskTitle,
    newTaskTime,
    setNewTaskTime,
    newTaskCategory,
    setNewTaskCategory,
    activeTaskMenu,
    setActiveTaskMenu,
    handleToggleTask,
    handleDeleteTask,
    handleCreateTask,
    // Edit mode
    isEditMode,
    setIsEditMode,
    blocks,
    toggleBlockVisibility,
    reorderBlocks,
    moveBlockUp,
    moveBlockDown,
    resetToDefaultLayout,
    isSavingLayout,
  };
}
