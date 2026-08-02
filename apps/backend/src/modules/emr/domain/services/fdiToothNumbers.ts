/**
 * docs/03-sad/15-module-emr.md Part 3.1B Sections 12-14: permanent
 * dentition (32 teeth, quadrants 1-4) plus primary dentition (20 teeth,
 * quadrants 5-8), mixed dentition supported per Section 14's business rule.
 */
const PERMANENT_QUADRANTS = [1, 2, 3, 4];
const PRIMARY_QUADRANTS = [5, 6, 7, 8];
const PERMANENT_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const PRIMARY_POSITIONS = [1, 2, 3, 4, 5];

function buildToothNumbers(quadrants: number[], positions: number[]): Set<number> {
  const numbers = new Set<number>();
  for (const quadrant of quadrants) {
    for (const position of positions) {
      numbers.add(quadrant * 10 + position);
    }
  }
  return numbers;
}

const VALID_FDI_TOOTH_NUMBERS = new Set([
  ...buildToothNumbers(PERMANENT_QUADRANTS, PERMANENT_POSITIONS),
  ...buildToothNumbers(PRIMARY_QUADRANTS, PRIMARY_POSITIONS),
]);

export function isValidFdiToothNumber(toothNumber: number): boolean {
  return VALID_FDI_TOOTH_NUMBERS.has(toothNumber);
}

/** docs/03-sad/15-module-emr.md Part 3.1B Section 18: valid Surface Combination codes. */
const VALID_SURFACE_LETTERS = new Set(['M', 'D', 'B', 'L', 'O', 'I']);

export function isValidSurfaceCombination(surface: string): boolean {
  if (surface.length === 0) return false;
  const letters = surface.toUpperCase().split('');
  return letters.every((letter) => VALID_SURFACE_LETTERS.has(letter)) && new Set(letters).size === letters.length;
}
