const STATIC_GET_ROUTES = new Set([
  '/healthz',
  '/healthz/detailed',
  '/v1/readiness',
  '/v1/usage',
  '/v1/metrics',
  '/v1/monitoring',
  '/v1/version',
]);

function pathname(input) {
  try {
    return new URL(input, 'http://local').pathname;
  } catch {
    return '';
  }
}

export function isAllowedWebApiRequest(method, url) {
  const normalizedMethod = String(method || '').toUpperCase();
  const path = pathname(url);

  if (normalizedMethod === 'GET' && STATIC_GET_ROUTES.has(path)) return true;
  if (normalizedMethod === 'GET' && path === '/v1/observations') return true;
  if (normalizedMethod === 'POST' && path === '/v1/observations') return true;
  if (normalizedMethod === 'GET' && path === '/v1/work-items') return true;

  const workItemPath = '^/v1/work-items/[^/]+$';
  const workItemSubresourcePath = '^/v1/work-items/[^/]+/(evidence|transitions|publications|actions)$';
  const workItemActionPath = '^/v1/work-items/[^/]+/(review|publish|promote)$';

  if (normalizedMethod === 'GET' && new RegExp(workItemPath).test(path)) return true;
  if (normalizedMethod === 'GET' && new RegExp(workItemSubresourcePath).test(path)) return true;
  if (normalizedMethod === 'POST' && new RegExp(workItemActionPath).test(path)) return true;

  return false;
}
