import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { BackgroundEffects } from './components/BackgroundEffects';
import { PaymentModal } from './components/PaymentModal';
import { PublicPortal } from './components/PublicPortal';
import {
  DEFAULT_CUSTOM_THEME,
  DEFAULT_PROFILE,
  PASTEL_THEMES,
} from './constants/themes';
import {
  deleteQueueFromSheet,
  deleteReviewFromSheet,
  fetchPortalData,
  saveQueueToSheet,
  saveReviewToSheet,
  saveSettingsToSheet,
  syncQueuesToSheet,
} from './services/gasApi';
import type {
  BackgroundEffectId,
  CustomThemeColors,
  ImageSlotKey,
  PortalData,
  ProfileSettings,
  QueueItem,
  ReviewItem,
} from './types/portal';
import { resolveActiveThemeColors, sortQueues } from './utils/queueLogic';

const INITIAL_PORTAL_DATA: PortalData = {
  profile: DEFAULT_PROFILE,
  activeThemeId: PASTEL_THEMES[0].id,
  customThemeColors: DEFAULT_CUSTOM_THEME,
  backgroundEffect: 'sakura',
  images: {},
  queues: [],
  reviews: [],
};

export default function App() {
  const [data, setData] = useState<PortalData>(INITIAL_PORTAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadFromSheets = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const fresh = await fetchPortalData();
      setData(fresh);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลได้');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Immediate GET fetch on page load — zero URL prompt popups
  useEffect(() => {
    loadFromSheets(false);
  }, [loadFromSheets]);

  // Apply active theme CSS custom properties globally so all visitors see the admin-selected theme
  const resolvedColors = useMemo(
    () => resolveActiveThemeColors(data.activeThemeId, data.customThemeColors),
    [data.activeThemeId, data.customThemeColors]
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--portal-bg', resolvedColors.bg);
    root.style.setProperty('--portal-surface', resolvedColors.surface);
    root.style.setProperty('--portal-surface-alt', resolvedColors.surfaceAlt);
    root.style.setProperty('--portal-border', resolvedColors.border);
    root.style.setProperty('--portal-primary', resolvedColors.primary);
    root.style.setProperty('--portal-secondary', resolvedColors.secondary);
    root.style.setProperty('--portal-ink', resolvedColors.ink);
    root.style.setProperty('--portal-muted', resolvedColors.muted);
  }, [resolvedColors]);

  // Sync dynamic page title, favicon, and iOS apple-touch-icon (img_icon -> fallback img_avatar)
  useEffect(() => {
    if (data.profile.studioName) {
      document.title = `${data.profile.studioName} — Queue Tracking & Bio-Link Portal`;
    }

    const iconDataUrl = data.images.img_icon || data.images.img_avatar || '';
    if (!iconDataUrl) {
      if (!isLoading) {
        try {
          localStorage.removeItem('cached_apple_touch_icon');
        } catch {
          // Ignore storage restrictions
        }
      }
      return;
    }

    let faviconLink =
      document.getElementById('favicon-icon') as HTMLLinkElement | null ||
      document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.id = 'favicon-icon';
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = iconDataUrl;

    let appleTouchLink =
      document.getElementById('apple-touch-icon') as HTMLLinkElement | null ||
      document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleTouchLink) {
      appleTouchLink = document.createElement('link');
      appleTouchLink.id = 'apple-touch-icon';
      appleTouchLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchLink);
    }
    appleTouchLink.href = iconDataUrl;

    try {
      localStorage.setItem('cached_apple_touch_icon', iconDataUrl);
    } catch {
      // Ignore storage quota or private browsing errors
    }
  }, [data.profile.studioName, data.images.img_icon, data.images.img_avatar, isLoading]);

  // Queue Actions
  const handleSaveQueue = async (queue: QueueItem) => {
    await saveQueueToSheet(queue);
    setData((prev) => {
      const exists = prev.queues.some((item) => item.id === queue.id);
      const nextQueues = exists
        ? prev.queues.map((item) => (item.id === queue.id ? queue : item))
        : [...prev.queues, queue];
      return { ...prev, queues: sortQueues(nextQueues) };
    });
    showToast(`บันทึกคิวงาน ${queue.queueNo} ลง Google Sheets แล้ว`);
  };

  const handleDeleteQueue = async (id: string) => {
    await deleteQueueFromSheet(id);
    setData((prev) => ({
      ...prev,
      queues: prev.queues.filter((item) => item.id !== id),
    }));
    showToast('ลบคิวงานเรียบร้อยแล้ว');
  };

  const handleSyncQueues = async (reordered: QueueItem[]) => {
    setData((prev) => ({ ...prev, queues: reordered }));
    try {
      await syncQueuesToSheet(reordered);
      showToast('บันทึกลำดับคิวงานทั้งหมดลง Google Sheets แล้ว');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'บันทึกลำดับคิวงานไม่สำเร็จ',
        'error'
      );
    }
  };

  // Review & Loyalty Points Actions
  const handleSaveReview = async (review: ReviewItem) => {
    await saveReviewToSheet(review);
    setData((prev) => ({
      ...prev,
      reviews: [review, ...prev.reviews.filter((r) => r.id !== review.id)],
    }));
    showToast(`บันทึกรีวิวและ +${review.points} แต้มให้ ${review.clientName} แล้ว`);
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await deleteReviewFromSheet(id);
      setData((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((r) => r.id !== id),
      }));
      showToast('ลบรีวิวเรียบร้อยแล้ว');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ลบรีวิวไม่สำเร็จ', 'error');
    }
  };

  // Admin-only Theme & Background Effect Actions
  const handleChangeThemePreview = (
    activeThemeId: string,
    customThemeColors: CustomThemeColors,
    backgroundEffect: BackgroundEffectId
  ) => {
    setData((prev) => ({
      ...prev,
      activeThemeId,
      customThemeColors,
      backgroundEffect,
    }));
  };

  const handleSaveThemeSettings = async (payload: {
    activeThemeId: string;
    customThemeColors: CustomThemeColors;
    backgroundEffect: BackgroundEffectId;
  }) => {
    try {
      await saveSettingsToSheet({
        activeThemeId: payload.activeThemeId,
        customThemeColors: payload.customThemeColors,
        backgroundEffect: payload.backgroundEffect,
      });
      setData((prev) => ({
        ...prev,
        activeThemeId: payload.activeThemeId,
        customThemeColors: payload.customThemeColors,
        backgroundEffect: payload.backgroundEffect,
      }));
      showToast('บันทึกธีมสีและเอฟเฟกต์ลง Google Sheets เรียบร้อยแล้ว');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'บันทึกธีมไม่สำเร็จ', 'error');
    }
  };

  // Separate Image Slot Action (never merged into profile)
  const handleSaveImageSlot = async (key: ImageSlotKey, dataUrl: string) => {
    await saveSettingsToSheet({ [key]: dataUrl });
    setData((prev) => {
      const nextImages = { ...prev.images };
      if (dataUrl) {
        nextImages[key] = dataUrl;
      } else {
        delete nextImages[key];
      }
      return { ...prev, images: nextImages };
    });
    showToast(dataUrl ? 'บันทึกรูปภาพเรียบร้อยแล้ว' : 'ล้างค่ารูปภาพเรียบร้อยแล้ว');
  };

  // Profile & BankInfo Action
  const handleSaveProfile = async (
    nextProfile: ProfileSettings,
    successLabel: string
  ) => {
    try {
      await saveSettingsToSheet({ profile: nextProfile });
      setData((prev) => ({ ...prev, profile: nextProfile }));
      showToast(successLabel);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'บันทึกข้อมูลไม่สำเร็จ', 'error');
    }
  };

  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setViewMode('admin');
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--portal-bg)] text-[var(--portal-ink)] transition-colors duration-200">
      <BackgroundEffects
        effect={data.backgroundEffect}
        primaryColor={resolvedColors.primary}
        secondaryColor={resolvedColors.secondary}
      />

      {viewMode === 'admin' && isAdminAuthenticated ? (
        <AdminDashboard
          data={data}
          isRefreshing={isRefreshing}
          onRefresh={() => loadFromSheets(true)}
          onBackToPublic={() => setViewMode('public')}
          onLogout={() => {
            setIsAdminAuthenticated(false);
            setViewMode('public');
            showToast('ออกจากระบบแอดมินแล้ว');
          }}
          onSaveQueue={handleSaveQueue}
          onDeleteQueue={handleDeleteQueue}
          onSyncQueues={handleSyncQueues}
          onSaveReview={handleSaveReview}
          onDeleteReview={handleDeleteReview}
          onChangeThemePreview={handleChangeThemePreview}
          onSaveThemeSettings={handleSaveThemeSettings}
          onSaveImageSlot={handleSaveImageSlot}
          onSaveProfile={handleSaveProfile}
        />
      ) : (
        <PublicPortal
          data={data}
          isLoading={isLoading}
          loadError={loadError}
          onRetryLoad={() => loadFromSheets(false)}
          onOpenPayment={() => setIsPaymentOpen(true)}
          onOpenAdminLogin={handleOpenAdmin}
        />
      )}

      <PaymentModal
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        bankInfo={data.profile.bankInfo}
        studioName={data.profile.studioName}
        onNotify={(msg) => showToast(msg)}
      />

      <AdminLoginModal
        open={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        expectedPassword={data.profile.adminPassword || '1234'}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsAdminAuthenticated(true);
          setViewMode('admin');
        }}
      />

      {toast && (
        <div className="fixed bottom-24 inset-x-0 z-50 flex justify-center px-4 pointer-events-none mb-[env(safe-area-inset-bottom)]">
          <div
            role="status"
            aria-live="polite"
            className="animate-toast-enter pointer-events-auto w-fit max-w-[90vw] px-5 py-3 rounded-2xl border shadow-lg text-center text-sm font-medium leading-relaxed break-words"
            style={
              toast.type === 'error'
                ? {
                    backgroundColor: '#FFF1F2',
                    borderColor: '#FECDD3',
                    color: '#9F1239',
                  }
                : {
                    backgroundColor: 'var(--portal-surface)',
                    borderColor: 'var(--portal-primary)',
                    color: 'var(--portal-ink)',
                  }
            }
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
