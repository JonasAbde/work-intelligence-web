export function isExplicitPreviewSearch(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  return params.get('preview') === '1';
}

export function isExplicitPreviewMode(): boolean {
  if (typeof window === 'undefined') return false;
  return isExplicitPreviewSearch(window.location.search);
}
