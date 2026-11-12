import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  CreditCard,
  User,
  Cpu,
  RefreshCw,
  Code
} from 'lucide-react';
import { api } from '../services/api';
import { AuditEvent } from '../types';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAuditEvents();
      setEvents(res.events);
      if (res.events.length > 0 && !selectedEvent) {
        setSelectedEvent(res.events[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit events');
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter((ev) => {
    const matchesActor = actorFilter === 'ALL' || ev.actor === actorFilter;
    const matchesSearch =
      ev.eventType.toLowerCase().includes(search.toLowerCase()) ||
      (ev.transactionId && ev.transactionId.toLowerCase().includes(search.toLowerCase())) ||
      JSON.stringify(ev.details).toLowerCase().includes(search.toLowerCase());
    return matchesActor && matchesSearch;
  });

  const getActorBadge = (actor: AuditEvent['actor']) => {
    switch (actor) {
      case 'AI_AGENT':
        return <span className="text-[#C7F36B] font-mono">AI_AGENT</span>;
      case 'POLICY_ENGINE':
        return <span className="text-[#D8A85B] font-mono">POLICY_ENGINE</span>;
      case 'PAYPAL_GATEWAY':
        return <span className="text-[#4EAA79] font-mono">PAYPAL_GATEWAY</span>;
      case 'USER':
        return <span className="text-[#F0F0E9] font-mono">USER</span>;
      default:
        return <span className="text-[#A4AA9A] font-mono">{actor}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#343A30]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#C7F36B]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Immutable Security Chronicle</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F0F0E9] mt-1">Security &amp; Audit Center</h1>
          <p className="text-sm text-[#A4AA9A] mt-1">
            Chronological cryptographic event trail verifying all AI inferences, policy verdicts, user consents, and PayPal settlements.
          </p>
        </div>

        <button
          type="button"
          onClick={loadEvents}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-[#A4AA9A] hover:text-[#F0F0E9] bg-[#20241E] border border-[#343A30] rounded transition-colors self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stream</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#20241E] border border-[#D95D5D]/50 text-xs text-[#D95D5D]">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#A4AA9A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by event type or transaction..."
            className="w-full pl-9 pr-4 py-2 bg-[#20241E] border border-[#343A30] rounded text-xs text-[#F0F0E9] placeholder-[#A4AA9A]/50 focus:outline-none focus:border-[#C7F36B]"
          />
        </div>

        {/* Actor Filter segmented controls */}
        <div className="flex items-center gap-1 p-1 bg-[#20241E] border border-[#343A30] rounded overflow-x-auto">
          {['ALL', 'AI_AGENT', 'POLICY_ENGINE', 'USER', 'PAYPAL_GATEWAY'].map((act) => (
            <button
              key={act}
              onClick={() => setActorFilter(act)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                actorFilter === act
                  ? 'bg-[#272C23] text-[#C7F36B] font-semibold border border-[#343A30]'
                  : 'text-[#A4AA9A] hover:text-[#F0F0E9]'
              }`}
            >
              {act === 'ALL' ? 'All Actors' : act}
            </button>
          ))}
        </div>
      </div>

      {/* Split Audit List and Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Event List */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="h-64 rounded bg-[#20241E] animate-pulse" />
          ) : filtered.length > 0 ? (
            <div className="border border-[#343A30] rounded bg-[#20241E] divide-y divide-[#343A30]/50 max-h-[640px] overflow-y-auto">
              {filtered.map((ev) => {
                const isSelected = selectedEvent?.id === ev.id;
                const isPolicyBlock = ev.eventType === 'PURCHASE_BLOCKED';
                const isSuccess = ev.eventType === 'PAYMENT_CAPTURED' || ev.eventType === 'POLICY_EVALUATED';

                return (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`w-full p-4 text-left transition-colors flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-[#272C23]' : 'hover:bg-[#272C23]/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {getActorBadge(ev.actor)}
                        <span className="text-[#A4AA9A]">·</span>
                        <span className="font-mono text-[#F0F0E9] font-medium">{ev.eventType}</span>
                      </div>
                      <p className="text-xs text-[#A4AA9A] line-clamp-1">
                        {ev.transactionId ? `Tx: ${ev.transactionId}` : ev.intentId ? `Intent: ${ev.intentId}` : 'System operation'}
                      </p>
                    </div>

                    <div className="text-right text-[11px] font-mono text-[#A4AA9A] shrink-0">
                      <div>{new Date(ev.createdAt).toLocaleTimeString()}</div>
                      <div>{new Date(ev.createdAt).toLocaleDateString()}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-10 rounded bg-[#20241E] border border-[#343A30] text-center text-xs text-[#A4AA9A]">
              No audit events found matching the criteria.
            </div>
          )}
        </div>

        {/* Selected Event JSON Inspector */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 p-6 rounded bg-[#181B16] border border-[#343A30] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#343A30]/60">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#C7F36B]" />
                <h3 className="text-sm font-semibold text-[#F0F0E9]">Event Telemetry Inspector</h3>
              </div>
              <span className="text-[11px] font-mono text-[#A4AA9A]">Structured Payload</span>
            </div>

            {selectedEvent ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[#A4AA9A]">Event ID:</span>
                    <p className="text-[#F0F0E9] truncate mt-0.5">{selectedEvent.id}</p>
                  </div>
                  <div>
                    <span className="text-[#A4AA9A]">Actor Authority:</span>
                    <p className="text-[#C7F36B] mt-0.5">{selectedEvent.actor}</p>
                  </div>
                  <div>
                    <span className="text-[#A4AA9A]">Timestamp:</span>
                    <p className="text-[#F0F0E9] mt-0.5">{new Date(selectedEvent.createdAt).toISOString()}</p>
                  </div>
                  <div>
                    <span className="text-[#A4AA9A]">Related Tx ID:</span>
                    <p className="text-[#D8A85B] truncate mt-0.5">{selectedEvent.transactionId || 'None'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#A4AA9A] font-semibold">Structured Audit Metadata:</span>
                  <pre className="p-4 rounded bg-[#111310] border border-[#343A30] text-[11px] font-mono text-[#F0F0E9] overflow-x-auto max-h-80">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#A4AA9A]">
                Select an audit event from the stream to view raw cryptographic parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
