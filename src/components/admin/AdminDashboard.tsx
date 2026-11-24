import React, { useState } from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  ListChecks,
  LogOut,
  Palette,
  RefreshCw,
  Settings,
  Star,
} from 'lucide-react';
import type {
  BackgroundEffectId,
  CustomThemeColors,
  ImageSlotKey,
  PortalData,
  ProfileSettings,
  QueueItem,
  ReviewItem,
} from '../../types/portal';
import { AdminImagesTab } from './AdminImagesTab';
import { AdminQueuesTab } from './AdminQueuesTab';
import { AdminReviewsTab } from './AdminReviewsTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminThemeTab } from './AdminThemeTab';

type AdminTabId = 'queues' | 'reviews' | 'theme' | 'images' | 'settings';

interface AdminDashboardProps {
  data: PortalData;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onBackToPublic: () => void;
  onLogout: () => void;
  onSaveQueue: (queue: QueueItem) => Promise<void>;
  onDeleteQueue: (id: string) => Promise<void>;
  onSyncQueues: (queues: QueueItem[]) => Promise<void>;
  onSaveReview: (review: ReviewItem) => Promise<void>;
  onDeleteReview: (id: string) => Promise<void>;
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
  onSaveImageSlot: (key: ImageSlotKey, dataUrl: string) => Promise<void>;
  onSaveProfile: (nextProfile: ProfileSettings, successLabel: string) => Promise<void>;
  onNotifyError: (message: string) => void;
}

const TABS: Array<{ id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'queues', label: 'จัดการคิวงาน', icon: ListChecks },
  { id: 'reviews', label: 'รีวิวและแต้มสะสม', icon: Star },
  { id: 'theme', label: 'ธีมและเอฟเฟกต์', icon: Palette },
  { id: 'images', label: 'รูปภาพและผลงาน', icon: ImageIcon },
  { id: 'settings', label: 'บัญชีและการตั้งค่า', icon: Settings },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  data,
  isRefreshing,
  onRefresh,
  onBackToPublic,
  onLogout,
  onSaveQueue,
  onDeleteQueue,
  onSyncQueues,
  onSaveReview,
  onDeleteReview,
  onChangeThemePreview,
  onSaveThemeSettings,
  onSaveImageSlot,
  onSaveProfile,
  onNotifyError,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('queues');

  return (
    <div className="relative z-10 min-h-screen pb-16">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--portal-border)] bg-[var(--portal-surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToPublic}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-xs font-semibold text-[var(--portal-ink)] hover:border-[var(--portal-primary)] whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              ดูหน้าเว็บจริง
            </button>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate font-display text-base font-semibold text-[var(--portal-ink)]">
                หลังบ้านแอดมิน · {data.profile.studioName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isRefreshing}
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-3.5 py-2 text-xs font-medium text-[var(--portal-ink)] hover:bg-[var(--portal-surface-alt)] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* Admin Navigation Tabs */}
        <div
          role="tablist"
          aria-label="หมวดหมู่การจัดการแอดมิน"
          className="mb-6 flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-1.5"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 sm:text-sm"
                style={
                  active
                    ? {
                        backgroundColor: 'var(--portal-primary)',
                        color: '#FFFFFF',
                      }
                    : {
                        color: 'var(--portal-muted)',
                      }
                }
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab View */}
        {activeTab === 'queues' && (
          <AdminQueuesTab
            queues={data.queues}
            onSaveQueue={onSaveQueue}
            onDeleteQueue={onDeleteQueue}
            onSyncQueues={onSyncQueues}
          />
        )}

        {activeTab === 'reviews' && (
          <AdminReviewsTab
            reviews={data.reviews}
            onSaveReview={onSaveReview}
            onDeleteReview={onDeleteReview}
          />
        )}

        {activeTab === 'theme' && (
          <AdminThemeTab
            activeThemeId={data.activeThemeId}
            customThemeColors={data.customThemeColors}
            backgroundEffect={data.backgroundEffect}
            onChangeThemePreview={onChangeThemePreview}
            onSaveThemeSettings={onSaveThemeSettings}
          />
        )}

        {activeTab === 'images' && (
          <AdminImagesTab
            images={data.images}
            onSaveImageSlot={onSaveImageSlot}
            onNotifyError={onNotifyError}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettingsTab
            profile={data.profile}
            onSaveProfile={onSaveProfile}
          />
        )}
      </main>
    </div>
  );
};
