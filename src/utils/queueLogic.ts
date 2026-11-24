import {
  BACKGROUND_EFFECTS,
  DEFAULT_CHANNELS,
  DEFAULT_CUSTOM_THEME,
  DEFAULT_PROFILE,
  DEFAULT_WORK_STATUSES,
  DEFAULT_WORK_TYPES,
  IMAGE_SLOT_CONFIG,
  PASTEL_THEMES,
  STATUS_COLOR_PALETTE,
  type StatusBadgePalette,
} from '../constants/themes';
import type {
  BackgroundEffectId,
  CustomThemeColors,
  ImageSlotKey,
  PaymentStatus,
  PortalData,
  PortalImages,
  ProfileSettings,
  QueueItem,
  ReviewItem,
  StatusColorId,
  WorkStatus,
  WorkStatusOption,
} from '../types/portal';
import { resolveImageFromSettings } from './imageChunking';

export { resolveImageFromSettings };

export interface ResolvedWorkStatusDisplay {
  id: string;
  label: string;
  color: StatusColorId;
  palette: StatusBadgePalette;
  step: number;
  totalSteps: number;
  progressPercent: number;
  isKnown: boolean;
  isCompleted: boolean;
}

const VALID_STATUS_COLORS = new Set<StatusColorId>([
  'gray',
  'yellow',
  'sky',
  'purple',
  'pink',
  'orange',
  'green',
]);

export function resolveWorkStatusDisplay(
  workStatus: string,
  customStatuses: WorkStatusOption[] = DEFAULT_WORK_STATUSES
): ResolvedWorkStatusDisplay {
  const list = customStatuses.length > 0 ? customStatuses : DEFAULT_WORK_STATUSES;
  const normalizedTarget = (workStatus || '').trim();
  const idx = list.findIndex(
    (s) => s.id === normalizedTarget || s.label === normalizedTarget
  );

  if (idx >= 0) {
    const matched = list[idx];
    const totalSteps = list.length;
    const progressPercent =
      totalSteps <= 1 ? 100 : Math.round(15 + (idx / (totalSteps - 1)) * 85);
    const safeColor: StatusColorId = VALID_STATUS_COLORS.has(matched.color)
      ? matched.color
      : 'gray';
    return {
      id: matched.id,
      label: matched.label,
      color: safeColor,
      palette: STATUS_COLOR_PALETTE[safeColor],
      step: idx + 1,
      totalSteps,
      progressPercent,
      isKnown: true,
      isCompleted: idx === totalSteps - 1,
    };
  }

  return {
    id: normalizedTarget || 'unknown',
    label: normalizedTarget || 'ไม่ระบุสถานะ',
    color: 'gray',
    palette: STATUS_COLOR_PALETTE.gray,
    step: 0,
    totalSteps: list.length,
    progressPercent: 0,
    isKnown: false,
    isCompleted: false,
  };
}

export function isQueueCompleted(
  workStatus: string,
  customStatuses: WorkStatusOption[] = DEFAULT_WORK_STATUSES
): boolean {
  const list = customStatuses.length > 0 ? customStatuses : DEFAULT_WORK_STATUSES;
  const last = list[list.length - 1];
  if (!last) return workStatus === 'done';
  return workStatus === last.id || workStatus === last.label;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalPaid: number;
  totalUnpaid: number;
  totalCount: number;
  activeCount: number;
  completedCount: number;
  rushCount: number;
}

export interface LoyaltySummary {
  clientName: string;
  totalPoints: number;
  reviewCount: number;
  latestDate: string;
}

export function calculateRevenueSummary(
  queues: QueueItem[],
  customStatuses: WorkStatusOption[] = DEFAULT_WORK_STATUSES
): RevenueSummary {
  let totalRevenue = 0;
  let totalPaid = 0;
  let activeCount = 0;
  let completedCount = 0;
  let rushCount = 0;

  for (const q of queues) {
    const full = Number(q.fullPrice) || 0;
    const paid = Math.min(Math.max(Number(q.paidAmount) || 0, 0), full > 0 ? full : Number.MAX_SAFE_INTEGER);
    totalRevenue += full;
    totalPaid += paid;
    const completed = isQueueCompleted(q.workStatus, customStatuses);
    if (completed) {
      completedCount += 1;
    } else {
      activeCount += 1;
    }
    if (q.isRush && !completed) {
      rushCount += 1;
    }
  }

  return {
    totalRevenue,
    totalPaid,
    totalUnpaid: Math.max(totalRevenue - totalPaid, 0),
    totalCount: queues.length,
    activeCount,
    completedCount,
    rushCount,
  };
}

export function sortQueues(queues: QueueItem[]): QueueItem[] {
  return [...queues].sort((a, b) => {
    const orderDiff = (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0);
    if (orderDiff !== 0) return orderDiff;
    return a.queueNo.localeCompare(b.queueNo, undefined, { numeric: true });
  });
}

