import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.WORK_INTELLIGENCE_API_URL || 'http://localhost:8000';

// This BFF proxy only forwards requests to the authoritative Aftergraph backend.
// IT DOES NOT IMPLEMENT ANY DOMAIN LOGIC OR STORE DATA.
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // Rewrite /api to match backend expectations (adjust if backend expects /api)
  },
  on: {
    error: (err, req, res) => {
      console.error('Proxy connection error to real backend:', err.message);
      if (res && 'writeHead' in res && !res.headersSent) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Backend unavailable', 
          details: 'The BFF could not reach the authoritative Work Intelligence API.' 
        }));
      }
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy connection error to real backend:', err.message);
    if (res && 'status' in res && !res.headersSent) {
      res.status(503).json({ 
        error: 'Backend unavailable', 
        details: 'The BFF could not reach the authoritative Work Intelligence API.' 
      });
    }
  }
}));

// Serve static React production build
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BFF Proxy listening on port ${PORT}`);
  console.log(`Proxying frontend /api requests to authoritative backend at ${API_URL}`);
});
