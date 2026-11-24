import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  STATUS_COLOR_LIST,
  STATUS_COLOR_PALETTE,
} from '../../constants/themes';
import type { StatusColorId, WorkStatusOption } from '../../types/portal';

export interface WorkflowOptionsPayload {
  customWorkTypes: string[];
  customWorkStatuses: WorkStatusOption[];
  customChannels: string[];
}

interface AdminWorkflowOptionsCardProps {
  customWorkTypes: string[];
  customWorkStatuses: WorkStatusOption[];
  customChannels: string[];
  onSaveWorkflowOptions: (payload: WorkflowOptionsPayload) => Promise<void>;
}

function makeStatusId(label: string, existing: WorkStatusOption[]): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const prefix = base ? `step_${base}` : `step_${Date.now()}`;
  let candidate = prefix;
  let n = 2;
  const ids = new Set(existing.map((s) => s.id));
  while (ids.has(candidate)) {
    candidate = `${prefix}_${n}`;
    n += 1;
  }
  return candidate;
}

export const AdminWorkflowOptionsCard: React.FC<AdminWorkflowOptionsCardProps> = ({
  customWorkTypes,
  customWorkStatuses,
  customChannels,
  onSaveWorkflowOptions,
}) => {
  const [workTypes, setWorkTypes] = useState<string[]>(customWorkTypes);
  const [workStatuses, setWorkStatuses] = useState<WorkStatusOption[]>(customWorkStatuses);
  const [channels, setChannels] = useState<string[]>(customChannels);

  const [newWorkType, setNewWorkType] = useState('');
  const [editingTypeIdx, setEditingTypeIdx] = useState<number | null>(null);
  const [editingTypeValue, setEditingTypeValue] = useState('');

  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState<StatusColorId>('sky');

  const [newChannel, setNewChannel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setWorkTypes(customWorkTypes);
    setWorkStatuses(customWorkStatuses);
    setChannels(customChannels);
  }, [customWorkTypes, customWorkStatuses, customChannels]);

  // Work Types handlers
  const handleAddWorkType = () => {
    const clean = newWorkType.trim();
    if (!clean) return;
    if (workTypes.includes(clean)) {
      setNewWorkType('');
      return;
    }
    setWorkTypes((prev) => [...prev, clean]);
    setNewWorkType('');
  };

  const handleStartEditType = (idx: number) => {
    setEditingTypeIdx(idx);
    setEditingTypeValue(workTypes[idx]);
  };

  const handleCommitEditType = () => {
    if (editingTypeIdx === null) return;
    const clean = editingTypeValue.trim();
    if (clean) {
      setWorkTypes((prev) =>
        prev.map((item, i) => (i === editingTypeIdx ? clean : item))
      );
    }
    setEditingTypeIdx(null);
    setEditingTypeValue('');
  };

  const handleDeleteWorkType = (idx: number) => {
    if (workTypes.length <= 1) return;
    setWorkTypes((prev) => prev.filter((_, i) => i !== idx));
    if (editingTypeIdx === idx) {
      setEditingTypeIdx(null);
      setEditingTypeValue('');
    }
  };

  // Work Statuses handlers
  const handleAddStatus = () => {
    const clean = newStatusLabel.trim();
    if (!clean) return;
    const nextItem: WorkStatusOption = {
      id: makeStatusId(clean, workStatuses),
      label: clean,
      color: newStatusColor,
    };
    setWorkStatuses((prev) => [...prev, nextItem]);
    setNewStatusLabel('');
  };

  const handleMoveStatus = (idx: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= workStatuses.length) return;
    setWorkStatuses((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  };

  const handleUpdateStatusLabel = (id: string, label: string) => {
    setWorkStatuses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label } : item))
    );
  };

  const handleUpdateStatusColor = (id: string, color: StatusColorId) => {
    setWorkStatuses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, color } : item))
    );
  };

  const handleDeleteStatus = (id: string) => {
    if (workStatuses.length <= 1) return;
    setWorkStatuses((prev) => prev.filter((item) => item.id !== id));
  };

  // Channels handlers
  const handleAddChannel = () => {
    const clean = newChannel.trim();
    if (!clean) return;
    if (channels.includes(clean)) {
      setNewChannel('');
      return;
    }
    setChannels((prev) => [...prev, clean]);
    setNewChannel('');
  };

  const handleDeleteChannel = (idx: number) => {
    if (channels.length <= 1) return;
    setChannels((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedTypes = workTypes.map((s) => s.trim()).filter(Boolean);
    const cleanedStatuses = workStatuses
      .map((s) => ({ ...s, label: s.label.trim() }))
      .filter((s) => s.label.length > 0);
    const cleanedChannels = channels.map((s) => s.trim()).filter(Boolean);

    if (cleanedTypes.length === 0 || cleanedStatuses.length === 0 || cleanedChannels.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveWorkflowOptions({
        customWorkTypes: cleanedTypes,
        customWorkStatuses: cleanedStatuses,
        customChannels: cleanedChannels,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSaveAll}
      className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6"
    >
      <div className="flex flex-col gap-3 border-b border-[var(--portal-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="h-5 w-5 text-[var(--portal-primary)]" />
          <div>
            <h3 className="font-display text-lg font-semibold text-[var(--portal-ink)]">
              ตั้งค่าหมวดหมู่งานและขั้นตอนคิว
            </h3>
            <p className="text-xs text-[var(--portal-muted)]">
              ปรับแต่งประเภทงาน ขั้นตอนการทำงาน สีป้ายสถานะ และช่องทางสั่งงานให้เหมาะกับธุรกิจของคุณ
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap shrink-0"
          style={{ backgroundColor: 'var(--portal-primary)' }}
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกตัวเลือกทั้งหมด'}
        </button>
      </div>

      <div className="mt-6 space-y-8">
        {/* 1. Work Types Manager */}
        <section aria-labelledby="wf-worktypes-heading" className="space-y-3">
          <div>
            <h4
              id="wf-worktypes-heading"
              className="text-sm font-semibold text-[var(--portal-ink)]"
            >
              1. หมวดหมู่ / ประเภทงาน
            </h4>
            <p className="text-xs text-[var(--portal-muted)]">
              รายการประเภทงานหรือบริการที่จะแสดงให้เลือกตอนเพิ่มคิวงานใหม่
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newWorkType}
              onChange={(e) => setNewWorkType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddWorkType();
                }
              }}
              aria-label="เพิ่มประเภทงานใหม่"
              placeholder="พิมพ์ชื่อประเภทงานหรือบริการใหม่..."
              className="flex-1 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
            <button
              type="button"
              onClick={handleAddWorkType}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-4 py-2 text-xs font-semibold text-[var(--portal-ink)] hover:border-[var(--portal-primary)] whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มประเภทงาน
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {workTypes.map((typeName, idx) => (
              <div
                key={`${typeName}-${idx}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)]/55 px-3.5 py-2"
              >
                {editingTypeIdx === idx ? (
                  <div className="flex flex-1 items-center gap-1.5">
                    <input
                      type="text"
                      value={editingTypeValue}
                      onChange={(e) => setEditingTypeValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCommitEditType();
                        }
                      }}
                      aria-label="แก้ไขชื่อประเภทงาน"
                      className="w-full rounded-lg border border-[var(--portal-primary)] bg-[var(--portal-surface)] px-2.5 py-1 text-sm text-[var(--portal-ink)]"
                    />
                    <button
                      type="button"
                      onClick={handleCommitEditType}
                      aria-label="ยืนยันชื่อประเภทงาน"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTypeIdx(null)}
                      aria-label="ยกเลิกการแก้ไขชื่อประเภทงาน"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--portal-border)] text-[var(--portal-muted)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="truncate text-sm font-medium text-[var(--portal-ink)]">
                      {typeName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditType(idx)}
                        aria-label={`แก้ไขประเภทงาน ${typeName}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={workTypes.length <= 1}
                        onClick={() => handleDeleteWorkType(idx)}
                        aria-label={`ลบประเภทงาน ${typeName}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-[var(--portal-surface)] text-rose-600 hover:bg-rose-50 disabled:opacity-35"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 2. Work Statuses Manager (with Reordering & Pastel Badge Colors) */}
        <section
          aria-labelledby="wf-statuses-heading"
          className="space-y-3 border-t border-[var(--portal-border)] pt-6"
        >
          <div>
            <h4
              id="wf-statuses-heading"
              className="text-sm font-semibold text-[var(--portal-ink)]"
            >
              2. ขั้นตอน / สถานะการทำงาน
            </h4>
            <p className="text-xs text-[var(--portal-muted)]">
              เรียงลำดับจากขั้นตอนเริ่มต้นไปจนถึงขั้นตอนสุดท้าย (100%) และเลือกสีป้ายสถานะประจำแต่ละขั้น
            </p>
          </div>

          <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)]/50 p-3.5 sm:flex-row sm:items-center">
            <input
              type="text"
              value={newStatusLabel}
              onChange={(e) => setNewStatusLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStatus();
                }
              }}
              aria-label="เพิ่มขั้นตอนการทำงานใหม่"
              placeholder="พิมพ์ชื่อขั้นตอนใหม่ เช่น รอตรวจสอบ, กำลังผลิต, จัดส่งแล้ว..."
              className="flex-1 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />

            <div className="flex items-center gap-1.5" role="group" aria-label="เลือกสีสำหรับขั้นตอนใหม่">
              {STATUS_COLOR_LIST.map((c) => {
                const selected = newStatusColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewStatusColor(c.id)}
                    title={c.labelTh}
                    aria-label={`เลือก${c.labelTh}สำหรับขั้นตอนใหม่`}
                    aria-pressed={selected}
                    className="h-6 w-6 rounded-full border-2 transition-transform"
                    style={{
                      backgroundColor: c.swatch,
                      borderColor: selected ? 'var(--portal-ink)' : '#FFFFFF',
                      transform: selected ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddStatus}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-4 py-2 text-xs font-semibold text-[var(--portal-ink)] hover:border-[var(--portal-primary)] whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มขั้นตอน
            </button>
          </div>

          <div className="space-y-2.5">
            {workStatuses.map((status, idx) => {
              const palette = STATUS_COLOR_PALETTE[status.color] || STATUS_COLOR_PALETTE.gray;
              const progressPreview =
                workStatuses.length <= 1
                  ? 100
                  : Math.round(15 + (idx / (workStatuses.length - 1)) * 85);

              return (
                <div
                  key={status.id}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)]/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 items-center gap-2.5 min-w-0">
                    {/* Up/Down Order Buttons */}
                    <div className="flex flex-col shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveStatus(idx, 'up')}
                        aria-label={`เลื่อนขั้นตอน ${status.label} ขึ้น`}
                        className="rounded p-0.5 text-[var(--portal-muted)] hover:bg-[var(--portal-surface)] hover:text-[var(--portal-ink)] disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === workStatuses.length - 1}
                        onClick={() => handleMoveStatus(idx, 'down')}
                        aria-label={`เลื่อนขั้นตอน ${status.label} ลง`}
                        className="rounded p-0.5 text-[var(--portal-muted)] hover:bg-[var(--portal-surface)] hover:text-[var(--portal-ink)] disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="shrink-0 text-center">
                      <span className="font-mono-num block text-xs font-semibold text-[var(--portal-ink)]">
                        #{idx + 1}
                      </span>
                      <span className="font-mono-num block text-[10px] text-[var(--portal-muted)]">
                        {progressPreview}%
                      </span>
                    </div>

                    <input
                      type="text"
                      value={status.label}
                      onChange={(e) => handleUpdateStatusLabel(status.id, e.target.value)}
                      aria-label={`ชื่อขั้นตอนที่ ${idx + 1}`}
                      className="min-w-0 flex-1 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] px-3 py-1.5 text-sm font-medium text-[var(--portal-ink)]"
                    />

                    {/* Live Badge Preview */}
                    <span
                      className="hidden shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold md:inline-flex"
                      style={{
                        backgroundColor: palette.bg,
                        color: palette.text,
                        borderColor: palette.border,
                      }}
                    >
                      {status.label || 'ตัวอย่างป้าย'}
                    </span>
                  </div>

                  {/* Color Swatches + Delete */}
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <div
                      className="flex items-center gap-1.5"
                      role="group"
                      aria-label={`เลือกสีป้ายสถานะ ${status.label}`}
                    >
                      {STATUS_COLOR_LIST.map((c) => {
                        const active = status.color === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleUpdateStatusColor(status.id, c.id)}
                            title={c.labelTh}
                            aria-label={`ตั้งสี ${status.label} เป็น${c.labelTh}`}
                            aria-pressed={active}
                            className="h-5 w-5 rounded-full border-2 transition-transform"
                            style={{
                              backgroundColor: c.swatch,
                              borderColor: active ? 'var(--portal-ink)' : '#FFFFFF',
                              transform: active ? 'scale(1.18)' : 'scale(1)',
                            }}
                          />
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={workStatuses.length <= 1}
                      onClick={() => handleDeleteStatus(status.id)}
                      aria-label={`ลบขั้นตอน ${status.label}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-[var(--portal-surface)] text-rose-600 hover:bg-rose-50 disabled:opacity-35"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Order Channels Manager */}
        <section
          aria-labelledby="wf-channels-heading"
          className="space-y-3 border-t border-[var(--portal-border)] pt-6"
        >
          <div>
            <h4
              id="wf-channels-heading"
              className="text-sm font-semibold text-[var(--portal-ink)]"
            >
              3. ช่องทางสั่งงาน
            </h4>
            <p className="text-xs text-[var(--portal-muted)]">
              ช่องทางที่ลูกค้าติดต่อสั่งงาน เช่น LINE, Instagram, X, TikTok หรือหน้าเว็บไซต์
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChannel();
                }
              }}
              aria-label="เพิ่มช่องทางสั่งงานใหม่"
              placeholder="พิมพ์ชื่อช่องทางสั่งงานใหม่ เช่น Shopee, หน้าร้าน..."
              className="flex-1 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
            <button
              type="button"
              onClick={handleAddChannel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-4 py-2 text-xs font-semibold text-[var(--portal-ink)] hover:border-[var(--portal-primary)] whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มช่องทาง
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {channels.map((ch, idx) => (
              <div
                key={`${ch}-${idx}`}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)]/65 px-3 py-1.5 text-sm text-[var(--portal-ink)]"
              >
                <span className="font-medium">{ch}</span>
                <button
                  type="button"
                  disabled={channels.length <= 1}
                  onClick={() => handleDeleteChannel(idx)}
                  aria-label={`ลบช่องทาง ${ch}`}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[var(--portal-muted)] hover:bg-rose-50 hover:text-rose-600 disabled:opacity-35"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </form>
  );
};
