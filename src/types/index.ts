export type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'degraded'
  | 'unauthorized'
  | 'unavailable'
  | 'offline'
  | 'preview_mock';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type WorkItemStatus =
  | 'inferred'
  | 'needs_review'
  | 'approved'
  | 'in_progress'
  | 'blocked'
  | 'published'
  | 'rejected'
  | 'completed';

export type SourceType = 'gmail' | 'calendar' | 'conversation' | 'renos' | 'code' | 'system';

export interface Observation {
  id: string;
  source: SourceType;
  actor: { name: string; email: string; avatar?: string };
  timestamp: string;
  rawText: string;
  inferredAction: string;
  confidence: number;
  resolutionStatus: 'unprocessed' | 'candidate_created' | 'linked_to_workitem' | 'discarded';
  linkedWorkItemId?: string;
  provenance: {
    originSystem: string;
    externalId: string;
    threadId?: string;
    uri?: string;
    checksum: string;
  };
}

export interface EvidenceItem {
  id: string;
  type: 'email_thread' | 'calendar_event' | 'git_commit' | 'slack_snippet' | 'system_alert' | 'document';
  title: string;
  snippet: string;
  timestamp: string;
  author: string;
  sourceUri?: string;
  hash: string;
  confidenceContribution: number;
}

export interface PolicyRule {
  id: string;
  code: string;
  name: string;
  status: 'passed' | 'requires_human_signoff' | 'blocked' | 'warning';
  reason: string;
  appliedAt: string;
}

export interface PublicationTarget {
  id: string;
  target: string;
  status: 'published' | 'pending' | 'awaiting_approval' | 'failed' | 'not_targeted';
  externalReference?: string;
  syncedAt?: string;
  payloadHash?: string;
  errorMessage?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  isSystem: boolean;
  action: string;
  detail: string;
}

export type ActivityItem = ActivityLog;

export interface Candidate {
  id: string;
  suggestedTitle: string;
  suggestedDescription: string;
  confidence: number;
  similarityScore: number;
  reasoning: string;
  sourceObservations: string[];
  incomingAt: string;
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  status: WorkItemStatus;
  priority: Priority;
  owner: {
    name: string;
    email: string;
    isAutonomousAgent?: boolean;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  confidence: number;
  whyExists: {
    inferenceSummary: string;
    model: string;
    triggerObservationId: string;
    inferredIntent: string;
  };
  resolution: {
    decisionType: 'backend_resolved' | 'autonomous_created' | 'merged_candidate' | 'policy_promoted' | 'human_created';
    details: string;
  };
  policies: PolicyRule[];
  evidence: EvidenceItem[];
  publications: PublicationTarget[];
  activity: ActivityLog[];
  sourceObservationIds: string[];
  allowedActions?: string[];
  reviewCategory?: 'high_confidence' | 'ambiguous_merge' | 'execution_promotion' | 'policy_conflict';
  candidateComparison?: Candidate;
}

export interface ReviewQueueItem {
  id: string;
  workItem: WorkItem;
  category: 'high_confidence' | 'ambiguous_merge' | 'execution_promotion' | 'policy_conflict';
  urgency: 'critical' | 'high' | 'normal';
  reasoning: string;
  candidate?: Candidate;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  type: SourceType;
  status: 'operational' | 'degraded' | 'syncing' | 'failed';
  lastEventTime: string;
  eventsPerMinute: number;
  latencyMs: number;
  authenticatedAs: string;
}

export interface SystemMetrics {
  autonomousResolutionRate: number;
  humanInterventionRatio: number;
  meanInferenceLatencyMs: number;
  activeObservationsToday: number;
  workItemsDiscoveredToday: number;
  pendingReviewCount: number;
  policyAlignmentScore: number;
}
