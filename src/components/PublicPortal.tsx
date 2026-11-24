import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CreditCard,
  Gift,
  Lock,
  Search,
  Star,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_ASSETS,
  PAYMENT_STATUS_META,
  THAI_MONTHS,
  WORK_STATUS_META,
} from '../constants/themes';
import type { PortalData, WorkStatus } from '../types/portal';
import {
  calculateRevenueSummary,
  filterQueues,
  formatBaht,
  searchLoyaltyByClient,
} from '../utils/queueLogic';
import { PortfolioCarousel3D } from './PortfolioCarousel3D';

interface PublicPortalProps {
  data: PortalData;
  isLoading: boolean;
  loadError: string | null;
  onRetryLoad: () => void;
  onOpenPayment: () => void;
  onOpenAdminLogin: () => void;
}

const STATUS_TABS: Array<{ id: WorkStatus | 'all'; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'waiting', label: 'รอคิว' },
  { id: 'sketch', label: 'ร่างภาพ' },
  { id: 'lineart', label: 'ตัดเส้น' },
  { id: 'coloring', label: 'ลงสี' },
  { id: 'done', label: 'เสร็จสิ้น' },
];

export const PublicPortal: React.FC<PublicPortalProps> = ({
  data,
  isLoading,
  loadError,
  onRetryLoad,
  onOpenPayment,
  onOpenAdminLogin,
}) => {
  const { profile, images, queues, reviews } = data;

  const [queueSearch, setQueueSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkStatus | 'all'>('all');
  const [loyaltySearch, setLoyaltySearch] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  const summary = useMemo(() => calculateRevenueSummary(queues), [queues]);

  const filteredQueues = useMemo(
    () =>
      filterQueues(queues, {
        query: queueSearch,
        workStatus: statusFilter,
      }),
    [queues, queueSearch, statusFilter]
  );

  const loyaltyEntries = useMemo(
    () => searchLoyaltyByClient(reviews, loyaltySearch),
    [reviews, loyaltySearch]
  );

  const avatarSrc = images.img_avatar || DEFAULT_ASSETS.avatar;
  const coverSrc = images.img_cover || DEFAULT_ASSETS.cover;

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarSrc]);

  useEffect(() => {
    setCoverFailed(false);
  }, [coverSrc]);

  return (
    <div className="relative z-10 min-h-screen">
      {/* 3-Zone Top Bar Contract: NO theme switcher button, NO URL prompt */}
      <header className="sticky top-0 z-30 border-b border-[var(--portal-border)] bg-[var(--portal-surface)]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-semibold tracking-tight text-[var(--portal-ink)] whitespace-nowrap shrink-0"
          >
            {profile.studioName}
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav
            aria-label="เมนูหลัก"
            className="hidden items-center gap-7 text-sm font-medium text-[var(--portal-muted)] md:flex"
          >
            <a
              href="#portfolio"
              className="transition-colors hover:text-[var(--portal-ink)] whitespace-nowrap shrink-0"
            >
              ผลงาน
            </a>
            <a
              href="#queues"
              className="transition-colors hover:text-[var(--portal-ink)] whitespace-nowrap shrink-0"
            >
              ตารางคิวงาน
            </a>
            <a
              href="#loyalty"
              className="transition-colors hover:text-[var(--portal-ink)] whitespace-nowrap shrink-0"
            >
              เช็กแต้มสะสม
            </a>
            <button
              type="button"
              onClick={onOpenPayment}
              className="transition-colors hover:text-[var(--portal-ink)] whitespace-nowrap shrink-0"
            >
              โอนเงิน
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-4 py-2 text-xs font-semibold text-[var(--portal-ink)] transition-colors hover:border-[var(--portal-primary)] whitespace-nowrap shrink-0"
            >
              <Lock className="h-3.5 w-3.5 text-[var(--portal-primary)]" />
              แอดมิน
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* Compact non-sticky quick nav for mobile viewports */}
        <nav
          aria-label="ลิงก์ด่วนสำหรับมือถือ"
          className="mt-4 flex items-center justify-between gap-2 overflow-x-auto rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-3.5 py-2.5 text-xs font-medium text-[var(--portal-muted)] md:hidden"
        >
          <a href="#portfolio" className="hover:text-[var(--portal-ink)] whitespace-nowrap shrink-0">
            ผลงาน
          </a>
          <span aria-hidden="true">·</span>
          <a href="#queues" className="hover:text-[var(--portal-ink)] whitespace-nowrap shrink-0">
            ตารางคิวงาน
          </a>
          <span aria-hidden="true">·</span>
          <a href="#loyalty" className="hover:text-[var(--portal-ink)] whitespace-nowrap shrink-0">
            เช็กแต้มสะสม
          </a>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onOpenPayment}
            className="font-semibold text-[var(--portal-primary)] whitespace-nowrap shrink-0"
          >
            โอนเงิน
          </button>
        </nav>

        {loadError && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm text-rose-800"
          >
            <span>ไม่สามารถโหลดข้อมูลล่าสุดจาก Google Sheets ได้: {loadError}</span>
            <button
              type="button"
              onClick={onRetryLoad}
              className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 whitespace-nowrap shrink-0"
            >
              ลองเชื่อมต่อใหม่
            </button>
          </div>
        )}

        {/* Hero Section: Balanced 2-Column Editorial Pastel Split */}
        <section className="pt-8 pb-10 md:pt-12 md:pb-12">
          <div className="grid items-stretch gap-8 lg:grid-cols-12">
            {/* Left Column: Studio Identity + Bio-Links + Primary Actions */}
            <div className="flex flex-col justify-between rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6 sm:p-8 lg:col-span-6">
              <div>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)]">
                    {!avatarFailed ? (
                      <img
                        src={avatarSrc}
                        alt={`รูปโปรไฟล์ ${profile.studioName}`}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarFailed(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-xl font-semibold text-[var(--portal-primary)]">
                        {profile.studioName.slice(0, 2)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--portal-muted)]">
                      <span>{profile.handle}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className="font-semibold"
                        style={{
                          color: profile.commissionOpen ? '#287D52' : '#B9384F',
                        }}
                      >
                        {profile.commissionOpen ? 'เปิดรับคิวคอมมิชชัน' : 'ปิดรับคิวชั่วคราว'}
                      </span>
                    </div>
                    <h1
                      className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--portal-ink)] sm:text-3xl"
                      style={{ textWrap: 'balance' }}
                    >
                      {profile.studioName}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--portal-muted)]">
                      {profile.tagline}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-[var(--portal-ink)]/85 sm:text-[15px]">
                  {profile.bio}
                </p>

                <p className="mt-3 text-xs font-medium text-[var(--portal-muted)]">
                  {profile.commissionNote} · {profile.priceStarting}
                </p>

                {/* Primary & Secondary Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href="#queues"
                    className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
                    style={{ backgroundColor: 'var(--portal-primary)' }}
                  >
                    เช็กสถานะคิวงาน
                  </a>
                  <button
                    type="button"
                    onClick={onOpenPayment}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-5 py-2.5 text-sm font-semibold text-[var(--portal-ink)] transition-colors hover:border-[var(--portal-primary)] whitespace-nowrap shrink-0"
                  >
                    <CreditCard className="h-4 w-4 text-[var(--portal-primary)]" />
                    ช่องทางการโอนเงิน
                  </button>
                </div>
              </div>

              {/* Bio-Link Grid */}
              <div className="mt-7 border-t border-[var(--portal-border)] pt-5">
                <p className="mb-3 text-xs font-medium text-[var(--portal-muted)]">
                  ช่องทางติดต่อและรวมลิงก์ทั้งหมด
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {profile.socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)]/70 px-3.5 py-2.5 text-xs font-medium text-[var(--portal-ink)] transition-colors hover:border-[var(--portal-primary)] hover:bg-[var(--portal-surface-alt)] sm:text-sm"
                    >
                      <span className="truncate">{link.label}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--portal-muted)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--portal-primary)]" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Matching-Height Framed Cover Illustration */}
            <div className="overflow-hidden rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-surface)] lg:col-span-6">
              <div className="relative h-full min-h-[260px] w-full bg-[var(--portal-surface-alt)]">
                {!coverFailed ? (
                  <img
                    src={coverSrc}
                    alt={`ภาพหน้าปก ${profile.studioName}`}
                    referrerPolicy="no-referrer"
                    onError={() => setCoverFailed(true)}
                    className="h-full w-full object-cover lg:h-full"
                  />
                ) : (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center p-8 text-center">
                    <p className="font-display text-xl font-semibold text-[var(--portal-ink)]">
                      {profile.studioName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--portal-muted)]">
                      {profile.tagline}
                    </p>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-6 pt-12 text-white">
                  <p className="text-xs font-semibold text-white/90">
                    ข้อตกลงคอมมิชชันโดยย่อ
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white">
                    {profile.tosSummary}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Full-Width Studio Snapshot Strip */}
          <div className="mt-6 grid grid-cols-2 divide-y divide-[var(--portal-border)] rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4">
              <p className="text-xs text-[var(--portal-muted)]">คิวที่กำลังดำเนินการ</p>
              <p className="font-mono-num mt-1 text-2xl font-semibold text-[var(--portal-ink)]">
                {summary.activeCount}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-[var(--portal-muted)]">งานที่ส่งมอบแล้ว</p>
              <p className="font-mono-num mt-1 text-2xl font-semibold text-[var(--portal-ink)]">
                {summary.completedCount}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-[var(--portal-muted)]">รีวิวจากลูกค้า</p>
              <p className="font-mono-num mt-1 text-2xl font-semibold text-[var(--portal-ink)]">
                {reviews.length}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-[var(--portal-muted)]">ราคาเริ่มต้น</p>
              <p className="mt-1 font-display text-lg font-semibold text-[var(--portal-primary)] sm:text-xl">
                {profile.priceStarting}
              </p>
            </div>
          </div>

          {/* Optional Uploaded Banner from Google Sheets (img_banner) */}
          {images.img_banner && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
              <img
                src={images.img_banner}
                alt="แบนเนอร์ประชาสัมพันธ์สตูดิโอ"
                referrerPolicy="no-referrer"
                className="max-h-52 w-full object-cover"
              />
            </div>
          )}
        </section>

        {/* 3D Portfolio Carousel */}
        <PortfolioCarousel3D images={images} />

        {/* Live Queue Tracking Section */}
        <section id="queues" className="py-10 md:py-14" aria-labelledby="queues-heading">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--portal-muted)]">
                อัปเดตตรงจาก Google Sheets
              </p>
              <h2
                id="queues-heading"
                className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--portal-ink)] sm:text-3xl"
              >
                ตารางติดตามคิวงาน
              </h2>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
              <input
                type="search"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                aria-label="ค้นหาคิวงานด้วยชื่อลูกค้าหรือเลขคิว"
                placeholder="ค้นหาชื่อลูกค้า, เลขคิว, ประเภทงาน..."
                className="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--portal-ink)] placeholder:text-[var(--portal-muted)]/75"
              />
            </div>
          </div>

          {/* Interactive Status Filter Tabs */}
          <div
            role="tablist"
            aria-label="กรองตามสถานะงาน"
            className="mt-5 flex flex-wrap items-center gap-1.5 rounded-xl bg-[var(--portal-surface-alt)] p-1.5"
          >
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(tab.id)}
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--portal-surface)',
                          color: 'var(--portal-primary)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        }
                      : {
                          color: 'var(--portal-muted)',
                        }
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Queue Table Container */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
            {isLoading ? (
              <div className="divide-y divide-[var(--portal-border)] p-4">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between gap-4 py-4 animate-pulse"
                  >
                    <div className="h-4 w-20 rounded bg-[var(--portal-surface-alt)]" />
                    <div className="h-4 w-40 rounded bg-[var(--portal-surface-alt)]" />
                    <div className="h-4 w-28 rounded bg-[var(--portal-surface-alt)]" />
                    <div className="h-4 w-24 rounded bg-[var(--portal-surface-alt)]" />
                  </div>
                ))}
              </div>
            ) : filteredQueues.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-display text-base font-medium text-[var(--portal-ink)]">
                  {queues.length === 0
                    ? 'ยังไม่มีคิวงานในตารางขณะนี้'
                    : 'ไม่พบคิวงานที่ตรงกับคำค้นหา'}
                </p>
                <p className="mt-1 text-xs text-[var(--portal-muted)]">
                  {queues.length === 0
                    ? 'สามารถทักจองคิวผ่านช่องทางติดต่อด้านบน หรือให้แอดมินเพิ่มคิวงานได้ทันที'
                    : 'ลองล้างคำค้นหาหรือเปลี่ยนตัวกรองสถานะเพื่อดูคิวทั้งหมด'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--portal-border)] bg-[var(--portal-surface-alt)]/70 text-xs font-semibold text-[var(--portal-muted)]">
                        <th className="px-5 py-3.5">เลขคิว</th>
                        <th className="px-5 py-3.5">ลูกค้า</th>
                        <th className="px-5 py-3.5">ประเภทงาน / รายละเอียด</th>
                        <th className="px-5 py-3.5">กำหนดส่ง</th>
                        <th className="px-5 py-3.5">การชำระเงิน</th>
                        <th className="px-5 py-3.5">สถานะงาน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--portal-border)]">
                      {filteredQueues.map((q) => {
                        const workMeta = WORK_STATUS_META[q.workStatus];
                        const payMeta = PAYMENT_STATUS_META[q.paymentStatus];
                        return (
                          <tr
                            key={q.id}
                            className="transition-colors hover:bg-[var(--portal-surface-alt)]/45"
                          >
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono-num font-semibold text-[var(--portal-ink)]">
                                  {q.queueNo}
                                </span>
                                {q.isRush && (
                                  <span
                                    title="งานด่วน"
                                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-700"
                                  >
                                    <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
                                    ด่วน
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                                {THAI_MONTHS[(q.month || 1) - 1]} {q.year}
                              </p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="font-semibold text-[var(--portal-ink)]">
                                {q.clientName}
                              </p>
                              <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                                ช่องทาง: {q.channel}
                              </p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="font-medium text-[var(--portal-ink)]">
                                {q.workType}
                              </p>
                              {q.details && (
                                <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--portal-muted)]">
                                  {q.details}
                                </p>
                              )}
                            </td>
                            <td className="font-mono-num px-5 py-4 align-top text-xs text-[var(--portal-ink)]">
                              {q.deadline || '-'}
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p
                                className="text-xs font-semibold"
                                style={{ color: payMeta.color }}
                              >
                                {payMeta.label}
                              </p>
                              <p className="font-mono-num mt-0.5 text-xs text-[var(--portal-muted)]">
                                ฿{formatBaht(q.paidAmount)} / ฿{formatBaht(q.fullPrice)}
                              </p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p
                                className="text-xs font-semibold"
                                style={{ color: workMeta.color }}
                              >
                                {workMeta.label} ({workMeta.step}/5)
                              </p>
                              <div className="mt-1.5 flex w-28 gap-1" aria-hidden="true">
                                {[1, 2, 3, 4, 5].map((step) => (
                                  <span
                                    key={step}
                                    className="h-1.5 flex-1 rounded-full"
                                    style={{
                                      backgroundColor:
                                        step <= workMeta.step
                                          ? workMeta.color
                                          : 'var(--portal-border)',
                                    }}
                                  />
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List */}
                <div className="divide-y divide-[var(--portal-border)] md:hidden">
                  {filteredQueues.map((q) => {
                    const workMeta = WORK_STATUS_META[q.workStatus];
                    const payMeta = PAYMENT_STATUS_META[q.paymentStatus];
                    return (
                      <div key={q.id} className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-[var(--portal-muted)]">
                              <span className="font-mono-num font-semibold text-[var(--portal-ink)]">
                                {q.queueNo}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{q.channel}</span>
                              {q.isRush && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-semibold text-amber-700">งานด่วน</span>
                                </>
                              )}
                            </div>
                            <p className="mt-0.5 font-semibold text-[var(--portal-ink)]">
                              {q.clientName}
                            </p>
                          </div>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: workMeta.color }}
                          >
                            {workMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--portal-ink)]/85">
                          {q.workType}
                          {q.details ? ` — ${q.details}` : ''}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--portal-muted)]">
                          <span>กำหนดส่ง: {q.deadline || '-'}</span>
                          <span style={{ color: payMeta.color }} className="font-medium">
                            {payMeta.label} (฿{formatBaht(q.paidAmount)}/฿{formatBaht(q.fullPrice)})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Loyalty Points Lookup & Customer Reviews */}
        <section id="loyalty" className="py-10 md:py-14" aria-labelledby="loyalty-heading">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Loyalty Points Search */}
            <div className="rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6 sm:p-7 lg:col-span-5">
              <div className="flex items-center gap-2.5 text-[var(--portal-primary)]">
                <Gift className="h-5 w-5" />
                <span className="text-xs font-semibold">ระบบสะสมแต้มลูกค้าประจำ</span>
              </div>
              <h2
                id="loyalty-heading"
                className="mt-2 font-display text-2xl font-semibold text-[var(--portal-ink)]"
              >
                เช็กแต้มสะสมของคุณ
              </h2>
              <p className="mt-1.5 text-sm text-[var(--portal-muted)]">
                พิมพ์ชื่อหรือแอคเคาท์ที่ใช้สั่งงานเพื่อดูคะแนนสะสมและจำนวนครั้งที่เคยใช้บริการ
              </p>

              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
                <input
                  type="search"
                  value={loyaltySearch}
                  onChange={(e) => setLoyaltySearch(e.target.value)}
                  aria-label="ค้นหาแต้มสะสมด้วยชื่อลูกค้า"
                  placeholder="พิมพ์ชื่อลูกค้าเพื่อเช็กแต้ม..."
                  className="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] py-2.5 pl-10 pr-4 text-sm text-[var(--portal-ink)]"
                />
              </div>

              <div className="mt-5 divide-y divide-[var(--portal-border)]">
                {loyaltyEntries.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[var(--portal-muted)]">
                    {reviews.length === 0
                      ? 'ยังไม่มีข้อมูลแต้มสะสมในระบบ'
                      : 'ไม่พบรายชื่อลูกค้าที่ตรงกับคำค้นหา'}
                  </p>
                ) : (
                  loyaltyEntries.slice(0, 6).map((entry) => (
                    <div
                      key={entry.clientName}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--portal-ink)]">
                          {entry.clientName}
                        </p>
                        <p className="text-xs text-[var(--portal-muted)]">
                          รีวิว {entry.reviewCount} ครั้ง · ล่าสุด {entry.latestDate || '-'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-mono-num text-base font-semibold text-[var(--portal-primary)]">
                          {entry.totalPoints}
                        </span>
                        <span className="ml-1 text-xs text-[var(--portal-muted)]">แต้ม</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Customer Reviews Wall */}
            <div className="lg:col-span-7">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--portal-muted)]">
                    เสียงตอบรับจากผู้ว่าจ้าง
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-[var(--portal-ink)]">
                    รีวิวความประทับใจ
                  </h3>
                </div>
                <span className="font-mono-num text-xs text-[var(--portal-muted)]">
                  ทั้งหมด {reviews.length} รีวิว
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-6 py-14 text-center">
                  <p className="font-display text-base font-medium text-[var(--portal-ink)]">
                    ยังไม่มีรีวิวในระบบ
                  </p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    เมื่อแอดมินบันทึกรีวิวและแต้มสะสม ข้อความความประทับใจจะแสดงที่นี่ทันที
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="flex flex-col justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--portal-ink)]">
                            {rev.clientName}
                          </p>
                          <div
                            className="flex items-center gap-0.5 text-amber-500"
                            aria-label={`คะแนน ${rev.rating} จาก 5 ดาว`}
                          >
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < rev.rating ? 'fill-amber-400 text-amber-500' : 'text-[var(--portal-border)]'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-2.5 text-sm leading-relaxed text-[var(--portal-ink)]/85">
                          “{rev.comment}”
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[var(--portal-border)] pt-3 text-xs text-[var(--portal-muted)]">
                        <span>{rev.date || '-'}</span>
                        <span className="font-mono-num font-medium text-[var(--portal-primary)]">
                          +{rev.points} แต้มสะสม
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[var(--portal-border)] bg-[var(--portal-surface)]/80 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-[var(--portal-muted)] sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {profile.studioName} · {profile.handle}
          </p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onOpenPayment}
              className="hover:text-[var(--portal-ink)]"
            >
              ช่องทางการโอนเงิน
            </button>
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="hover:text-[var(--portal-ink)]"
            >
              เข้าสู่ระบบแอดมิน
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
