import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    mdx(),
  ],
  output: 'static',
  site: 'https://yourwebsite.com',
  base: '/EyalWebSite',
  server: {
    port: 4321,
  },
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@lib': '/src/lib',
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'socket.io-client'],
      exclude: ['@astrojs/react'],
    },
  },
});

