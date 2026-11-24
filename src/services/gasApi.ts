import type { PortalData, QueueItem, ReviewItem } from '../types/portal';
import { normalizePortalResponse } from '../utils/queueLogic';

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbxzsbJ29fcsy0jojSxsbdRBerDsvnNmL0H5QYHZ06MDTejru3O9IgDmgeOT9FJs3ILs/exec';

export const GAS_URL: string =
  (import.meta.env.VITE_APPS_SCRIPT_URL && import.meta.env.VITE_APPS_SCRIPT_URL.trim()) ||
  DEFAULT_GAS_URL;

export type GasPayload =
  | { action: 'saveSettings'; data: Record<string, unknown> }
  | { action: 'saveQueue'; data: QueueItem }
  | { action: 'syncQueues'; data: QueueItem[] }
  | { action: 'deleteQueue'; id: string }
  | { action: 'saveReview'; data: ReviewItem }
  | { action: 'deleteReview'; id: string };

export async function fetchPortalData(): Promise<PortalData> {
  const response = await fetch(GAS_URL, {
    method: 'GET',
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (HTTP ${response.status})`);
  }
  const json = await response.json();
  return normalizePortalResponse(json);
}

export async function postGasAction(payload: GasPayload): Promise<{ status?: string; message?: string }> {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`บันทึกข้อมูลไม่สำเร็จ (HTTP ${response.status})`);
  }

  const text = await response.text();
  let parsed: { status?: string; message?: string };
  try {
    parsed = JSON.parse(text) as { status?: string; message?: string };
  } catch {
    return { status: 'success' };
  }
  if (parsed && parsed.status === 'error') {
    throw new Error(parsed.message || 'บันทึกข้อมูลไม่สำเร็จ');
  }
  return parsed;
}

export function saveSettingsToSheet(data: Record<string, unknown>) {
  return postGasAction({ action: 'saveSettings', data });
}

export function saveQueueToSheet(queueObject: QueueItem) {
  return postGasAction({ action: 'saveQueue', data: queueObject });
}

export function syncQueuesToSheet(queuesArray: QueueItem[]) {
  return postGasAction({ action: 'syncQueues', data: queuesArray });
}

export function deleteQueueFromSheet(queueId: string) {
  return postGasAction({ action: 'deleteQueue', id: queueId });
}

export function saveReviewToSheet(reviewObject: ReviewItem) {
  return postGasAction({ action: 'saveReview', data: reviewObject });
}

export function deleteReviewFromSheet(reviewId: string) {
  return postGasAction({ action: 'deleteReview', id: reviewId });
}
