import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ua-national-model-training-financial/',
  build: {
    outDir: 'docs'
  }
});
