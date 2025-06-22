export function getRank(xp: number = 0): 'E' | 'D' | 'C' | 'B' | 'A' | 'S' {
  if (xp >= 5000) return 'S';
  if (xp >= 3000) return 'A';
  if (xp >= 1500) return 'B';
  if (xp >= 700) return 'C';
  if (xp >= 300) return 'D';
  return 'E';
}
