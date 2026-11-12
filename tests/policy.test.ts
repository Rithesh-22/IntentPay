import { describe, it, expect, beforeAll } from 'vitest';
import { initializeDatabase, db } from '../server/src/database/db';
import { PolicyEngine } from '../server/src/policies/policyEngine';

describe('Independent Policy Engine Tests', () => {
  beforeAll(() => {
    initializeDatabase();
  });

  it('approves a purchase within single-transaction budget', () => {
    const result = PolicyEngine.evaluate({
      productId: 'prod_kb_01', // $69.00
      userId: 'user_demo_01',
      currency: 'USD'
    });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe('APPROVED_FOR_USER_REVIEW');
    expect(result.verifiedCatalogPriceMinor).toBe(6900);
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.reasons.length).toBe(0);
  });

  it('rejects a purchase that exceeds user single-transaction limit', () => {
    // prod_desk_01 is $480.00, default user policy limit is $250.00
    const result = PolicyEngine.evaluate({
      productId: 'prod_desk_01',
      userId: 'user_demo_01',
      currency: 'USD'
    });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('REJECTED_BY_POLICY');
    expect(result.reasons.some(r => r.includes('exceeds user limit'))).toBe(true);

    const rule4 = result.checkedRules.find(r => r.ruleNumber === 4);
    expect(rule4?.passed).toBe(false);
  });

  it('blocks purchases belonging to restricted categories', () => {
    // prod_crypto_vault_01 is 'crypto_hardware', which is in restrictedCategories
    const result = PolicyEngine.evaluate({
      productId: 'prod_crypto_vault_01',
      userId: 'user_demo_01',
      currency: 'USD'
    });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('REJECTED_BY_POLICY');

    const rule6 = result.checkedRules.find(r => r.ruleNumber === 6);
    expect(rule6?.passed).toBe(false);
    expect(result.reasons.some(r => r.includes('prohibited by security policy'))).toBe(true);
  });

  it('detects and rejects client-tampered pricing', () => {
    // prod_kb_01 authoritative price is 6900 cents ($69). Client claims it is 1000 cents ($10).
    const result = PolicyEngine.evaluate({
      productId: 'prod_kb_01',
      userId: 'user_demo_01',
      clientSuppliedAmountMinor: 1000,
      currency: 'USD'
    });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('REJECTED_BY_POLICY');
    const rule2 = result.checkedRules.find(r => r.ruleNumber === 2);
    expect(rule2?.passed).toBe(false);
    expect(result.reasons.some(r => r.includes('tampering'))).toBe(true);
  });

  it('rejects purchase when currency mismatches catalog product', () => {
    // prod_kb_01 is USD. Request in EUR.
    const result = PolicyEngine.evaluate({
      productId: 'prod_kb_01',
      userId: 'user_demo_01',
      currency: 'EUR'
    });

    expect(result.allowed).toBe(false);
    const rule3 = result.checkedRules.find(r => r.ruleNumber === 3);
    expect(rule3?.passed).toBe(false);
  });

  it('rejects non-existent product ID', () => {
    const result = PolicyEngine.evaluate({
      productId: 'non_existent_sku_9999',
      userId: 'user_demo_01',
      currency: 'USD'
    });

    expect(result.allowed).toBe(false);
    const rule1 = result.checkedRules.find(r => r.ruleNumber === 1);
    expect(rule1?.passed).toBe(false);
  });

  it('always enforces mandatory human approval as an invariant', () => {
    const result = PolicyEngine.evaluate({
      productId: 'prod_kb_01',
      userId: 'user_demo_01',
      currency: 'USD'
    });

    expect(result.requiresHumanApproval).toBe(true);
    const rule7 = result.checkedRules.find(r => r.ruleNumber === 7);
    expect(rule7?.passed).toBe(true);
  });
});
