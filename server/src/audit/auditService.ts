import { db } from '../database/db.ts';
import { AuditEvent } from '../types/index.ts';

export class AuditService {
  static log(
    eventType: string,
    actor: AuditEvent['actor'],
    details: Record<string, any>,
    transactionId?: string,
    intentId?: string
  ): AuditEvent {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO audit_events (id, transaction_id, intent_id, event_type, actor, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      transactionId || null,
      intentId || null,
      eventType,
      actor,
      JSON.stringify(details),
      now
    );

    return {
      id,
      transactionId,
      intentId,
      eventType,
      actor,
      details,
      createdAt: now
    };
  }

  static getEvents(limit = 100): AuditEvent[] {
    const rows = db.prepare(`
      SELECT id, transaction_id as transactionId, intent_id as intentId,
             event_type as eventType, actor, details_json as detailsJson,
             created_at as createdAt
      FROM audit_events
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as Array<{
      id: string;
      transactionId: string | null;
      intentId: string | null;
      eventType: string;
      actor: AuditEvent['actor'];
      detailsJson: string;
      createdAt: string;
    }>;

    return rows.map(r => ({
      id: r.id,
      transactionId: r.transactionId || undefined,
      intentId: r.intentId || undefined,
      eventType: r.eventType,
      actor: r.actor,
      details: JSON.parse(r.detailsJson || '{}'),
      createdAt: r.createdAt
    }));
  }

  static getEventsByTransaction(transactionId: string): AuditEvent[] {
    const rows = db.prepare(`
      SELECT id, transaction_id as transactionId, intent_id as intentId,
             event_type as eventType, actor, details_json as detailsJson,
             created_at as createdAt
      FROM audit_events
      WHERE transaction_id = ?
      ORDER BY created_at ASC
    `).all(transactionId) as Array<{
      id: string;
      transactionId: string | null;
      intentId: string | null;
      eventType: string;
      actor: AuditEvent['actor'];
      detailsJson: string;
      createdAt: string;
    }>;

    return rows.map(r => ({
      id: r.id,
      transactionId: r.transactionId || undefined,
      intentId: r.intentId || undefined,
      eventType: r.eventType,
      actor: r.actor,
      details: JSON.parse(r.detailsJson || '{}'),
      createdAt: r.createdAt
    }));
  }
}
