import {
  DriveItem,
  GmailMessageItem,
  CalendarEventItem,
  DocDocumentItem,
  KeepNoteItem,
  SheetDataset,
} from './runtimeTypes';
import { WorkspaceResource } from './workspaceResource';

export function driveItemToResource(file: DriveItem): WorkspaceResource {
  const isDoc = file.mimeType.includes('document');
  const isSheet = file.mimeType.includes('spreadsheet');
  const isFolder = file.mimeType.includes('folder');

  return {
    id: `drive-${file.id}`,
    provider: 'drive',
    kind: isFolder ? 'folder' : isDoc ? 'document' : isSheet ? 'spreadsheet' : 'file',
    title: file.name,
    subtitle: file.ownerName ? `Owner: ${file.ownerName}` : 'Drive resource',
    summary: `${file.mimeType.split('.').pop() || file.mimeType} • Modified ${file.modifiedTime}`,
    modifiedAt: file.modifiedTime,
    actor: {
      name: file.ownerName || 'Drive collaborator',
      email: '',
      role: file.shared ? 'Collaborator' : 'Owner',
    },
    permissions: {
      canView: true,
    },
    capabilities: {
      open: Boolean(file.webViewLink),
      preview: true,
      download: !isFolder,
      createWorkItem: true,
    },
    connectionState: 'connected',
    provenanceUri: file.webViewLink,
    metadata: {
      mimeType: file.mimeType,
      size: file.size,
      shared: file.shared,
      thumbnailLink: file.thumbnailLink,
      rawId: file.id,
    },
  };
}

export function gmailItemToResource(msg: GmailMessageItem): WorkspaceResource {
  const hasWorkCandidate = Boolean(msg.extractedWorkItemCandidate);

  return {
    id: `gmail-${msg.id}`,
    provider: 'gmail',
    kind: 'email',
    title: msg.subject,
    subtitle: `${msg.fromName} <${msg.from}>`,
    summary: msg.snippet,
    modifiedAt: msg.date,
    actor: {
      name: msg.fromName,
      email: msg.from,
      role: 'Sender',
    },
    permissions: {
      canView: true,
      role: 'viewer',
    },
    capabilities: {
      open: true,
      preview: true,
      reply: true,
      createWorkItem: true,
    },
    connectionState: 'connected',
    provenanceUri: `https://mail.google.com/mail/u/0/#inbox/${msg.threadId}`,
    isActionable: hasWorkCandidate || msg.isUnread,
    detectedWork: msg.extractedWorkItemCandidate,
    metadata: {
      threadId: msg.threadId,
      to: msg.to,
      isUnread: msg.isUnread,
      hasAttachments: msg.hasAttachments,
      labels: msg.labels,
      body: msg.body,
      rawId: msg.id,
    },
  };
}

