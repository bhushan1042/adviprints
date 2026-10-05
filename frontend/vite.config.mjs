import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const frontendDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendDir, '');
  const apiBase = (env.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE || '').trim();
  const developmentApiBase = apiBase || '/';
  const proxyTarget = apiBase || 'http://localhost:5000';

  if (mode === 'production' && !apiBase) {
    throw new Error(
      'REACT_APP_API_BASE is required for production builds. Set it to the public backend URL without a trailing slash.'
    );
  }

  return {
    server: {
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
        '/products': { target: proxyTarget, changeOrigin: true },
        '/categories': { target: proxyTarget, changeOrigin: true },
        '/reviews': { target: proxyTarget, changeOrigin: true },
        '/uploads': { target: proxyTarget, changeOrigin: true }
      }
    },
    optimizeDeps: {
      entries: ['index.html'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    },
    plugins: [
      {
        name: 'jsx-in-js',
        enforce: 'pre',
        async transform(code, id) {
          if (id.includes('/src/') && id.endsWith('.js')) {
            const apiBaseLiteral = JSON.stringify(
              mode === 'production' ? apiBase : developmentApiBase
            );
            const source = code.replace(/\b__API_BASE__\b/g, apiBaseLiteral);
            return transformWithEsbuild(source, id, { loader: 'jsx', jsx: 'automatic' });
          }
          return null;
        }
      },
      react()
    ],
    resolve: {
      alias: {
        '@': path.resolve(frontendDir, 'src')
      }
    },
    define: {
      'process.env.REACT_APP_API_BASE': JSON.stringify(apiBase)
    },
    build: { outDir: 'build' }
  };
});
