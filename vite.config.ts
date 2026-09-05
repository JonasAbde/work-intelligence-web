import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.WORK_INTELLIGENCE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.warn(`Proxy error for ${req.url}: ${err.message}`);
            // Safely cast to ServerResponse to send 503
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
