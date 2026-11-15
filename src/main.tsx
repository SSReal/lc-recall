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
    // Ice Blue palette based on #a9cef4 and #7ea0b7
    ice: [
      '#f2f8fd', // 0
      '#e0effb', // 1
      '#c7e2f8', // 2
      '#a9cef4', // 3: #a9cef4 primary
      '#8fbfe8', // 4
      '#7ea0b7', // 5: #7ea0b7
      '#658da7', // 6: primary button
      '#597081', // 7: #597081
      '#475b69', // 8
      '#364551', // 9
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
