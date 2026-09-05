import { DocDocumentItem } from '../../runtime/runtimeTypes';
import { getAccessToken } from './googleAuth';

let localDocs: DocDocumentItem[] = [
  {
    id: 'doc_arch_spec_01',
    title: 'Q3 Aftergraph Operational Architecture Spec',
    author: 'Alex Chen (Staff Engineer)',
    lastModified: new Date(Date.now() - 3600000 * 3).toISOString(),
    wordCount: 1420,
    webViewLink: 'https://docs.google.com/document/d/doc_arch_spec_01/edit',
    sections: [
      {
        heading: '1. Executive Overview & Autonomous Boundary',
        body: 'The Aftergraph operational intelligence subsystem continuously digests disparate telemetry from email threads, meetings, commits, and system metrics. Its core mission is transforming ambiguous conversational artifacts into verified, policy-bounded work candidates with full provenance verification.'
      },
      {
        heading: '2. Five Questions Supervisory Decision Model',
        body: 'Every proposal presented to human supervisors must answer five immutable supervisory requirements: What is being proposed? Why does it exist? What changes if approved? What is the blast radius risk? What immutable evidence supports it?'
      },
      {
        heading: '3. Google Workspace Ecosystem Integration',
        body: 'Native bidirectional integration with Google Drive (artifacts & evidence storage), Gmail (intent observation & communication dispatch), Google Calendar (schedule conflict resolution), Google Sheets (metric tracking), Google Docs (spec synchronization), and Google Keep (checklist capture).'
      }
    ]
  },
  {
    id: 'doc_key_rotation_02',
    title: 'Audit Signoff: Production KMS Root Key Rotation',
    author: 'SecOps Automated Compliance Engine',
    lastModified: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    wordCount: 680,
    webViewLink: 'https://docs.google.com/document/d/doc_key_rotation_02/edit',
    sections: [
      {
        heading: 'Scope & Authorization',
        body: 'Rotation of AWS KMS root CMK and GCP Cloud KMS keyring for production transactional datastores. Staged by Aftergraph Autonomous Agent under rule SEC-8902.'
      },
      {
        heading: 'Canary Verification Results',
        body: 'Zero failed handshakes recorded over 300s observation window. P99 latency unaffected at 18ms.'
      }
    ]
  }
];

export const fetchDocs = async (): Promise<DocDocumentItem[]> => {
  return [...localDocs];
};

export const createGoogleDoc = async (title: string, initialBody: string): Promise<DocDocumentItem> => {
  const token = await getAccessToken();
  if (token) {
    try {
      const res = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const data = await res.json();
        // Insert text
        if (initialBody) {
          await fetch(`https://docs.googleapis.com/v1/documents/${data.documentId}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [
                {
                  insertText: {
                    location: { index: 1 },
                    text: `${title}\n\n${initialBody}\n`,
                  },
                },
              ],
            }),
          });
        }
        const newDoc: DocDocumentItem = {
          id: data.documentId,
          title: data.title || title,
          author: 'Current User',
          lastModified: new Date().toISOString(),
          wordCount: initialBody.split(/\s+/).length,
          webViewLink: `https://docs.google.com/document/d/${data.documentId}/edit`,
          sections: [{ heading: 'Generated Content', body: initialBody }],
        };
        localDocs.unshift(newDoc);
        return newDoc;
      }
    } catch (err) {
      console.warn('Live Docs create error:', err);
    }
  }

  const localDoc: DocDocumentItem = {
    id: `local_doc_${Date.now()}`,
    title,
    author: 'Current User',
    lastModified: new Date().toISOString(),
    wordCount: initialBody.split(/\s+/).length,
    webViewLink: 'https://docs.google.com',
    sections: [{ heading: 'Document Body', body: initialBody }],
  };
  localDocs.unshift(localDoc);
  return localDoc;
};
