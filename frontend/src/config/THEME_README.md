# Theme Configuration Guide

## Overview

The theme system is centralized in `src/config/theme.ts` for easy customization. You can change the light and dark theme colors from this single file, and the changes will be applied across the entire application.

## How to Change Theme Colors

### Step 1: Open the Theme Config File

Open `src/config/theme.ts` in your editor.

### Step 2: Modify the Colors

Update the color values in the `themeConfig` object:

```typescript
export const themeConfig = {
  light: {
    background: "#ffffff",        // Change this to your desired light background
    backgroundSecondary: "#f9fafb",
    textPrimary: "#101828",       // Change this to your desired light text color
    // ... other colors
  },
  dark: {
    background: "#000000",        // Change this to your desired dark background
    backgroundSecondary: "#0c111d",
    textPrimary: "#ffffff",       // Change this to your desired dark text color
    // ... other colors
  },
};
```

### Step 3: Save and Restart

After making changes, save the file. The changes will be applied automatically when you toggle between light and dark themes.

## Available Theme Properties

### Background Colors
- `background`: Main background color
- `backgroundSecondary`: Secondary background (e.g., body background)
- `backgroundTertiary`: Tertiary background (e.g., hover states)

### Text Colors
- `textPrimary`: Primary text color (headings, main content)
- `textSecondary`: Secondary text color (descriptions, labels)
- `textTertiary`: Tertiary text color (subtle text)

### Border Colors
- `border`: Primary border color
- `borderSecondary`: Secondary border color

### Surface Colors
- `surface`: Surface color for cards, panels, etc.
- `surfaceHover`: Surface color on hover

## Using Theme Colors in Components

The theme colors are available as CSS variables:

```tsx
// In your component styles
<div className="bg-[var(--theme-background)] text-[var(--theme-text-primary)]">
  Content
</div>
```

Or use Tailwind's arbitrary values:

```tsx
<div style={{ 
  backgroundColor: 'var(--theme-background)',
  color: 'var(--theme-text-primary)'
}}>
  Content
</div>
```

## Example: Changing to Pure Black/White Theme

To make dark theme pure black and light theme pure white:

```typescript
export const themeConfig = {
  light: {
    background: "#ffffff",        // Pure white
    backgroundSecondary: "#ffffff",
    backgroundTertiary: "#f9fafb",
    textPrimary: "#000000",      // Pure black text
    // ...
  },
  dark: {
    background: "#000000",        // Pure black
    backgroundSecondary: "#000000",
    backgroundTertiary: "#0a0a0a",
    textPrimary: "#ffffff",      // Pure white text
    // ...
  },
};
```

## Notes

- The theme colors are applied dynamically via JavaScript in `ThemeContext.tsx`
- CSS variables are set on the document root element
- The dark theme class is still used for Tailwind's dark mode utilities
- Changes take effect immediately when toggling themes

