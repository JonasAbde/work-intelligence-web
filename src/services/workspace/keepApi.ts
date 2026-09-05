import { KeepNoteItem } from '../../runtime/runtimeTypes';

let localKeepNotes: KeepNoteItem[] = [
  {
    id: 'note_01',
    title: 'Release Readiness Checklist (Sprint 34)',
    content: 'Ensure all critical security and publishing gates are verified before Friday 17:00 UTC.',
    isChecklist: true,
    checklistItems: [
      { id: 'chk_1', text: 'KMS Key rotation signoff approved in Review Queue', done: false },
      { id: 'chk_2', text: 'Canary health metric latency validated below 50ms', done: true },
      { id: 'chk_3', text: 'Webhook schema exported to Acme Corp', done: true },
      { id: 'chk_4', text: 'Spanner replica sync lag alert silenced after patch', done: true }
    ],
    color: 'amber',
    isPinned: true,
    labels: ['Operations', 'Sprint 34', 'Security'],
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    linkedWorkItemId: 'WI-1024',
  },
  {
    id: 'note_02',
    title: 'Observation Rules to Calibrate',
    content: 'Notes from Alex: Reduce false-positive rate on Slack channel #infra-chatter. High noise on casual bot mentions. Need policy threshold adjusted to 0.88 confidence minimum.',
    isChecklist: false,
    checklistItems: [],
    color: 'cyan',
    isPinned: true,
    labels: ['Intelligence', 'Model Calibration'],
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'note_03',
    title: 'Customer Feedback: Acme Webhooks',
    content: 'Client requested webhook signature header verification examples in Python and Go. Need to attach code snippets to Docs spec.',
    isChecklist: false,
    checklistItems: [],
    color: 'purple',
    isPinned: false,
    labels: ['Customer', 'Acme'],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    linkedWorkItemId: 'WI-1025',
  }
];

export const fetchKeepNotes = async (): Promise<KeepNoteItem[]> => {
  return [...localKeepNotes];
};

export const createKeepNote = async (note: Omit<KeepNoteItem, 'id' | 'updatedAt'>): Promise<KeepNoteItem> => {
  const newNote: KeepNoteItem = {
    ...note,
    id: `keep_${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };
  localKeepNotes.unshift(newNote);
  return newNote;
};

export const toggleChecklistItem = async (noteId: string, itemId: string): Promise<void> => {
  const note = localKeepNotes.find(n => n.id === noteId);
  if (note) {
    const item = note.checklistItems.find(i => i.id === itemId);
    if (item) {
      item.done = !item.done;
      note.updatedAt = new Date().toISOString();
    }
  }
};

export const deleteKeepNote = async (noteId: string): Promise<void> => {
  localKeepNotes = localKeepNotes.filter(n => n.id !== noteId);
};
