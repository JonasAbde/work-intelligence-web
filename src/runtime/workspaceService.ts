import { fetchDriveFiles } from '../services/workspace/driveApi';
import { fetchGmailMessages } from '../services/workspace/gmailApi';
import { fetchCalendarEvents } from '../services/workspace/calendarApi';
import { fetchDocs } from '../services/workspace/docsApi';
import { fetchSheetDataset } from '../services/workspace/sheetsApi';
import { fetchKeepNotes } from '../services/workspace/keepApi';
import {
  WorkspaceResource,
  WorkspaceProvider,
  ProviderHealth,
  PickerIntent,
} from './workspaceResource';
import {
  driveItemToResource,
  gmailItemToResource,
  calendarEventToResource,
  docItemToResource,
  sheetDatasetToResource,
  keepItemToResource,
} from './resourceAdapters';
import { telemetry } from './telemetry';
import { isExplicitPreviewMode } from './runtimeMode';

export interface WorkspaceFilterOptions {
  query?: string;
  providers?: WorkspaceProvider[];
  kinds?: string[];
  actionableOnly?: boolean;
  linkedWorkOnly?: boolean;
  hasEvidenceHash?: boolean;
}

const PROVIDERS: WorkspaceProvider[] = ['gmail', 'calendar', 'drive', 'docs', 'sheets', 'keep'];

function initialHealth(provider: WorkspaceProvider): ProviderHealth {
  return {
    provider,
    state: 'connecting',
    impactMessage: 'Provider has not been checked in this browser session.',
    lastChecked: new Date(0).toISOString(),
    scopeGranted: false,
  };
}

class WorkspaceRuntimeService {
  private cache: Map<string, WorkspaceResource> = new Map();
  private isInitialized = false;
  private providerHealthMap: Map<WorkspaceProvider, ProviderHealth> = new Map(PROVIDERS.map(provider => [provider, initialHealth(provider)]));

  public getProviderHealth(): ProviderHealth[] {
    return Array.from(this.providerHealthMap.values());
  }

  public setProviderHealth(provider: WorkspaceProvider, health: Partial<ProviderHealth>) {
    const existing = this.providerHealthMap.get(provider) || initialHealth(provider);
    this.providerHealthMap.set(provider, { ...existing, ...health, lastChecked: new Date().toISOString() });
  }

  private recordProviderResult(provider: WorkspaceProvider, result: PromiseSettledResult<unknown>, elapsedMs: number) {
    if (result.status === 'fulfilled') {
      this.setProviderHealth(provider, {
        state: isExplicitPreviewMode() && provider === 'keep' ? 'connected' : 'healthy',
        impactMessage: isExplicitPreviewMode() && provider === 'keep' ? 'Explicit preview provider.' : 'Provider request completed successfully.',
        scopeGranted: provider === 'keep' ? false : true,
        latencyMs: elapsedMs,
      });
      return;
    }

    const message = result.reason instanceof Error ? result.reason.message : 'Provider request failed.';
    const lower = message.toLowerCase();
    const authFailure = lower.includes('authorization required') || lower.includes('401') || lower.includes('403');
    this.setProviderHealth(provider, {
      state: authFailure ? 'permission_missing' : 'unavailable',
      impactMessage: message,
      scopeGranted: false,
      latencyMs: elapsedMs,
    });
  }

