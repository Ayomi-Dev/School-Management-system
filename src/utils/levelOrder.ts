/**
 * Maps a ClassLevel to a default sort order so auto-created
 * classes have a sensible ordering in lists.
 */
export function _levelOrder(level: string): number {
  const ORDER: Record<string, number> = {
    CRECHE: 1, NURSERY1: 2, NURSERY2: 3,
    PRIMARY1: 4, PRIMARY2: 5, PRIMARY3: 6,
    PRIMARY4: 7, PRIMARY5: 8, PRIMARY6: 9,
    JSS1: 10, JSS2: 11, JSS3: 12,
    SS1: 13, SS2: 14, SS3: 15,
  };
  return ORDER[level] ?? 99;
}