import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { DEFAULT_ASSETS } from '../constants/themes';
import type { ImageSlotKey, PortalImages } from '../types/portal';

interface PortfolioCarousel3DProps {
  images: PortalImages;
}

interface SlideItem {
  key: ImageSlotKey;
  src: string;
  title: string;
  category: string;
  index: number;
}

export const PortfolioCarousel3D: React.FC<PortfolioCarousel3DProps> = ({ images }) => {
  const slides: SlideItem[] = DEFAULT_ASSETS.portfolio.map((item, idx) => ({
    key: item.key,
    src: images[item.key] || item.src,
    title: item.title,
    category: item.category,
    index: idx,
  }));

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxSlide, setLightboxSlide] = useState<SlideItem | null>(null);
  const [failedKeys, setFailedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFailedKeys({});
  }, [images]);

  const total = slides.length;

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % total);

  const getRelativeOffset = (index: number) => {
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  const activeSlide = slides[activeIndex];

  return (
    <section
      id="portfolio"
      className="relative py-12 md:py-16"
      aria-labelledby="portfolio-heading"
    >
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--portal-muted)]">
            ตัวอย่างผลงานล่าสุด · แกลเลอรี 3 มิติ
          </p>
          <h2
            id="portfolio-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-[var(--portal-ink)] sm:text-3xl"
            style={{ textWrap: 'balance' }}
          >
            ตัวอย่างงานคอมมิชชัน
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="ดูผลงานก่อนหน้า"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-ink)] transition-colors hover:bg-[var(--portal-surface-alt)]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-mono-num min-w-[3.5rem] text-center text-sm text-[var(--portal-muted)]">
            {activeIndex + 1} / {total}
          </span>
          <button
            type="button"
            onClick={goNext}
            aria-label="ดูผลงานถัดไป"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-ink)] transition-colors hover:bg-[var(--portal-surface-alt)]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 3D Perspective Stage */}
      <div
        className="relative mx-auto flex h-[320px] w-full items-center justify-center overflow-hidden sm:h-[390px] md:h-[430px]"
        style={{ perspective: '1200px' }}
      >
        {slides.map((slide, idx) => {
          const offset = getRelativeOffset(idx);
          const abs = Math.abs(offset);
          const isCenter = offset === 0;
          const visible = abs <= 2;

          const translateX = offset * 54;
          const translateZ = isCenter ? 60 : -abs * 110;
          const rotateY = offset * -24;
          const scale = isCenter ? 1 : abs === 1 ? 0.84 : 0.7;
          const opacity = !visible ? 0 : 1;
          const filter = isCenter
            ? 'none'
            : abs === 1
              ? 'brightness(0.95) saturate(0.92)'
              : 'brightness(0.9) saturate(0.84)';
          const zIndex = 30 - abs * 10;

          return (
            <button
              key={slide.key}
              type="button"
              onClick={() => {
                if (isCenter) {
                  setLightboxSlide(slide);
                } else {
                  setActiveIndex(idx);
                }
              }}
              aria-label={
                isCenter
                  ? `ขยายดูภาพ ${slide.title}`
                  : `เลือกดูผลงาน ${slide.title}`
              }
              className="group absolute w-[78%] max-w-[460px] overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] text-left shadow-md transition-all duration-300 ease-out sm:w-[62%]"
              style={{
                transform: `translate3d(${translateX}%, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                filter,
                zIndex,
                pointerEvents: visible ? 'auto' : 'none',
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--portal-surface-alt)]">
                {!failedKeys[slide.key] ? (
                  <img
                    src={slide.src}
                    alt={`${slide.title} — ${slide.category}`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedKeys((prev) => ({ ...prev, [slide.key]: true }))
                    }
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                    <p className="font-display text-base font-medium text-[var(--portal-ink)]">
                      {slide.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--portal-muted)]">
                      {slide.category}
                    </p>
                  </div>
                )}

                {isCenter && (
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/45 text-white backdrop-blur-xs transition-opacity group-hover:bg-black/65"
                  >
                    <Expand className="h-4 w-4" />
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-medium text-[var(--portal-ink)] sm:text-base">
                    {slide.title}
                  </p>
                  <p className="truncate text-xs text-[var(--portal-muted)]">
                    {slide.category} · ภาพที่ {idx + 1}
                  </p>
                </div>
                {isCenter && (
                  <span className="shrink-0 text-xs font-medium text-[var(--portal-primary)]">
                    ดูภาพเต็ม
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Slide selector bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {slides.map((slide, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={slide.key}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`ไปยังภาพผลงานที่ ${idx + 1}: ${slide.title}`}
              aria-current={isActive ? 'true' : undefined}
              className="h-2.5 rounded-full transition-all duration-200"
              style={{
                width: isActive ? '28px' : '10px',
                backgroundColor: isActive
                  ? 'var(--portal-primary)'
                  : 'var(--portal-border)',
              }}
            />
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-[var(--portal-muted)]">
        กำลังแสดง: {activeSlide.title} · คลิกที่ภาพตรงกลางเพื่อขยายดูรายละเอียด
      </p>

      {/* Fullscreen Lightbox */}
      {lightboxSlide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`ภาพขยาย ${lightboxSlide.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => setLightboxSlide(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--portal-border)] px-5 py-3.5">
              <div>
                <h3 className="font-display text-base font-medium text-[var(--portal-ink)]">
                  {lightboxSlide.title}
                </h3>
                <p className="text-xs text-[var(--portal-muted)]">
                  {lightboxSlide.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxSlide(null)}
                aria-label="ปิดหน้าต่างภาพขยาย"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--portal-border)] text-[var(--portal-ink)] hover:bg-[var(--portal-surface-alt)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex max-h-[75vh] items-center justify-center bg-[var(--portal-surface-alt)] p-3">
              <img
                src={lightboxSlide.src}
                alt={lightboxSlide.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
