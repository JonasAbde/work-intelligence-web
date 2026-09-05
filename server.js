import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const API_URL = process.env.WORK_INTELLIGENCE_API_URL || 'http://127.0.0.1:8087';
const AFTERGRAPH_API_TOKEN = process.env.AFTERGRAPH_API_TOKEN || '';

// Thin BFF only. Canonical Work Intelligence state and domain logic stay in
// Aftergraph/work-intelligence-v2. Never expose AFTERGRAPH_API_TOKEN to Vite.
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  on: {
    proxyReq: (proxyReq) => {
      if (AFTERGRAPH_API_TOKEN) {
        proxyReq.setHeader('Authorization', `Bearer ${AFTERGRAPH_API_TOKEN}`);
      }
    },
    error: (err, _req, res) => {
      console.error('Proxy connection error to authoritative backend:', err.message);
      if (res && 'writeHead' in res && !res.headersSent) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(JSON.stringify({
          error: 'Backend unavailable',
          details: 'The BFF could not reach the authoritative Work Intelligence API.',
        }));
      }
    },
  },
}));

app.use(express.static(path.join(__dirname, 'dist'), {
  index: false,
  immutable: true,
  maxAge: '1h',
}));

// Express 5/path-to-regexp no longer accepts the old bare '*' catch-all.
// A path-less final middleware is valid for every SPA route including '/'.
app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BFF Proxy listening on port ${PORT}`);
  console.log(`Proxying frontend /api requests to authoritative backend at ${API_URL}`);
});
