import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateLoyaltyPoints,
  calculateRevenueSummary,
  filterQueues,
  normalizePortalResponse,
  reorderQueueList,
  resolveWorkStatusDisplay,
  searchLoyaltyByClient,
} from './queueLogic';
import { serializePortalForCache } from './portalCache';
import type { QueueItem, ReviewItem, WorkStatusOption } from '../types/portal';

const sampleQueues: QueueItem[] = [
  {
    id: 'q1',
    queueNo: 'Q-001',
    clientName: 'น้องมิ้นท์',
    workType: 'Chibi Full Color',
    channel: 'X (Twitter)',
    details: 'ถือแก้วมัทฉะ',
    fullPrice: 500,
    paidAmount: 500,
    month: 11,
    year: 2026,
    deadline: '2026-11-30',
    paymentStatus: 'paid',
    workStatus: 'done',
    isRush: false,
    sortOrder: 1,
  },
  {
    id: 'q2',
    queueNo: 'Q-002',
    clientName: 'คุณพาย',
    workType: 'Bust-Up Pastel',
    channel: 'LINE',
    details: 'ชุดโลลิต้าสีชมพู',
    fullPrice: 850,
    paidAmount: 400,
    month: 11,
    year: 2026,
    deadline: '2026-12-05',
    paymentStatus: 'deposit',
    workStatus: 'coloring',
    isRush: true,
    sortOrder: 2,
  },
  {
    id: 'q3',
    queueNo: 'Q-003',
    clientName: 'คุณเบลล์',
    workType: 'Full Body',
    channel: 'Facebook',
    details: 'ธีมแฟนตาซี',
    fullPrice: 1200,
    paidAmount: 0,
    month: 12,
    year: 2026,
    deadline: '2026-12-15',
    paymentStatus: 'unpaid',
    workStatus: 'waiting',
    isRush: false,
    sortOrder: 3,
  },
];

test('calculateRevenueSummary totals revenue, paid, unpaid, active, done, and rush counts', () => {
  const summary = calculateRevenueSummary(sampleQueues);
  assert.equal(summary.totalRevenue, 2550);
  assert.equal(summary.totalPaid, 900);
  assert.equal(summary.totalUnpaid, 1650);
  assert.equal(summary.totalCount, 3);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.activeCount, 2);
  assert.equal(summary.rushCount, 1);
});

test('filterQueues filters by search query, workStatus, and month', () => {
  const byQuery = filterQueues(sampleQueues, { query: 'พาย' });
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].id, 'q2');

  const byStatus = filterQueues(sampleQueues, { workStatus: 'waiting' });
  assert.equal(byStatus.length, 1);
  assert.equal(byStatus[0].queueNo, 'Q-003');

  const byMonth = filterQueues(sampleQueues, { month: 11 });
  assert.equal(byMonth.length, 2);
});

test('reorderQueueList swaps adjacent items and recalculates sortOrder sequentially', () => {
  const reordered = reorderQueueList(sampleQueues, 2, 'up');
  assert.deepEqual(
    reordered.map((q) => ({ id: q.id, sortOrder: q.sortOrder })),
    [
      { id: 'q1', sortOrder: 1 },
      { id: 'q3', sortOrder: 2 },
      { id: 'q2', sortOrder: 3 },
    ]
  );
});

test('aggregateLoyaltyPoints and searchLoyaltyByClient combine client points case-insensitively', () => {
  const reviews: ReviewItem[] = [
    { id: 'r1', clientName: 'MomoFan', rating: 5, comment: 'น่ารักมาก', points: 2, date: '2026-11-01' },
    { id: 'r2', clientName: 'momofan', rating: 5, comment: 'งานไวมาก', points: 3, date: '2026-11-15' },
    { id: 'r3', clientName: 'Minty', rating: 5, comment: 'สีละมุนสุดๆ', points: 1, date: '2026-11-10' },
  ];
  const aggregated = aggregateLoyaltyPoints(reviews);
  assert.equal(aggregated.length, 2);
  assert.equal(aggregated[0].totalPoints, 5);
  assert.equal(aggregated[0].reviewCount, 2);

  const search = searchLoyaltyByClient(reviews, 'mint');
  assert.equal(search.length, 1);
  assert.equal(search[0].totalPoints, 1);
});

