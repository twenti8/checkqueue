import React, { useMemo, useState } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import type { ReviewItem } from '../../types/portal';
import { aggregateLoyaltyPoints } from '../../utils/queueLogic';

interface AdminReviewsTabProps {
  reviews: ReviewItem[];
  onSaveReview: (review: ReviewItem) => Promise<void>;
  onDeleteReview: (id: string) => Promise<void>;
}

export const AdminReviewsTab: React.FC<AdminReviewsTabProps> = ({
  reviews,
  onSaveReview,
  onDeleteReview,
}) => {
  const [clientName, setClientName] = useState('');
  const [rating, setRating] = useState(5);
  const [points, setPoints] = useState(1);
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loyaltyBoard = useMemo(() => aggregateLoyaltyPoints(reviews), [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setError('กรุณากรอกชื่อลูกค้า');
      return;
    }
    if (!comment.trim()) {
      setError('กรุณากรอกข้อความรีวิว');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSaveReview({
        id: `rev-${Date.now()}`,
        clientName: clientName.trim(),
        rating: Number(rating) || 5,
        comment: comment.trim(),
        points: Math.max(0, Number(points) || 0),
        date,
      });
      setClientName('');
      setComment('');
      setRating(5);
      setPoints(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกรีวิวไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Add Review & Points Form */}
      <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6 lg:col-span-5">
        <h3 className="font-display text-lg font-semibold text-[var(--portal-ink)]">
          เพิ่มรีวิวและแต้มสะสม
        </h3>
        <p className="mt-1 text-xs text-[var(--portal-muted)]">
          เพิ่มรีวิวความประทับใจจากลูกค้าพร้อมคำนวณแต้มสะสมให้อัตโนมัติ
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="rev-client" className="block text-xs font-medium text-[var(--portal-ink)]">
              ชื่อลูกค้า
            </label>
            <input
              id="rev-client"
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="เช่น คุณพาย หรือ @pie_cute"
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="rev-rating" className="block text-xs font-medium text-[var(--portal-ink)]">
                ดาว (1-5)
              </label>
              <select
                id="rev-rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} ดาว
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rev-points" className="block text-xs font-medium text-[var(--portal-ink)]">
                แต้มสะสม
              </label>
              <input
                id="rev-points"
                type="number"
                min="0"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
              />
            </div>
            <div>
              <label htmlFor="rev-date" className="block text-xs font-medium text-[var(--portal-ink)]">
                วันที่
              </label>
              <input
                id="rev-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-2.5 py-2 text-xs text-[var(--portal-ink)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rev-comment" className="block text-xs font-medium text-[var(--portal-ink)]">
              ข้อความรีวิว
            </label>
            <textarea
              id="rev-comment"
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ข้อความความประทับใจจากลูกค้า..."
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--portal-primary)' }}
          >
            <Plus className="h-4 w-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกรีวิวและแต้มสะสม'}
          </button>
        </form>

        {/* Loyalty Summary */}
        <div className="mt-6 border-t border-[var(--portal-border)] pt-5">
          <h4 className="text-xs font-semibold text-[var(--portal-muted)]">
            สรุปแต้มสะสมรายลูกค้า ({loyaltyBoard.length} คน)
          </h4>
          <div className="mt-3 divide-y divide-[var(--portal-border)]">
            {loyaltyBoard.length === 0 ? (
              <p className="py-3 text-xs text-[var(--portal-muted)]">ยังไม่มีข้อมูลแต้มสะสม</p>
            ) : (
              loyaltyBoard.slice(0, 6).map((item) => (
                <div key={item.clientName} className="flex items-center justify-between py-2 text-xs">
                  <span className="font-medium text-[var(--portal-ink)]">{item.clientName}</span>
                  <span className="font-mono-num font-semibold text-[var(--portal-primary)]">
                    {item.totalPoints} แต้ม
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6 lg:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--portal-ink)]">
            รายการรีวิวทั้งหมด ({reviews.length})
          </h3>
        </div>

        {reviews.length === 0 ? (
          <p className="py-12 text-center text-xs text-[var(--portal-muted)]">
            ยังไม่มีรีวิวที่บันทึกไว้ใน Google Sheets
          </p>
        ) : (
          <div className="divide-y divide-[var(--portal-border)]">
            {reviews.map((rev) => (
              <div key={rev.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--portal-ink)]">
                      {rev.clientName}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: rev.rating }, (_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                      ))}
                    </span>
                    <span className="font-mono-num text-xs font-medium text-[var(--portal-primary)]">
                      +{rev.points} แต้ม
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--portal-ink)]/85">{rev.comment}</p>
                  <p className="font-mono-num mt-1 text-xs text-[var(--portal-muted)]">
                    {rev.date}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteReview(rev.id)}
                  aria-label={`ลบรีวิวของ ${rev.clientName}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