export function calendarEventToResource(event: CalendarEventItem): WorkspaceResource {
  const isConflict = event.title.toLowerCase().includes('conflict') || event.title.toLowerCase().includes('sync');

  return {
    id: `calendar-${event.id}`,
    provider: 'calendar',
    kind: 'event',
    title: event.title,
    subtitle: `${new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    summary: event.description || (event.location ? `Location: ${event.location}` : 'No description provided'),
    modifiedAt: event.start,
    actor: {
      name: event.attendees[0]?.name || 'Calendar participant',
      email: event.attendees[0]?.email || '',
      role: 'Participant',
    },
    permissions: {
      canView: true,
    },
    capabilities: {
      open: Boolean(event.htmlLink),
      preview: true,
      createWorkItem: true,
    },
    connectionState: 'connected',
    provenanceUri: event.htmlLink,
    isActionable: isConflict || Boolean(event.linkedWorkItemId),
    linkedWorkItems: event.linkedWorkItemId ? [event.linkedWorkItemId] : undefined,
    metadata: {
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: event.attendees,
      isAllDay: event.isAllDay,
      hasConflict: isConflict,
      rawId: event.id,
    },
  };
}

export function docItemToResource(doc: DocDocumentItem): WorkspaceResource {
  return {
    id: `docs-${doc.id}`,
    provider: 'docs',
    kind: 'document',
    title: doc.title,
    subtitle: `By ${doc.author} • ${doc.wordCount} words`,
    summary: doc.sections[0]?.body?.slice(0, 140) + '...',
    modifiedAt: doc.lastModified,
    actor: {
      name: doc.author,
      email: '',
      role: 'Author',
    },
    permissions: {
      canView: true,
    },
    capabilities: {
      open: Boolean(doc.webViewLink),
      preview: true,
      createWorkItem: true,
    },
    connectionState: 'connected',
    provenanceUri: doc.webViewLink,
    metadata: {
      wordCount: doc.wordCount,
      sectionsCount: doc.sections.length,
      sections: doc.sections,
      rawId: doc.id,
    },
  };
}

export function sheetDatasetToResource(sheet: SheetDataset): WorkspaceResource {
  return {
    id: `sheets-${sheet.spreadsheetId}`,
    provider: 'sheets',
    kind: 'spreadsheet',
    title: sheet.title,
    subtitle: `Sheet: ${sheet.sheetName} (${sheet.rows.length} rows, ${sheet.columns.length} columns)`,
    summary: `Columns: ${sheet.columns.slice(0, 5).join(', ')}${sheet.columns.length > 5 ? '...' : ''}`,
    modifiedAt: sheet.updatedAt,
    actor: {
      name: 'Google Sheets',
      email: '',
      role: 'Provider',
    },
    permissions: {
      canView: true,
    },
    capabilities: {
      open: true,
      preview: true,
      createWorkItem: true,
    },
    connectionState: 'connected',
    provenanceUri: `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`,
    metadata: {
      spreadsheetId: sheet.spreadsheetId,
      sheetName: sheet.sheetName,
      columns: sheet.columns,
      rowCount: sheet.rows.length,
      sampleRows: sheet.rows.slice(0, 3),
      rawId: sheet.spreadsheetId,
    },
  };
}

export function keepItemToResource(note: KeepNoteItem): WorkspaceResource {
  const isPromoted = Boolean(note.linkedWorkItemId);
  const doneCount = note.checklistItems?.filter(i => i.done).length || 0;
  const totalCount = note.checklistItems?.length || 0;

  return {
    id: `keep-${note.id}`,
    provider: 'keep',
    kind: note.isChecklist ? 'checklist' : 'note',
    title: note.title,
    subtitle: note.isChecklist ? `${doneCount}/${totalCount} items completed` : 'Preview note',
    summary: note.isChecklist
      ? note.checklistItems.map(i => `${i.done ? '✓' : '○'} ${i.text}`).join(' • ')
      : note.content,
    modifiedAt: note.updatedAt,
    actor: {
      name: 'Preview user',
      email: '',
      role: 'Preview',
    },
    permissions: {
      canView: true,
    },
    capabilities: {
      preview: true,
      createWorkItem: !isPromoted,
    },
    connectionState: 'preview_mock',
    provenanceUri: `https://keep.google.com/#NOTE/${note.id}`,
    isActionable: note.isChecklist && doneCount < totalCount && !isPromoted,
    linkedWorkItems: note.linkedWorkItemId ? [note.linkedWorkItemId] : undefined,
    metadata: {
      previewOnly: true,
      isChecklist: note.isChecklist,
      isPinned: note.isPinned,
      color: note.color,
      labels: note.labels,
      checklistItems: note.checklistItems,
      content: note.content,
      rawId: note.id,
    },
  };
}

export const adaptDriveItemToWorkspaceResource = driveItemToResource;
export const adaptGmailMessageToWorkspaceResource = gmailItemToResource;
export const adaptCalendarEventToWorkspaceResource = calendarEventToResource;
export const adaptDocItemToWorkspaceResource = docItemToResource;
export const adaptSheetDatasetToWorkspaceResource = sheetDatasetToResource;
export const adaptKeepNoteToWorkspaceResource = keepItemToResource;
