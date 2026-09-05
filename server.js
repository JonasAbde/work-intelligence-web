import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { isAllowedWebApiRequest } from './server-policy.mjs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const API_URL = process.env.WORK_INTELLIGENCE_API_URL || 'http://127.0.0.1:8087';
const AFTERGRAPH_API_TOKEN = process.env.AFTERGRAPH_API_TOKEN || '';

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// The browser receives only the narrow Work Intelligence API surface needed by
// the Experience Runtime. The server credential must never turn this BFF into
// an authenticated tunnel to backend administration endpoints.
app.use('/api', (req, res, next) => {
  if (!isAllowedWebApiRequest(req.method, req.originalUrl.replace(/^\/api/, ''))) {
    res.status(403).set('Cache-Control', 'no-store').json({
      error: 'BFF route denied',
      details: 'This backend operation is not exposed to the web Experience Runtime.',
    });
    return;
  }
  next();
});

app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  on: {
    proxyReq: (proxyReq) => {
      // Never forward browser-supplied backend credentials.
      proxyReq.removeHeader('cookie');
      proxyReq.removeHeader('x-api-key');
      proxyReq.removeHeader('authorization');
      if (AFTERGRAPH_API_TOKEN) {
        proxyReq.setHeader('Authorization', `Bearer ${AFTERGRAPH_API_TOKEN}`);
      }
    },
    proxyRes: (proxyRes) => {
      proxyRes.headers['cache-control'] = 'no-store';
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

app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Work Intelligence Web BFF listening on port ${PORT}`);
  console.log(`Proxying allowlisted /api requests to ${API_URL}`);
  if (!AFTERGRAPH_API_TOKEN) {
    console.warn('AFTERGRAPH_API_TOKEN is not configured. This is acceptable only when the backend itself is running without token authentication.');
  }
});
