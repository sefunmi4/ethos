export interface Palette {
  light: string;
  dark: string;
}

export const colors: Record<string, Palette> = {
  primary: { light: '#111827', dark: '#f9fafb' },
  secondary: { light: '#4B5563', dark: '#D1D5DB' },
  accent: { light: '#4F46E5', dark: '#818cf8' },
  success: { light: '#10B981', dark: '#6EE7B7' },
  warning: { light: '#F59E0B', dark: '#FDE68A' },
  error: { light: '#EF4444', dark: '#FCA5A5' },
  background: { light: '#f9fafb', dark: '#1f2937' },
  surface: { light: '#ffffff', dark: '#374151' },
  infoBackground: { light: '#bfdbfe', dark: '#1e40af' },
};

export default colors;
