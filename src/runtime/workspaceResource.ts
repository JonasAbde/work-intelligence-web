import { ConnectionState, Priority } from '../types';

export type WorkspaceProvider = 'gmail' | 'calendar' | 'drive' | 'docs' | 'sheets' | 'keep';

export type WorkspaceResourceKind =
  | 'email'
  | 'thread'
  | 'event'
  | 'file'
  | 'folder'
  | 'document'
  | 'spreadsheet'
  | 'sheet_range'
  | 'note'
  | 'checklist';

export type ComponentLifecycleState =
  | 'idle'
  | 'loading'
  | 'refreshing'
  | 'streaming'
  | 'selected'
  | 'editing'
  | 'saving'
  | 'saved'
  | 'optimistic'
  | 'syncing'
  | 'stale'
  | 'partial'
  | 'offline'
  | 'reconnecting'
  | 'rate_limited'
  | 'unauthorized'
  | 'permission_denied'
  | 'token_expired'
  | 'not_found'
  | 'conflict'
  | 'failed'
  | 'retrying'
  | 'empty'
  | 'filtered_empty';

export type ProviderHealthState =
  | 'connected'
  | 'connecting'
  | 'healthy'
  | 'degraded'
  | 'expired'
  | 'permission_missing'
  | 'rate_limited'
  | 'unavailable';

export interface ProviderHealth {
  provider: WorkspaceProvider;
  state: ProviderHealthState;
  impactMessage?: string;
  lastChecked: string;
  scopeGranted: boolean;
  latencyMs?: number;
}

export interface WorkspaceActor {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface ResourcePermissions {
  canView?: boolean;
  canEdit?: boolean;
  canShare?: boolean;
  canDelete?: boolean;
  canComment?: boolean;
  role?: 'owner' | 'editor' | 'commenter' | 'viewer';
}

export interface ResourceCapabilities {
  open?: boolean;
  preview?: boolean;
  edit?: boolean;
  comment?: boolean;
  share?: boolean;
  download?: boolean;
  createWorkItem?: boolean;
  linkToWorkItem?: boolean;
  attachEvidence?: boolean;
  scheduleFollowUp?: boolean;
  reply?: boolean;
  archive?: boolean;
  move?: boolean;
  retry?: boolean;
}

export interface WorkspaceResource {
  id: string;
  provider: WorkspaceProvider;
  kind: WorkspaceResourceKind;
  title: string;
  subtitle?: string;
  summary?: string;
  modifiedAt?: string;
  actor?: WorkspaceActor;
  permissions: ResourcePermissions;
  capabilities: ResourceCapabilities;
  connectionState: ConnectionState;
  metadata: Record<string, unknown>;
  linkedWorkItems?: string[];
  evidenceHash?: string;
  provenanceUri?: string;
  isActionable?: boolean;
  detectedWork?: {
    suggestedTitle: string;
    suggestedAction: string;
    priority: Priority;
    confidence: number;
    reasoning: string;
  };
}

export type PickerIntent =
  | 'attach_evidence'
  | 'schedule_work'
  | 'link_communication'
  | 'source_material'
  | 'general_browse';

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type:
    | 'time_to_resource'
    | 'time_to_decision'
    | 'work_item_created'
    | 'evidence_attached'
    | 'action_undone'
    | 'action_failed'
    | 'action_retried'
    | 'search_performed'
    | 'picker_opened'
    | 'picker_abandoned'
    | 'picker_selected'
    | 'review_latency'
    | 'resource_loaded';
  durationMs?: number;
  provider?: WorkspaceProvider;
  resourceId?: string;
  details?: Record<string, unknown>;
}
