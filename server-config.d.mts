export interface BackendEnvironment {
  WORK_INTELLIGENCE_API_URL?: string;
  AFTERGRAPH_API_TOKEN?: string;
  [key: string]: string | undefined;
}

export function resolveBackendUrl(env?: BackendEnvironment): string;
export function backendAuthHeader(env?: BackendEnvironment): string | null;
