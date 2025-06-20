import { hexComplement } from './colorUtils';

export interface Palette {
  light: string;
  dark: string;
}

export const lightColors: Record<string, string> = {
  primary: '#111827',
  secondary: '#4B5563',
  accent: '#4F46E5',
  soft: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  infoBackground: '#bfdbfe',
};

export const colors: Record<string, Palette> = Object.fromEntries(
  Object.entries(lightColors).map(([name, light]) => [
    name,
    { light, dark: hexComplement(light) },
  ])
) as Record<string, Palette>;

export default colors;
