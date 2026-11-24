import {
  BACKGROUND_EFFECTS,
  DEFAULT_CUSTOM_THEME,
  DEFAULT_PROFILE,
  IMAGE_SLOT_CONFIG,
  PASTEL_THEMES,
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
  WorkStatus,
} from '../types/portal';

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

export function calculateRevenueSummary(queues: QueueItem[]): RevenueSummary {
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
    if (q.workStatus === 'done') {
      completedCount += 1;
    } else {
      activeCount += 1;
    }
    if (q.isRush && q.workStatus !== 'done') {
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

const VALID_WORK_STATUS: WorkStatus[] = ['waiting', 'sketch', 'lineart', 'coloring', 'done'];
const VALID_PAYMENT_STATUS: PaymentStatus[] = ['unpaid', 'deposit', 'paid'];

export function normalizeQueueItem(raw: Record<string, unknown>, fallbackOrder: number): QueueItem {
  const now = new Date();
  const fullPrice = Number(raw.fullPrice) || 0;
  const paidAmount = Number(raw.paidAmount) || 0;
  const rawWork = String(raw.workStatus || 'waiting') as WorkStatus;
  const rawPay = String(raw.paymentStatus || '') as PaymentStatus;

  return {
    id: String(raw.id || `q-${Date.now()}-${fallbackOrder}`),
    queueNo: String(raw.queueNo || `Q-${String(fallbackOrder).padStart(3, '0')}`),
    clientName: String(raw.clientName || ''),
    workType: String(raw.workType || 'Chibi'),
    channel: String(raw.channel || 'X (Twitter)'),
    details: String(raw.details || ''),
    fullPrice,
    paidAmount,
    month: Number(raw.month) || now.getMonth() + 1,
    year: Number(raw.year) || now.getFullYear(),
    deadline: String(raw.deadline || ''),
    paymentStatus: VALID_PAYMENT_STATUS.includes(rawPay)
      ? rawPay
      : derivePaymentStatus(fullPrice, paidAmount),
    workStatus: VALID_WORK_STATUS.includes(rawWork) ? rawWork : 'waiting',
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
    const val = settings[slot.key];
    if (typeof val === 'string' && val.trim().length > 0) {
      images[slot.key as ImageSlotKey] = val.trim();
    }
  }

  const rawQueues = Array.isArray(payload.queues) ? payload.queues : [];
  const queues = sortQueues(
    rawQueues
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item, idx) => normalizeQueueItem(item, idx + 1))
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
