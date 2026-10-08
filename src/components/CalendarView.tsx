// src/components/CalendarView.tsx
// Calendar view adhering to MVC pattern: uses useCalendar controller hook and Omni design tokens.

import React from 'react';
import { ChevronLeft, ChevronRight, Mic, Square, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n/translations';
import { useCalendar } from '@/controllers/useCalendar';
import { Badge, Button } from '@/ui';
import type { Language, Task, TaskCategory, UserProfile } from '@/types';

interface CalendarViewProps {
  uid: string;
  language: Language;
  tasks: Task[];
  variant?: 'full' | 'compact';
  profile?: UserProfile | null;
}

const CATEGORY_KEYS: Record<
  TaskCategory,
  'catWork' | 'catStudy' | 'catFitness' | 'catHabit' | 'catRest' | 'catOther'
> = {
  work: 'catWork',
  study: 'catStudy',
  fitness: 'catFitness',
  habit: 'catHabit',
  rest: 'catRest',
  other: 'catOther',
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function CalendarView({
  uid,
  language,
  tasks,
  variant = 'full',
  profile,
}: CalendarViewProps) {
  const { t } = useTranslation(language);
  const {
    viewMode,
    setViewMode,
    reference,
    setReference,
    weekDays,
    monthDays,
    tasksByDate,
    nextPeriod,
    prevPeriod,
    handleToggle,
    handleDelete,
    scheduleText,
    setScheduleText,
    aiStatus,
    aiLoading,
    listening,
    toggleVoiceInput,
    handleParseSchedule,
  } = useCalendar({ uid, language, tasks, profile });

  const dayLabelKeys: Array<
    'dayMon' | 'dayTue' | 'dayWed' | 'dayThu' | 'dayFri' | 'daySat' | 'daySun'
  > = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'];

  /* ================= COMPACT VARIANT (for Today Dashboard) ================= */
  if (variant === 'compact') {
    const monthName = reference.toLocaleDateString(
      language === 'vi' ? 'vi-VN' : 'en-US',
      { month: 'long', year: 'numeric' }
    );

    return (
      <div className="bg-[var(--panel)] rounded-3xl p-5 border border-[var(--line)] shadow-[var(--shadow)] text-[var(--text)] transition-colors">
        {/* Calendar Card Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold font-sans text-[var(--text)]">
              {t('tabCalendar')}
            </h3>
            <div className="flex items-center gap-1 bg-[var(--panel-2)] rounded-lg p-0.5 border border-[var(--line)]">
              <button
                type="button"
                onClick={prevPeriod}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={nextPeriod}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <span className="text-xs font-semibold text-[var(--text)] capitalize">
              {monthName}
            </span>
          </div>

          <div className="flex items-center bg-[var(--panel-2)] rounded-full p-0.5 border border-[var(--line)] text-[11px] font-medium text-[var(--text-dim)]">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-full transition-all ${
                viewMode === 'month'
                  ? 'bg-[var(--panel)] text-[var(--text)] shadow-xs font-semibold'
                  : 'hover:text-[var(--text)]'
              }`}
            >
              {t('calViewMonth')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-full transition-all ${
                viewMode === 'week'
                  ? 'bg-[var(--panel)] text-[var(--text)] shadow-xs font-semibold'
                  : 'hover:text-[var(--text)]'
              }`}
            >
              {t('calViewWeek')}
            </button>
          </div>
        </div>

        {/* 7-column calendar grid */}
        <div className="grid grid-cols-7 gap-2 overflow-x-auto min-w-[540px]">
          {weekDays.map((date, i) => {
            const iso = toISODate(date);
            const dayTasks = tasksByDate.get(iso) ?? [];
            const isToday = iso === toISODate(new Date());

            return (
              <div
                key={iso}
                className={`rounded-2xl p-2.5 min-h-[140px] flex flex-col justify-between transition-colors border ${
                  isToday
                    ? 'bg-[var(--panel-2)] border-[var(--accent)]/50 shadow-xs'
                    : 'bg-[var(--panel-2)]/50 hover:bg-[var(--panel-2)] border-[var(--line)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-[var(--text-dim)]">
                      {t(dayLabelKeys[i])}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center justify-center ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-[var(--accent)] text-white shadow-xs'
                          : 'text-[var(--text)]'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggle(task)}
                        className={`p-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[10px] leading-tight cursor-pointer transition-transform hover:scale-[1.02] shadow-2xs ${
                          task.completed ? 'opacity-50 line-through' : ''
                        }`}
                      >
                        {task.time && (
                          <div className="font-bold opacity-80 text-[9px] text-[var(--accent)]">
                            {task.time}
                          </div>
                        )}
                        <div className="font-semibold truncate text-[var(--text)]">
                          {task.title}
                        </div>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[9.5px] text-[var(--text-dim)] font-medium block text-center">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ================= FULL PAGE VARIANT ================= */
  return (
    <div className="omni-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text)]">
            {viewMode === 'week' ? t('calTitleWeek') : t('calTitleMonth')}
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">{t('calSub')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--panel-2)] rounded-lg p-0.5 border border-[var(--line)]">
            <button
              type="button"
              onClick={prevPeriod}
              className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text)]"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextPeriod}
              className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text)]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center bg-[var(--panel-2)] rounded-full p-0.5 border border-[var(--line)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                viewMode === 'week'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {t('calViewWeek')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                viewMode === 'month'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {t('calViewMonth')}
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      {viewMode === 'week' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
          {weekDays.map((date, i) => {
            const iso = toISODate(date);
            const dayTasks = tasksByDate.get(iso) ?? [];
            const isToday = iso === toISODate(new Date());

            return (
              <div
                key={iso}
                className={`rounded-2xl p-3 min-h-[180px] flex flex-col justify-between border ${
                  isToday
                    ? 'bg-[var(--panel)] border-[var(--accent)] shadow-sm'
                    : 'bg-[var(--panel-2)] border-[var(--line)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">
                      {t(dayLabelKeys[i])}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isToday ? 'px-2 py-0.5 rounded-full bg-[var(--accent)] text-white' : ''
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggle(task)}
                        className={`p-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-xs cursor-pointer relative group transition-transform hover:scale-[1.01] ${
                          task.completed ? 'opacity-50 line-through' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id);
                          }}
                          className="absolute top-1 right-1.5 text-[var(--text-dim)] hover:text-rose-500 text-sm"
                        >
                          ×
                        </button>
                        <div className="font-semibold text-[var(--text)] pr-3 truncate">
                          {task.title}
                        </div>
                        {task.time && (
                          <div className="text-[10px] text-[var(--accent)] mt-0.5 font-medium">
                            {task.time}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Month Grid */
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((date) => {
            const iso = toISODate(date);
            const dayTasks = tasksByDate.get(iso) ?? [];
            const inMonth = date.getMonth() === reference.getMonth();
            const isToday = iso === toISODate(new Date());

            return (
              <div
                key={iso}
                className={`p-2 rounded-xl border min-h-[72px] flex flex-col justify-between ${
                  !inMonth
                    ? 'opacity-40 bg-[var(--panel-2)] border-transparent'
                    : isToday
                      ? 'bg-[var(--panel)] border-[var(--accent)] shadow-xs'
                      : 'bg-[var(--panel-2)] border-[var(--line)]'
                }`}
              >
                <span className="text-[11px] font-semibold text-[var(--text-dim)]">
                  {date.getDate()}
                </span>
                <div className="flex gap-1 flex-wrap">
                  {dayTasks.map((task) => (
                    <span
                      key={task.id}
                      className={`w-2 h-2 rounded-full ${
                        task.completed ? 'bg-[var(--text-dim)]' : 'bg-[var(--accent)]'
                      }`}
                      title={task.title}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Schedule Parser */}
      <div className="pt-6 border-t border-[var(--line)] space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--accent)]" />
          <h3 className="font-bold text-sm text-[var(--text)]">{t('calAiLabel')}</h3>
        </div>

        <div className="flex gap-2">
          <textarea
            rows={2}
            value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            placeholder={t('calAiPlaceholder')}
            className="omni-input flex-1 resize-none"
          />

          <button
            type="button"
            onClick={toggleVoiceInput}
            title={listening ? t('calVoiceStop') : t('calVoiceStart')}
            className={`px-3.5 rounded-2xl border transition-all flex items-center justify-center ${
              listening
                ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                : 'bg-[var(--panel-2)] border-[var(--line)] text-[var(--text)] hover:border-[var(--accent)]'
            }`}
          >
            {listening ? <Square size={16} /> : <Mic size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="primary"
            disabled={aiLoading || !scheduleText.trim()}
            loading={aiLoading}
            onClick={handleParseSchedule}
          >
            {t('calParse')}
          </Button>

          {aiStatus && (
            <span className="text-xs text-[var(--text-dim)] italic">{aiStatus}</span>
          )}
        </div>
      </div>
    </div>
  );
}
