# Ethos Design System

This guide documents the color tokens used throughout the Ethos application and how to apply them in components.

## Color Palette

The palette is defined in `ethos-frontend/src/theme.ts` and mirrored in Tailwind and CSS variables. Each token represents a color that can be referenced in Tailwind classes or via `var(--token-name)`.

| Token | Light | Dark | Description |
| ----- | ----- | ---- | ----------- |
| `primary` | `#111827` | `#f9fafb` | Default text color |
| `secondary` | `#4B5563` | `#D1D5DB` | Subtle text elements |
| `accent` | `#4F46E5` | `#818cf8` | Brand accent and buttons |
| `soft` | `#E5E7EB` | `#1f2937` | Application background |
| `surface` | `#ffffff` | `#374151` | Cards and panels |
| `infoBackground` | `#bfdbfe` | `#1e40af` | Highlight color for drag/drop or info blocks |

`soft` now has a slightly darker light mode value. Use `surface` for most card backgrounds and reserve `soft` for overall page backgrounds.

## Using Tokens in Components

### Tailwind Classes

Color tokens are registered as Tailwind colors so you can use them directly in class names. Example:

```tsx
<button className="bg-accent text-white hover:bg-accent/80">Click me</button>
```

The class `bg-accent` maps to the `accent` token defined above. The same applies to `text-primary`, `bg-soft`, `bg-surface`, and other tokens.

### CSS Variables

Tokens are also exposed as CSS custom properties in `src/index.css`. Use them when writing custom styles or when Tailwind utility classes are not flexible enough.

Each palette token is mirrored with a `--color-<token>` variable. For example,
`--color-accent` and `--color-surface` provide the accent and surface colors used
for buttons and card backgrounds.

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

## Tag Styles

Posts and quests are annotated with small tags that reuse the same color palette as `PostTypeBadge` components. The tag styles are implemented in `SummaryTag.tsx` and provide consistent background and text colors.

| Tag Type | Light / Dark Classes |
| -------- | ------------------- |
| quest | `bg-green-100 text-green-800` / `dark:bg-green-800 dark:text-green-200` |
| task | `bg-purple-100 text-purple-800` / `dark:bg-purple-800 dark:text-purple-200` |
| issue | `bg-orange-100 text-orange-800` / `dark:bg-orange-800 dark:text-orange-200` |
| log | `bg-blue-100 text-blue-800` / `dark:bg-blue-800 dark:text-blue-200` |
| review | `bg-teal-100 text-teal-800` / `dark:bg-teal-800 dark:text-teal-200` |
| status | `bg-yellow-100 text-yellow-800` / `dark:bg-yellow-800 dark:text-yellow-200` |
| category | `bg-indigo-100 text-indigo-800` / `dark:bg-indigo-800 dark:text-indigo-200` |
| free_speech | `bg-gray-100 text-gray-700` / `dark:bg-gray-700 dark:text-gray-200` |

All tags share the `TAG_BASE` style which sets padding, font size and border radius.

### Tag summary format

Summary tags combine the quest title with the post's node ID and author handle.
For task-oriented posts the username appears alongside the node ID:

```
[Quest: Demo Quest] [Task - Q:demo:T01:@alice]
[Quest: Demo Quest] [Issue - Q:demo:T01:I00:@bob]
[Quest: Demo Quest] [Commit - Q:demo:T01:C00:@carol]
```

Logs and other post types show the author with a `Log` label. These concise tags
help identify who created each node at a glance.
