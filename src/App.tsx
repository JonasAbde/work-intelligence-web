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
import { shouldUseLocalPreviewMutations } from './api/contracts';
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
import { GmailMessageItem, KeepNoteItem, DriveItem, DensityMode } from './runtime/runtimeTypes';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('home');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [activeScenario, setActiveScenario] = useState<AppScenario>('normal_day');

  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);

  const initialData = getScenarioData('normal_day');
  const [workItems, setWorkItems] = useState<WorkItem[]>(initialData.workItems);
  const [observations, setObservations] = useState<Observation[]>(initialData.observations);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>(initialData.reviewQueue);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>(initialData.integrations);
  const [, setMetrics] = useState<SystemMetrics>(initialData.metrics);

  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [evidenceTargetResource, setEvidenceTargetResource] = useState<WorkspaceResource | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const useLocalPreviewMutations = shouldUseLocalPreviewMutations(isMockMode);

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
    setIsMockMode(true);
    setConnectionState('preview_mock');

    setToast({
      id: `scen-${Date.now()}`,
      title: `Switched to ${newScenario.replace('_', ' ').toUpperCase()}`,
      description: 'Loaded explicit preview data. Canonical backend state is unchanged.',
      duration: 3000
    });
  };

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

  const applyApprovedState = (id: string) => {
    setWorkItems(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' } : w));
    setReviewQueue(prev => prev.filter(r => r.workItem.id !== id));
    if (selectedWorkItem?.id === id) {
      setSelectedWorkItem(prev => prev ? { ...prev, status: 'approved' } : null);
    }
  };

  const handleApproveWorkItem = async (id: string) => {
    const targetItem = workItems.find(w => w.id === id);
    if (!targetItem) return;

    if (useLocalPreviewMutations) {
      const previousStatus = targetItem.status;
      const removedReviewItem = reviewQueue.find(r => r.workItem.id === id);
      applyApprovedState(id);
      setToast({
        id: `appr-${id}-${Date.now()}`,
        title: 'Approved in preview',
        description: 'Approval changes state to Approved. Publication remains a separate action.',
        undoLabel: 'Undo',
        duration: 6000,
        onUndo: () => {
          setWorkItems(prev => prev.map(w => w.id === id ? { ...w, status: previousStatus } : w));
          if (removedReviewItem) setReviewQueue(prev => [removedReviewItem, ...prev]);
          if (selectedWorkItem?.id === id) {
            setSelectedWorkItem(prev => prev ? { ...prev, status: previousStatus } : null);
          }
        }
      });
      return;
    }

    try {
      await apiClient.approveWorkItem(id, false);
      applyApprovedState(id);
      setToast({
        id: `appr-${id}-${Date.now()}`,
        title: 'Approved',
        description: 'Backend state is Approved. Nothing has been published or executed.',
        duration: 5000
      });
    } catch (error) {
      setToast({
        id: `appr-failed-${id}-${Date.now()}`,
        title: 'Approval failed',
        description: error instanceof Error ? error.message : 'The authoritative backend rejected the approval.',
        duration: 6000
      });
    }
  };

  const handleRejectWorkItem = async (id: string, reason: string) => {
    const applyRejectedState = () => {
      setWorkItems(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' } : w));
      setReviewQueue(prev => prev.filter(r => r.workItem.id !== id));
      setIsInspectorOpen(false);
    };

    if (useLocalPreviewMutations) {
      applyRejectedState();
      setToast({
        id: `rej-${id}`,
        title: 'Rejected in preview',
        description: reason || 'Preview item rejected.',
        duration: 4000
      });
      return;
    }

    try {
      await apiClient.rejectWorkItem(id, reason, false);
      applyRejectedState();
      setToast({
        id: `rej-${id}`,
        title: 'Rejected',
        description: reason || 'Backend state changed to Rejected.',
        duration: 4000
      });
    } catch (error) {
      setToast({
        id: `rej-failed-${id}-${Date.now()}`,
        title: 'Rejection failed',
        description: error instanceof Error ? error.message : 'The authoritative backend rejected the request.',
        duration: 6000
      });
    }
  };

  const handleReconnectIntegration = (integrationId: string) => {
    if (!useLocalPreviewMutations) {
      setToast({
        id: `rec-unavailable-${integrationId}`,
        title: 'Integration control unavailable',
        description: 'Work Intelligence V2 does not expose an integration reconnect endpoint yet. No state was fabricated locally.',
        duration: 6000
      });
      return;
    }

    setIntegrations(prev => prev.map(i => i.id === integrationId ? { ...i, status: 'operational' as const } : i));
    setToast({
      id: `rec-${integrationId}`,
      title: 'Integration restored in preview',
      description: 'Preview fixture updated. No backend integration was changed.',
      duration: 4000
    });
  };

  const handlePromoteGmailToWorkItem = async (msg: GmailMessageItem) => {
    const candidate = msg.extractedWorkItemCandidate;

    if (!useLocalPreviewMutations) {
      try {
        await apiClient.ingestObservation({
          source: 'email',
          text: `${msg.subject}\n\n${msg.snippet}${candidate?.suggestedAction ? `\n\nSuggested action: ${candidate.suggestedAction}` : ''}`,
          external_id: `gmail:${msg.id}`,
          actor: msg.from,
          metadata: {
            provider: 'gmail',
            subject: msg.subject,
            source_date: msg.date,
          },
          title_hint: candidate?.suggestedTitle || msg.subject,
          priority_hint: 'high',
        }, false);
        await checkBackendHealth();
        setToast({
          id: `gmail-ingest-${msg.id}-${Date.now()}`,
          title: 'Sent to Work Intelligence',
          description: 'The Gmail signal was ingested by the authoritative backend and the canonical view was refreshed.',
          duration: 5000
        });
      } catch (error) {
        setToast({
          id: `gmail-ingest-failed-${msg.id}-${Date.now()}`,
          title: 'Ingest failed',
          description: error instanceof Error ? error.message : 'The Gmail signal could not be ingested.',
          duration: 6000
        });
      }
      return;
    }

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
        model: 'preview-fixture',
        triggerObservationId: `obs-gmail-${msg.id}`,
        inferredIntent: 'Resolve inbound request and generate delivery spec',
      },
      resolution: {
        decisionType: 'autonomous_created',
        details: 'Preview-only WorkItem generated from Gmail fixture.',
      },
      policies: [],
      evidence: [],
      publications: [],
      activity: [],
      sourceObservationIds: [`obs-gmail-${msg.id}`],
      reviewCategory: 'high_confidence',
    };

    setWorkItems(prev => [newWorkItem, ...prev]);
    setReviewQueue(prev => [{
      id: `rev-${newId}`,
      workItem: newWorkItem,
      category: 'high_confidence',
      urgency: 'high',
      reasoning: 'Preview-only Gmail candidate requires review.',
    }, ...prev]);
    setToast({
      id: `prom-${newId}`,
      title: 'Preview WorkItem created',
      description: `${newId} exists only in preview data.`,
      duration: 5000,
    });
  };

  const handlePromoteKeepToWorkItem = async (note: KeepNoteItem) => {
    const description = note.isChecklist
      ? `Verify checklist items: ${note.checklistItems.map(i => i.text).join('; ')}`
      : note.content;

    if (!useLocalPreviewMutations) {
      try {
        await apiClient.ingestObservation({
          source: 'google_keep',
          text: `${note.title}\n\n${description}`,
          external_id: `keep:${note.id}`,
          metadata: {
            provider: 'keep',
            is_checklist: note.isChecklist,
            source_updated_at: note.updatedAt,
          },
          title_hint: note.title,
          priority_hint: 'medium',
        }, false);
        await checkBackendHealth();
        setToast({
          id: `keep-ingest-${note.id}-${Date.now()}`,
          title: 'Sent to Work Intelligence',
          description: 'The Keep signal was ingested by the authoritative backend and the canonical view was refreshed.',
          duration: 5000,
        });
      } catch (error) {
        setToast({
          id: `keep-ingest-failed-${note.id}-${Date.now()}`,
          title: 'Ingest failed',
          description: error instanceof Error ? error.message : 'The Keep signal could not be ingested.',
          duration: 6000,
        });
      }
      return;
    }

    const newId = `WI-KEEP-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const newWorkItem: WorkItem = {
      id: newId,
      title: note.title,
      description,
      status: 'needs_review',
      priority: 'medium',
      owner: {
        name: 'Keep Preview Agent',
        email: 'preview@aftergraph.internal',
        isAutonomousAgent: true,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      confidence: 0.95,
      whyExists: {
        inferenceSummary: `Captured from Google Keep preview checklist: ${note.title}`,
        model: 'preview-fixture',
        triggerObservationId: `obs-keep-${note.id}`,
        inferredIntent: 'Review checklist items.',
      },
      resolution: {
        decisionType: 'policy_promoted',
        details: 'Preview-only WorkItem generated from Keep fixture.',
      },
      policies: [],
      evidence: [],
      publications: [],
      activity: [],
      sourceObservationIds: [`obs-keep-${note.id}`],
      reviewCategory: 'high_confidence',
    };

    setWorkItems(prev => [newWorkItem, ...prev]);
    setReviewQueue(prev => [{
      id: `rev-${newId}`,
      workItem: newWorkItem,
      category: 'high_confidence',
      urgency: 'normal',
      reasoning: 'Preview-only Keep candidate requires review.',
    }, ...prev]);
    setToast({
      id: `prom-${newId}`,
      title: 'Preview WorkItem created',
      description: `${newId} exists only in preview data.`,
      duration: 5000,
    });
  };

  const handleAttachDriveToWorkItem = (file: DriveItem) => {
    if (!useLocalPreviewMutations) {
      setToast({
        id: `att-live-gap-${Date.now()}`,
        title: 'Evidence write unavailable',
        description: 'Work Intelligence V2 does not expose an evidence-attachment write endpoint yet. No local evidence was fabricated.',
        duration: 6000,
      });
      return;
    }

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
      hash: `preview:drive_${file.id}`,
      confidenceContribution: 0.99,
    };

    setWorkItems(prev => prev.map(w => w.id === selectedWorkItem.id ? { ...w, evidence: [...w.evidence, newEvidence] } : w));
    setSelectedWorkItem(prev => prev ? { ...prev, evidence: [...prev.evidence, newEvidence] } : null);
    setToast({
      id: `att-${Date.now()}`,
      title: 'Evidence attached in preview',
      description: `Linked "${file.name}" to ${selectedWorkItem.id} in preview data only.`,
      duration: 4000,
    });
  };

  const handleCreateWorkItemFromResource = async (resource: WorkspaceResource) => {
    const summaryText = resource.summary || resource.subtitle || resource.title;

    if (!useLocalPreviewMutations) {
      const resourcePriority = resource.detectedWork?.priority;
      const priorityHint = resourcePriority === 'urgent' ? 'critical' :
        resourcePriority === 'high' ? 'high' : resourcePriority === 'low' ? 'low' : 'medium';
      try {
        await apiClient.ingestObservation({
          source: `google_${resource.provider}`,
          text: `${resource.title}\n\n${resource.detectedWork?.suggestedAction || summaryText}`,
          external_id: `${resource.provider}:${resource.id}`,
          actor: resource.actor?.email || resource.actor?.name,
          metadata: {
            provider: resource.provider,
            kind: resource.kind,
            provenance_uri: resource.provenanceUri,
            source_modified_at: resource.modifiedAt,
          },
          title_hint: resource.detectedWork?.suggestedTitle || resource.title,
          priority_hint: priorityHint,
        }, false);
        await checkBackendHealth();
        setToast({
          id: `resource-ingest-${resource.id}-${Date.now()}`,
          title: 'Sent to Work Intelligence',
          description: 'The resource became an observation in the authoritative backend. Canonical work was refreshed from V2.',
          duration: 5000,
        });
      } catch (error) {
        setToast({
          id: `resource-ingest-failed-${resource.id}-${Date.now()}`,
          title: 'Ingest failed',
          description: error instanceof Error ? error.message : 'The resource could not be ingested.',
          duration: 6000,
        });
      }
      return;
    }

    const newId = `WI-WS-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const newWorkItem: WorkItem = {
      id: newId,
      title: resource.detectedWork?.suggestedTitle || resource.title,
      description: resource.detectedWork?.suggestedAction || summaryText,
      status: 'needs_review',
      priority: resource.detectedWork?.priority || 'medium',
      owner: {
        name: `${resource.provider.toUpperCase()} Preview Agent`,
        email: 'preview@aftergraph.internal',
        isAutonomousAgent: true,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      confidence: resource.detectedWork?.confidence ?? 0.94,
      whyExists: {
        inferenceSummary: `Captured from preview ${resource.provider.toUpperCase()} resource: ${resource.title}`,
        model: 'preview-fixture',
        triggerObservationId: `obs-${resource.provider}-${resource.id}`,
        inferredIntent: resource.detectedWork?.reasoning || 'Preview resource candidate.',
      },
      resolution: {
        decisionType: 'policy_promoted',
        details: `Preview-only WorkItem generated from ${resource.provider} ${resource.kind}.`,
      },
      policies: [],
      evidence: [],
      publications: [],
      activity: [],
      sourceObservationIds: [`obs-${resource.provider}-${resource.id}`],
      reviewCategory: 'high_confidence',
    };

    setWorkItems(prev => [newWorkItem, ...prev]);
    setReviewQueue(prev => [{
      id: `rev-${newId}`,
      workItem: newWorkItem,
      category: 'high_confidence',
      urgency: 'normal',
      reasoning: 'Preview-only resource candidate requires review.',
    }, ...prev]);
    setSelectedWorkItem(newWorkItem);
    setToast({
      id: `prom-${newId}`,
      title: 'Preview WorkItem created',
      description: `${newId} exists only in preview data.`,
      duration: 4000,
    });
  };

  const handleAttachResourceToTarget = (targetItem: WorkItem, resource: WorkspaceResource) => {
    if (!useLocalPreviewMutations) {
      setToast({
        id: `att-live-gap-${Date.now()}`,
        title: 'Evidence write unavailable',
        description: 'The current V2 API exposes evidence reads but not evidence attachment writes. No canonical state was changed.',
        duration: 6000,
      });
      return;
    }

    const summaryText = resource.summary || resource.subtitle || resource.title;
    const newEvidence = {
      id: `ev-${resource.provider}-${Date.now()}`,
      type: 'document' as const,
      title: resource.title,
      snippet: summaryText.slice(0, 240),
      timestamp: resource.modifiedAt || new Date().toISOString(),
      author: resource.actor?.name || `${resource.provider} User`,
      sourceUri: resource.provenanceUri || `https://${resource.provider}.google.com`,
      hash: `preview:${resource.provider}_${resource.id}`,
      confidenceContribution: 0.99,
    };

    setWorkItems(prev => prev.map(w => w.id === targetItem.id ? { ...w, evidence: [...w.evidence, newEvidence] } : w));
    setSelectedWorkItem(targetItem);
    setIsInspectorOpen(true);
    setToast({
      id: `att-${Date.now()}`,
      title: 'Evidence anchored in preview',
      description: `Bound "${resource.title}" to ${targetItem.id} in preview data only.`,
      duration: 4500,
    });
  };

  const handleAttachEvidenceFromResource = (resource: WorkspaceResource) => {
    if (!useLocalPreviewMutations) {
      setToast({
        id: `att-live-gap-${Date.now()}`,
        title: 'Evidence write unavailable',
        description: 'Evidence attachment is disabled in live mode until V2 exposes an authoritative write contract.',
        duration: 6000,
      });
      return;
    }
    if (!selectedWorkItem) {
      setEvidenceTargetResource(resource);
      return;
    }
    handleAttachResourceToTarget(selectedWorkItem, resource);
  };

  return (
    <DensityProvider density={density} onDensityChange={setDensity}>
      <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
        <Navigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'work') setIsInspectorOpen(false);
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

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
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
                  if (selectedWorkItem) handleAttachEvidenceFromResource(res);
                  else handleCreateWorkItemFromResource(res);
                }}
                onBatchCreateWork={(resources) => {
                  resources.forEach(res => void handleCreateWorkItemFromResource(res));
                }}
                onBatchAttachEvidence={(resources) => {
                  resources.forEach(res => handleAttachEvidenceFromResource(res));
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

            {activeTab === 'component_registry' && <ComponentRegistryView />}

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

        <Toast toast={toast} onDismiss={() => setToast(null)} />

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(tab) => setActiveTab(tab as ViewTab)}
          workItems={workItems}
          observations={observations}
          onSelectWorkItem={(item) => {
            setSelectedWorkItem(item);
            setIsInspectorOpen(true);
          }}
          onSelectObservation={() => setActiveTab('activity')}
          onTriggerReviewNext={() => {
            if (reviewQueue.length > 0) {
              setSelectedWorkItem(reviewQueue[0].workItem);
              setActiveTab('review');
            }
          }}
          onRetryConnection={checkBackendHealth}
        />

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

        <TelemetryHUD isOpen={isTelemetryOpen} onClose={() => setIsTelemetryOpen(false)} />

        <AttachEvidenceModal
          isOpen={evidenceTargetResource !== null}
          onClose={() => setEvidenceTargetResource(null)}
          resource={evidenceTargetResource}
          workItems={workItems}
          onSelectWorkItem={(item, res) => {
            handleAttachResourceToTarget(item, res);
            setEvidenceTargetResource(null);
          }}
          onCreateNewWithEvidence={(res) => {
            void handleCreateWorkItemFromResource(res);
            setEvidenceTargetResource(null);
          }}
        />
      </div>
    </DensityProvider>
  );
}
