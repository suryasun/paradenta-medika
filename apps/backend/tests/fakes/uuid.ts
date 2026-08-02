let counter = 0;

/**
 * Generates deterministic, class-validator `@IsUUID('4')`-compliant ids for
 * test fakes (version nibble `4`, variant nibble `8`), since several DTOs
 * validate foreign-key fields as UUIDs.
 */
export function nextFakeUuid(): string {
  counter += 1;
  const hex = counter.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}
