/**
 * Elbow Method (Modified Kneedle Algorithm)
 *
 * Finds the "elbow" point in a descending curve by computing the
 * maximum perpendicular distance from each point to the line
 * connecting the first and last points.
 *
 * @param values - Descending array of num_decks values
 * @returns Index of the elbow point (cutoff)
 */
export function calculateElbow(values: number[]): number {
  if (values.length < 3) return values.length;

  const n = values.length;
  const yFirst = values[0];
  const yLast = values[n - 1];

  // Line from (0, yFirst) to (n-1, yLast) in Ax + By + C = 0 form
  const A = yLast - yFirst;
  const B = -(n - 1);
  const C = (n - 1) * yFirst;
  const denom = Math.sqrt(A * A + B * B);

  // All points identical → elbow at 0
  if (denom === 0) return 0;

  let maxDist = 0;
  let maxIdx = 0;

  for (let i = 0; i < n; i++) {
    const dist = Math.abs(A * i + B * values[i] + C) / denom;
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  return maxIdx;
}