  public async loadAllResources(forceRefresh = false): Promise<WorkspaceResource[]> {
    const startTime = performance.now();
    if (this.isInitialized && !forceRefresh && this.cache.size > 0) return Array.from(this.cache.values());

    const previewMode = isExplicitPreviewMode();
    const providerStarts = new Map<WorkspaceProvider, number>();
    const timed = <T,>(provider: WorkspaceProvider, operation: () => Promise<T>) => {
      providerStarts.set(provider, performance.now());
      return operation();
    };

    const keepOperation = previewMode
      ? fetchKeepNotes()
      : Promise.reject(new Error('Google Keep is preview-only and has no supported live connector.'));

    const [driveItems, gmailItems, calendarItems, docsItems, sheetData, keepItems] = await Promise.allSettled([
      timed('drive', () => fetchDriveFiles()),
      timed('gmail', () => fetchGmailMessages()),
      timed('calendar', () => fetchCalendarEvents()),
      timed('docs', () => fetchDocs()),
      timed('sheets', () => fetchSheetDataset()),
      timed('keep', () => previewMode ? fetchKeepNotes() : keepOperation),
    ]);

    const results: Array<[WorkspaceProvider, PromiseSettledResult<unknown>]> = [
      ['drive', driveItems],
      ['gmail', gmailItems],
      ['calendar', calendarItems],
      ['docs', docsItems],
      ['sheets', sheetData],
      ['keep', keepItems],
    ];
    for (const [provider, result] of results) {
      const startedAt = providerStarts.get(provider) ?? startTime;
      this.recordProviderResult(provider, result, Math.max(0, Math.round(performance.now() - startedAt)));
    }

    const allResources: WorkspaceResource[] = [];
    if (driveItems.status === 'fulfilled') driveItems.value.forEach(item => allResources.push(driveItemToResource(item)));
    if (gmailItems.status === 'fulfilled') gmailItems.value.forEach(item => allResources.push(gmailItemToResource(item)));
    if (calendarItems.status === 'fulfilled') calendarItems.value.forEach(item => allResources.push(calendarEventToResource(item)));
    if (docsItems.status === 'fulfilled') docsItems.value.forEach(item => allResources.push(docItemToResource(item)));
    if (sheetData.status === 'fulfilled' && sheetData.value) allResources.push(sheetDatasetToResource(sheetData.value));
    if (keepItems.status === 'fulfilled') keepItems.value.forEach(item => allResources.push(keepItemToResource(item)));

    this.cache.clear();
    allResources.forEach(resource => this.cache.set(resource.id, resource));
    this.isInitialized = true;
    telemetry.record('time_to_resource', { durationMs: Math.round(performance.now() - startTime) });
    return allResources;
  }

  public async searchResources(filters: WorkspaceFilterOptions): Promise<WorkspaceResource[]> {
    const all = await this.loadAllResources();
    const query = (filters.query || '').trim().toLowerCase();

    return all.filter(item => {
      if (filters.providers?.length && !filters.providers.includes(item.provider)) return false;
      if (filters.kinds?.length && !filters.kinds.includes(item.kind)) return false;
      if (filters.actionableOnly && !item.isActionable) return false;
      if (filters.linkedWorkOnly && !item.linkedWorkItems?.length) return false;
      if (filters.hasEvidenceHash && !item.evidenceHash) return false;
      if (!query) return true;

      return item.title.toLowerCase().includes(query)
        || Boolean(item.subtitle?.toLowerCase().includes(query))
        || Boolean(item.summary?.toLowerCase().includes(query))
        || Boolean(item.actor?.name.toLowerCase().includes(query))
        || Boolean(item.actor?.email.toLowerCase().includes(query));
    });
  }

  public getResourcesForIntent(intent: PickerIntent, resources: WorkspaceResource[]): WorkspaceResource[] {
    switch (intent) {
      case 'attach_evidence':
        return resources.filter(resource => Boolean(resource.provenanceUri));
      case 'schedule_work':
        return [...resources].sort((a, b) => Number(b.provider === 'calendar') - Number(a.provider === 'calendar'));
      case 'link_communication':
        return [...resources].sort((a, b) => Number(b.provider === 'gmail') - Number(a.provider === 'gmail'));
      case 'source_material':
        return resources.filter(resource => ['docs', 'drive', 'sheets'].includes(resource.provider) || (isExplicitPreviewMode() && resource.provider === 'keep'));
      case 'general_browse':
      default:
        return resources;
    }
  }

  /** Preview-only link projection. Canonical resource-to-WorkItem links belong in the backend. */
  public updateResourceLink(resourceId: string, workItemId: string) {
    if (!isExplicitPreviewMode()) throw new Error('Local resource linking is disabled outside explicit preview mode.');
    const resource = this.cache.get(resourceId);
    if (!resource) return;
    const existing = resource.linkedWorkItems || [];
    if (!existing.includes(workItemId)) {
      this.cache.set(resourceId, { ...resource, linkedWorkItems: [...existing, workItemId] });
    }
  }
}

export const workspaceRuntime = new WorkspaceRuntimeService();
