import { WorkItem, Observation, ReviewQueueItem, IntegrationStatus, SystemMetrics, Priority } from '../types';

export const mockObservations: Observation[] = [
  {
    id: 'OBS-8921',
    source: 'gmail',
    actor: {
      name: 'Elena Rostova',
      email: 'e.rostova@acmeparts.internal',
    },
    timestamp: '2026-09-05T09:14:22Z',
    rawText: 'Critical: The ISO 27001 SOC2 Type II audit report flagged unencrypted backup snapshots on regional cold tier. We have 48h to remediate or fail Stage 1 compliance certification.',
    inferredAction: 'Spin remediation work item for infrastructure team to enforce KMS envelope encryption on cold-tier snapshots before deadline.',
    confidence: 0.98,
    resolutionStatus: 'linked_to_workitem',
    linkedWorkItemId: 'WI-1048',
    provenance: {
      originSystem: 'Google Workspace Mail API v3',
      externalId: 'msg_18fa4b91ac7789d',
      threadId: 'th_091bbff1',
      uri: 'https://mail.google.com/mail/u/0/#inbox/msg_18fa4b91ac7789d',
      checksum: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    },
  },
  {
    id: 'OBS-8920',
    source: 'renos',
    actor: {
      name: 'RenOS Telemetry Daemon',
      email: 'renos-agent-04@internal.renos.network',
    },
    timestamp: '2026-09-05T09:11:05Z',
    rawText: 'Process failure in OrderFulfillmentPipeline worker #12: Deadlock detected during inventory reserve lock acquisition. 41 transactions rerouted to fallback queue.',
    inferredAction: 'Investigate Postgres lock concurrency contention on inventory_sku_reserve table; isolate transaction timeout threshold.',
    confidence: 0.94,
    resolutionStatus: 'linked_to_workitem',
    linkedWorkItemId: 'WI-1049',
    provenance: {
      originSystem: 'RenOS Operational Plane v4.2',
      externalId: 'rn_exec_err_90192',
      uri: 'https://renos.internal.net/incidents/rn_exec_err_90192',
      checksum: 'sha256:b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78',
    },
  },
  {
    id: 'OBS-8919',
    source: 'conversation',
    actor: {
      name: 'Marcus Brody',
      email: 'm.brody@engineering.core',
    },
    timestamp: '2026-09-05T08:58:30Z',
    rawText: '@aftergraph let us make sure we deprecate v1 AuthToken exchange by next sprint. Clients on SDK < 2.4.0 must be prompted with HTTP 426 Upgrade Required.',
    inferredAction: 'Schedule API deprecation policy enforcement on Gateway routing rules; notify developer platform maintainers.',
    confidence: 0.89,
    resolutionStatus: 'candidate_created',
    provenance: {
      originSystem: 'Slack Enterprise Grid (#core-architecture)',
      externalId: 'p1725526710.009182',
      uri: 'https://acme.slack.com/archives/C0812/p1725526710009182',
      checksum: 'sha256:c2b186b4a8e99b0c95454b52b217a80b06b9b8b093ec2186fb5a4789547d2a8b',
    },
  },
  {
    id: 'OBS-8918',
    source: 'code',
    actor: {
      name: 'GitHub Actions / Dependabot',
      email: 'support+bot@github.com',
    },
    timestamp: '2026-09-05T08:42:10Z',
    rawText: 'PR #412 Security Advisory CVE-2026-3199: High severity vulnerability discovered in protobuf serializer package. Immediate patch available: v4.19.2.',
    inferredAction: 'Verify test suite and fast-track PR merge into staging pipeline.',
    confidence: 0.96,
    resolutionStatus: 'linked_to_workitem',
    linkedWorkItemId: 'WI-1045',
    provenance: {
      originSystem: 'GitHub Enterprise / org-core-services',
      externalId: 'pr_412_dependabot',
      uri: 'https://github.com/org-core/services/pull/412',
      checksum: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  },
  {
    id: 'OBS-8917',
    source: 'calendar',
    actor: {
      name: 'Google Calendar Sync',
      email: 'calendar-sync@service.google.com',
    },
    timestamp: '2026-09-05T08:15:00Z',
    rawText: 'Executive Sync: Q3 Cloud Infrastructure Budget Overrun Review scheduled for tomorrow at 14:00 CET with CFO & VP Engineering.',
    inferredAction: 'Compile automated infrastructure cost variance report with regional AWS/GCP breakdown.',
    confidence: 0.82,
    resolutionStatus: 'candidate_created',
    provenance: {
      originSystem: 'Google Calendar API',
      externalId: 'evt_20260906T120000Z',
      checksum: 'sha256:88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589',
    },
  },
  {
    id: 'OBS-8916',
    source: 'system',
    actor: {
      name: 'Aftergraph Anomaly Agent',
      email: 'agent-guardian@aftergraph.internal',
    },
    timestamp: '2026-09-05T07:55:12Z',
    rawText: 'Cross-channel correlation detected: 3 distinct customer success tickets regarding EU-West-1 API latency spike match GitHub commit dc81e2b (dynamic query re-indexing).',
    inferredAction: 'Correlate customer impact with commit author and dispatch performance regression investigation.',
    confidence: 0.97,
    resolutionStatus: 'linked_to_workitem',
    linkedWorkItemId: 'WI-1042',
    provenance: {
      originSystem: 'Aftergraph Graph Engine Core',
      externalId: 'corr_graph_77189',
      checksum: 'sha256:a123f8b91901a1c3b123d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
    },
  },
];

export const mockWorkItems: WorkItem[] = [
  {
    id: 'WI-1048',
    title: 'Enforce KMS Envelope Encryption on Cold-Tier Snapshots (SOC2 Remediation)',
    description: 'ISO 27001 / SOC2 Stage 1 audit identified 14 regional cold-tier backup snapshots lacking Customer-Managed KMS keys. Remediate with policy automation before the 48h audit verification window.',
    status: 'needs_review',
    priority: 'urgent',
    owner: {
      name: 'Alex Vance',
      email: 'a.vance@acmeparts.internal',
      isAutonomousAgent: false,
    },
    dueDate: '2026-09-07T12:00:00Z',
    createdAt: '2026-09-05T09:15:00Z',
    updatedAt: '2026-09-05T09:16:30Z',
    confidence: 0.98,
    whyExists: {
      inferenceSummary: 'Direct compliance blocker escalated from Lead Auditor via executive email thread. High risk of certification loss.',
      model: 'aftergraph-intent-v2.6 (temperature 0.05)',
      triggerObservationId: 'OBS-8921',
      inferredIntent: 'Autonomous creation triggered by matching high-severity policy rule POL-COMPLIANCE-019.',
    },
    resolution: {
      decisionType: 'autonomous_created',
      details: 'Evaluated against compliance directory rules. Triggered instant high-priority queueing and human sign-off request.',
    },
    policies: [
      {
        id: 'POL-1',
        code: 'POL-COMPLIANCE-019',
        name: 'SOC2 Backup Encryption Mandate',
        status: 'requires_human_signoff',
        reason: 'Modifying production snapshot encryption requires verified security lead approval.',
        appliedAt: '2026-09-05T09:15:05Z',
      },
      {
        id: 'POL-2',
        code: 'POL-SLA-48H',
        name: 'Critical Remediation SLA Enforcement',
        status: 'passed',
        reason: 'Remediation timeline set to 36 hours, within 48h compliance threshold.',
        appliedAt: '2026-09-05T09:15:05Z',
      },
    ],
    evidence: [
      {
        id: 'EV-101',
        type: 'email_thread',
        title: 'Audit Finding #SOC2-8812 - Unencrypted snapshot volume IDs',
        snippet: 'List of impacted snapshot IDs: snap-0a918f4, snap-081cb92 in eu-west-1 and us-east-2. Compliance window closes Sep 7.',
        timestamp: '2026-09-05T09:14:22Z',
        author: 'Elena Rostova (Compliance Lead)',
        sourceUri: 'https://mail.google.com/mail/u/0/#inbox/msg_18fa4b91ac7789d',
        hash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        confidenceContribution: 0.95,
      },
      {
        id: 'EV-102',
        type: 'system_alert',
        title: 'CloudTrail snapshot configuration export',
        snippet: 'Automated verification check confirmed KMS key policy lacks alias/sec-backup-master association.',
        timestamp: '2026-09-05T09:15:02Z',
        author: 'AWS Security Hub Probe',
        hash: 'sha256:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        confidenceContribution: 0.99,
      },
    ],
    publications: [
      {
        id: 'PUB-1',
        target: 'RenOS',
        status: 'awaiting_approval',
        externalReference: 'RENOS-ACTION-8821',
        payloadHash: 'sha256:3b9ac9',
      },
      {
        id: 'PUB-2',
        target: 'Linear',
        status: 'pending',
        externalReference: 'LIN-994',
      },
    ],
    activity: [
      {
        id: 'ACT-1',
        timestamp: '2026-09-05T09:14:22Z',
        actor: 'Gmail Ingest Pipeline',
        isSystem: true,
        action: 'Ingested raw observation OBS-8921',
        detail: 'Extracted compliance audit metadata with 98% confidence.',
      },
      {
        id: 'ACT-2',
        timestamp: '2026-09-05T09:15:00Z',
        actor: 'Work Intelligence Inference Core',
        isSystem: true,
        action: 'Synthesized WorkItem WI-1048',
        detail: 'Bound policy POL-COMPLIANCE-019. Flagged for human gate sign-off.',
      },
      {
        id: 'ACT-3',
        timestamp: '2026-09-05T09:16:30Z',
        actor: 'Security Gate Controller',
        isSystem: true,
        action: 'Staged RenOS publication payload',
        detail: 'Awaiting human authorization before executing automated snapshot re-encryption script.',
      },
    ],
    sourceObservationIds: ['OBS-8921'],
    reviewCategory: 'policy_conflict',
  },
  {
    id: 'WI-1049',
    title: 'Resolve Inventory SKU Lock Deadlock in Fulfillment Pipeline Worker #12',
    description: 'Telemetry detected repeated lock timeout exceptions during bulk checkout operations. 41 transactions rerouted. Worker thread pool memory consumption elevated.',
    status: 'in_progress',
    priority: 'high',
    owner: {
      name: 'Autonomous Self-Healing Daemon',
      email: 'agent-db-remediator@aftergraph.internal',
      isAutonomousAgent: true,
    },
    createdAt: '2026-09-05T09:11:10Z',
    updatedAt: '2026-09-05T09:13:00Z',
    confidence: 0.94,
    whyExists: {
      inferenceSummary: 'Continuous transaction rollback anomaly in RenOS telemetry stream. Automatic mitigation protocol initiated.',
      model: 'aftergraph-telemetry-v3.1',
      triggerObservationId: 'OBS-8920',
      inferredIntent: 'Isolate transaction timeout threshold and apply advisory lock query optimization.',
    },
    resolution: {
      decisionType: 'autonomous_created',
      details: 'Created autonomously and allocated to Self-Healing Agent with auto-publish permissions to staging.',
    },
    policies: [
      {
        id: 'POL-3',
        code: 'POL-AUTO-RECOVERY-04',
        name: 'Non-Destructive Database Self-Healing',
        status: 'passed',
        reason: 'Transaction isolation level tune approved for non-blocking read-committed tier.',
        appliedAt: '2026-09-05T09:11:15Z',
      },
    ],
    evidence: [
      {
        id: 'EV-103',
        type: 'system_alert',
        title: 'PostgreSQL PgBouncer Lock Contention Log',
        snippet: 'PID 4819 waiting on ExclusiveLock on relation "inventory_sku_reserve" for > 5000ms. Process killed.',
        timestamp: '2026-09-05T09:11:05Z',
        author: 'RenOS Operational Telemetry',
        hash: 'sha256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        confidenceContribution: 0.96,
      },
    ],
    publications: [
      {
        id: 'PUB-3',
        target: 'RenOS',
        status: 'published',
        externalReference: 'RN-EXEC-99120',
        syncedAt: '2026-09-05T09:12:45Z',
      },
      {
        id: 'PUB-4',
        target: 'WORKS',
        status: 'published',
        externalReference: 'WORKS-TK-4412',
        syncedAt: '2026-09-05T09:12:50Z',
      },
    ],
    activity: [
      {
        id: 'ACT-4',
        timestamp: '2026-09-05T09:11:05Z',
        actor: 'RenOS Ingestion Adapter',
        isSystem: true,
        action: 'Ingested telemetry deadlock event OBS-8920',
        detail: 'Correlated with 41 impacted user checkout sessions.',
      },
      {
        id: 'ACT-5',
        timestamp: '2026-09-05T09:12:45Z',
        actor: 'Autonomous Self-Healing Daemon',
        isSystem: true,
        action: 'Dispatched PgBouncer pool recycle command to RenOS',
        detail: 'Lock queue drained successfully; observing latency metrics.',
      },
    ],
    sourceObservationIds: ['OBS-8920'],
  },
  {
    id: 'WI-1045',
    title: 'Merge & Deploy Protobuf Serializer Patch CVE-2026-3199',
    description: 'High-severity buffer overflow in protobuf parser. Pull request #412 tested against CI regression suite with 100% test pass rate. Awaiting release train promotion.',
    status: 'needs_review',
    priority: 'urgent',
    owner: {
      name: 'Sofia Chen',
      email: 's.chen@security.corp',
      isAutonomousAgent: false,
    },
    createdAt: '2026-09-05T08:42:15Z',
    updatedAt: '2026-09-05T08:50:00Z',
    confidence: 0.96,
    whyExists: {
      inferenceSummary: 'Automated vulnerability patch verified by CI pipeline. Requires one-click promotion into production cluster.',
      model: 'aftergraph-security-triage-v1.8',
      triggerObservationId: 'OBS-8918',
      inferredIntent: 'Promote PR #412 and trigger canary deployment to EU cluster.',
    },
    resolution: {
      decisionType: 'policy_promoted',
      details: 'Automatic upgrade passed build & smoke tests; flagged for Human-in-the-Loop promotion.',
    },
    policies: [
      {
        id: 'POL-4',
        code: 'POL-CICD-PROD-RELEASE',
        name: 'Production Gate Verification',
        status: 'requires_human_signoff',
        reason: 'Patching core serialization dependencies requires manual authorization.',
        appliedAt: '2026-09-05T08:43:00Z',
      },
    ],
    evidence: [
      {
        id: 'EV-104',
        type: 'git_commit',
        title: 'PR #412: Bump protobuf-serializer from 4.18.0 to 4.19.2',
        snippet: 'Fixes CVE-2026-3199. All 1,420 unit and integration tests passed in 4m 12s.',
        timestamp: '2026-09-05T08:42:10Z',
        author: 'Dependabot',
        sourceUri: 'https://github.com/org-core/services/pull/412',
        hash: 'sha256:ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        confidenceContribution: 0.97,
      },
    ],
    publications: [
      {
        id: 'PUB-5',
        target: 'GitHub',
        status: 'awaiting_approval',
        externalReference: 'PR #412',
      },
    ],
    activity: [
      {
        id: 'ACT-6',
        timestamp: '2026-09-05T08:42:10Z',
        actor: 'GitHub Webhook Consumer',
        isSystem: true,
        action: 'Captured PR test success event',
        detail: 'CI build 99281 green on main branch merge preview.',
      },
      {
        id: 'ACT-7',
        timestamp: '2026-09-05T08:43:00Z',
        actor: 'Policy Engine',
        isSystem: true,
        action: 'Queued for human execution promotion',
        detail: 'Waiting for SecOps signoff before merging.',
      },
    ],
    sourceObservationIds: ['OBS-8918'],
    reviewCategory: 'execution_promotion',
  },
  {
    id: 'WI-1042',
    title: 'Investigate EU-West-1 Latency Spike Correlated with Commit dc81e2b',
    description: 'Dynamic query re-indexing change caused index scan invalidation on high-throughput tenant partition, degrading 99th percentile response time to 1,840ms.',
    status: 'in_progress',
    priority: 'medium',
    owner: {
      name: 'Kasper Lindholm',
      email: 'k.lindholm@platform.team',
      isAutonomousAgent: false,
    },
    dueDate: '2026-09-06T18:00:00Z',
    createdAt: '2026-09-05T07:56:00Z',
    updatedAt: '2026-09-05T08:30:00Z',
    confidence: 0.97,
    whyExists: {
      inferenceSummary: 'Synthesized by correlation graph engine joining APM latency anomaly with git history and customer support escalation tickets.',
      model: 'aftergraph-correlation-graph-v2',
      triggerObservationId: 'OBS-8916',
      inferredIntent: 'Rollback query index migration or add covering partial index.',
    },
    resolution: {
      decisionType: 'autonomous_created',
      details: 'Triaged and auto-routed to Platform Team lead based on code-ownership CODEOWNERS file.',
    },
    policies: [
      {
        id: 'POL-5',
        code: 'POL-PERF-SLA-99',
        name: 'P99 Latency Degradation Alert',
        status: 'passed',
        reason: 'Incident auto-created within 180 seconds of SLA threshold breach.',
        appliedAt: '2026-09-05T07:56:05Z',
      },
    ],
    evidence: [
      {
        id: 'EV-105',
        type: 'system_alert',
        title: 'Datadog APM P99 latency EU-West-1 > 1.5s',
        snippet: 'Impacted endpoints: /api/v2/work-graph/query, /api/v2/tenant/overview.',
        timestamp: '2026-09-05T07:54:30Z',
        author: 'Datadog Monitor #9182',
        hash: 'sha256:2c624232cdd221771294dfbb310aca000a0df6ec8b6602f7f7096cb50a1b8e71',
        confidenceContribution: 0.98,
      },
      {
        id: 'EV-106',
        type: 'git_commit',
        title: 'Commit dc81e2b: Refactor query optimizer indices',
        snippet: 'Author: David Kim. Merged 3 hours ago.',
        timestamp: '2026-09-05T05:20:00Z',
        author: 'David Kim',
        sourceUri: 'https://github.com/org-core/services/commit/dc81e2b',
        hash: 'sha256:01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b',
        confidenceContribution: 0.92,
      },
    ],
    publications: [
      {
        id: 'PUB-6',
        target: 'WORKS',
        status: 'published',
        externalReference: 'INC-8812',
        syncedAt: '2026-09-05T07:58:00Z',
      },
    ],
    activity: [
      {
        id: 'ACT-8',
        timestamp: '2026-09-05T07:56:00Z',
        actor: 'Correlation Graph Engine',
        isSystem: true,
        action: 'Generated multi-signal incident link',
        detail: 'Linked commit dc81e2b with 3 customer tickets and APM alert.',
      },
    ],
    sourceObservationIds: ['OBS-8916'],
  },
  {
    id: 'WI-1039',
    title: 'Deprecate Legacy v1 AuthToken Exchange across Gateway Cluster',
    description: 'Enforce HTTP 426 Upgrade Required for client SDKs below v2.4.0. Coordinate with mobile and partner integration partners.',
    status: 'needs_review',
    priority: 'high',
    owner: {
      name: 'Marcus Brody',
      email: 'm.brody@engineering.core',
      isAutonomousAgent: false,
    },
    dueDate: '2026-09-12T17:00:00Z',
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-09-05T09:05:00Z',
    confidence: 0.89,
    whyExists: {
      inferenceSummary: 'Derived from senior engineering conversation in #core-architecture regarding Q3 security milestone.',
      model: 'aftergraph-chat-extractor-v2',
      triggerObservationId: 'OBS-8919',
      inferredIntent: 'Create architectural deprecation item with milestone tracking.',
    },
    resolution: {
      decisionType: 'autonomous_created',
      details: 'Ambiguity detected with existing roadmap item WI-1011 (API Gateway v2 Migration). Candidate merge required.',
    },
    policies: [
      {
        id: 'POL-6',
        code: 'POL-API-GOVERNANCE-08',
        name: 'Public API Breaking Change Notice',
        status: 'requires_human_signoff',
        reason: 'Deprecating authentication flow requires minimum 14-day notice to external partners.',
        appliedAt: '2026-09-05T09:01:00Z',
      },
    ],
    evidence: [
      {
        id: 'EV-107',
        type: 'slack_snippet',
        title: 'Slack Thread in #core-architecture',
        snippet: 'Marcus Brody: "@aftergraph let us make sure we deprecate v1 AuthToken exchange by next sprint..."',
        timestamp: '2026-09-05T08:58:30Z',
        author: 'Marcus Brody',
        hash: 'sha256:4355a46b19d348dc2f57c046f8ef63d4538ebb936000f3c9ee954a27460dd865',
        confidenceContribution: 0.89,
      },
    ],
    publications: [
      {
        id: 'PUB-7',
        target: 'Linear',
        status: 'pending',
      },
    ],
    activity: [
      {
        id: 'ACT-9',
        timestamp: '2026-09-05T09:00:00Z',
        actor: 'Slack Ingest Bot',
        isSystem: true,
        action: 'Parsed conversational intent',
        detail: 'Generated WorkItem candidate with 89% intent certainty.',
      },
    ],
    sourceObservationIds: ['OBS-8919'],
    reviewCategory: 'ambiguous_merge',
    candidateComparison: {
      id: 'CAND-991',
      suggestedTitle: 'Enforce v1 AuthToken Exchange Deprecation Gate',
      suggestedDescription: 'Configure API Gateway envoy filters to return 426 for User-Agent SDK < 2.4.0',
      confidence: 0.89,
      similarityScore: 0.84,
      reasoning: 'Matches existing roadmap ticket WI-1011 (API Gateway v2 Migration). System proposes merging this requirement into WI-1011 rather than creating a fragmented standalone ticket.',
      sourceObservations: ['OBS-8919'],
      incomingAt: '2026-09-05T08:58:30Z',
    },
  },
  {
    id: 'WI-1033',
    title: 'Customer Data Export Compliance Pipeline Automation',
    description: 'Auto-fulfill GDPR/CCPA Article 15 user data export requests with cryptographic integrity proof and encrypted S3 pre-signed delivery.',
    status: 'published',
    priority: 'low',
    owner: {
      name: 'Autonomous Privacy Daemon',
      email: 'privacy-bot@aftergraph.internal',
      isAutonomousAgent: true,
    },
    createdAt: '2026-09-04T14:20:00Z',
    updatedAt: '2026-09-05T06:00:00Z',
    confidence: 0.99,
    whyExists: {
      inferenceSummary: 'Routine GDPR automated compliance flow triggered by user self-service portal.',
      model: 'aftergraph-compliance-v1.4',
      triggerObservationId: 'OBS-8711',
      inferredIntent: 'Zero-touch privacy export fulfillment.',
    },
    resolution: {
      decisionType: 'autonomous_created',
      details: 'Fully executed and published to RenOS and WORKS audit log with cryptographic seal.',
    },
    policies: [
      {
        id: 'POL-7',
        code: 'POL-GDPR-ART15',
        name: '30-Day Export Turnaround Guarantee',
        status: 'passed',
        reason: 'Fulfilled in 14 minutes autonomously.',
        appliedAt: '2026-09-04T14:20:05Z',
      },
    ],
    evidence: [
      {
        id: 'EV-108',
        type: 'document',
        title: 'Cryptographic Audit Manifest #EXP-20260904-991',
        snippet: 'SHA-256 seal: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855. Stored in immutable audit bucket.',
        timestamp: '2026-09-04T14:34:10Z',
        author: 'Aftergraph Provenance Notary',
        hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        confidenceContribution: 1.0,
      },
    ],
    publications: [
      {
        id: 'PUB-8',
        target: 'RenOS',
        status: 'published',
        externalReference: 'RN-EXP-9921',
        syncedAt: '2026-09-04T14:34:20Z',
      },
      {
        id: 'PUB-9',
        target: 'WORKS',
        status: 'published',
        externalReference: 'WORKS-AUDIT-441',
        syncedAt: '2026-09-04T14:34:25Z',
      },
    ],
    activity: [
      {
        id: 'ACT-10',
        timestamp: '2026-09-04T14:34:25Z',
        actor: 'Privacy Daemon',
        isSystem: true,
        action: 'Completed autonomous export & publication',
        detail: 'Export archive encrypted with user public GPG key.',
      },
    ],
    sourceObservationIds: ['OBS-8711'],
  },
];

export const mockReviewQueue: ReviewQueueItem[] = [
  {
    id: 'REV-01',
    workItem: mockWorkItems[0], // WI-1048
    category: 'policy_conflict',
    urgency: 'critical',
    reasoning: 'Compliance rule POL-COMPLIANCE-019 strictly blocks autonomous key modification on production snapshot volumes. Requires explicit security officer authorization.',
  },
  {
    id: 'REV-02',
    workItem: mockWorkItems[2], // WI-1045
    category: 'execution_promotion',
    urgency: 'high',
    reasoning: 'CVE-2026-3199 security patch PR #412 passed all unit and synthetic integration tests. Human gate required to trigger automated canary rollout to EU-West clusters.',
  },
  {
    id: 'REV-03',
    workItem: mockWorkItems[4], // WI-1039
    category: 'ambiguous_merge',
    urgency: 'high',
    reasoning: 'Incoming candidate has 84% semantic overlap with existing Roadmap Item WI-1011 (API Gateway v2 Migration). Recommend merging to avoid work fragmentation.',
    candidate: mockWorkItems[4].candidateComparison,
  },
];

export const mockIntegrations: IntegrationStatus[] = [
  {
    id: 'INT-GMAIL',
    name: 'Google Workspace (Gmail)',
    type: 'gmail',
    status: 'operational',
    lastEventTime: '2026-09-05T09:14:22Z',
    eventsPerMinute: 42,
    latencyMs: 120,
    authenticatedAs: 'aftergraph-audit@corp.domain',
  },
  {
    id: 'INT-RENOS',
    name: 'RenOS Operational Mesh',
    type: 'renos',
    status: 'operational',
    lastEventTime: '2026-09-05T09:11:05Z',
    eventsPerMinute: 310,
    latencyMs: 38,
    authenticatedAs: 'renos-daemon-prod-eu1',
  },
  {
    id: 'INT-GITHUB',
    name: 'GitHub Enterprise Core',
    type: 'code',
    status: 'operational',
    lastEventTime: '2026-09-05T08:42:10Z',
    eventsPerMinute: 18,
    latencyMs: 240,
    authenticatedAs: 'app-aftergraph-intel[bot]',
  },
  {
    id: 'INT-SLACK',
    name: 'Slack Conversations Grid',
    type: 'conversation',
    status: 'operational',
    lastEventTime: '2026-09-05T08:58:30Z',
    eventsPerMinute: 88,
    latencyMs: 95,
    authenticatedAs: 'bot@aftergraph-workspace',
  },
  {
    id: 'INT-CALENDAR',
    name: 'Google Calendar Enterprise',
    type: 'calendar',
    status: 'operational',
    lastEventTime: '2026-09-05T08:15:00Z',
    eventsPerMinute: 6,
    latencyMs: 310,
    authenticatedAs: 'secops-calendar@corp.domain',
  },
  {
    id: 'INT-WORKS',
    name: 'WORKS ERP / Dispatch Bridge',
    type: 'system',
    status: 'degraded',
    lastEventTime: '2026-09-05T09:02:10Z',
    eventsPerMinute: 14,
    latencyMs: 840,
    authenticatedAs: 'works-gateway-prod-02',
  },
];

export const mockMetrics: SystemMetrics = {
  autonomousResolutionRate: 0.846,
  humanInterventionRatio: 0.154,
  meanInferenceLatencyMs: 284,
  activeObservationsToday: 1482,
  workItemsDiscoveredToday: 38,
  pendingReviewCount: 3,
  policyAlignmentScore: 0.998,
};

export type AppScenario = 
  | 'normal_day'         // State A: Normal day (2 reviews, 8 handled, 3 upcoming)
  | 'all_calm'           // State B: Nothing needs attention (0 reviews, highlight automation value)
  | 'integration_issue'  // State C: Gmail disconnected with impact
  | 'high_risk'          // State D: High-risk execution gate
  | 'new_workspace';     // State E: Clean empty onboarding

export function getScenarioData(scenario: AppScenario) {
  switch (scenario) {
    case 'all_calm':
      return {
        workItems: mockWorkItems.map(w => ({ ...w, status: w.status === 'needs_review' ? 'published' as const : w.status })),
        observations: mockObservations,
        reviewQueue: [] as ReviewQueueItem[],
        integrations: mockIntegrations.map(i => ({ ...i, status: 'operational' as const })),
        metrics: { ...mockMetrics, pendingReviewCount: 0 }
      };

    case 'integration_issue':
      return {
        workItems: mockWorkItems,
        observations: mockObservations,
        reviewQueue: mockReviewQueue,
        integrations: mockIntegrations.map(i => 
          i.type === 'gmail' 
            ? { ...i, status: 'failed' as const, latencyMs: 0, eventsPerMinute: 0 } 
            : i
        ),
        metrics: { ...mockMetrics }
      };

    case 'high_risk':
      return {
        workItems: mockWorkItems,
        observations: mockObservations,
        reviewQueue: [
          {
            id: 'REV-HIGH-01',
            workItem: {
              ...mockWorkItems[0],
              title: 'Production KMS Envelope Key Rotation & Cold-Tier Snapshot Migration',
              priority: 'urgent' as Priority,
            },
            category: 'execution_promotion' as const,
            urgency: 'critical' as const,
            reasoning: 'Automated script is requesting permission to re-encrypt and rotate AWS KMS envelope keys across 4 regional cold-tier storage volumes. Execution will touch 1.4 TB of historical customer database backups.',
          },
          ...mockReviewQueue
        ] as ReviewQueueItem[],
        integrations: mockIntegrations,
        metrics: { ...mockMetrics, pendingReviewCount: 4 }
      };

    case 'new_workspace':
      return {
        workItems: [] as WorkItem[],
        observations: [] as Observation[],
        reviewQueue: [] as ReviewQueueItem[],
        integrations: mockIntegrations.map(i => ({ ...i, status: 'degraded' as const, eventsPerMinute: 0 })),
        metrics: {
          autonomousResolutionRate: 0,
          humanInterventionRatio: 0,
          meanInferenceLatencyMs: 0,
          activeObservationsToday: 0,
          workItemsDiscoveredToday: 0,
          pendingReviewCount: 0,
          policyAlignmentScore: 1.0,
        }
      };

    case 'normal_day':
    default:
      return {
        workItems: mockWorkItems,
        observations: mockObservations,
        reviewQueue: mockReviewQueue,
        integrations: mockIntegrations,
        metrics: mockMetrics
      };
  }
}

