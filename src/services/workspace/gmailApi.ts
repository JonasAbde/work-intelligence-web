import { GmailMessageItem } from '../../runtime/runtimeTypes';
import { getAccessToken } from './googleAuth';

let localGmailMessages: GmailMessageItem[] = [
  {
    id: 'msg_sec_alert_91',
    threadId: 'th_sec_91',
    from: 'security-notify@infra.internal',
    fromName: 'Infra SecOps Alert',
    to: 'engineering-ops@internal',
    subject: 'Action Required: Primary Root Key Rotation SLA (24h left)',
    snippet: 'AWS and GCP KMS cross-tenant primary key rotation policy requires human signoff. Inferred blast radius: 4 DB clusters.',
    body: `Hello Team,

Per compliance audit rule SEC-8902, the quarterly KMS key rotation cycle must complete before Sept 6th.

Autonomous agent Aftergraph has already staged the candidate configuration, verified zero-downtime health on staging canary, and now requires human signoff in Review Queue.

Affected Volumes:
- prod-cluster-us-east1
- prod-cluster-eu-west1
- replica-backup-cold
- event-bus-vault

Please confirm rotation authorization immediately.

Regards,
Security Automation Service`,
    date: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isUnread: true,
    hasAttachments: true,
    labels: ['INBOX', 'URGENT', 'SECURITY'],
    extractedWorkItemCandidate: {
      suggestedTitle: 'Approve Primary Root Key Rotation SLA',
      suggestedAction: 'Execute staged KMS key rotation for 4 production clusters with zero downtime canary verification.',
      priority: 'urgent',
      confidence: 0.94,
      reasoning: 'Compliance rule SEC-8902 SLA expiring in 24 hours. Staged changes verified on staging canary.'
    }
  },
  {
    id: 'msg_sprint_sync_92',
    threadId: 'th_sprint_92',
    from: 'sarah.miller@product.io',
    fromName: 'Sarah Miller',
    to: 'core-team@internal',
    subject: 'Client Meeting Notes: Fintech Integration Specs needed for Friday',
    snippet: 'Hey team, during our sync with Acme Corp they asked for the webhook payload schemas and retry policy document.',
    body: `Hey team,

Following up on today's client sync with Acme Corp:
1. They need the webhook payload schemas for the new transaction stream.
2. They specifically asked about exponential backoff retry policies and timeout intervals.

Can we make sure this is added to the Sprint 34 backlog and assigned before Friday?

Thanks!
Sarah`,
    date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isUnread: true,
    hasAttachments: false,
    labels: ['INBOX', 'PRODUCT'],
    extractedWorkItemCandidate: {
      suggestedTitle: 'Document Webhook Schemas & Retry Policy for Acme Corp',
      suggestedAction: 'Draft and publish technical specification for transaction stream webhooks and exponential backoff retry behaviors.',
      priority: 'high',
      confidence: 0.89,
      reasoning: 'Explicit client request with Friday deadline extracted from Sarah Miller (Product Lead).'
    }
  },
  {
    id: 'msg_billing_alert_93',
    threadId: 'th_bill_93',
    from: 'cloud-billing@provider.com',
    fromName: 'Cloud Infrastructure Billing',
    to: 'devops-alerts@internal',
    subject: 'Monthly Compute Budget at 85% threshold',
    snippet: 'Billing alert: monthly spend reached $12,450 of allocated $15,000 budget.',
    body: `Monthly spend threshold notification:
Current month-to-date spend has reached 85% of budget.
Top contributors:
- Kubernetes egress traffic ($3,420)
- BigQuery query compute ($2,890)`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    isUnread: false,
    hasAttachments: false,
    labels: ['INBOX', 'BILLING'],
    extractedWorkItemCandidate: {
      suggestedTitle: 'Review Compute Egress Spend & BigQuery Usage',
      suggestedAction: 'Analyze Kubernetes egress routing and optimize high-cost BigQuery query partitions.',
      priority: 'medium',
      confidence: 0.82,
      reasoning: 'Automated 85% budget consumption alert on cloud infrastructure.'
    }
  }
];

export const fetchGmailMessages = async (query?: string): Promise<GmailMessageItem[]> => {
  const token = await getAccessToken();
  if (token) {
    try {
      let url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20';
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }
      const listRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.messages && listData.messages.length > 0) {
          const detailPromises = listData.messages.slice(0, 10).map(async (m: { id: string }) => {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!detailRes.ok) return null;
            const full = await detailRes.json();
            const headers = full.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
            const fromRaw = getHeader('From');
            const matchName = fromRaw.match(/^(.*?)\s*<.*>$/);
            const fromName = matchName ? matchName[1].replace(/["']/g, '') : fromRaw.split('@')[0];
            const subject = getHeader('Subject') || '(No subject)';
            const date = getHeader('Date') || new Date().toISOString();

            return {
              id: full.id,
              threadId: full.threadId,
              from: fromRaw,
              fromName: fromName || fromRaw,
              to: getHeader('To'),
              subject,
              snippet: full.snippet || '',
              date: new Date(date).toISOString(),
              isUnread: full.labelIds?.includes('UNREAD') ?? false,
              hasAttachments: (full.payload?.parts || []).some((p: any) => !!p.filename),
              labels: full.labelIds || [],
              extractedWorkItemCandidate: {
                suggestedTitle: `Follow up on: ${subject}`,
                suggestedAction: full.snippet || 'Review and take appropriate action on email correspondence.',
                priority: 'medium' as const,
                confidence: 0.85,
                reasoning: 'Extracted from incoming Gmail thread.',
              }
            };
          });
          const resolved = (await Promise.all(detailPromises)).filter(Boolean) as GmailMessageItem[];
          if (resolved.length > 0) {
            return resolved;
          }
        }
      }
    } catch (err) {
      console.warn('Live Gmail API fetch error, using local fallback:', err);
    }
  }

  if (query) {
    const q = query.toLowerCase();
    return localGmailMessages.filter(m => 
      m.subject.toLowerCase().includes(q) || 
      m.from.toLowerCase().includes(q) || 
      m.snippet.toLowerCase().includes(q)
    );
  }
  return [...localGmailMessages];
};

export const sendGmailMessage = async (to: string, subject: string, bodyText: string): Promise<void> => {
  const token = await getAccessToken();
  if (token) {
    try {
      const emailLines = [
        `To: ${to}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        bodyText
      ];
      const rawEmail = btoa(unescape(encodeURIComponent(emailLines.join('\r\n'))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawEmail }),
      });
      if (!res.ok) {
        throw new Error(`Gmail API send failed: ${res.statusText}`);
      }
    } catch (err) {
      console.warn('Live Gmail send failed:', err);
    }
  }

  // Record sent message locally
  const newSent: GmailMessageItem = {
    id: `sent_${Date.now()}`,
    threadId: `th_sent_${Date.now()}`,
    from: 'me@company.io',
    fromName: 'You',
    to,
    subject,
    snippet: bodyText.slice(0, 80),
    body: bodyText,
    date: new Date().toISOString(),
    isUnread: false,
    hasAttachments: false,
    labels: ['SENT'],
  };
  localGmailMessages.unshift(newSent);
};
