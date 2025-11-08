import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    mdx(),
  ],
  output: 'hybrid',
  site: 'https://yourwebsite.com',
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

