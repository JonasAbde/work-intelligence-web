import { TelemetryEvent, WorkspaceProvider } from './workspaceResource';

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private listeners: Array<(events: TelemetryEvent[]) => void> = [];

  public record(
    type: TelemetryEvent['type'],
    payload?: {
      durationMs?: number;
      provider?: WorkspaceProvider;
      resourceId?: string;
      details?: Record<string, unknown>;
    },
  ): void {
    const event: TelemetryEvent = {
      id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      type,
      durationMs: payload?.durationMs,
      provider: payload?.provider,
      resourceId: payload?.resourceId,
      // Details are intentionally dropped from the in-browser telemetry store.
      // Provider payloads, search queries and resource content can contain user data.
      details: undefined,
    };

    this.events.unshift(event);
    if (this.events.length > 200) this.events = this.events.slice(0, 200);
    this.notify();
  }

  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  public subscribe(listener: (events: TelemetryEvent[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getEvents());
    return () => {
      this.listeners = this.listeners.filter(current => current !== listener);
    };
  }

  private notify(): void {
    const current = this.getEvents();
    this.listeners.forEach(listener => listener(current));
  }

  public getSummary() {
    const totalEvents = this.events.length;
    const workCreated = this.events.filter(event => event.type === 'work_item_created').length;
    const evidenceAttached = this.events.filter(event => event.type === 'evidence_attached').length;
    const undoneActions = this.events.filter(event => event.type === 'action_undone').length;
    const failedActions = this.events.filter(event => event.type === 'action_failed').length;
    const retries = this.events.filter(event => event.type === 'action_retried').length;
    const pickerOpened = this.events.filter(event => event.type === 'picker_opened').length;
    const pickerSelected = this.events.filter(event => event.type === 'picker_selected').length;
    const pickerAbandoned = this.events.filter(event => event.type === 'picker_abandoned').length;

    const resourceTimes = this.events
      .filter(event => event.type === 'time_to_resource' && event.durationMs !== undefined)
      .map(event => event.durationMs as number);
    const decisionTimes = this.events
      .filter(event => event.type === 'time_to_decision' && event.durationMs !== undefined)
      .map(event => event.durationMs as number);

    return {
      totalEvents,
      workCreated,
      evidenceAttached,
      undoneActions,
      failedActions,
      retries,
      pickerOpened,
      pickerSelected,
      pickerAbandoned,
      avgResourceTimeMs: resourceTimes.length
        ? Math.round(resourceTimes.reduce((sum, value) => sum + value, 0) / resourceTimes.length)
        : null,
      avgDecisionTimeMs: decisionTimes.length
        ? Math.round(decisionTimes.reduce((sum, value) => sum + value, 0) / decisionTimes.length)
        : null,
      undoRate: workCreated + evidenceAttached > 0
        ? undoneActions / (workCreated + evidenceAttached)
        : null,
      pickerConversion: pickerOpened > 0
        ? Math.round((pickerSelected / pickerOpened) * 100)
        : null,
    };
  }

  public clear(): void {
    this.events = [];
    this.notify();
  }
}

export const telemetry = new TelemetryService();
