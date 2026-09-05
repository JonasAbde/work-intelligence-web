import { KeepNoteItem } from '../../runtime/runtimeTypes';
import { isExplicitPreviewMode } from '../../runtime/runtimeMode';
import { loadPersistedState, savePersistedState, STORAGE_KEYS } from '../../runtime/persistence';

const previewNotes: KeepNoteItem[] = [
  {
    id: 'preview_keep_1',
    title: 'Preview checklist',
    content: 'Explicit preview note. Google Keep is not connected in live mode.',
    isChecklist: true,
    checklistItems: [
      { id: 'preview_item_1', text: 'Preview-only checklist item', done: false },
    ],
    color: 'amber',
    isPinned: true,
    labels: ['Preview'],
    updatedAt: new Date().toISOString(),
  },
];

let localNotes: KeepNoteItem[] = loadPersistedState(STORAGE_KEYS.KEEP_NOTES, previewNotes);

function assertPreview(): void {
  if (!isExplicitPreviewMode()) {
    throw new Error('Google Keep is not available as a live provider. Open with ?preview=1 to use preview data.');
  }
}

function persistPreviewNotes() {
  savePersistedState(STORAGE_KEYS.KEEP_NOTES, localNotes);
}

export const fetchKeepNotes = async (): Promise<KeepNoteItem[]> => {
  assertPreview();
  return [...localNotes];
};

export const createKeepNote = async (note: Omit<KeepNoteItem, 'id' | 'updatedAt'>): Promise<KeepNoteItem> => {
  assertPreview();
  const item: KeepNoteItem = {
    ...note,
    id: `preview_keep_${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };
  localNotes.unshift(item);
  persistPreviewNotes();
  return item;
};

export const toggleChecklistItem = async (noteId: string, itemId: string): Promise<void> => {
  assertPreview();
  const note = localNotes.find(candidate => candidate.id === noteId);
  if (!note) throw new Error('Preview Keep note not found.');
  const item = note.checklistItems.find(candidate => candidate.id === itemId);
  if (!item) throw new Error('Preview checklist item not found.');
  item.done = !item.done;
  note.updatedAt = new Date().toISOString();
  persistPreviewNotes();
};

export const deleteKeepNote = async (noteId: string): Promise<void> => {
  assertPreview();
  localNotes = localNotes.filter(note => note.id !== noteId);
  persistPreviewNotes();
};
