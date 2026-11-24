import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  PAYMENT_STATUS_META,
  THAI_MONTHS,
} from '../../constants/themes';
import type {
  PaymentStatus,
  QueueItem,
  WorkStatus,
  WorkStatusOption,
} from '../../types/portal';
import {
  calculateRevenueSummary,
  derivePaymentStatus,
  filterQueues,
  formatBaht,
  reorderQueueList,
  resolveWorkStatusDisplay,
} from '../../utils/queueLogic';

interface AdminQueuesTabProps {
  queues: QueueItem[];
  customWorkTypes: string[];
  customWorkStatuses: WorkStatusOption[];
  customChannels: string[];
  onSaveQueue: (queue: QueueItem) => Promise<void>;
  onDeleteQueue: (id: string) => Promise<void>;
  onSyncQueues: (queues: QueueItem[]) => Promise<void>;
}

function createEmptyQueue(
  existing: QueueItem[],
  workTypes: string[],
  workStatuses: WorkStatusOption[],
  channels: string[]
): QueueItem {
  const now = new Date();
  const nextNum = existing.length + 1;
  return {
    id: `q-${Date.now()}`,
    queueNo: `Q-${String(nextNum).padStart(3, '0')}`,
    clientName: '',
    workType: workTypes[0] || 'งานทั่วไป',
    channel: channels[0] || 'LINE',
    details: '',
    fullPrice: 500,
    paidAmount: 0,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    deadline: '',
    paymentStatus: 'unpaid',
    workStatus: workStatuses[0]?.id || 'waiting',
    isRush: false,
    sortOrder: nextNum,
  };
}

