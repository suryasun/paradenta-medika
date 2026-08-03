import { computePayloadHash } from './ReportChecksum';

describe('computePayloadHash (task-190, TC-RPT-015)', () => {
  it('is stable across key reordering -- reproduces MySQL JSON columns not preserving insertion order', () => {
    const original = { b: 1, a: { d: 4, c: 3 }, e: [1, { g: 7, f: 6 }] };
    const reordered = { e: [1, { f: 6, g: 7 }], a: { c: 3, d: 4 }, b: 1 };
    expect(computePayloadHash(original)).toBe(computePayloadHash(reordered));
  });

  it('normalizes a Date instance the same as its already-stringified ISO form', () => {
    const date = new Date('2026-08-01T00:00:00.000Z');
    expect(computePayloadHash({ receivedDate: date })).toBe(computePayloadHash({ receivedDate: date.toISOString() }));
  });

  it('detects a genuine content change', () => {
    expect(computePayloadHash({ a: 1 })).not.toBe(computePayloadHash({ a: 2 }));
  });
});