export function filterQueues(
  queues: QueueItem[],
  options: {
    query?: string;
    workStatus?: WorkStatus | 'all';
    paymentStatus?: PaymentStatus | 'all';
    month?: number | 'all';
    year?: number | 'all';
  }
): QueueItem[] {
  const q = (options.query || '').trim().toLowerCase();
  return sortQueues(queues).filter((item) => {
    if (options.workStatus && options.workStatus !== 'all' && item.workStatus !== options.workStatus) {
      return false;
    }
    if (options.paymentStatus && options.paymentStatus !== 'all' && item.paymentStatus !== options.paymentStatus) {
      return false;
    }
    if (options.month && options.month !== 'all' && Number(item.month) !== Number(options.month)) {
      return false;
    }
    if (options.year && options.year !== 'all' && Number(item.year) !== Number(options.year)) {
      return false;
    }
    if (q) {
      const hay = `${item.queueNo} ${item.clientName} ${item.workType} ${item.channel} ${item.details}`.toLowerCase();
      return hay.includes(q);
    }
    return true;
  });
}

export function reorderQueueList(
  queues: QueueItem[],
  index: number,
  direction: 'up' | 'down'
): QueueItem[] {
  const sorted = sortQueues(queues);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= sorted.length || targetIndex < 0 || targetIndex >= sorted.length) {
    return sorted;
  }
  const next = [...sorted];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
}

