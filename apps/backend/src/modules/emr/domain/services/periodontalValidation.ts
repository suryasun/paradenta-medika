/**
 * docs/03-sad/15-module-emr.md Part 3.2B Section 18 "Applicable Teeth" --
 * furcation only applies to multiroot (molar) teeth.
 */
const FURCATION_APPLICABLE_TEETH = new Set([16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48]);

export function isFurcationApplicable(toothNumber: number): boolean {
  return FURCATION_APPLICABLE_TEETH.has(toothNumber);
}

/** Part 3.2B Section 14: "CAL = Pocket Depth + Gingival Margin", auto-computed. */
export function calculateCAL(pocketDepth: number, gingivalMargin: number): number {
  return Math.round((pocketDepth + gingivalMargin) * 10) / 10;
}
