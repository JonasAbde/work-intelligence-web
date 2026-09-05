import React, { useState, useEffect } from 'react';
import { 
  fetchCalendarEvents, 
  createCalendarEvent, 
  deleteCalendarEvent 
} from '../../services/workspace/calendarApi';
import { CalendarEventItem } from '../../runtime/runtimeTypes';
import { WorkspaceResource } from '../../runtime/workspaceResource';
import { adaptCalendarEventToWorkspaceResource } from '../../runtime/resourceAdapters';
import { telemetry } from '../../runtime/telemetry';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { ConfirmationDialog } from '../../runtime/primitives/Dialogs';
import { GoogleAuthBar } from './GoogleAuthBar';
import { WorkspaceResourceRow } from './primitives/WorkspaceResourceRow';
import { WorkspaceBulkActions } from './primitives/WorkspaceBulkActions';
import { WorkspaceActionBar } from './primitives/WorkspaceActionBar';
import { WorkspaceSource } from './primitives/WorkspaceSource';
import { WorkspacePermissionState } from './primitives/WorkspacePermissionState';
import { WorkspaceSyncState } from './primitives/WorkspaceSyncState';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Link2, 
  Video
} from 'lucide-react';

export interface CalendarSurfaceProps {
  onSelectWorkItem?: (workItemId: string) => void;
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
  onNavigateToWorkItem?: (id: string) => void;
}

