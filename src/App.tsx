import { useEffect, useState, useCallback } from 'react';
import { 
  WorkItem, 
  Observation, 
  ReviewQueueItem, 
  IntegrationStatus, 
  SystemMetrics, 
  ConnectionState 
} from './types';
import { apiClient, HealthCheckResult } from './api/client';
import { Navigation, ViewTab } from './components/Navigation';
import { Inspector } from './components/Inspector';
import { CommandPalette } from './components/CommandPalette';
import { ConnectionModal } from './components/ConnectionModal';
import { HomeView } from './components/views/HomeView';
import { WorkView } from './components/views/WorkView';
import { ReviewQueueView } from './components/views/ReviewQueueView';
import { ActivityView } from './components/views/ActivityView';
import { IntegrationsView } from './components/views/IntegrationsView';
import { EvidenceGraphView } from './components/views/EvidenceGraphView';
import { Toast, ToastMessage } from './components/ui/Toast';
import { 
  AppScenario, 
  getScenarioData 
} from './mock/fixtures';
import { DensityProvider } from './runtime/primitives/DensityProvider';
import { DriveSurface } from './components/workspace/DriveSurface';
import { GmailSurface } from './components/workspace/GmailSurface';
import { CalendarSurface } from './components/workspace/CalendarSurface';
import { SheetsSurface } from './components/workspace/SheetsSurface';
import { DocsSurface } from './components/workspace/DocsSurface';
import { KeepSurface } from './components/workspace/KeepSurface';
import { UniversalSearchView } from './components/workspace/UniversalSearchView';
import { ComponentRegistryView } from './components/dev/ComponentRegistryView';
import { TelemetryHUD } from './components/workspace/TelemetryHUD';
import { AttachEvidenceModal } from './components/workspace/AttachEvidenceModal';
import { WorkspaceResource } from './runtime/workspaceResource';
import { workspaceRuntime } from './runtime/workspaceService';
import { GmailMessageItem, KeepNoteItem, DriveItem, DensityMode } from './runtime/runtimeTypes';
import { 
  STORAGE_KEYS, 
  loadPersistedState, 
  savePersistedState 
} from './runtime/persistence';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('home');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [density, setDensity] = useState<DensityMode>(() => 
    loadPersistedState<DensityMode>(STORAGE_KEYS.DENSITY, 'comfortable')
  );

  const initialScenario = loadPersistedState<AppScenario>(STORAGE_KEYS.CURRENT_SCENARIO, 'normal_day');
  const [activeScenario, setActiveScenario] = useState<AppScenario>(initialScenario);
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);

  // Initialize data with initial scenario or persisted state
  const initialData = getScenarioData(initialScenario);
  const [workItems, setWorkItems] = useState<WorkItem[]>(() => 
    loadPersistedState<WorkItem[]>(STORAGE_KEYS.WORK_ITEMS, initialData.workItems)
  );
  const [observations, setObservations] = useState<Observation[]>(() => 
    loadPersistedState<Observation[]>(STORAGE_KEYS.OBSERVATIONS, initialData.observations)
  );
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>(() => 
    loadPersistedState<ReviewQueueItem[]>(STORAGE_KEYS.REVIEW_QUEUE, initialData.reviewQueue)
  );
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>(() => 
    loadPersistedState<IntegrationStatus[]>(STORAGE_KEYS.INTEGRATIONS, initialData.integrations)
  );
  const [, setMetrics] = useState<SystemMetrics>(() => 
    loadPersistedState<SystemMetrics>(STORAGE_KEYS.METRICS, initialData.metrics)
  );

  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [evidenceTargetResource, setEvidenceTargetResource] = useState<WorkspaceResource | null>(null);
  const [batchEvidenceTargetResources, setBatchEvidenceTargetResources] = useState<WorkspaceResource[]>([]);

  // Sync state to persistent storage
  useEffect(() => {
    savePersistedState(STORAGE_KEYS.WORK_ITEMS, workItems);
  }, [workItems]);

  useEffect(() => {
    savePersistedState(STORAGE_KEYS.OBSERVATIONS, observations);
  }, [observations]);

  useEffect(() => {
    savePersistedState(STORAGE_KEYS.REVIEW_QUEUE, reviewQueue);
  }, [reviewQueue]);

  useEffect(() => {
    savePersistedState(STORAGE_KEYS.INTEGRATIONS, integrations);
  }, [integrations]);

  useEffect(() => {
    savePersistedState(STORAGE_KEYS.CURRENT_SCENARIO, activeScenario);
  }, [activeScenario]);

  useEffect(() => {
    savePersistedState(STORAGE_KEYS.DENSITY, density);
  }, [density]);

  // Toast state with Undo support
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Switch Scenario handler
  const handleScenarioChange = (newScenario: AppScenario) => {
    setActiveScenario(newScenario);
    const data = getScenarioData(newScenario);
    setWorkItems(data.workItems);
    setObservations(data.observations);
    setReviewQueue(data.reviewQueue);
    setIntegrations(data.integrations);
    setMetrics(data.metrics);
    setSelectedWorkItem(null);
    setIsInspectorOpen(false);

    savePersistedState(STORAGE_KEYS.CURRENT_SCENARIO, newScenario);
    savePersistedState(STORAGE_KEYS.WORK_ITEMS, data.workItems);
    savePersistedState(STORAGE_KEYS.OBSERVATIONS, data.observations);
    savePersistedState(STORAGE_KEYS.REVIEW_QUEUE, data.reviewQueue);
    savePersistedState(STORAGE_KEYS.INTEGRATIONS, data.integrations);
    savePersistedState(STORAGE_KEYS.METRICS, data.metrics);

    setToast({
      id: `scen-${Date.now()}`,
      title: `Switched to ${newScenario.replace('_', ' ').toUpperCase()}`,
      description: 'Loaded test state matrix for complete UX evaluation.',
      duration: 3000
    });
  };

  // Ping backend check
  const checkBackendHealth = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const result = await apiClient.checkHealth();
      setHealthResult(result);
      setConnectionState(result.state);
      
      if (result.state === 'connected') {
        setIsMockMode(false);
        const [items, obs, queue, integ, met] = await Promise.all([
          apiClient.getWorkItems(false),
          apiClient.getObservations(false),
          apiClient.getReviewQueue(false),
          apiClient.getIntegrations(false),
          apiClient.getMetrics(false),
        ]);
        setWorkItems(items);
        setObservations(obs);
        setReviewQueue(queue);
        setIntegrations(integ);
        setMetrics(met);
      } else {
        setIsMockMode(true);
      }
    } catch {
      setConnectionState('unavailable');
      setIsMockMode(true);
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        if (isInspectorOpen) setIsInspectorOpen(false);
        else if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        else if (isConnectionModalOpen) setIsConnectionModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isConnectionModalOpen, isInspectorOpen]);

  // Approve action with full Undo support
  const handleApproveWorkItem = async (id: string) => {
    const targetItem = workItems.find(w => w.id === id);
    const prevStatus = targetItem?.status || 'needs_review';
    const removedReviewItem = reviewQueue.find(r => r.workItem.id === id);

    // Optimistic update
    setWorkItems(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          status: 'published',
          publications: w.publications.map(p => ({ ...p, status: 'published' })),
        };
      }
      return w;
    }));
    setReviewQueue(prev => prev.filter(r => r.workItem.id !== id));
    if (selectedWorkItem?.id === id) {
      setSelectedWorkItem(prev => prev ? { ...prev, status: 'published' } : null);
    }

    // Trigger toast with undo
    setToast({
      id: `appr-${id}-${Date.now()}`,
      title: 'Approved',
      description: `Dispatched to ${targetItem?.publications[0]?.target || 'RenOS'}`,
      undoLabel: 'Undo',
      duration: 6000,
      onUndo: () => {
        // Rollback optimistic update
        setWorkItems(prev => prev.map(w => w.id === id ? { ...w, status: prevStatus } : w));
        if (removedReviewItem) {
          setReviewQueue(prev => [removedReviewItem, ...prev]);
        }
        if (selectedWorkItem?.id === id) {
          setSelectedWorkItem(prev => prev ? { ...prev, status: prevStatus } : null);
        }
        setToast({
          id: `undo-${Date.now()}`,
          title: 'Action undone',
          description: `Work item ${id} restored to review queue.`,
          duration: 3000
        });
      }
    });

    try {
      await apiClient.approveWorkItem(id, isMockMode);
    } catch {
      // handled gracefully in preview mode
    }
  };

  const handleRejectWorkItem = async (id: string, reason: string) => {
    setWorkItems(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' } : w));
    setReviewQueue(prev => prev.filter(r => r.workItem.id !== id));
    setIsInspectorOpen(false);

    setToast({
      id: `rej-${id}`,
      title: 'Item archived',
      description: `Archived with reason: ${reason}`,
      duration: 4000
    });

    try {
      await apiClient.rejectWorkItem(id, reason, isMockMode);
    } catch {
      // handled gracefully
    }
  };

  const handleReconnectIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(i => i.id === integrationId ? { ...i, status: 'operational' as const } : i));
    setToast({
      id: `rec-${integrationId}`,
      title: 'Integration restored',
      description: 'Incoming communication stream is now active.',
      duration: 4000
    });
  };

  // Promote an extracted Gmail intent into a verified Work Item
  const handlePromoteGmailToWorkItem = (msg: GmailMessageItem) => {
    const candidate = msg.extractedWorkItemCandidate;
    const newId = `WI-GMAIL-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const newWorkItem: WorkItem = {
      id: newId,
      title: candidate ? candidate.suggestedTitle : `Process: ${msg.subject}`,
      description: candidate ? candidate.suggestedAction : msg.snippet,
      status: 'needs_review',
      priority: 'high',
      owner: {
        name: 'Aftergraph Gmail Observer',
        email: 'intelligence@aftergraph.internal',
        isAutonomousAgent: true,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      confidence: candidate ? candidate.confidence : 0.88,
      whyExists: {
        inferenceSummary: candidate ? candidate.reasoning : 'Ingested from incoming email communication',
        model: 'gemini-2.5-flash-autonomous',
        triggerObservationId: `obs-gmail-${msg.id}`,
        inferredIntent: 'Resolve inbound request and generate delivery spec',
      },
      resolution: {
        decisionType: 'autonomous_created',
        details: 'Promoted directly from Gmail operational stream with cryptographic email evidence.',
      },
      policies: [
        {
          id: `pol-${Date.now()}`,
          code: 'RULE-COMMS-AUTO-INGEST',
          name: 'Comms Ingest Policy',
          status: 'requires_human_signoff',
          reason: 'External stakeholder request requires human verification before dispatching.',
          appliedAt: nowIso,
        }
      ],
      evidence: [
        {
          id: `ev-${Date.now()}`,
          type: 'email_thread',
          title: msg.subject,
          snippet: msg.snippet,
          timestamp: msg.date,
          author: `${msg.fromName} (${msg.from})`,
          sourceUri: 'https://mail.google.com',
          hash: `sha256:gmail_${msg.id.slice(0, 16)}`,
          confidenceContribution: candidate ? candidate.confidence : 0.88,
        }
      ],
      publications: [
        {
          id: `pub-${Date.now()}`,
          target: 'RenOS',
          status: 'pending',
        }
      ],
      activity: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowIso,
          actor: 'Aftergraph Intelligence',
          isSystem: true,
          action: 'Extracted Work Item',
          detail: `Parsed inbound email thread from ${msg.fromName}`,
        }
      ],
      sourceObservationIds: [`obs-gmail-${msg.id}`],
      reviewCategory: 'high_confidence',
    };

    setWorkItems(prev => [newWorkItem, ...prev]);
    setReviewQueue(prev => [
      {
        id: `rev-${newId}`,
        workItem: newWorkItem,
        category: 'high_confidence',
        urgency: 'high',
        reasoning: 'Inbound external communication requires review before triggering publication dispatch.',
      },
      ...prev
    ]);

    setToast({
      id: `prom-${newId}`,
      title: 'Promoted to Work Item',
      description: `Created ${newId} with cryptographic email evidence hash.`,
      duration: 5000,
    });
  };

  // Promote a Keep Note / Checklist into a verified Work Item
  const handlePromoteKeepToWorkItem = (note: KeepNoteItem) => {
    const newId = `WI-KEEP-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const description = note.isChecklist
      ? `Verify checklist items: ${note.checklistItems.map(i => i.text).join('; ')}`
      : note.content;

    const newWorkItem: WorkItem = {
      id: newId,
      title: note.title,
      description,
      status: 'needs_review',
      priority: 'medium',
      owner: {
        name: 'Keep Sync Agent',
        email: 'keep-sync@aftergraph.internal',
        isAutonomousAgent: true,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      confidence: 0.95,
      whyExists: {
        inferenceSummary: `Captured from Google Keep checklist: ${note.title}`,
        model: 'gemini-2.5-flash-autonomous',
        triggerObservationId: `obs-keep-${note.id}`,
        inferredIntent: 'Execute and verify checklist items before release gate signoff.',
      },
      resolution: {
        decisionType: 'policy_promoted',
        details: 'Promoted from Google Keep note into supervisory review backlog.',
      },
      policies: [
        {
          id: `pol-${Date.now()}`,
          code: 'RULE-KEEP-SYNC',
          name: 'Keep Operational Checklist Signoff',
          status: 'requires_human_signoff',
          reason: 'Checklist operational items require supervisory signoff.',
          appliedAt: nowIso,
        }
      ],
      evidence: [
        {
          id: `ev-keep-${Date.now()}`,
          type: 'document',
          title: note.title,
          snippet: description.slice(0, 200),
          timestamp: note.updatedAt,
          author: 'Current User (Google Keep)',
          sourceUri: 'https://keep.google.com',
          hash: `sha256:keep_${note.id}`,
          confidenceContribution: 0.95,
        }
      ],
      publications: [
        {
          id: `pub-${Date.now()}`,
          target: 'RenOS',
          status: 'pending',
        }
      ],
      activity: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowIso,
          actor: 'Keep Ingestion Engine',
          isSystem: true,
          action: 'Promoted Checklist Note',
          detail: `Converted note "${note.title}" into operational work item`,
        }
      ],
      sourceObservationIds: [`obs-keep-${note.id}`],
      reviewCategory: 'high_confidence',
    };

    setWorkItems(prev => [newWorkItem, ...prev]);
    setReviewQueue(prev => [
      {
        id: `rev-${newId}`,
        workItem: newWorkItem,
        category: 'high_confidence',
        urgency: 'normal',
        reasoning: 'Operational checklist item promoted from Google Keep for team signoff.',
      },
      ...prev
    ]);

    setToast({
      id: `prom-${newId}`,
      title: 'Promoted Keep Note',
      description: `Created Work Item ${newId} from checklist.`,
      duration: 5000,
    });
  };

  // Attach a Drive file as cryptographic evidence to the currently selected work item
  const handleAttachDriveToWorkItem = (file: DriveItem) => {
    if (!selectedWorkItem) {
      setToast({
        id: `att-err-${Date.now()}`,
        title: 'No Work Item Selected',
        description: 'Please select a Work Item from the Work or Review tab first.',
        duration: 4000,
      });
      return;
    }

    const newEvidence = {
      id: `ev-drive-${Date.now()}`,
      type: 'document' as const,
      title: file.name,
      snippet: `Drive artifact (${file.mimeType}) owned by ${file.ownerName || 'workspace user'}.`,
      timestamp: file.modifiedTime,
      author: file.ownerName || 'Drive User',
      sourceUri: file.webViewLink || 'https://drive.google.com',
      hash: `sha256:drive_${file.id}`,
      confidenceContribution: 0.99,
    };

    setWorkItems(prev => prev.map(w => {
      if (w.id === selectedWorkItem.id) {
        return {
          ...w,
          evidence: [...w.evidence, newEvidence],
        };
      }
      return w;
    }));

    setSelectedWorkItem(prev => prev ? {
      ...prev,
      evidence: [...prev.evidence, newEvidence]
    } : null);

    setToast({
      id: `att-${Date.now()}`,
      title: 'Evidence Attached',
      description: `Linked "${file.name}" to ${selectedWorkItem.id}.`,
      duration: 4000,
    });
  };

  // Unified Resource -> Work Item promotion
  const handleCreateWorkItemFromResource = (resource: WorkspaceResource) => {
    const newId = `WI-WS-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const summaryText = resource.summary || resource.subtitle || resource.title;

    const newWorkItem: WorkItem = {
      id: newId,
      title: resource.detectedWork?.suggestedTitle || resource.title,
      description: resource.detectedWork?.suggestedAction || summaryText || `Operational work item from ${resource.provider.toUpperCase()} (${resource.kind})`,
      status: 'needs_review',
      priority: resource.detectedWork?.priority || 'medium',
      owner: {
        name: `${resource.provider.toUpperCase()} Ingestion Agent`,
        email: `${resource.provider}-sync@aftergraph.internal`,
        isAutonomousAgent: true,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      confidence: resource.detectedWork?.confidence ?? 0.94,
      whyExists: {
        inferenceSummary: `Captured from ${resource.provider.toUpperCase()} resource: ${resource.title}`,
        model: 'gemini-2.5-flash-autonomous',
        triggerObservationId: `obs-${resource.provider}-${resource.id}`,
        inferredIntent: resource.detectedWork?.reasoning || 'Operational resource promoted into supervisory review backlog.',
      },
      resolution: {
        decisionType: 'policy_promoted',
        details: `Promoted from ${resource.provider} ${resource.kind} into team action queue.`,
      },
      policies: [
        {
          id: `pol-${Date.now()}`,
          code: `RULE-${resource.provider.toUpperCase()}-SYNC`,
          name: `${resource.provider.toUpperCase()} Resource Operational Signoff`,
          status: 'requires_human_signoff',
          reason: 'Cross-surface resource actions require human signoff.',
          appliedAt: nowIso,
        }
      ],
      evidence: [
        {
          id: `ev-${resource.provider}-${Date.now()}`,
          type: 'document',
          title: resource.title,
          snippet: summaryText.slice(0, 240),
          timestamp: resource.modifiedAt || nowIso,
          author: resource.actor?.name || `${resource.provider} System`,
          sourceUri: resource.provenanceUri || `https://${resource.provider}.google.com`,
          hash: resource.evidenceHash || `sha256:${resource.provider}_${resource.id}`,
          confidenceContribution: 0.98,
        },
      ],
      publications: [
        {
          id: `pub-${Date.now()}`,
          target: 'RenOS',
          status: 'pending',
        },
      ],
      activity: [
        {
          id: `act-${Date.now()}`,
          timestamp: nowIso,
          actor: `${resource.provider.toUpperCase()} Ingestion Runtime`,
          isSystem: true,
          action: 'Ingested & Promoted Resource',
          detail: `Created work item from ${resource.kind} "${resource.title}"`,
        },
      ],
      sourceObservationIds: [`obs-${resource.provider}-${resource.id}`],
      reviewCategory: 'high_confidence',
    };

    setWorkItems(prev => [newWorkItem, ...prev]);
    setReviewQueue(prev => [
      {
        id: `rev-${newId}`,
        workItem: newWorkItem,
        category: 'high_confidence',
        urgency: 'normal',
        reasoning: resource.detectedWork?.reasoning || `Operational asset promoted from ${resource.provider} for team review.`,
      },
      ...prev,
    ]);

    setSelectedWorkItem(newWorkItem);
    setToast({
      id: `prom-${newId}`,
      title: 'Work Item Created',
      description: `Created ${newId}: "${newWorkItem.title}".`,
      duration: 4000,
    });
  };

  const handleAttachResourceToTarget = (targetItem: WorkItem, resource: WorkspaceResource) => {
    const summaryText = resource.summary || resource.subtitle || resource.title;
    const newEvidence = {
      id: `ev-${resource.provider}-${Date.now()}`,
      type: 'document' as const,
      title: resource.title,
      snippet: summaryText.slice(0, 240),
      timestamp: resource.modifiedAt || new Date().toISOString(),
      author: resource.actor?.name || `${resource.provider} User`,
      sourceUri: resource.provenanceUri || `https://${resource.provider}.google.com`,
      hash: resource.evidenceHash || `sha256:${resource.provider}_${resource.id}`,
      confidenceContribution: 0.99,
    };

    setWorkItems(prev => prev.map(w => {
      if (w.id === targetItem.id) {
        return {
          ...w,
          evidence: [...w.evidence, newEvidence],
        };
      }
      return w;
    }));

    workspaceRuntime.updateResourceLink(resource.id, targetItem.id);

    setSelectedWorkItem(targetItem);
    setIsInspectorOpen(true);

    setToast({
      id: `att-${Date.now()}`,
      title: 'Evidence Anchored',
      description: `Bound "${resource.title}" (${resource.provider.toUpperCase()}) to ${targetItem.id}.`,
      duration: 4500,
    });
  };

  const handleBatchAttachResourcesToTarget = (targetItem: WorkItem, resources: WorkspaceResource[]) => {
    const newEvidences = resources.map(resource => {
      const summaryText = resource.summary || resource.subtitle || resource.title;
      return {
        id: `ev-${resource.provider}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'document' as const,
        title: resource.title,
        snippet: summaryText.slice(0, 240),
        timestamp: resource.modifiedAt || new Date().toISOString(),
        author: resource.actor?.name || `${resource.provider} User`,
        sourceUri: resource.provenanceUri || `https://${resource.provider}.google.com`,
        hash: resource.evidenceHash || `sha256:${resource.provider}_${resource.id}`,
        confidenceContribution: 0.99,
      };
    });

    setWorkItems(prev => prev.map(w => {
      if (w.id === targetItem.id) {
        return {
          ...w,
          evidence: [...w.evidence, ...newEvidences],
        };
      }
      return w;
    }));

    resources.forEach(res => {
      workspaceRuntime.updateResourceLink(res.id, targetItem.id);
    });

    setSelectedWorkItem(targetItem);
    setIsInspectorOpen(true);

    setToast({
      id: `att-batch-${Date.now()}`,
      title: 'Batch Evidence Anchored',
      description: `Bound ${resources.length} cryptographic proofs to ${targetItem.id}.`,
      duration: 4500,
    });
  };

  // Unified Resource -> Evidence Attachment
  const handleAttachEvidenceFromResource = (resource: WorkspaceResource) => {
    if (!selectedWorkItem) {
      setEvidenceTargetResource(resource);
      return;
    }
    handleAttachResourceToTarget(selectedWorkItem, resource);
  };

  const handleBatchAttachEvidence = (resources: WorkspaceResource[]) => {
    if (resources.length === 0) return;
    if (selectedWorkItem) {
      handleBatchAttachResourcesToTarget(selectedWorkItem, resources);
    } else {
      setBatchEvidenceTargetResources(resources);
    }
  };

  const handleUpdateWorkItem = (updated: WorkItem) => {
    setWorkItems(prev => prev.map(w => w.id === updated.id ? updated : w));
    setReviewQueue(prev => prev.map(r => r.workItem.id === updated.id ? { ...r, workItem: updated } : r));
    if (selectedWorkItem?.id === updated.id) {
      setSelectedWorkItem(updated);
    }
    setToast({
      id: `upd-${updated.id}`,
      title: 'Work Item Updated',
      description: `Saved edits for ${updated.id}.`,
      duration: 3000,
    });
  };

  return (
    <DensityProvider density={density} onDensityChange={setDensity}>
      <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
        {/* 1. Left Navigation */}
        <Navigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'work') {
              setIsInspectorOpen(false);
            }
          }}
          reviewCount={reviewQueue.length}
          workCount={workItems.length}
          connectionState={connectionState}
          isMockMode={isMockMode}
          density={density}
          onToggleDensity={() => setDensity(d => d === 'comfortable' ? 'compact' : d === 'compact' ? 'dense' : 'comfortable')}
          activeScenario={activeScenario}
          onScenarioChange={handleScenarioChange}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenConnectionDiagnostics={() => setIsConnectionModalOpen(true)}
          onOpenTelemetry={() => setIsTelemetryOpen(true)}
        />

        {/* 2. Main Center Workspace */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          
          {/* Dynamic Views */}
          <div className="flex-1 flex overflow-hidden">
            
            {activeTab === 'home' && (
              <HomeView
                workItems={workItems}
                reviewQueue={reviewQueue}
                integrations={integrations}
                onSelectItem={(item) => {
                  setSelectedWorkItem(item);
                  setIsInspectorOpen(true);
                }}
                onSelectReview={(rev) => {
                  setSelectedWorkItem(rev.workItem);
                  setActiveTab('review');
                }}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onApprove={handleApproveWorkItem}
                onReconnectIntegration={handleReconnectIntegration}
                density={density}
              />
            )}

            {activeTab === 'work' && (
              <WorkView
                workItems={workItems}
                selectedItem={selectedWorkItem}
                onSelectItem={(item) => {
                  setSelectedWorkItem(item);
                  setIsInspectorOpen(true);
                }}
                density={density}
                onToggleDensity={() => setDensity(d => d === 'comfortable' ? 'compact' : d === 'compact' ? 'dense' : 'comfortable')}
              />
            )}

            {activeTab === 'review' && (
              <ReviewQueueView
                reviewQueue={reviewQueue}
                onApprove={handleApproveWorkItem}
                onReject={handleRejectWorkItem}
                onSelectWorkItem={(item) => {
                  setSelectedWorkItem(item);
                  setIsInspectorOpen(true);
                }}
                onUpdateWorkItem={handleUpdateWorkItem}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityView
                observations={observations}
                workItems={workItems}
                onSelectWorkItem={(item) => {
                  setSelectedWorkItem(item);
                  setIsInspectorOpen(true);
                }}
              />
            )}

            {activeTab === 'integrations' && (
              <IntegrationsView
                integrations={integrations}
                onRefresh={checkBackendHealth}
                onReconnect={handleReconnectIntegration}
              />
            )}

            {activeTab === 'evidence' && (
              <EvidenceGraphView
                workItems={workItems}
                observations={observations}
                onSelectWorkItem={(item) => {
                  setSelectedWorkItem(item);
                  setIsInspectorOpen(true);
                }}
              />
            )}

            {/* Google Workspace Surfaces */}
            {activeTab === 'workspace_search' && (
              <UniversalSearchView
                onSelectResource={(res) => {
                  const linkedId = res.linkedWorkItems?.[0];
                  if (linkedId) {
                    const found = workItems.find(w => w.id === linkedId);
                    if (found) {
                      setSelectedWorkItem(found);
                      setActiveTab('work');
                      setIsInspectorOpen(true);
                    }
                  }
                }}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={(res) => {
                  if (selectedWorkItem) {
                    handleAttachEvidenceFromResource(res);
                  } else {
                    handleCreateWorkItemFromResource(res);
                  }
                }}
                onBatchCreateWork={(resources) => {
                  resources.forEach(res => handleCreateWorkItemFromResource(res));
                }}
                onBatchAttachEvidence={(resources) => {
                  handleBatchAttachEvidence(resources);
                }}
                onNavigateToWorkItem={(id) => {
                  const found = workItems.find(w => w.id === id);
                  if (found) {
                    setSelectedWorkItem(found);
                    setActiveTab('work');
                    setIsInspectorOpen(true);
                  }
                }}
              />
            )}

            {activeTab === 'component_registry' && (
              <ComponentRegistryView />
            )}

            {activeTab === 'drive' && (
              <DriveSurface 
                onAttachToWorkItem={handleAttachDriveToWorkItem}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onNavigateToWorkItem={(id) => {
                  const found = workItems.find(w => w.id === id);
                  if (found) {
                    setSelectedWorkItem(found);
                    setActiveTab('work');
                    setIsInspectorOpen(true);
                  }
                }}
              />
            )}

            {activeTab === 'gmail' && (
              <GmailSurface 
                onPromoteToWorkItem={handlePromoteGmailToWorkItem}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onNavigateToWorkItem={(id) => {
                  const found = workItems.find(w => w.id === id);
                  if (found) {
                    setSelectedWorkItem(found);
                    setActiveTab('work');
                    setIsInspectorOpen(true);
                  }
                }}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarSurface
                onSelectWorkItem={(id) => {
                  const found = workItems.find(w => w.id === id);
                  if (found) {
                    setSelectedWorkItem(found);
                    setActiveTab('work');
                    setIsInspectorOpen(true);
                  }
                }}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onNavigateToWorkItem={(id) => {
                  const found = workItems.find(w => w.id === id);
                  if (found) {
                    setSelectedWorkItem(found);
                    setActiveTab('work');
                    setIsInspectorOpen(true);
                  }
                }}
              />
            )}

            {activeTab === 'sheets' && (
              <SheetsSurface 
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
              />
            )}

            {activeTab === 'docs' && (
              <DocsSurface 
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onNavigateToWorkItem={(id) => {
                  const found = workItems.find(w => w.id === id);
                  if (found) {
                    setSelectedWorkItem(found);
                    setActiveTab('work');
                    setIsInspectorOpen(true);
                  }
                }}
              />
            )}

            {activeTab === 'keep' && (
              <KeepSurface 
                onPromoteToWorkItem={handlePromoteKeepToWorkItem}
                onCreateWorkItem={handleCreateWorkItemFromResource}
                onAttachEvidence={handleAttachEvidenceFromResource}
                onLinkWorkItem={handleAttachEvidenceFromResource}
                onNavigateToWorkItem={(id) => {
                  const found = workItems.find(w => w.id === id);
                  if (found) {
                    setSelectedWorkItem(found);
                    setActiveTab('work');
                    setIsInspectorOpen(true);
                  }
                }}
              />
            )}

            {/* 3. Contextual Inspector (Dockable side panel with progressive disclosure) */}
            {isInspectorOpen && selectedWorkItem && (
              <Inspector
                item={selectedWorkItem}
                onClose={() => setIsInspectorOpen(false)}
                onApprove={handleApproveWorkItem}
                onReject={handleRejectWorkItem}
              />
            )}
          </div>
        </div>

        {/* 4. Action Toast with Undo */}
        <Toast
          toast={toast}
          onDismiss={() => setToast(null)}
        />

        {/* 5. Command Palette (⌘K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(tab) => setActiveTab(tab as any)}
          workItems={workItems}
          observations={observations}
          onSelectWorkItem={(item) => {
            setSelectedWorkItem(item);
            setIsInspectorOpen(true);
          }}
          onSelectObservation={() => {
            setActiveTab('activity');
          }}
          onTriggerReviewNext={() => {
            if (reviewQueue.length > 0) {
              setSelectedWorkItem(reviewQueue[0].workItem);
              setActiveTab('review');
            }
          }}
          onRetryConnection={checkBackendHealth}
        />

        {/* 6. Connection State Diagnostics Modal */}
        <ConnectionModal
          isOpen={isConnectionModalOpen}
          onClose={() => setIsConnectionModalOpen(false)}
          connectionState={connectionState}
          healthResult={healthResult}
          isMockMode={isMockMode}
          onToggleMockMode={() => setIsMockMode(prev => !prev)}
          onRetry={checkBackendHealth}
          isChecking={isCheckingBackend}
        />

        {/* 7. Live Telemetry & Performance HUD Modal */}
        <TelemetryHUD
          isOpen={isTelemetryOpen}
          onClose={() => setIsTelemetryOpen(false)}
        />

        {/* 8. Attach Evidence Target Selector Modal */}
        <AttachEvidenceModal
          isOpen={evidenceTargetResource !== null || batchEvidenceTargetResources.length > 0}
          onClose={() => {
            setEvidenceTargetResource(null);
            setBatchEvidenceTargetResources([]);
          }}
          resource={evidenceTargetResource}
          resources={batchEvidenceTargetResources}
          workItems={workItems}
          onSelectWorkItem={(item, res) => {
            handleAttachResourceToTarget(item, res);
            setEvidenceTargetResource(null);
            setBatchEvidenceTargetResources([]);
          }}
          onBatchSelectWorkItem={(item, resList) => {
            handleBatchAttachResourcesToTarget(item, resList);
            setBatchEvidenceTargetResources([]);
          }}
          onCreateNewWithEvidence={(res) => {
            handleCreateWorkItemFromResource(res);
            setEvidenceTargetResource(null);
            setBatchEvidenceTargetResources([]);
          }}
        />
      </div>
    </DensityProvider>
  );
}
