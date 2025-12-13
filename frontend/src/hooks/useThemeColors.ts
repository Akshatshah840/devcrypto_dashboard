import { useState, useEffect } from 'react';

interface ThemeColors {
  grid: string;
  text: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipSubtext: string;
  isDark: boolean;
}

export const useThemeColors = (): ThemeColors => {
  const [colors, setColors] = useState<ThemeColors>({
    grid: 'rgba(156, 163, 175, 0.3)',
    text: '#9ca3af',
    tooltipBg: 'rgba(0, 0, 0, 0.85)',
    tooltipText: '#ffffff',
    tooltipSubtext: '#e0e0e0',
    isDark: true
  });

  useEffect(() => {
    const updateColors = () => {
      const dataTheme = document.documentElement.getAttribute('data-theme') || '';
      const isDark = dataTheme.includes('dark') ||
                     dataTheme === 'night' ||
                     dataTheme === 'forest' ||
                     dataTheme === 'black' ||
                     dataTheme === 'luxury' ||
                     dataTheme === 'dracula' ||
                     dataTheme === 'business' ||
                     dataTheme === 'coffee' ||
                     dataTheme === 'dim' ||
                     dataTheme === 'sunset' ||
                     document.documentElement.classList.contains('dark') ||
                     (!dataTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        setColors({
          grid: 'rgba(255, 255, 255, 0.15)',
          text: '#a1a1aa',
          tooltipBg: 'rgba(24, 24, 27, 0.95)',
          tooltipText: '#ffffff',
          tooltipSubtext: '#d4d4d8',
          isDark: true
        });
      } else {
        setColors({
          grid: 'rgba(0, 0, 0, 0.1)',
          text: '#52525b',
          tooltipBg: 'rgba(255, 255, 255, 0.98)',
          tooltipText: '#18181b',
          tooltipSubtext: '#3f3f46',
          isDark: false
        });
      }
    };

    updateColors();

    // Watch for theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    // Also listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateColors);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateColors);
    };
  }, []);

  return colors;
};
