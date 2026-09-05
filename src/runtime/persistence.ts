/**
 * Aftergraph Runtime Persistence Engine
 * 
 * Safely manages client-side durable state across reloads and tab sessions.
 * Implements fault-tolerant JSON serialization, quota guardrails, and
 * scenario reset mechanisms.
 */

export const STORAGE_KEYS = {
  WORK_ITEMS: 'aftergraph_work_items_v2',
  OBSERVATIONS: 'aftergraph_observations_v2',
  REVIEW_QUEUE: 'aftergraph_review_queue_v2',
  INTEGRATIONS: 'aftergraph_integrations_v2',
  METRICS: 'aftergraph_metrics_v2',
  CURRENT_SCENARIO: 'aftergraph_scenario_v2',
  DRIVE_ITEMS: 'aftergraph_drive_items_v2',
  GMAIL_MESSAGES: 'aftergraph_gmail_messages_v2',
  CALENDAR_EVENTS: 'aftergraph_calendar_events_v2',
  SHEETS_DATASETS: 'aftergraph_sheets_datasets_v2',
  DOCS_ITEMS: 'aftergraph_docs_items_v2',
  KEEP_NOTES: 'aftergraph_keep_notes_v2',
  DENSITY: 'aftergraph_density_v2',
} as const;

export function loadPersistedState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch (err) {
    console.warn(`[Persistence] Failed to load key "${key}", using fallback:`, err);
    return fallback;
  }
}

export function savePersistedState<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn(`[Persistence] Quota exceeded or error saving key "${key}":`, err);
    return false;
  }
}

export function removePersistedState(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[Persistence] Failed to remove key "${key}":`, err);
  }
}

export function clearAllPersistedState(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (err) {
    console.warn('[Persistence] Failed to clear storage:', err);
  }
}
