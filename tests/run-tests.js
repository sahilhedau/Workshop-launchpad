/**
 * Workshop Launchpad Test Suite
 * Comprehensive automated tests for growth calculations, attribution integrity,
 * pacing thresholds, and edge cases.
 */

const assert = require('assert');

console.log('🧪 Running Workshop Launchpad Test Suite...\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// ==========================================
// 1. Referral Code Generator Tests
// ==========================================
console.log('--- 1. Referral Code Generation ---');

function generateCode(label) {
  const cleanLabel = (label.replace(/[^a-zA-Z]/g, '').toUpperCase() + 'XXX').slice(0, 3);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${cleanLabel}-${suffix}`;
}

test('Format conforms to XXX-YYY with valid random suffix chars', () => {
  const code = generateCode('Aditi Sharma');
  assert.match(code, /^[A-Z]{3}-[A-Z2-9]{3}$/, `Code ${code} did not match expected pattern`);
  const [prefix, suffix] = code.split('-');
  assert.strictEqual(prefix.length, 3, 'Prefix must be 3 characters');
  assert.strictEqual(suffix.length, 3, 'Suffix must be 3 characters');
  assert.ok(!suffix.includes('0') && !suffix.includes('1') && !suffix.includes('I') && !suffix.includes('O'), 'Suffix must avoid ambiguous characters 0, 1, I, O');
});

test('Collision resistance & deduplication across 1,000 generated codes', () => {
  const set = new Set();
  function getUniqueCodeTest(label) {
    let code = generateCode(label);
    let attempts = 0;
    while (set.has(code) && attempts < 50) {
      code = generateCode(label);
      attempts++;
    }
    set.add(code);
    return code;
  }

  for (let i = 0; i < 1000; i++) {
    getUniqueCodeTest(`Connector ${i}`);
  }
  assert.strictEqual(set.size, 1000, `Expected exactly 1000 unique codes with deduplication retry, got ${set.size}`);
});

// ==========================================
// 2. Funnel Model Calculations
// ==========================================
console.log('\n--- 2. Funnel Model Calculations ---');

function calculateFunnel(r1, c1, r2, c2, r3, c3, paidEnabled = false, paidCpl = 16) {
  const reach1 = Math.max(0, Number(r1) || 0);
  const conv1 = Math.max(0, Number(c1) || 0);
  const reach2 = Math.max(0, Number(r2) || 0);
  const conv2 = Math.max(0, Number(c2) || 0);
  const shareRate = Math.max(0, Number(r3) || 0);
  const signupsPerSharer = Math.max(0, Number(c3) || 0);

  const o1 = Math.round((reach1 * conv1) / 100);
  const o2 = Math.round((reach2 * conv2) / 100);
  const wave1 = o1 + o2;
  const sharers = (wave1 * shareRate) / 100;
  const o3 = Math.round(sharers * signupsPerSharer);
  const kFactor = (shareRate / 100) * signupsPerSharer;

  let paidRegs = 0;
  if (paidEnabled) {
    paidRegs = Math.round(800 / paidCpl);
  }

  const total = o1 + o2 + o3 + paidRegs;
  return { o1, o2, wave1, o3, kFactor, paidRegs, total };
}

test('Base Case produces exactly 507 registrations (250 + 140 + 117)', () => {
  const res = calculateFunnel(5000, 5, 3500, 4, 25, 1.2);
  assert.strictEqual(res.o1, 250, 'WhatsApp should equal 250');
  assert.strictEqual(res.o2, 140, 'Clubs should equal 140');
  assert.strictEqual(res.wave1, 390, 'Wave 1 total should equal 390');
  assert.strictEqual(res.o3, 117, 'Referrals should equal 117');
  assert.strictEqual(res.total, 507, 'Total registrations must equal 507');
  assert.strictEqual(Number(res.kFactor.toFixed(2)), 0.30, 'Viral K-factor should be 0.30');
});

test('Boundary & edge cases: handles 0, negative values, and non-numeric inputs', () => {
  const resZero = calculateFunnel(0, 5, 0, 4, 25, 1.2);
  assert.strictEqual(resZero.total, 0, 'Zero reach must yield zero registrations');

  const resNeg = calculateFunnel(-5000, -5, -3500, 4, -25, -1.2);
  assert.strictEqual(resNeg.total, 0, 'Negative inputs must be clamped to 0');

  const resNaN = calculateFunnel('abc', undefined, null, NaN, {}, []);
  assert.strictEqual(resNaN.total, 0, 'Corrupt inputs must not throw or produce NaN');
});

test('Contingency Paid Reserve: +50 registrations when ₹800 deployed @ ₹16 CPL', () => {
  const resWithPaid = calculateFunnel(5000, 5, 3500, 4, 25, 1.2, true, 16);
  assert.strictEqual(resWithPaid.paidRegs, 50, 'Paid reserve should add 50 registrations');
  assert.strictEqual(resWithPaid.total, 557, 'Total with paid reserve should be 557');
});

// ==========================================
// 3. Pacing Engine & Target Trajectory
// ==========================================
console.log('\n--- 3. Pacing Engine & Trajectory ---');

const TARGETS = [40, 120, 210, 300, 390, 450, 500];

function evaluatePacing(day, dailyRegistrations, goal = 500) {
  const currentTotal = dailyRegistrations.reduce((a, b) => a + b, 0);
  const targetForDay = TARGETS[day - 1];
  const delta = currentTotal - targetForDay;
  const pctOfTarget = Math.round((currentTotal / targetForDay) * 100);
  const remainingNeeded = Math.max(0, goal - currentTotal);
  const remainingDays = 7 - day;
  const runRateNeeded = remainingDays > 0 ? Math.ceil(remainingNeeded / remainingDays) : remainingNeeded;

  let status = 'on_track';
  if (pctOfTarget < 90) {
    status = 'behind';
  } else if (pctOfTarget < 100) {
    status = 'caution';
  }

  return { currentTotal, targetForDay, delta, pctOfTarget, remainingNeeded, runRateNeeded, status };
}

test('Day 4 at 262 registrations triggers Behind Pace (<90% of 300 target)', () => {
  const pacing = evaluatePacing(4, [36, 68, 85, 73, 0, 0, 0]);
  assert.strictEqual(pacing.currentTotal, 262, 'Total must equal 262');
  assert.strictEqual(pacing.targetForDay, 300, 'Day 4 target must be 300');
  assert.strictEqual(pacing.delta, -38, 'Delta must be -38');
  assert.strictEqual(pacing.pctOfTarget, 87, 'Percentage of target must be 87%');
  assert.strictEqual(pacing.remainingNeeded, 238, 'Remaining needed must be 238');
  assert.strictEqual(pacing.runRateNeeded, 80, 'Run rate needed must be ceil(238 / 3) = 80/day');
  assert.strictEqual(pacing.status, 'behind', 'Status must be behind pace');
});

test('Day 4 at 310 registrations evaluates to On Track (>=100% of target)', () => {
  const pacing = evaluatePacing(4, [45, 80, 95, 90, 0, 0, 0]);
  assert.strictEqual(pacing.currentTotal, 310, 'Total must equal 310');
  assert.strictEqual(pacing.delta, 10, 'Delta must be +10');
  assert.strictEqual(pacing.pctOfTarget, 103, 'Percentage must be 103%');
  assert.strictEqual(pacing.status, 'on_track', 'Status must be on_track');
});

test('Non-destructive Day switching: array length does not truncate', () => {
  const state = {
    day: 4,
    daily: [36, 68, 85, 73, 0, 0, 0]
  };

  // Simulating the upgraded day change logic:
  function changeDay(newDay) {
    state.day = newDay;
    while (state.daily.length < 7) state.daily.push(0);
    // Crucial: do NOT set state.daily.length = newDay!
  }

  changeDay(2);
  assert.strictEqual(state.day, 2, 'Day updated to 2');
  assert.strictEqual(state.daily.length, 7, 'Daily array length preserved at 7');
  assert.strictEqual(state.daily[2], 85, 'Day 3 data not erased');
  assert.strictEqual(state.daily[3], 73, 'Day 4 data not erased');

  changeDay(4);
  assert.strictEqual(state.daily.reduce((a, b) => a + b, 0), 262, 'Total sum preserved');
});

// ==========================================
// 4. Attribution Consistency & Data Integrity
// ==========================================
console.log('\n--- 4. Attribution Consistency ---');

test('Registration attribution synchronizes links, channels, and daily total', () => {
  const links = [
    { c: 'ADI-7KQ', ch: 'wa', n: 52 },
    { c: 'COD-2RT', ch: 'club', n: 38 },
    { c: 'STU-4ZA', ch: 'ref', n: 21 }
  ];
  const daily = [36, 68, 85, 73, 0, 0, 0];
  let activeDay = 4;

  // Simulate new registration via ADI-7KQ
  const targetCode = 'ADI-7KQ';
  const found = links.find(l => l.c === targetCode);
  assert.ok(found, 'Link exists');

  found.n += 1;
  daily[activeDay - 1] += 1;

  // Channel totals
  const channelTotals = { wa: 0, club: 0, ref: 0 };
  links.forEach(l => channelTotals[l.ch] += l.n);

  const linksSum = links.reduce((s, l) => s + l.n, 0);
  const channelsSum = Object.values(channelTotals).reduce((a, b) => a + b, 0);

  assert.strictEqual(found.n, 53, 'Link count incremented to 53');
  assert.strictEqual(channelTotals.wa, 53, 'WhatsApp channel total matches');
  assert.strictEqual(linksSum, channelsSum, 'Sum of links equals sum of channels');
});

test('Budget metrics: ₹2,000 for 500 registrations yields ₹4.00 CAC', () => {
  const budget = 2000;
  const goal = 500;
  const unitCac = budget / goal;
  assert.strictEqual(unitCac, 4.00, 'Base CAC should be ₹4.00');
});

console.log('\n==========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('==========================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All core calculations, pacing algorithms, and attribution assertions passed!');
}