export const AdminQueuesTab: React.FC<AdminQueuesTabProps> = ({
  queues,
  customWorkTypes,
  customWorkStatuses,
  customChannels,
  onSaveQueue,
  onDeleteQueue,
  onSyncQueues,
}) => {
  const [search, setSearch] = useState('');
  const [workFilter, setWorkFilter] = useState<WorkStatus | 'all'>('all');
  const [editingQueue, setEditingQueue] = useState<QueueItem | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const summary = useMemo(
    () => calculateRevenueSummary(queues, customWorkStatuses),
    [queues, customWorkStatuses]
  );
  const filteredQueues = useMemo(
    () => filterQueues(queues, { query: search, workStatus: workFilter }),
    [queues, search, workFilter]
  );

  const openNewModal = () => {
    setFormError('');
    setEditingQueue(
      createEmptyQueue(queues, customWorkTypes, customWorkStatuses, customChannels)
    );
  };

  const openEditModal = (item: QueueItem) => {
    setFormError('');
    setEditingQueue({ ...item });
  };

  const handleFieldChange = <K extends keyof QueueItem>(key: K, value: QueueItem[K]) => {
    setEditingQueue((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      if (key === 'fullPrice' || key === 'paidAmount') {
        next.paymentStatus = derivePaymentStatus(
          Number(next.fullPrice) || 0,
          Number(next.paidAmount) || 0
        );
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQueue) return;
    if (!editingQueue.clientName.trim()) {
      setFormError('กรุณากรอกชื่อลูกค้า');
      return;
    }
    if (!editingQueue.queueNo.trim()) {
      setFormError('กรุณากรอกเลขคิวงาน');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      await onSaveQueue({
        ...editingQueue,
        queueNo: editingQueue.queueNo.trim(),
        clientName: editingQueue.clientName.trim(),
        workType: editingQueue.workType.trim() || customWorkTypes[0] || 'งานทั่วไป',
        channel: editingQueue.channel.trim() || customChannels[0] || '-',
        fullPrice: Number(editingQueue.fullPrice) || 0,
        paidAmount: Number(editingQueue.paidAmount) || 0,
        month: Number(editingQueue.month) || new Date().getMonth() + 1,
        year: Number(editingQueue.year) || new Date().getFullYear(),
        sortOrder: Number(editingQueue.sortOrder) || queues.length + 1,
      });
      setEditingQueue(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'บันทึกคิวงานไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const reordered = reorderQueueList(queues, index, direction);
    await onSyncQueues(reordered);
  };

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteQueue(id);
    } finally {
      setDeletingId(null);
    }
  };

  const isFiltered = Boolean(search.trim()) || workFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Automatic Revenue Summary Strip */}
      <div className="grid grid-cols-1 divide-y divide-[var(--portal-border)] rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-medium text-[var(--portal-muted)]">ยอดรวมทั้งหมด</p>
          <p className="font-mono-num mt-1.5 text-2xl font-semibold text-[var(--portal-ink)]">
            ฿{formatBaht(summary.totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            ทั้งหมด {summary.totalCount} คิว · งานด่วน {summary.rushCount} คิว
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-[var(--portal-muted)]">ยอดที่ชำระแล้ว</p>
          <p className="font-mono-num mt-1.5 text-2xl font-semibold text-emerald-700">
            ฿{formatBaht(summary.totalPaid)}
          </p>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            รับชำระจริงจากทุกคิวงาน
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-[var(--portal-muted)]">ยอดค้างชำระ</p>
          <p className="font-mono-num mt-1.5 text-2xl font-semibold text-rose-700">
            ฿{formatBaht(summary.totalUnpaid)}
          </p>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            รอรับมัดจำหรือยอดคงเหลือ
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-[var(--portal-muted)]">ความคืบหน้าคิวงาน</p>
          <p className="font-mono-num mt-1.5 text-2xl font-semibold text-[var(--portal-primary)]">
            {summary.completedCount} / {summary.totalCount}
          </p>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            กำลังทำ {summary.activeCount} คิว · เสร็จแล้ว {summary.completedCount} คิว
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--portal-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="ค้นหาคิวงานในหลังบ้าน"
              placeholder="ค้นหาเลขคิว, ชื่อลูกค้า, ช่องทาง..."
              className="w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] py-2 pl-9 pr-3 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <select
            aria-label="กรองตามสถานะงาน"
            value={workFilter}
            onChange={(e) => setWorkFilter(e.target.value as WorkStatus | 'all')}
            className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] px-3 py-2 text-sm text-[var(--portal-ink)]"
          >
            <option value="all">ทุกสถานะงาน</option>
            {customWorkStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
          style={{ backgroundColor: 'var(--portal-primary)' }}
        >
          <Plus className="h-4 w-4" />
          เพิ่มคิวงานใหม่
        </button>
      </div>

      {/* Queue Data Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
        {filteredQueues.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-display text-base font-medium text-[var(--portal-ink)]">
              ยังไม่มีรายการคิวงาน
            </p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              กดปุ่มด้านล่างเพื่อเพิ่มคิวงานแรกและบันทึกลง Google Sheets ทันที
            </p>
            <button
              type="button"
              onClick={openNewModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--portal-primary)' }}
            >
              <Plus className="h-4 w-4" />
              เพิ่มคิวงานแรก
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--portal-border)] bg-[var(--portal-surface-alt)]/75 text-xs font-semibold text-[var(--portal-muted)]">
                  <th className="px-4 py-3">ลำดับ</th>
                  <th className="px-4 py-3">เลขคิว</th>
                  <th className="px-4 py-3">ลูกค้า / ช่องทาง</th>
                  <th className="px-4 py-3">งาน / กำหนดส่ง</th>
                  <th className="px-4 py-3 text-right">ราคาเต็ม</th>
                  <th className="px-4 py-3 text-right">ชำระแล้ว</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--portal-border)]">
                {filteredQueues.map((q, idx) => {
                  const workMeta = resolveWorkStatusDisplay(q.workStatus, customWorkStatuses);
                  const payMeta = PAYMENT_STATUS_META[q.paymentStatus];
                  return (
                    <tr
                      key={q.id}
                      className="transition-colors hover:bg-[var(--portal-surface-alt)]/40"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1">
                          <span className="font-mono-num w-6 text-xs text-[var(--portal-muted)]">
                            {q.sortOrder}
                          </span>
                          {!isFiltered && (
                            <div className="flex flex-col">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMove(idx, 'up')}
                                aria-label={`เลื่อนคิว ${q.queueNo} ขึ้น`}
                                className="rounded p-0.5 text-[var(--portal-muted)] hover:bg-[var(--portal-surface-alt)] hover:text-[var(--portal-ink)] disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === filteredQueues.length - 1}
                                onClick={() => handleMove(idx, 'down')}
                                aria-label={`เลื่อนคิว ${q.queueNo} ลง`}
                                className="rounded p-0.5 text-[var(--portal-muted)] hover:bg-[var(--portal-surface-alt)] hover:text-[var(--portal-ink)] disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono-num font-semibold text-[var(--portal-ink)]">
                            {q.queueNo}
                          </span>
                          {q.isRush && (
                            <Zap
                              aria-label="งานด่วน"
                              className="h-3.5 w-3.5 fill-amber-500 text-amber-600"
                            />
                          )}
                        </div>
                        <p className="text-xs text-[var(--portal-muted)]">
                          {THAI_MONTHS[(q.month || 1) - 1]} {q.year}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <p className="font-semibold text-[var(--portal-ink)]">{q.clientName}</p>
                        <p className="text-xs text-[var(--portal-muted)]">{q.channel}</p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <p className="font-medium text-[var(--portal-ink)]">{q.workType}</p>
                        <p className="font-mono-num text-xs text-[var(--portal-muted)]">
                          ส่ง: {q.deadline || '-'}
                        </p>
                      </td>
                      <td className="font-mono-num px-4 py-3 text-right align-middle font-medium text-[var(--portal-ink)]">
                        ฿{formatBaht(q.fullPrice)}
                      </td>
                      <td className="font-mono-num px-4 py-3 text-right align-middle">
                        <span className="font-medium text-emerald-700">
                          ฿{formatBaht(q.paidAmount)}
                        </span>
                        <p className="text-[11px]" style={{ color: payMeta.color }}>
                          {payMeta.label}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: workMeta.palette.bg,
                            color: workMeta.palette.text,
                            borderColor: workMeta.palette.border,
                          }}
                        >
                          {workMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(q)}
                            aria-label={`แก้ไขคิว ${q.queueNo}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--portal-border)] text-[var(--portal-ink)] hover:bg-[var(--portal-surface-alt)]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === q.id}
                            onClick={() => handleConfirmDelete(q.id)}
                            aria-label={`ลบคิว ${q.queueNo}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Queue Modal */}
      {editingQueue && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="queue-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setEditingQueue(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--portal-border)] px-6 py-4">
              <h3
                id="queue-form-title"
                className="font-display text-lg font-semibold text-[var(--portal-ink)]"
              >
                {queues.some((x) => x.id === editingQueue.id)
                  ? `แก้ไขคิวงาน ${editingQueue.queueNo}`
                  : 'เพิ่มคิวงานใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingQueue(null)}
                aria-label="ปิดฟอร์มคิวงาน"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--portal-muted)] hover:bg-[var(--portal-surface-alt)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {formError && (
                <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700">
                  {formError}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="q-no" className="block text-xs font-medium text-[var(--portal-ink)]">
                    เลขคิว
                  </label>
                  <input
                    id="q-no"
                    type="text"
                    required
                    value={editingQueue.queueNo}
                    onChange={(e) => handleFieldChange('queueNo', e.target.value)}
                    className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="q-client" className="block text-xs font-medium text-[var(--portal-ink)]">
                    ชื่อลูกค้า
                  </label>
                  <input
                    id="q-client"
                    type="text"
                    required
                    value={editingQueue.clientName}
                    onChange={(e) => handleFieldChange('clientName', e.target.value)}
                    placeholder="เช่น คุณมิ้นท์ หรือ @client_name"
                    className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="q-worktype" className="block text-xs font-medium text-[var(--portal-ink)]">
                    ประเภทงาน
                  </label>
                  <select
                    id="q-worktype"
                    value={editingQueue.workType}
                    onChange={(e) => handleFieldChange('workType', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  >
                    {editingQueue.workType &&
                      !customWorkTypes.includes(editingQueue.workType) && (
                        <option value={editingQueue.workType}>
                          {editingQueue.workType} (รายการเดิม)
                        </option>
                      )}
                    {customWorkTypes.map((typeOption) => (
                      <option key={typeOption} value={typeOption}>
                        {typeOption}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="q-channel" className="block text-xs font-medium text-[var(--portal-ink)]">
                    ช่องทางสั่งงาน
                  </label>
                  <select
                    id="q-channel"
                    value={editingQueue.channel}
                    onChange={(e) => handleFieldChange('channel', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  >
                    {editingQueue.channel &&
                      !customChannels.includes(editingQueue.channel) && (
                        <option value={editingQueue.channel}>
                          {editingQueue.channel} (ช่องทางเดิม)
                        </option>
                      )}
                    {customChannels.map((chOption) => (
                      <option key={chOption} value={chOption}>
                        {chOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="q-details" className="block text-xs font-medium text-[var(--portal-ink)]">
                  รายละเอียดงาน
                </label>
                <textarea
                  id="q-details"
                  rows={2}
                  value={editingQueue.details}
                  onChange={(e) => handleFieldChange('details', e.target.value)}
                  placeholder="ระบุรายละเอียดงาน ข้อกำหนดเพิ่มเติม หรือหมายเหตุสำคัญ"
                  className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="q-fullprice" className="block text-xs font-medium text-[var(--portal-ink)]">
                    ราคาเต็ม (บาท)
                  </label>
                  <input
                    id="q-fullprice"
                    type="number"
                    min="0"
                    value={editingQueue.fullPrice}
                    onChange={(e) => handleFieldChange('fullPrice', Number(e.target.value))}
                    className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  />
                </div>
                <div>
                  <label htmlFor="q-paid" className="block text-xs font-medium text-[var(--portal-ink)]">
                    ยอดที่ชำระแล้ว (บาท)
                  </label>
                  <input
                    id="q-paid"
                    type="number"
                    min="0"
                    value={editingQueue.paidAmount}
                    onChange={(e) => handleFieldChange('paidAmount', Number(e.target.value))}
                    className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  />
                </div>
                <div>
                  <label htmlFor="q-paystatus" className="block text-xs font-medium text-[var(--portal-ink)]">
                    สถานะชำระเงิน
                  </label>
                  <select
                    id="q-paystatus"
                    value={editingQueue.paymentStatus}
                    onChange={(e) =>
                      handleFieldChange('paymentStatus', e.target.value as PaymentStatus)
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  >
                    <option value="unpaid">ยังไม่ชำระ</option>
                    <option value="deposit">มัดจำแล้ว</option>
                    <option value="paid">ชำระครบแล้ว</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label htmlFor="q-month" className="block text-xs font-medium text-[var(--portal-ink)]">
                    เดือน
                  </label>
                  <select
                    id="q-month"
                    value={editingQueue.month}
                    onChange={(e) => handleFieldChange('month', Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  >
                    {THAI_MONTHS.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {idx + 1} - {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="q-year" className="block text-xs font-medium text-[var(--portal-ink)]">
                    ปี
                  </label>
                  <input
                    id="q-year"
                    type="number"
                    value={editingQueue.year}
                    onChange={(e) => handleFieldChange('year', Number(e.target.value))}
                    className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  />
                </div>
                <div>
                  <label htmlFor="q-deadline" className="block text-xs font-medium text-[var(--portal-ink)]">
                    กำหนดส่ง
                  </label>
                  <input
                    id="q-deadline"
                    type="date"
                    value={editingQueue.deadline}
                    onChange={(e) => handleFieldChange('deadline', e.target.value)}
                    className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  />
                </div>
                <div>
                  <label htmlFor="q-order" className="block text-xs font-medium text-[var(--portal-ink)]">
                    ลำดับคิว
                  </label>
                  <input
                    id="q-order"
                    type="number"
                    min="1"
                    value={editingQueue.sortOrder}
                    onChange={(e) => handleFieldChange('sortOrder', Number(e.target.value))}
                    className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  />
                </div>
              </div>

              <div className="grid items-center gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="q-workstatus" className="block text-xs font-medium text-[var(--portal-ink)]">
                    สถานะการทำงาน
                  </label>
                  <select
                    id="q-workstatus"
                    value={editingQueue.workStatus}
                    onChange={(e) =>
                      handleFieldChange('workStatus', e.target.value as WorkStatus)
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)]"
                  >
                    {editingQueue.workStatus &&
                      !customWorkStatuses.some((s) => s.id === editingQueue.workStatus) && (
                        <option value={editingQueue.workStatus}>
                          {editingQueue.workStatus} (สถานะเดิม)
                        </option>
                      )}
                    {customWorkStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-2.5 sm:mt-5">
                  <input
                    type="checkbox"
                    checked={editingQueue.isRush}
                    onChange={(e) => handleFieldChange('isRush', e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--portal-primary)]"
                  />
                  <span className="text-sm font-medium text-[var(--portal-ink)]">
                    คิวด่วนพิเศษ
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--portal-border)] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingQueue(null)}
                  className="rounded-xl border border-[var(--portal-border)] px-4 py-2 text-xs font-medium text-[var(--portal-ink)] hover:bg-[var(--portal-surface-alt)]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--portal-primary)' }}
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกคิวงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