export function aggregateLoyaltyPoints(reviews: ReviewItem[]): LoyaltySummary[] {
  const map = new Map<string, LoyaltySummary>();
  for (const rev of reviews) {
    const cleanName = (rev.clientName || '').trim();
    if (!cleanName) continue;
    const key = cleanName.toLowerCase();
    const existing = map.get(key);
    const pts = Number(rev.points) || 0;
    if (existing) {
      existing.totalPoints += pts;
      existing.reviewCount += 1;
      if (rev.date && rev.date > existing.latestDate) {
        existing.latestDate = rev.date;
      }
    } else {
      map.set(key, {
        clientName: cleanName,
        totalPoints: pts,
        reviewCount: 1,
        latestDate: rev.date || '',
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);
}

export function searchLoyaltyByClient(reviews: ReviewItem[], query: string): LoyaltySummary[] {
  const q = query.trim().toLowerCase();
  const all = aggregateLoyaltyPoints(reviews);
  if (!q) return all;
  return all.filter((entry) => entry.clientName.toLowerCase().includes(q));
}

export function derivePaymentStatus(fullPrice: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return 'unpaid';
  if (fullPrice > 0 && paidAmount >= fullPrice) return 'paid';
  return 'deposit';
}

function safeParseJson<T>(value: unknown): T | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return null;
}

const VALID_PAYMENT_STATUS: PaymentStatus[] = ['unpaid', 'deposit', 'paid'];

function normalizeStringList(raw: unknown, fallback: string[]): string[] {
  const parsed = safeParseJson<unknown>(raw);
  if (!Array.isArray(parsed)) return [...fallback];
  const cleaned = parsed
    .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
    .filter((item) => item.length > 0);
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : [...fallback];
}

function normalizeWorkStatuses(raw: unknown): WorkStatusOption[] {
  const parsed = safeParseJson<unknown>(raw);
  if (!Array.isArray(parsed)) return DEFAULT_WORK_STATUSES.map((s) => ({ ...s }));
  const cleaned: WorkStatusOption[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < parsed.length; i += 1) {
    const item = parsed[i];
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const label = String(rec.label ?? '').trim();
    if (!label) continue;
    const id = String(rec.id ?? '').trim() || `status_${i + 1}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    const rawColor = String(rec.color ?? 'gray').trim() as StatusColorId;
    const color: StatusColorId = VALID_STATUS_COLORS.has(rawColor) ? rawColor : 'gray';
    cleaned.push({ id, label, color });
  }

  return cleaned.length > 0 ? cleaned : DEFAULT_WORK_STATUSES.map((s) => ({ ...s }));
}

export function normalizeQueueItem(
  raw: Record<string, unknown>,
  fallbackOrder: number,
  defaultStatusId = 'waiting'
): QueueItem {
  const now = new Date();
  const fullPrice = Number(raw.fullPrice) || 0;
  const paidAmount = Number(raw.paidAmount) || 0;
  const rawWork = String(raw.workStatus || defaultStatusId).trim();
  const rawPay = String(raw.paymentStatus || '') as PaymentStatus;

  return {
    id: String(raw.id || `q-${Date.now()}-${fallbackOrder}`),
    queueNo: String(raw.queueNo || `Q-${String(fallbackOrder).padStart(3, '0')}`),
    clientName: String(raw.clientName || ''),
    workType: String(raw.workType || DEFAULT_WORK_TYPES[0]),
    channel: String(raw.channel || DEFAULT_CHANNELS[0]),
    details: String(raw.details || ''),
    fullPrice,
    paidAmount,
    month: Number(raw.month) || now.getMonth() + 1,
    year: Number(raw.year) || now.getFullYear(),
    deadline: String(raw.deadline || ''),
    paymentStatus: VALID_PAYMENT_STATUS.includes(rawPay)
      ? rawPay
      : derivePaymentStatus(fullPrice, paidAmount),
    workStatus: rawWork || defaultStatusId,
    isRush: raw.isRush === true || raw.isRush === 'true' || raw.isRush === 1 || raw.isRush === 'TRUE',
    sortOrder: Number(raw.sortOrder) || fallbackOrder,
  };
}

export function normalizeReviewItem(raw: Record<string, unknown>, idx: number): ReviewItem {
  return {
    id: String(raw.id || `rev-${Date.now()}-${idx}`),
    clientName: String(raw.clientName || ''),
    rating: Math.min(5, Math.max(1, Number(raw.rating) || 5)),
    comment: String(raw.comment || ''),
    points: Math.max(0, Number(raw.points) || 0),
    date: String(raw.date || new Date().toISOString().slice(0, 10)),
    workType: raw.workType ? String(raw.workType) : undefined,
  };
}

export function normalizePortalResponse(raw: unknown): PortalData {
  const payload = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const settings = (
    payload.settings && typeof payload.settings === 'object' ? payload.settings : {}
  ) as Record<string, unknown>;

  const parsedProfile = safeParseJson<Partial<ProfileSettings>>(settings.profile) || {};
  const profile: ProfileSettings = {
    ...DEFAULT_PROFILE,
    ...parsedProfile,
    bankInfo: {
      ...DEFAULT_PROFILE.bankInfo,
      ...(parsedProfile.bankInfo || {}),
    },
    socialLinks:
      Array.isArray(parsedProfile.socialLinks) && parsedProfile.socialLinks.length > 0
        ? parsedProfile.socialLinks
        : DEFAULT_PROFILE.socialLinks,
  };

  const rawThemeId = typeof settings.activeThemeId === 'string' && settings.activeThemeId
    ? settings.activeThemeId
    : PASTEL_THEMES[0].id;
  const isKnownPreset = PASTEL_THEMES.some((t) => t.id === rawThemeId);
  const activeThemeId = rawThemeId === 'custom' || isKnownPreset ? rawThemeId : PASTEL_THEMES[0].id;

  const parsedCustomColors = safeParseJson<Partial<CustomThemeColors>>(settings.customThemeColors);
  const customThemeColors: CustomThemeColors = {
    ...DEFAULT_CUSTOM_THEME,
    ...(parsedCustomColors || {}),
  };

  const rawEffect = String(settings.backgroundEffect || 'sakura') as BackgroundEffectId;
  const backgroundEffect: BackgroundEffectId = BACKGROUND_EFFECTS.some((e) => e.id === rawEffect)
    ? rawEffect
    : 'sakura';

  const images: PortalImages = {};
  for (const slot of IMAGE_SLOT_CONFIG) {
    const resolved = resolveImageFromSettings(settings, slot.key);
    if (resolved.length > 0) {
      images[slot.key as ImageSlotKey] = resolved;
    }
  }

  const customWorkTypes = normalizeStringList(
    settings.customWorkTypes,
    DEFAULT_WORK_TYPES
  );
  const customWorkStatuses = normalizeWorkStatuses(settings.customWorkStatuses);
  const customChannels = normalizeStringList(
    settings.customChannels,
    DEFAULT_CHANNELS
  );
  const defaultStatusId = customWorkStatuses[0]?.id || 'waiting';

  const rawQueues = Array.isArray(payload.queues) ? payload.queues : [];
  const queues = sortQueues(
    rawQueues
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item, idx) => normalizeQueueItem(item, idx + 1, defaultStatusId))
  );

  const rawReviews = Array.isArray(payload.reviews) ? payload.reviews : [];
  const reviews = rawReviews
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item, idx) => normalizeReviewItem(item, idx + 1));

  return {
    profile,
    activeThemeId,
    customThemeColors,
    backgroundEffect,
    images,
    queues,
    reviews,
    customWorkTypes,
    customWorkStatuses,
    customChannels,
  };
}

export function resolveActiveThemeColors(
  activeThemeId: string,
  customThemeColors: CustomThemeColors
): CustomThemeColors {
  if (activeThemeId === 'custom') {
    return customThemeColors;
  }
  const preset = PASTEL_THEMES.find((t) => t.id === activeThemeId);
  return preset ? preset.colors : PASTEL_THEMES[0].colors;
}

export function formatBaht(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}
