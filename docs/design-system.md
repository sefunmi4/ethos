# Ethos Design System

This guide documents the color tokens used throughout the Ethos application and how to apply them in components.

## Color Palette

The palette is defined in `ethos-frontend/src/theme.ts` and mirrored in Tailwind and CSS variables. Each token represents a color that can be referenced in Tailwind classes or via `var(--token-name)`.

| Token | Hex | Description |
| ----- | --- | ----------- |
| `primary` | `#111827` | Default text and interface color |
| `accent` | `#4F46E5` | Primary brand accent |
| `soft` | `#F3F4F6` | Light background or borders |
| `primaryDark` | `#f9fafb` | Text color when dark mode is active |
| `softDark` | `#1f2937` | Dark mode background |
| `infoBackground` | `#bfdbfe` | Highlight color for drag/drop or info blocks |

## Using Tokens in Components

### Tailwind Classes

Color tokens are registered as Tailwind colors so you can use them directly in class names. Example:

```tsx
<button className="bg-accent text-white hover:bg-accent/80">Click me</button>
```

The class `bg-accent` maps to the `accent` token defined above. The same applies to `text-primary`, `bg-soft`, and other tokens.

### CSS Variables

Tokens are also exposed as CSS custom properties in `src/index.css`. Use them when writing custom styles or when Tailwind utility classes are not flexible enough.

```css
.card {
  background-color: var(--bg-soft);
  color: var(--text-primary);
  border-radius: 0.75rem;
}
```

In dark mode the variables automatically switch to their `*-Dark` counterparts.

## Adding or Updating Tokens

1. **Update `src/theme.ts`** – add the new token or modify an existing value in the exported `colors` object.
2. **Edit `tailwind.config.cjs`** – mirror the change under `theme.extend.colors` so the token can be used as a Tailwind class.
3. **Adjust `src/index.css`** – if the token is needed as a CSS variable, create a `--token-name` entry inside `:root` (and within `.dark` if a dark-mode value is required).
4. Restart the development server so Tailwind picks up the config changes.

Following these steps keeps your design system consistent across components and CSS.
