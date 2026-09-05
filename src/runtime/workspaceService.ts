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
  PickerIntent 
} from './workspaceResource';
import { 
  driveItemToResource, 
  gmailItemToResource, 
  calendarEventToResource, 
  docItemToResource, 
  sheetDatasetToResource, 
  keepItemToResource 
} from './resourceAdapters';
import { telemetry } from './telemetry';

export interface WorkspaceFilterOptions {
  query?: string;
  providers?: WorkspaceProvider[];
  kinds?: string[];
  actionableOnly?: boolean;
  linkedWorkOnly?: boolean;
  hasEvidenceHash?: boolean;
}

class WorkspaceRuntimeService {
  private cache: Map<string, WorkspaceResource> = new Map();
  private isInitialized = false;

  private providerHealthMap: Map<WorkspaceProvider, ProviderHealth> = new Map([
    [
      'gmail',
      {
        provider: 'gmail',
        state: 'healthy',
        impactMessage: 'Ingesting inbound stakeholder emails and extracting operational intent.',
        lastChecked: new Date().toISOString(),
        scopeGranted: true,
        latencyMs: 142,
      },
    ],
    [
      'calendar',
      {
        provider: 'calendar',
        state: 'healthy',
        impactMessage: 'Synchronizing release gates, architectural reviews, and standups.',
        lastChecked: new Date().toISOString(),
        scopeGranted: true,
        latencyMs: 98,
      },
    ],
    [
      'drive',
      {
        provider: 'drive',
        state: 'healthy',
        impactMessage: 'Accessing enterprise documents, specifications, and architecture PDFs.',
        lastChecked: new Date().toISOString(),
        scopeGranted: true,
        latencyMs: 185,
      },
    ],
    [
      'docs',
      {
        provider: 'docs',
        state: 'healthy',
        impactMessage: 'Reading and writing live operational specs and security runbooks.',
        lastChecked: new Date().toISOString(),
        scopeGranted: true,
        latencyMs: 120,
      },
    ],
    [
      'sheets',
      {
        provider: 'sheets',
        state: 'healthy',
        impactMessage: 'Tracking pipeline capacity, inventory data, and structured metrics.',
        lastChecked: new Date().toISOString(),
        scopeGranted: true,
        latencyMs: 110,
      },
    ],
    [
      'keep',
      {
        provider: 'keep',
        state: 'healthy',
        impactMessage: 'Ingesting checklist items and tactical scratchpads.',
        lastChecked: new Date().toISOString(),
        scopeGranted: true,
        latencyMs: 82,
      },
    ],
  ]);

  public getProviderHealth(): ProviderHealth[] {
    return Array.from(this.providerHealthMap.values());
  }

  public setProviderHealth(provider: WorkspaceProvider, health: Partial<ProviderHealth>) {
    const existing = this.providerHealthMap.get(provider);
    if (existing) {
      this.providerHealthMap.set(provider, { ...existing, ...health, lastChecked: new Date().toISOString() });
    }
  }

