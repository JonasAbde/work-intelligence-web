import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { backendAuthHeader, resolveBackendUrl } from './server-config.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = resolveBackendUrl(process.env);
const AUTH_HEADER = backendAuthHeader(process.env);

// BFF proxy only. Domain logic and durable data stay in Work Intelligence V2.
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '',
  },
  on: {
    proxyReq: (proxyReq) => {
      if (AUTH_HEADER) {
        proxyReq.setHeader('Authorization', AUTH_HEADER);
      }
    },
    error: (err, _req, res) => {
      console.error('Proxy connection error to authoritative backend:', err.message);
      if ('writeHead' in res) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Backend unavailable',
          details: 'The BFF could not reach the authoritative Work Intelligence API.',
        }));
      }
    },
  },
}));

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BFF Proxy listening on port ${PORT}`);
  console.log(`Proxying frontend /api requests to authoritative backend at ${API_URL}`);
});
