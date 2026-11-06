
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const lightModeEnabled = env.VITE_ENABLE_LIGHT_MODE || 'false';
  const defaultTheme = env.VITE_DEFAULT_THEME || 'dark';

  return {
    plugins: [
      {
        name: 'klb-theme-html-env',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            return html
              .replaceAll('%VITE_ENABLE_LIGHT_MODE%', lightModeEnabled)
              .replaceAll('%VITE_DEFAULT_THEME%', defaultTheme);
          },
        },
      },
      react(),
      tailwindcss(),
    ],

    server: {
      host: '0.0.0.0',
      allowedHosts: ['.ngrok-free.dev'],
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/gsap/') || id.includes('/node_modules/lenis/')) {
              return 'motion';
            }

            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react-router/')
            ) {
              return 'framework';
            }

            return undefined;
          },
        },
      },
    },
  };
});
