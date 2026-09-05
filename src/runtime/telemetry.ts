import { TelemetryEvent, WorkspaceProvider } from './workspaceResource';

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private listeners: Array<(events: TelemetryEvent[]) => void> = [];

  constructor() {
    // Seed initial baseline telemetry for demonstration & verification
    this.record('time_to_resource', { durationMs: 240, provider: 'drive' });
    this.record('search_performed', { durationMs: 45, details: { query: 'invoice' } });
  }

  public record(
    type: TelemetryEvent['type'],
    payload?: {
      durationMs?: number;
      provider?: WorkspaceProvider;
      resourceId?: string;
      details?: Record<string, unknown>;
    }
  ): void {
    const event: TelemetryEvent = {
      id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      durationMs: payload?.durationMs,
      provider: payload?.provider,
      resourceId: payload?.resourceId,
      details: payload?.details,
    };

    this.events.unshift(event);
    if (this.events.length > 200) {
      this.events = this.events.slice(0, 200);
    }
    this.notify();
  }

  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  public subscribe(listener: (events: TelemetryEvent[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getEvents());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const current = this.getEvents();
    this.listeners.forEach(l => l(current));
  }

  public getSummary() {
    const totalEvents = this.events.length;
    const workCreated = this.events.filter(e => e.type === 'work_item_created').length;
    const evidenceAttached = this.events.filter(e => e.type === 'evidence_attached').length;
    const undoneActions = this.events.filter(e => e.type === 'action_undone').length;
    const failedActions = this.events.filter(e => e.type === 'action_failed').length;
    const retries = this.events.filter(e => e.type === 'action_retried').length;
    const pickerOpened = this.events.filter(e => e.type === 'picker_opened').length;
    const pickerSelected = this.events.filter(e => e.type === 'picker_selected').length;
    const pickerAbandoned = this.events.filter(e => e.type === 'picker_abandoned').length;

    const resourceTimes = this.events
      .filter(e => e.type === 'time_to_resource' && e.durationMs !== undefined)
      .map(e => e.durationMs as number);
    const avgResourceTime = resourceTimes.length > 0
      ? Math.round(resourceTimes.reduce((a, b) => a + b, 0) / resourceTimes.length)
      : 180;

    const decisionTimes = this.events
      .filter(e => e.type === 'time_to_decision' && e.durationMs !== undefined)
      .map(e => e.durationMs as number);
    const avgDecisionTime = decisionTimes.length > 0
      ? Math.round(decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length)
      : 840;

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
      avgResourceTimeMs: avgResourceTime,
      avgDecisionTimeMs: avgDecisionTime,
      undoRate: totalEvents > 0 ? (undoneActions / Math.max(1, workCreated + evidenceAttached)) : 0,
      pickerConversion: pickerOpened > 0 ? Math.round((pickerSelected / pickerOpened) * 100) : 100,
    };
  }

  public clear(): void {
    this.events = [];
    this.notify();
  }
}

export const telemetry = new TelemetryService();