  public async loadAllResources(forceRefresh = false): Promise<WorkspaceResource[]> {
    const startTime = performance.now();
    if (this.isInitialized && !forceRefresh && this.cache.size > 0) {
      return Array.from(this.cache.values());
    }

    try {
      const [driveItems, gmailItems, calendarItems, docsItems, sheetData, keepItems] = await Promise.allSettled([
        fetchDriveFiles(),
        fetchGmailMessages(),
        fetchCalendarEvents(),
        fetchDocs(),
        fetchSheetDataset('sheet_core_metrics_01'),
        fetchKeepNotes(),
      ]);

      const allResources: WorkspaceResource[] = [];

      if (driveItems.status === 'fulfilled') {
        driveItems.value.forEach(f => allResources.push(driveItemToResource(f)));
      }
      if (gmailItems.status === 'fulfilled') {
        gmailItems.value.forEach(m => allResources.push(gmailItemToResource(m)));
      }
      if (calendarItems.status === 'fulfilled') {
        calendarItems.value.forEach(c => allResources.push(calendarEventToResource(c)));
      }
      if (docsItems.status === 'fulfilled') {
        docsItems.value.forEach(d => allResources.push(docItemToResource(d)));
      }
      if (sheetData.status === 'fulfilled' && sheetData.value) {
        allResources.push(sheetDatasetToResource(sheetData.value));
      }
      if (keepItems.status === 'fulfilled') {
        keepItems.value.forEach(k => allResources.push(keepItemToResource(k)));
      }

      this.cache.clear();
      allResources.forEach(r => this.cache.set(r.id, r));
      this.isInitialized = true;

      const elapsed = Math.round(performance.now() - startTime);
      telemetry.record('time_to_resource', { durationMs: elapsed });

      return allResources;
    } catch (err) {
      console.error('Error loading universal workspace resources:', err);
      return Array.from(this.cache.values());
    }
  }

  public async searchResources(filters: WorkspaceFilterOptions): Promise<WorkspaceResource[]> {
    const all = await this.loadAllResources();
    const q = (filters.query || '').trim().toLowerCase();

    const filtered = all.filter(item => {
      if (filters.providers && filters.providers.length > 0 && !filters.providers.includes(item.provider)) {
        return false;
      }
      if (filters.kinds && filters.kinds.length > 0 && !filters.kinds.includes(item.kind)) {
        return false;
      }
      if (filters.actionableOnly && !item.isActionable) {
        return false;
      }
      if (filters.linkedWorkOnly && (!item.linkedWorkItems || item.linkedWorkItems.length === 0)) {
        return false;
      }
      if (filters.hasEvidenceHash && !item.evidenceHash) {
        return false;
      }

      if (q) {
        const inTitle = item.title.toLowerCase().includes(q);
        const inSubtitle = item.subtitle?.toLowerCase().includes(q) || false;
        const inSummary = item.summary?.toLowerCase().includes(q) || false;
        const inActor = item.actor?.name.toLowerCase().includes(q) || item.actor?.email.toLowerCase().includes(q) || false;
        return inTitle || inSubtitle || inSummary || inActor;
      }

      return true;
    });

    return filtered;
  }

  public getResourcesForIntent(intent: PickerIntent, resources: WorkspaceResource[]): WorkspaceResource[] {
    switch (intent) {
      case 'attach_evidence':
        // Prioritize Docs, Drive files, Sheets, Emails with hashes
        return [...resources].sort((a, b) => {
          const aPrio = a.kind === 'document' || a.kind === 'file' || a.kind === 'spreadsheet' ? 2 : 1;
          const bPrio = b.kind === 'document' || b.kind === 'file' || b.kind === 'spreadsheet' ? 2 : 1;
          return bPrio - aPrio;
        });
      case 'schedule_work':
        // Prioritize Calendar events
        return [...resources].sort((a, b) => (b.provider === 'calendar' ? 2 : 1) - (a.provider === 'calendar' ? 2 : 1));
      case 'link_communication':
        // Prioritize Gmail emails
        return [...resources].sort((a, b) => (b.provider === 'gmail' ? 2 : 1) - (a.provider === 'gmail' ? 2 : 1));
      case 'source_material':
        // Docs, Drive, Sheets, Keep
        return resources.filter(r => ['docs', 'drive', 'sheets', 'keep'].includes(r.provider));
      case 'general_browse':
      default:
        return resources;
    }
  }

  public updateResourceLink(resourceId: string, workItemId: string) {
    const res = this.cache.get(resourceId);
    if (res) {
      const existing = res.linkedWorkItems || [];
      if (!existing.includes(workItemId)) {
        res.linkedWorkItems = [...existing, workItemId];
        this.cache.set(resourceId, { ...res });
      }
    }
  }
}

export const workspaceRuntime = new WorkspaceRuntimeService();
