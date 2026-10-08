// src/components/OnboardingModal.tsx
// Onboarding setup view using Omni design tokens and standardized UI components.

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/translations';
import { Button, Input, Select } from '@/ui';
import type { Gender, Goal, Language } from '@/types';
import { Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  language: Language;
  onComplete: (data: {
    heightCm: number | null;
    weightKg: number | null;
    age: number | null;
    gender: Gender;
    goal: Goal;
  }) => Promise<void> | void;
}

const GOALS: Goal[] = ['productivity', 'fitness', 'habit', 'life'];
const GOAL_LABEL_KEY: Record<
  Goal,
  'goalProductivity' | 'goalFitness' | 'goalHabit' | 'goalLife'
> = {
  productivity: 'goalProductivity',
  fitness: 'goalFitness',
  habit: 'goalHabit',
  life: 'goalLife',
};

export default function OnboardingModal({ language, onComplete }: OnboardingModalProps) {
  const { t } = useTranslation(language);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [goal, setGoal] = useState<Goal>('productivity');
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    setSaving(true);
    try {
      await onComplete({
        heightCm: height ? Number(height) : null,
        weightKg: weight ? Number(weight) : null,
        age: age ? Number(age) : null,
        gender,
        goal,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--bg)] transition-colors">
      <div className="w-full max-w-lg bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--panel-2)] flex items-center justify-center border border-[var(--line)] shadow-xs overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Omni Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans text-[var(--text)] tracking-tight">
              {t('obTitle')}
            </h1>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">{t('obTag')}</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label={t('obHeight')}
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
          />
          <Input
            label={t('obWeight')}
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="68"
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label={t('obAge')}
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="24"
          />
          <Select
            label={t('obGender')}
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            <option value="male">{t('obMale')}</option>
            <option value="female">{t('obFemale')}</option>
            <option value="other">{t('obOther')}</option>
          </Select>
        </div>

        {/* Goal selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[var(--text-dim)]">
            {t('obGoalLabel')}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                  goal === g
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] shadow-2xs'
                    : 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)] hover:border-[var(--accent)]'
                }`}
              >
                {t(GOAL_LABEL_KEY[g])}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          block
          size="lg"
          loading={saving}
          onClick={handleContinue}
        >
          {saving ? t('loading') : t('obContinue')}
        </Button>
      </div>
    </div>
  );
}
