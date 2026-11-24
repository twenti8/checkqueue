import React, { useState } from 'react';
import { Image as ImageIcon, RotateCcw, Upload } from 'lucide-react';
import { DEFAULT_ASSETS, IMAGE_SLOT_CONFIG } from '../../constants/themes';
import type { ImageSlotKey, PortalImages } from '../../types/portal';
import { compressImageForSheet } from '../../utils/imageCompressor';

interface AdminImagesTabProps {
  images: PortalImages;
  onSaveImageSlot: (key: ImageSlotKey, dataUrl: string) => Promise<void>;
  onNotifyError: (message: string) => void;
}

function getFallbackPreview(key: ImageSlotKey): string | null {
  if (key === 'img_avatar') return DEFAULT_ASSETS.avatar;
  if (key === 'img_cover') return DEFAULT_ASSETS.cover;
  const found = DEFAULT_ASSETS.portfolio.find((p) => p.key === key);
  return found ? found.src : null;
}

export const AdminImagesTab: React.FC<AdminImagesTabProps> = ({
  images,
  onSaveImageSlot,
  onNotifyError,
}) => {
  const [busyKey, setBusyKey] = useState<ImageSlotKey | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  const handleFileSelected = async (
    key: ImageSlotKey,
    maxWidth: number,
    file?: File | null
  ) => {
    if (!file) return;
    setBusyKey(key);
    setErrorMap((prev) => ({ ...prev, [key]: '' }));
    setStatusMap((prev) => ({ ...prev, [key]: 'กำลังเตรียมรูปภาพ...' }));

    try {
      const compressed = await compressImageForSheet(file, maxWidth);
      setStatusMap((prev) => ({
        ...prev,
        [key]: 'กำลังบันทึกรูปภาพ...',
      }));
      await onSaveImageSlot(key, compressed.dataUrl);
      setStatusMap((prev) => ({
        ...prev,
        [key]: 'บันทึกรูปภาพเรียบร้อยแล้ว',
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'อัปโหลดรูปภาพไม่สำเร็จ';
      setErrorMap((prev) => ({
        ...prev,
        [key]: errorMessage,
      }));
      setStatusMap((prev) => ({ ...prev, [key]: '' }));
      onNotifyError(errorMessage);
    } finally {
      setBusyKey(null);
    }
  };

  const handleClearSlot = async (key: ImageSlotKey) => {
    setBusyKey(key);
    setErrorMap((prev) => ({ ...prev, [key]: '' }));
    try {
      await onSaveImageSlot(key, '');
      setStatusMap((prev) => ({ ...prev, [key]: 'ล้างค่ารูปภาพแล้ว' }));
    } catch (err) {
      setErrorMap((prev) => ({
        ...prev,
        [key]: err instanceof Error ? err.message : 'ล้างค่ารูปภาพไม่สำเร็จ',
      }));
    } finally {
      setBusyKey(null);
    }
  };

  const brandSlots = IMAGE_SLOT_CONFIG.filter((s) => s.group === 'brand');
  const portfolioSlots = IMAGE_SLOT_CONFIG.filter((s) => s.group === 'portfolio');

  const renderSlotCard = (slot: (typeof IMAGE_SLOT_CONFIG)[number]) => {
    const customSrc = images[slot.key];
    const previewSrc = customSrc || getFallbackPreview(slot.key);
    const isBusy = busyKey === slot.key;

    return (
      <div
        key={slot.key}
        className="flex flex-col justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-4"
      >
        <div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)]">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={slot.label}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-[var(--portal-muted)]">
                <ImageIcon className="h-7 w-7 opacity-45" />
                <span className="mt-1 text-xs">ยังไม่มีรูปภาพ</span>
              </div>
            )}
          </div>

          <div className="mt-3">
            <p className="font-semibold text-sm text-[var(--portal-ink)]">{slot.label}</p>
            <p className="mt-0.5 text-xs text-[var(--portal-muted)]">{slot.description}</p>
            <p className="mt-1 text-[11px] font-medium text-[var(--portal-muted)]">
              {customSrc ? 'อัปโหลดรูปแล้ว' : 'ภาพเริ่มต้น'}
            </p>
          </div>

          {statusMap[slot.key] && (
            <p className="mt-2 text-xs font-medium text-emerald-700">{statusMap[slot.key]}</p>
          )}
          {errorMap[slot.key] && (
            <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
              {errorMap[slot.key]}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <label
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--portal-primary)' }}
          >
            <Upload className="h-3.5 w-3.5" />
            {isBusy ? 'กำลังประมวลผล...' : 'เลือกรูปและบันทึก'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={isBusy}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleFileSelected(slot.key, slot.maxWidth, file);
                e.currentTarget.value = '';
              }}
            />
          </label>

          {customSrc && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleClearSlot(slot.key)}
              aria-label={`ล้างรูปภาพ ${slot.label}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--portal-border)] text-[var(--portal-muted)] hover:bg-[var(--portal-surface-alt)] hover:text-[var(--portal-ink)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5">
        <h3 className="font-display text-lg font-semibold text-[var(--portal-ink)]">
          จัดการรูปภาพหน้าร้าน
        </h3>
        <p className="mt-1 text-xs text-[var(--portal-muted)]">
          เลือกรูปภาพที่ต้องการแสดงในแต่ละส่วนของหน้าเว็บ รองรับภาพนิ่งและภาพเคลื่อนไหว GIF ระบบจะปรับขนาดและบันทึกให้อัตโนมัติทันที
        </p>
      </div>

      <section className="space-y-3">
        <h4 className="font-display text-base font-semibold text-[var(--portal-ink)]">
          รูปโปรไฟล์ ปก ไอคอน และแบนเนอร์
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brandSlots.map(renderSlotCard)}
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="font-display text-base font-semibold text-[var(--portal-ink)]">
          ภาพตัวอย่างผลงานในสไลด์หน้าเว็บ
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolioSlots.map(renderSlotCard)}
        </div>
      </section>
    </div>
  );
};
