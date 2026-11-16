import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@mantine/core/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import App from './App';

// Palette from https://coolors.co/040f0f-a9cef4-7ea0b7-597081-875053
const theme = createTheme({
  primaryColor: 'ice',
  colors: {
    // Rich obsidian teal-black theme based on #040f0f
    dark: [
      '#eef4fb', // 0: primary text
      '#a9cef4', // 1: ice-blue secondary highlight (#a9cef4)
      '#7ea0b7', // 2: slate-blue muted (#7ea0b7)
      '#597081', // 3: payne gray borders (#597081)
      '#26353e', // 4: active borders & dividers
      '#162329', // 5: hover surfaces
      '#0d191a', // 6: cards & papers
      '#071314', // 7: headers, toolbars, modal backgrounds
      '#040f0f', // 8: main body background (#040f0f)
      '#020909', // 9: deepest canvas & code blocks
    ],
    // Ice Blue palette based on #a9cef4 for dark mode and rich accessible blues for light mode
    ice: [
      '#f0f7ff', // 0: lightest background tint
      '#e0effb', // 1: subtle highlight
      '#c7e2f8', // 2: light badge border
      '#a9cef4', // 3: #a9cef4 dark-mode ice accent
      '#8fbfe8', // 4: mid ice
      '#5c93bd', // 5: muted slate
      '#1971c2', // 6: primary button & active elements (WCAG AA accessible)
      '#1864ab', // 7: rich deep blue
      '#144f88', // 8: high-contrast dark blue
      '#0e3860', // 9: deepest blue text for light badges
    ],
    // Rose Ebony palette based on #875053
    rose: [
      '#fbf5f5', // 0
      '#f5e9ea', // 1
      '#ebd2d4', // 2
      '#dcb3b6', // 3
      '#c88e92', // 4
      '#b06f74', // 5
      '#875053', // 6: #875053
      '#6f4144', // 7
      '#593436', // 8
      '#442728', // 9
    ],
    // High-contrast Gray palette for crisp text, placeholders and borders in light mode
    gray: [
      '#f8fafc', // 0: lightest slate background
      '#f1f5f9', // 1: subtle card background
      '#e2e8f0', // 2: light border
      '#cbd5e1', // 3: standard border
      '#94a3b8', // 4: muted icons
      '#475569', // 5: placeholders in light mode (contrast 4.7:1 - WCAG AA compliant)
      '#334155', // 6: dimmed text in light mode (contrast 7.8:1 - WCAG AAA compliant)
      '#1e293b', // 7: segmented control label / secondary text
      '#0f172a', // 8: primary text
      '#020617', // 9: deepest slate
    ],
  },
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
);
