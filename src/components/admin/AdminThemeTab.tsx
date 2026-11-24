import React, { useState } from 'react';
import { Check, Palette, Save, Sparkles } from 'lucide-react';
import { BACKGROUND_EFFECTS, PASTEL_THEMES } from '../../constants/themes';
import type { BackgroundEffectId, CustomThemeColors } from '../../types/portal';

interface AdminThemeTabProps {
  activeThemeId: string;
  customThemeColors: CustomThemeColors;
  backgroundEffect: BackgroundEffectId;
  onChangeThemePreview: (
    activeThemeId: string,
    customThemeColors: CustomThemeColors,
    backgroundEffect: BackgroundEffectId
  ) => void;
  onSaveThemeSettings: (payload: {
    activeThemeId: string;
    customThemeColors: CustomThemeColors;
    backgroundEffect: BackgroundEffectId;
  }) => Promise<void>;
}

const COLOR_FIELDS: Array<{ key: keyof CustomThemeColors; label: string }> = [
  { key: 'bg', label: 'พื้นหลังหลัก (Background)' },
  { key: 'surface', label: 'พื้นผิวการ์ด (Surface)' },
  { key: 'surfaceAlt', label: 'พื้นผิวรอง (Surface Alt)' },
  { key: 'border', label: 'เส้นขอบ (Border)' },
  { key: 'primary', label: 'สีหลัก/ปุ่ม (Primary Accent)' },
  { key: 'secondary', label: 'สีรอง/เอฟเฟกต์ (Secondary)' },
  { key: 'ink', label: 'สีตัวอักษรหลัก (Ink)' },
  { key: 'muted', label: 'สีตัวอักษรรอง (Muted)' },
];

export const AdminThemeTab: React.FC<AdminThemeTabProps> = ({
  activeThemeId,
  customThemeColors,
  backgroundEffect,
  onChangeThemePreview,
  onSaveThemeSettings,
}) => {
  const [saving, setSaving] = useState(false);

  const handleSelectPreset = (presetId: string) => {
    const preset = PASTEL_THEMES.find((t) => t.id === presetId);
    if (!preset) return;
    onChangeThemePreview(preset.id, preset.colors, backgroundEffect);
  };

  const handleColorPick = (key: keyof CustomThemeColors, value: string) => {
    const nextColors = { ...customThemeColors, [key]: value };
    onChangeThemePreview('custom', nextColors, backgroundEffect);
  };

  const handleSelectEffect = (effectId: BackgroundEffectId) => {
    onChangeThemePreview(activeThemeId, customThemeColors, effectId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveThemeSettings({
        activeThemeId,
        customThemeColors,
        backgroundEffect,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--portal-ink)]">
            ตั้งค่าธีมสีพาสเทลและเอฟเฟกต์พื้นหลัง (เฉพาะแอดมิน)
          </h3>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            เมื่อกดบันทึก ระบบจะเก็บค่า activeThemeId, customThemeColors และ backgroundEffect ลง Google Sheets เพื่อให้ผู้มาเยือนทุกอุปกรณ์เห็นธีมเดียวกัน
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap shrink-0"
          style={{ backgroundColor: 'var(--portal-primary)' }}
        >
          <Save className="h-4 w-4" />
          {saving ? 'กำลังบันทึกธีม...' : 'บันทึกธีมและเอฟเฟกต์'}
        </button>
      </div>

      {/* 15 Pastel Theme Presets */}
      <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-[var(--portal-primary)]" />
          <h4 className="font-display text-base font-semibold text-[var(--portal-ink)]">
            15 ธีมพาสเทลสำเร็จรูป
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PASTEL_THEMES.map((theme) => {
            const isSelected = activeThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectPreset(theme.id)}
                className="flex flex-col rounded-xl border p-3 text-left transition-all"
                style={{
                  backgroundColor: theme.colors.bg,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  boxShadow: isSelected ? `0 0 0 2px ${theme.colors.primary}44` : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: theme.colors.surfaceAlt }}
                    />
                  </div>
                  {isSelected && (
                    <Check
                      className="h-4 w-4 shrink-0"
                      style={{ color: theme.colors.primary }}
                    />
                  )}
                </div>
                <p
                  className="mt-2.5 truncate text-xs font-semibold"
                  style={{ color: theme.colors.ink }}
                >
                  {theme.nameTh}
                </p>
                <p
                  className="truncate text-[11px]"
                  style={{ color: theme.colors.muted }}
                >
                  {theme.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-display text-base font-semibold text-[var(--portal-ink)]">
              ปรับแต่งสีเอง (Custom Color Picker)
            </h4>
            <p className="text-xs text-[var(--portal-muted)]">
              {activeThemeId === 'custom'
                ? 'กำลังใช้งานโหมดสีที่กำหนดเอง (custom)'
                : 'ปรับสีใดก็ได้ด้านล่างเพื่อสลับเป็นโหมดกำหนดสีเองทันที'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLOR_FIELDS.map((field) => (
            <label
              key={field.key}
              className="flex items-center gap-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)]/60 p-3"
            >
              <input
                type="color"
                value={customThemeColors[field.key]}
                onChange={(e) => handleColorPick(field.key, e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-[var(--portal-border)] bg-white p-0.5"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[var(--portal-ink)]">
                  {field.label}
                </p>
                <p className="font-mono-num text-[11px] uppercase text-[var(--portal-muted)]">
                  {customThemeColors[field.key]}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 13 Background Effects */}
      <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--portal-primary)]" />
          <h4 className="font-display text-base font-semibold text-[var(--portal-ink)]">
            เอฟเฟกต์พื้นหลัง 13 แบบ
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BACKGROUND_EFFECTS.map((effect) => {
            const selected = backgroundEffect === effect.id;
            return (
              <button
                key={effect.id}
                type="button"
                onClick={() => handleSelectEffect(effect.id)}
                className="flex flex-col rounded-xl border p-3.5 text-left transition-colors"
                style={{
                  borderColor: selected ? 'var(--portal-primary)' : 'var(--portal-border)',
                  backgroundColor: selected
                    ? 'var(--portal-surface-alt)'
                    : 'var(--portal-surface)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--portal-ink)]">
                    {effect.nameTh}
                  </span>
                  {selected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--portal-primary)]" />
                  )}
                </div>
                <span className="mt-1 text-[11px] text-[var(--portal-muted)]">
                  {effect.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
