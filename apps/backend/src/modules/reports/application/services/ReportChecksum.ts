import { createHash } from 'crypto';

/**
 * A plain `JSON.stringify` is not stable across a MySQL JSON column
 * round-trip -- MySQL stores JSON in a binary form and reconstructs text
 * on read without preserving the original object-key insertion order, so
 * hashing the pre-insert object and the post-read object with a naive
 * stringify produces two different strings for identical data (a real
 * bug caught during this task's live verification). Sorting object keys
 * recursively before stringifying makes the hash independent of key
 * order, which is the only thing MySQL's JSON storage is known to change.
 */
function canonicalize(value: unknown): unknown {
  if (value instanceof Date) {
    // JSON.stringify's own default Date serialization -- normalizes a Date
    // instance (present before the DB round-trip) and its already-stringified
    // form (present after reading the JSON column back) to the same value.
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

/** docs/03-sad/20-module-report.md Section 5.3: "payload_hash" reproducibility/integrity checksum, verified on every snapshot read (TC-RPT-015). */
export function computePayloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(payload))).digest('hex');
}
