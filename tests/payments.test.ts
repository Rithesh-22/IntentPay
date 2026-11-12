import { describe, it, expect, beforeAll } from 'vitest';
import { initializeDatabase, db } from '../server/src/database/db';
import { PolicyEngine } from '../server/src/policies/policyEngine';
import { PayPalService } from '../server/src/payments/paypalService';

describe('PayPal REST Orders API & State Machine Tests', () => {
  beforeAll(() => {
    initializeDatabase();
  });

  it('creates an authoritative PayPal order for an approved transaction', async () => {
    // 1. Evaluate transaction
    const txId = `tx_test_${Date.now()}`;
    const idempKey = `idemp_${txId}`;

    db.prepare(`
      INSERT INTO transactions (
        id, product_id, user_id, amount_minor, currency, state, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(txId, 'prod_kb_01', 'user_demo_01', 6900, 'USD', 'AWAITING_USER_APPROVAL', idempKey);

    // 2. Create PayPal order
    const orderRes = await PayPalService.createOrder(txId);

    expect(orderRes.id).toBeDefined();
    expect(orderRes.amount.value).toBe('69.00');
    expect(orderRes.amount.currencyCode).toBe('USD');

    // 3. Verify database state updated
    const updatedTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any;
    expect(updatedTx.state).toBe('PAYMENT_ORDER_CREATED');
    expect(updatedTx.paypal_order_id).toBe(orderRes.id);
  });

  it('captures an approved PayPal order and marks transaction as CAPTURE_CONFIRMED', async () => {
    const txId = `tx_cap_test_${Date.now()}`;
    const idempKey = `idemp_${txId}`;

    db.prepare(`
      INSERT INTO transactions (
        id, product_id, user_id, amount_minor, currency, state, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(txId, 'prod_kb_01', 'user_demo_01', 6900, 'USD', 'AWAITING_USER_APPROVAL', idempKey);

    const orderRes = await PayPalService.createOrder(txId);
    const captureRes = await PayPalService.captureOrder(txId, orderRes.id);

    expect(captureRes.status).toBe('COMPLETED');
    expect(captureRes.id).toBeDefined();

    const confirmedTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any;
    expect(confirmedTx.state).toBe('CAPTURE_CONFIRMED');
    expect(confirmedTx.paypal_capture_id).toBe(captureRes.id);
    expect(confirmedTx.captured_at).toBeDefined();
  });

  it('strictly blocks duplicate capture operations on already captured orders', async () => {
    const txId = `tx_dup_test_${Date.now()}`;
    const idempKey = `idemp_${txId}`;

    db.prepare(`
      INSERT INTO transactions (
        id, product_id, user_id, amount_minor, currency, state, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(txId, 'prod_kb_01', 'user_demo_01', 6900, 'USD', 'AWAITING_USER_APPROVAL', idempKey);

    const orderRes = await PayPalService.createOrder(txId);
    await PayPalService.captureOrder(txId, orderRes.id);

    // Attempt second capture on same transaction
    await expect(PayPalService.captureOrder(txId, orderRes.id)).rejects.toThrow(/Duplicate capture/);
  });

  it('refuses order creation on blocked or invalid transactions', async () => {
    const blockedTxId = `tx_blocked_${Date.now()}`;
    db.prepare(`
      INSERT INTO transactions (
        id, product_id, user_id, amount_minor, currency, state, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(blockedTxId, 'prod_desk_01', 'user_demo_01', 48000, 'USD', 'BLOCKED', `idemp_${blockedTxId}`);

    await expect(PayPalService.createOrder(blockedTxId)).rejects.toThrow(/Invalid transaction state/);
  });

  it('allows user to cancel an uncaptured transaction and transitions state to CANCELLED', () => {
    const cancelTxId = `tx_cancel_${Date.now()}`;
    db.prepare(`
      INSERT INTO transactions (
        id, product_id, user_id, amount_minor, currency, state, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(cancelTxId, 'prod_kb_01', 'user_demo_01', 6900, 'USD', 'AWAITING_USER_APPROVAL', `idemp_${cancelTxId}`);

    PayPalService.cancelTransaction(cancelTxId, 'User altered mind');

    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(cancelTxId) as any;
    expect(tx.state).toBe('CANCELLED');
  });
});