export const CalendarSurface: React.FC<CalendarSurfaceProps> = ({ 
  onSelectWorkItem,
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
  onNavigateToWorkItem,
}) => {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<WorkspaceResource | null>(null);
  const [checkedResources, setCheckedResources] = useState<WorkspaceResource[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('14:00');
  const [newDurationMin] = useState(45);
  const [newAttendees, setNewAttendees] = useState('');
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const startTime = performance.now();
    setIsLoading(true);
    try {
      const items = await fetchCalendarEvents();
      setEvents(items);
      const adapted = items.map(adaptCalendarEventToWorkspaceResource);
      if (adapted.length > 0 && !selectedResource) {
        setSelectedResource(adapted[0]);
      }
      telemetry.record('resource_loaded', {
        provider: 'calendar',
        durationMs: Math.round(performance.now() - startTime),
        details: { count: items.length },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCreate = async () => {
    setIsCreating(true);
    try {
      const startDateTime = new Date(`${newDate}T${newTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + newDurationMin * 60 * 1000);
      const emails = newAttendees.split(',').map(e => e.trim()).filter(Boolean);

      const created = await createCalendarEvent({
        title: newTitle,
        description: newDescription,
        startIso: startDateTime.toISOString(),
        endIso: endDateTime.toISOString(),
        location: 'Google Meet',
        attendeeEmails: emails,
      });

      setEvents(prev => [...prev, created]);
      const res = adaptCalendarEventToWorkspaceResource(created);
      setSelectedResource(res);
      setShowCreateConfirmation(false);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewAttendees('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCalendarEvent(eventToDelete.id);
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      if (selectedResource?.id === eventToDelete.id) {
        setSelectedResource(null);
      }
      setCheckedResources(prev => prev.filter(r => r.id !== eventToDelete.id));
      setEventToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const adaptedResources = events.map(adaptCalendarEventToWorkspaceResource);

  const toggleCheck = (res: WorkspaceResource) => {
    setCheckedResources(prev => {
      const exists = prev.some(r => r.id === res.id);
      if (exists) return prev.filter(r => r.id !== res.id);
      return [...prev, res];
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Google Auth Status Banner */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]">
        <GoogleAuthBar onAuthChange={() => loadEvents()} />
      </div>

      {/* Surface Header & Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Google Calendar Operational Schedule
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-800/80 text-amber-300 font-normal">
                {events.length} scheduled
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Synchronize operational signoffs, audit reviews, and postmortems with Google Calendar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <InHouseButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Schedule Meeting
          </InHouseButton>
          <InHouseButton
            variant="quiet"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadEvents()}
            loading={isLoading}
          >
            Refresh
          </InHouseButton>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Events List */}
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-slate-800/80 overflow-y-auto p-3 space-y-1">
          {isLoading && events.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading events from Google Calendar...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No scheduled calendar events.</div>
          ) : (
            adaptedResources.map(res => (
              <WorkspaceResourceRow
                key={res.id}
                resource={res}
                isSelected={selectedResource?.id === res.id}
                isChecked={checkedResources.some(c => c.id === res.id)}
                onSelect={r => setSelectedResource(r)}
                onToggleCheck={toggleCheck}
                onCreateWorkItem={onCreateWorkItem}
                onAttachEvidence={onAttachEvidence}
                onLinkWorkItem={onLinkWorkItem}
                onNavigateToWorkItem={onNavigateToWorkItem}
              />
            ))
          )}
        </div>

        {/* Selected Event Details Inspector */}
        <div className="hidden md:flex flex-1 flex-col overflow-y-auto p-6 bg-[#090d16]">
          {selectedResource ? (
            <div className="max-w-2xl space-y-6">
              {/* Event Main Card */}
              <div className="p-5 rounded-2xl bg-[#0c101d] border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <WorkspaceSource provider="calendar" kind="event" />
                      <span className="font-mono text-[11px] text-slate-400">{selectedResource.id}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-100">{selectedResource.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {selectedResource.subtitle}
                      </span>
                      {Boolean(selectedResource.metadata?.location) && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {selectedResource.metadata?.location as string}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedResource.provenanceUri && (
                      <a
                        href={selectedResource.provenanceUri}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        title="Open in Google Calendar"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        const raw = events.find(e => e.id === selectedResource.id);
                        if (raw) setEventToDelete(raw);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                      title="Delete event from calendar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <WorkspaceSyncState state="saved" />
                  <WorkspacePermissionState permissions={selectedResource.permissions} showDetails />
                </div>

                {selectedResource.summary && (
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    {selectedResource.summary}
                  </div>
                )}

                {/* Google Meet Action */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">Google Meet Video Bridge Included</span>
                  </div>
                  <a
                    href="https://meet.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs"
                  >
                    Join Call
                  </a>
                </div>

                {/* Linked Work Items */}
                {selectedResource.linkedWorkItems && selectedResource.linkedWorkItems.length > 0 && (
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      <span>Bound Work Item: <strong>{selectedResource.linkedWorkItems[0]}</strong></span>
                    </div>
                    {onSelectWorkItem && (
                      <button
                        onClick={() => onSelectWorkItem(selectedResource.linkedWorkItems![0])}
                        className="text-cyan-400 hover:text-cyan-200 font-semibold underline text-xs cursor-pointer"
                      >
                        View in Work Queue →
                      </button>
                    )}
                  </div>
                )}

                {/* Action Bar */}
                <div className="pt-2 border-t border-slate-800/80">
                  <WorkspaceActionBar
                    resource={selectedResource}
                    size="md"
                    onCreateWorkItem={onCreateWorkItem}
                    onAttachEvidence={onAttachEvidence}
                    onLinkWorkItem={onLinkWorkItem}
                  />
                </div>
              </div>

              {/* Attendees List */}
              {Boolean(selectedResource.metadata?.attendees) && (
                <div className="p-5 rounded-2xl bg-[#0c101d] border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    Confirmed Attendees ({(selectedResource.metadata.attendees as any[]).length})
                  </h3>

                  <div className="space-y-1.5">
                    {(selectedResource.metadata.attendees as any[]).map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-200 font-medium">{a.name}</span>
                          <span className="text-slate-500 font-mono ml-2 text-[11px]">&lt;{a.email}&gt;</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                          {a.responseStatus || 'Invited'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 my-auto">Select a scheduled event to view details</div>
          )}
        </div>
      </div>

      {/* Floating Multi-Select Bulk Actions */}
      <WorkspaceBulkActions
        selectedResources={checkedResources}
        onClearSelection={() => setCheckedResources([])}
        onBatchCreateWork={resources => {
          resources.forEach(r => onCreateWorkItem && onCreateWorkItem(r));
          setCheckedResources([]);
        }}
        onBatchAttachEvidence={resources => {
          resources.forEach(r => onAttachEvidence && onAttachEvidence(r));
          setCheckedResources([]);
        }}
      />

      {/* Schedule Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1424] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Schedule Operational Review Meeting
            </h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Meeting Title</label>
              <input
                type="text"
                placeholder="e.g. KMS Key Rotation Review & Blast Radius Signoff"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Attendee Emails (comma-separated)</label>
              <input
                type="text"
                placeholder="alex.chen@internal, secops@internal"
                value={newAttendees}
                onChange={e => setNewAttendees(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Agenda & Description</label>
              <textarea
                rows={3}
                placeholder="Objective, evidence references, and expected signoff..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <InHouseButton variant="quiet" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </InHouseButton>
              <InHouseButton
                variant="primary"
                size="sm"
                disabled={!newTitle || !newDate || !newTime}
                onClick={() => setShowCreateConfirmation(true)}
              >
                Review & Schedule...
              </InHouseButton>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Creating Meeting */}
      <ConfirmationDialog
        isOpen={showCreateConfirmation}
        title="Schedule Google Calendar Event?"
        description={`Add "${newTitle}" to primary Google Calendar for ${newDate} at ${newTime}.`}
        impactWarning="Invitations and Google Meet link will be dispatched to all listed attendees."
        affectedCount={1}
        affectedItemNames={[newTitle, `Time: ${newDate} ${newTime}`]}
        confirmLabel="Confirm & Add Event"
        cancelLabel="Keep Editing"
        isDestructive={false}
        isLoading={isCreating}
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowCreateConfirmation(false)}
      />

      {/* Confirmation Dialog for Deleting Meeting */}
      <ConfirmationDialog
        isOpen={!!eventToDelete}
        title="Cancel & Delete Calendar Event?"
        description={`You are removing "${eventToDelete?.title}" from Google Calendar.`}
        impactWarning="This cancels the meeting for all attendees and removes the calendar slot."
        affectedCount={1}
        affectedItemNames={eventToDelete ? [eventToDelete.title] : []}
        confirmLabel="Confirm & Delete"
        cancelLabel="Keep Meeting"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};
