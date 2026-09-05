/**
 * Browser persistence boundary.
 *
 * Canonical Work Intelligence state belongs to Aftergraph/work-intelligence-v2.
 * Browser storage is intentionally limited to harmless UI preferences. Older
 * Gemini-generated builds persisted WorkItems, observations and provider data in
 * localStorage; those values are ignored here so a reload cannot resurrect fake
 * operational state or shadow the backend.
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

const UI_PREFERENCE_KEYS = new Set<string>([
  STORAGE_KEYS.DENSITY,
]);

function nonCanonicalFallback<T>(key: string, fallback: T): T {
  // Never reopen the app in an implicit demo scenario.
  if (key === STORAGE_KEYS.CURRENT_SCENARIO) {
    return 'new_workspace' as T;
  }

  // Canonical/provider collections start empty until an authoritative source
  // supplies them. Preview scenarios may still populate in-memory state after
  // an explicit user action.
  if (Array.isArray(fallback)) {
    return [] as T;
  }

  if (key === STORAGE_KEYS.METRICS) {
    return {
      autonomousResolutionRate: 0,
      humanInterventionRatio: 0,
      meanInferenceLatencyMs: 0,
      activeObservationsToday: 0,
      workItemsDiscoveredToday: 0,
      pendingReviewCount: 0,
      policyAlignmentScore: 0,
    } as T;
  }

  return fallback;
}

export function loadPersistedState<T>(key: string, fallback: T): T {
  if (!UI_PREFERENCE_KEYS.has(key)) {
    return nonCanonicalFallback(key, fallback);
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Persistence] Failed to load UI preference "${key}", using fallback:`, err);
    return fallback;
  }
}

export function savePersistedState<T>(key: string, data: T): boolean {
  if (!UI_PREFERENCE_KEYS.has(key)) {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn(`[Persistence] Failed to save UI preference "${key}":`, err);
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
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.warn('[Persistence] Failed to clear browser storage:', err);
  }
}
