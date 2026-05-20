/**
 * Theme Configuration
 * 
 * This file centralizes all theme colors for easy customization.
 * Change the values here to update the light and dark theme colors across the entire application.
 */

export const themeConfig = {
  light: {
    // Background colors
    background: "#ffffff", // Pure white
    backgroundSecondary: "#f9fafb", // gray-50
    backgroundTertiary: "#f2f4f7", // gray-100
    
    // Text colors
    textPrimary: "#101828", // gray-900 (almost black)
    textSecondary: "#667085", // gray-500
    textTertiary: "#98a2b3", // gray-400
    
    // Border colors
    border: "#e4e7ec", // gray-200
    borderSecondary: "#d0d5dd", // gray-300
    
    // Surface colors (for cards, panels, etc.)
    surface: "#ffffff",
    surfaceHover: "#f9fafb",
  },
  dark: {
    // Background colors - Pure black theme
    background: "#000000", // Pure black
    backgroundSecondary: "#000000", // Pure black
    backgroundTertiary: "#0a0a0a", // Very dark (almost black)
    
    // Text colors
    textPrimary: "#ffffff", // Pure white
    textSecondary: "#ffffff", // Pure white
    textTertiary: "#e5e5e5", // Light gray for subtle text
    
    // Border colors - Very dark borders
    border: "#1a1a1a", // Very dark gray (almost black)
    borderSecondary: "#2a2a2a", // Dark gray
    
    // Surface colors (for cards, panels, etc.)
    surface: "#000000", // Pure black
    surfaceHover: "#0a0a0a", // Very dark (almost black)
  },
} as const;

/**
 * Helper function to get theme color
 */
export const getThemeColor = (mode: "light" | "dark", colorKey: keyof typeof themeConfig.light) => {
  return themeConfig[mode][colorKey];
};

    