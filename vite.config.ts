import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.AI_API_KEY),
        'process.env.AI_API_KEY': JSON.stringify(env.AI_API_KEY)
      },
      plugins: [react()],
      server: {
        port: 3000,
        host: true
      },
      build: {
        outDir: 'dist'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
