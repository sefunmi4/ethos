export interface Palette {
  light: string;
  dark: string;
}

export const colors: Record<string, Palette> = {
  primary: { light: '#111827', dark: '#f9fafb' },
  secondary: { light: '#4B5563', dark: '#d1d5db' },
  accent: { light: '#4F46E5', dark: '#818cf8' },
  soft: { light: '#E5E7EB', dark: '#1f2937' },
  success: { light: '#10B981', dark: '#6ee7b7' },
  warning: { light: '#F59E0B', dark: '#fde68a' },
  error: { light: '#EF4444', dark: '#fca5a5' },
  background: { light: '#f9fafb', dark: '#1f2937' },
  surface: { light: '#ffffff', dark: '#374151' },
  accentMuted: { light: '#f0f0f0', dark: '#323c4e' },
  infoBackground: { light: '#bfdbfe', dark: '#1e40af' },
};

export default colors;
