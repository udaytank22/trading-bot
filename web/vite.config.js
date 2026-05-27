import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { allowedHosts: true },
  resolve: {
    alias: {
      '@'          : path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features'  : path.resolve(__dirname, './src/features'),
      '@context'   : path.resolve(__dirname, './src/context'),
      '@hooks'     : path.resolve(__dirname, './src/hooks'),
      '@services'  : path.resolve(__dirname, './src/services'),
      '@utils'     : path.resolve(__dirname, './src/utils'),
      '@data'      : path.resolve(__dirname, './src/data'),
      '@config'    : path.resolve(__dirname, './src/config'),
    },
  },
});
