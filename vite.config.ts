import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { backendAuthHeader, resolveBackendUrl } from './server-config.mjs';

const backendUrl = resolveBackendUrl(process.env);
const backendAuthorization = backendAuthHeader(process.env);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (backendAuthorization) {
              proxyReq.setHeader('Authorization', backendAuthorization);
            }
          });
          proxy.on('error', (err, req, res) => {
            console.warn(`Proxy error for ${req.url}: ${err.message}`);
            const response = res as any;
            if (!response.headersSent) {
              response.writeHead(503, { 'Content-Type': 'application/json' });
              response.end(JSON.stringify({ error: 'Backend unavailable', details: err.message }));
            }
          });
        }
      }
    }
  }
});
