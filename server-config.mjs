export function resolveBackendUrl(env = process.env) {
  return env.WORK_INTELLIGENCE_API_URL || 'http://127.0.0.1:8087';
}

export function backendAuthHeader(env = process.env) {
  const token = env.AFTERGRAPH_API_TOKEN;
  return token ? `Bearer ${token}` : null;
}
