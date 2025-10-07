import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // Απενεργοποίηση source maps για να αποφύγουμε το σφάλμα
  },
  server: {
    port: 3000,
    open: true,
    hmr: true,
  },
});