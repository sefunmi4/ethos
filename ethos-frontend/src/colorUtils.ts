export function hexComplement(color: string): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6 || /[^0-9a-fA-F]/.test(hex)) {
    throw new Error(`Invalid hex color: ${color}`);
  }
  const r = 255 - parseInt(hex.slice(0, 2), 16);
  const g = 255 - parseInt(hex.slice(2, 4), 16);
  const b = 255 - parseInt(hex.slice(4, 6), 16);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
