import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateLoyaltyPoints,
  calculateRevenueSummary,
  filterQueues,
  normalizePortalResponse,
  reorderQueueList,
  searchLoyaltyByClient,
} from './queueLogic';
import type { QueueItem, ReviewItem } from '../types/portal';

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
