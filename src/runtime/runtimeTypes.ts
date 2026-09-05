export type DensityMode = 'comfortable' | 'compact' | 'dense';

export interface PresentationContract<T = any> {
  objectType: 'work_item' | 'gmail_message' | 'calendar_event' | 'drive_file' | 'sheet_table' | 'doc_content' | 'keep_note';
  id: string;
  state: string;
  urgency?: 'critical' | 'high' | 'normal' | 'low';
  confidence?: number;
  capabilities: Array<
    | 'approve'
    | 'edit'
    | 'reject'
    | 'delete'
    | 'inspect_evidence'
    | 'promote_to_work_item'
    | 'export_to_doc'
    | 'append_to_sheet'
    | 'reply'
    | 'schedule_meeting'
    | 'toggle_checklist'
    | 'pick_file'
    | 'archive'
  >;
  presentation: {
    primary: 'card' | 'row' | 'detail' | 'table' | 'editor';
    secondary?: ('evidence' | 'activity' | 'policy' | 'meta')[];
    advanced?: ('raw_json' | 'provenance' | 'model_params')[];
  };
  data: T;
}

export interface WorkspaceUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  iconUrl?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  ownerName?: string;
  shared?: boolean;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  isUnread: boolean;
  hasAttachments: boolean;
  labels: string[];
  extractedWorkItemCandidate?: {
    suggestedTitle: string;
    suggestedAction: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    confidence: number;
    reasoning: string;
  };
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  isAllDay?: boolean;
  location?: string;
  attendees: Array<{ name: string; email: string; status?: 'accepted' | 'tentative' | 'declined' }>;
  htmlLink?: string;
  linkedWorkItemId?: string;
}

export interface SheetRowData {
  [columnKey: string]: string | number | boolean;
}

export interface SheetDataset {
  spreadsheetId: string;
  title: string;
  sheetName: string;
  columns: string[];
  rows: SheetRowData[];
  updatedAt: string;
}

export interface DocDocumentItem {
  id: string;
  title: string;
  author: string;
  lastModified: string;
  sections: Array<{ heading?: string; body: string }>;
  wordCount: number;
  webViewLink?: string;
}

export interface KeepNoteItem {
  id: string;
  title: string;
  content: string;
  isChecklist: boolean;
  checklistItems: Array<{ id: string; text: string; done: boolean }>;
  color: 'default' | 'amber' | 'cyan' | 'emerald' | 'rose' | 'purple';
  isPinned: boolean;
  labels: string[];
  updatedAt: string;
  linkedWorkItemId?: string;
}