test('normalizePortalResponse safely parses empty GAS response and stringified settings', () => {
  const emptyRes = normalizePortalResponse({
    status: 'success',
    settings: {},
    queues: [],
    reviews: [],
  });
  assert.equal(emptyRes.profile.adminPassword, '1234');
  assert.equal(emptyRes.activeThemeId, 'strawberry-milk');
  assert.equal(emptyRes.queues.length, 0);

  const populatedRes = normalizePortalResponse({
    status: 'success',
    settings: {
      activeThemeId: 'matcha-cream',
      backgroundEffect: 'stars',
      img_avatar: 'data:image/webp;base64,AAA',
      profile: JSON.stringify({ studioName: 'Neko Art', adminPassword: '9999' }),
    },
    queues: [{ id: '1', queueNo: 'Q-01', clientName: 'A', fullPrice: '600', paidAmount: '300', isRush: 'true' }],
    reviews: [{ id: 'r1', clientName: 'A', rating: '5', points: '2', comment: 'Great' }],
  });
  assert.equal(populatedRes.profile.studioName, 'Neko Art');
  assert.equal(populatedRes.profile.adminPassword, '9999');
  assert.equal(populatedRes.activeThemeId, 'matcha-cream');
  assert.equal(populatedRes.backgroundEffect, 'stars');
  assert.equal(populatedRes.images.img_avatar, 'data:image/webp;base64,AAA');
  assert.equal(populatedRes.queues[0].isRush, true);
  assert.equal(populatedRes.queues[0].paymentStatus, 'deposit');
  assert.equal(populatedRes.reviews[0].points, 2);
});

test('resolveWorkStatusDisplay computes 15%-100% progress, resolves pastel colors, and falls back safely for legacy statuses', () => {
  const customStatuses: WorkStatusOption[] = [
    { id: 'step_received', label: 'รับออเดอร์', color: 'gray' },
    { id: 'step_making', label: 'กำลังจัดทำ', color: 'sky' },
    { id: 'step_qc', label: 'ตรวจคุณภาพ', color: 'purple' },
    { id: 'step_shipped', label: 'จัดส่งแล้ว', color: 'green' },
  ];

  const first = resolveWorkStatusDisplay('step_received', customStatuses);
  assert.equal(first.isKnown, true);
  assert.equal(first.step, 1);
  assert.equal(first.progressPercent, 15);
  assert.equal(first.isCompleted, false);
  assert.equal(first.palette.id, 'gray');

  const second = resolveWorkStatusDisplay('step_making', customStatuses);
  assert.equal(second.step, 2);
  assert.equal(second.progressPercent, 43);
  assert.equal(second.palette.id, 'sky');

  const last = resolveWorkStatusDisplay('step_shipped', customStatuses);
  assert.equal(last.step, 4);
  assert.equal(last.progressPercent, 100);
  assert.equal(last.isCompleted, true);
  assert.equal(last.palette.id, 'green');

  // Legacy / removed status must render neutrally without throwing
  const legacy = resolveWorkStatusDisplay('old_deleted_stage', customStatuses);
  assert.equal(legacy.isKnown, false);
  assert.equal(legacy.label, 'old_deleted_stage');
  assert.equal(legacy.palette.id, 'gray');
  assert.equal(legacy.progressPercent, 0);
  assert.equal(legacy.isCompleted, false);
});

test('normalizePortalResponse and cache round-trip preserve customWorkTypes, customWorkStatuses, customChannels, and custom queue statuses', () => {
  const customWorkTypes = ['ทำเล็บเจล', 'ต่อขนตา', 'สปามือ-เท้า'];
  const customWorkStatuses: WorkStatusOption[] = [
    { id: 'booked', label: 'จองคิวแล้ว', color: 'yellow' },
    { id: 'in_service', label: 'กำลังให้บริการ', color: 'pink' },
    { id: 'finished', label: 'เสร็จเรียบร้อย', color: 'green' },
  ];
  const customChannels = ['LINE OA', 'หน้าร้าน', 'Instagram'];

  const parsed = normalizePortalResponse({
    settings: {
      customWorkTypes: JSON.stringify(customWorkTypes),
      customWorkStatuses: JSON.stringify(customWorkStatuses),
      customChannels: JSON.stringify(customChannels),
    },
    queues: [
      { id: 'q1', queueNo: 'Q-001', clientName: 'คุณฝน', workType: 'ทำเล็บเจล', channel: 'LINE OA', workStatus: 'finished', fullPrice: 800, paidAmount: 800 },
      { id: 'q2', queueNo: 'Q-002', clientName: 'คุณมายด์', workType: 'ต่อขนตา', channel: 'หน้าร้าน', workStatus: 'legacy_status', fullPrice: 600, paidAmount: 200 },
    ],
    reviews: [],
  });

  assert.deepEqual(parsed.customWorkTypes, customWorkTypes);
  assert.deepEqual(parsed.customWorkStatuses, customWorkStatuses);
  assert.deepEqual(parsed.customChannels, customChannels);
  assert.equal(parsed.queues[0].workStatus, 'finished');
  assert.equal(parsed.queues[1].workStatus, 'legacy_status');

  const summary = calculateRevenueSummary(parsed.queues, parsed.customWorkStatuses);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.activeCount, 1);

  const restored = normalizePortalResponse(serializePortalForCache(parsed));
  assert.deepEqual(restored.customWorkTypes, customWorkTypes);
  assert.deepEqual(restored.customWorkStatuses, customWorkStatuses);
  assert.deepEqual(restored.customChannels, customChannels);
});
