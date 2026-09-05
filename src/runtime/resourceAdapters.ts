import { 
  DriveItem, 
  GmailMessageItem, 
  CalendarEventItem, 
  DocDocumentItem, 
  KeepNoteItem, 
  SheetDataset 
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
    subtitle: file.ownerName ? `Owner: ${file.ownerName}` : 'Shared File',
    summary: `${file.mimeType.split('.').pop() || file.mimeType} • Modified ${file.modifiedTime}`,
    modifiedAt: file.modifiedTime,
    actor: {
      name: file.ownerName || 'Drive Collaborator',
      email: `${(file.ownerName || 'user').toLowerCase().replace(/\s+/g, '.')}@acme.corp`,
      role: file.shared ? 'Collaborator' : 'Owner',
    },
    permissions: {
      canView: true,
      canEdit: !file.shared || file.ownerName?.includes('User'),
      canShare: true,
      canDelete: true,
      canComment: true,
      role: file.shared ? 'editor' : 'owner',
    },
    capabilities: {
      open: true,
      preview: true,
      download: !isFolder,
      attachEvidence: !isFolder,
      linkToWorkItem: true,
      share: true,
      comment: isDoc || isSheet,
      edit: isDoc || isSheet,
      createWorkItem: true,
    },
    connectionState: 'connected',
    evidenceHash: `sha256:drive_${file.id.slice(0, 16)}`,
    provenanceUri: file.webViewLink || `https://drive.google.com/file/d/${file.id}`,
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
      canEdit: false,
      canShare: true,
      canDelete: true,
      role: 'viewer',
    },
    capabilities: {
      open: true,
      preview: true,
      reply: true,
      archive: true,
      createWorkItem: true,
      attachEvidence: true,
      scheduleFollowUp: true,
      linkToWorkItem: true,
    },
    connectionState: 'connected',
    evidenceHash: `sha256:gmail_${msg.id.slice(0, 16)}`,
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
      name: event.attendees[0]?.name || 'Meeting Host',
      email: event.attendees[0]?.email || 'host@acme.corp',
      role: 'Organizer',
    },
    permissions: {
      canView: true,
      canEdit: true,
      canShare: true,
      canDelete: true,
      role: 'editor',
    },
    capabilities: {
      open: true,
      preview: true,
      edit: true,
      createWorkItem: true,
      linkToWorkItem: true,
      attachEvidence: true,
      scheduleFollowUp: true,
    },
    connectionState: 'connected',
    evidenceHash: `sha256:cal_${event.id.slice(0, 16)}`,
    provenanceUri: event.htmlLink || `https://calendar.google.com/event?eid=${event.id}`,
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
      email: `${doc.author.toLowerCase().replace(/\s+/g, '.')}@acme.corp`,
      role: 'Author',
    },
    permissions: {
      canView: true,
      canEdit: true,
      canComment: true,
      canShare: true,
      role: 'editor',
    },
    capabilities: {
      open: true,
      preview: true,
      edit: true,
      comment: true,
      attachEvidence: true,
      linkToWorkItem: true,
      createWorkItem: true,
    },
    connectionState: 'connected',
    evidenceHash: `sha256:docs_${doc.id.slice(0, 16)}`,
    provenanceUri: doc.webViewLink || `https://docs.google.com/document/d/${doc.id}`,
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
      name: 'Sheets Automation',
      email: 'sheets-ops@acme.corp',
      role: 'Editor',
    },
    permissions: {
      canView: true,
      canEdit: true,
      canShare: true,
      canComment: true,
      role: 'editor',
    },
    capabilities: {
      open: true,
      preview: true,
      edit: true,
      createWorkItem: true,
      linkToWorkItem: true,
      attachEvidence: true,
      download: true,
    },
    connectionState: 'connected',
    evidenceHash: `sha256:sheet_${sheet.spreadsheetId.slice(0, 16)}`,
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
    subtitle: note.isChecklist ? `${doneCount}/${totalCount} items completed` : 'Note',
    summary: note.isChecklist 
      ? note.checklistItems.map(i => `${i.done ? '✓' : '○'} ${i.text}`).join(' • ')
      : note.content,
    modifiedAt: note.updatedAt,
    actor: {
      name: 'Current User',
      email: 'user@acme.corp',
      role: 'Owner',
    },
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      role: 'owner',
    },
    capabilities: {
      open: true,
      preview: true,
      edit: true,
      createWorkItem: !isPromoted,
      linkToWorkItem: true,
      attachEvidence: true,
      archive: true,
    },
    connectionState: 'connected',
    evidenceHash: `sha256:keep_${note.id}`,
    provenanceUri: `https://keep.google.com/#NOTE/${note.id}`,
    isActionable: note.isChecklist && doneCount < totalCount && !isPromoted,
    linkedWorkItems: note.linkedWorkItemId ? [note.linkedWorkItemId] : undefined,
    metadata: {
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

// Aliases for cross-module compatibility
export const adaptDriveItemToWorkspaceResource = driveItemToResource;
export const adaptGmailMessageToWorkspaceResource = gmailItemToResource;
export const adaptCalendarEventToWorkspaceResource = calendarEventToResource;
export const adaptDocItemToWorkspaceResource = docItemToResource;
export const adaptSheetDatasetToWorkspaceResource = sheetDatasetToResource;
export const adaptKeepNoteToWorkspaceResource = keepItemToResource;
