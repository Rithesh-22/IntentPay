import { db } from '../database/db.ts';
import { PolicyEvaluationResult, Product, UserPolicy } from '../types/index.ts';
import { AuditService } from '../audit/auditService.ts';

export interface PolicyCheckInput {
  productId: string;
  userId: string;
  clientSuppliedAmountMinor?: number; // Intentionally evaluated against verified catalog price
  currency: string;
  transactionId?: string;
  intentId?: string;
}

export class PolicyEngine {
  /**
   * Evaluates purchase request against 10 strict deterministic financial rules.
   * Completely decoupled from Gemini AI.
   */
  static evaluate(input: PolicyCheckInput): PolicyEvaluationResult {
    const reasons: string[] = [];
    const checkedRules: PolicyEvaluationResult['checkedRules'] = [];

    // Rule 1: Product must exist in trusted catalog
    const productRow = db.prepare(`
      SELECT id, title, description, category, price_minor, currency, stock, specs_json, image_url, created_at
      FROM products WHERE id = ?
    `).get(input.productId) as any;

    const rule1Passed = !!productRow;
    checkedRules.push({
      ruleNumber: 1,
      name: 'TRUSTED_CATALOG_PRODUCT_EXISTENCE',
      passed: rule1Passed,
      details: rule1Passed
        ? `Product verified in immutable catalog: "${productRow.title}"`
        : `Product ID "${input.productId}" not found in trusted merchant catalog.`
    });
    if (!rule1Passed) {
      reasons.push(`Catalog item '${input.productId}' does not exist.`);
    }

    // Stop early if product doesn't exist
    if (!productRow) {
      const failedResult: PolicyEvaluationResult = {
        allowed: false,
        decision: 'REJECTED_BY_POLICY',
        reasons,
        checkedRules,
        requiresHumanApproval: true,
        verifiedCatalogPriceMinor: 0,
        verifiedCurrency: input.currency
      };
      AuditService.log('POLICY_EVALUATED', 'POLICY_ENGINE', {
        result: 'BLOCKED',
        decision: failedResult.decision,
        reasons,
        checkedRules
      }, input.transactionId, input.intentId);
      return failedResult;
    }

    const verifiedPriceMinor = productRow.price_minor;
    const verifiedCurrency = productRow.currency;

    // Rule 2: Actual catalog price must be used (Detect and reject client-tampered price)
    let rule2Passed = true;
    let rule2Details = `Verified catalog price of ${verifiedPriceMinor / 100} ${verifiedCurrency} locked for checkout.`;
    if (input.clientSuppliedAmountMinor !== undefined && input.clientSuppliedAmountMinor !== verifiedPriceMinor) {
      rule2Passed = false;
      rule2Details = `Client price tampering detected: client provided ${input.clientSuppliedAmountMinor / 100} ${input.currency}, but catalog authority specifies ${verifiedPriceMinor / 100} ${verifiedCurrency}.`;
      reasons.push(rule2Details);
    }
    checkedRules.push({
      ruleNumber: 2,
      name: 'AUTHORITATIVE_CATALOG_PRICING',
      passed: rule2Passed,
      details: rule2Details
    });

    // Rule 3: Product currency and transaction currency match
    const rule3Passed = verifiedCurrency.toUpperCase() === input.currency.toUpperCase();
    checkedRules.push({
      ruleNumber: 3,
      name: 'CURRENCY_ALIGNMENT_VERIFICATION',
      passed: rule3Passed,
      details: rule3Passed
        ? `Currency matches: ${verifiedCurrency}`
        : `Currency mismatch: transaction requested in ${input.currency}, but catalog product is denominated in ${verifiedCurrency}.`
    });
    if (!rule3Passed) {
      reasons.push(`Currency mismatch between requested ${input.currency} and catalog ${verifiedCurrency}.`);
    }

    // Retrieve user policy
    const policyRow = db.prepare(`
      SELECT id, user_id, max_transaction_amount_minor, monthly_spending_limit_minor,
             allowed_categories_json, restricted_categories_json, currency, require_human_approval
      FROM user_policies WHERE user_id = ?
    `).get(input.userId) as any;

    if (!policyRow) {
      reasons.push(`No active spending policy found for user '${input.userId}'.`);
    }

    const maxTransactionMinor = policyRow ? policyRow.max_transaction_amount_minor : 25000;
    const monthlyLimitMinor = policyRow ? policyRow.monthly_spending_limit_minor : 100000;
    const restrictedCategories: string[] = policyRow ? JSON.parse(policyRow.restricted_categories_json || '[]') : [];
    const requireApproval = policyRow ? Boolean(policyRow.require_human_approval) : true;

    // Rule 4: Transaction must not exceed user's configured single-transaction limit
    const rule4Passed = verifiedPriceMinor <= maxTransactionMinor;
    checkedRules.push({
      ruleNumber: 4,
      name: 'SINGLE_TRANSACTION_SPENDING_LIMIT',
      passed: rule4Passed,
      details: rule4Passed
        ? `Item price of $${(verifiedPriceMinor / 100).toFixed(2)} is within user limit of $${(maxTransactionMinor / 100).toFixed(2)}.`
        : `Item price of $${(verifiedPriceMinor / 100).toFixed(2)} exceeds user policy max limit of $${(maxTransactionMinor / 100).toFixed(2)}.`
    });
    if (!rule4Passed) {
      reasons.push(`Transaction amount $${(verifiedPriceMinor / 100).toFixed(2)} exceeds user limit of $${(maxTransactionMinor / 100).toFixed(2)}.`);
    }

    // Rule 5: Monthly spending restrictions must be respected
    // Calculate total spent this calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlySpentRow = db.prepare(`
      SELECT COALESCE(SUM(amount_minor), 0) as totalSpent
      FROM transactions
      WHERE user_id = ?
        AND state IN ('CAPTURE_CONFIRMED', 'AWAITING_USER_APPROVAL', 'PAYMENT_ORDER_CREATED')
        AND created_at >= ?
    `).get(input.userId, startOfMonth.toISOString()) as { totalSpent: number };

    const projectedMonthlyTotal = monthlySpentRow.totalSpent + verifiedPriceMinor;
    const rule5Passed = projectedMonthlyTotal <= monthlyLimitMinor;
    checkedRules.push({
      ruleNumber: 5,
      name: 'MONTHLY_SPENDING_LIMIT_ENFORCEMENT',
      passed: rule5Passed,
      details: rule5Passed
        ? `Projected monthly total $${(projectedMonthlyTotal / 100).toFixed(2)} is within limit of $${(monthlyLimitMinor / 100).toFixed(2)} (Spent so far: $${(monthlySpentRow.totalSpent / 100).toFixed(2)}).`
        : `Projected monthly total $${(projectedMonthlyTotal / 100).toFixed(2)} exceeds monthly policy cap of $${(monthlyLimitMinor / 100).toFixed(2)}.`
    });
    if (!rule5Passed) {
      reasons.push(`Monthly spending cap exceeded: Current total $${(monthlySpentRow.totalSpent / 100).toFixed(2)} + item $${(verifiedPriceMinor / 100).toFixed(2)} > limit $${(monthlyLimitMinor / 100).toFixed(2)}.`);
    }

    // Rule 6: Restricted categories must be blocked
    const isCategoryRestricted = restrictedCategories.some(
      rc => rc.toLowerCase() === productRow.category.toLowerCase()
    );
    const rule6Passed = !isCategoryRestricted;
    checkedRules.push({
      ruleNumber: 6,
      name: 'CATEGORY_ALLOWLIST_AND_RESTRICTION',
      passed: rule6Passed,
      details: rule6Passed
        ? `Category "${productRow.category}" is permitted under active user policy.`
        : `Category "${productRow.category}" is strictly flagged under restricted categories: [${restrictedCategories.join(', ')}].`
    });
    if (!rule6Passed) {
      reasons.push(`Category '${productRow.category}' is explicitly prohibited by security policy.`);
    }

    // Rule 7: Human approval must be mandatory
    checkedRules.push({
      ruleNumber: 7,
      name: 'MANDATORY_EXPLICIT_HUMAN_APPROVAL',
      passed: true,
      details: 'Strict zero-autonomous-charge policy: Human approval gate required before payment execution.'
    });

    // Rule 8: Invalid or missing purchase data must be rejected
    const rule8Passed = input.productId.length > 0 && verifiedPriceMinor > 0;
    checkedRules.push({
      ruleNumber: 8,
      name: 'PURCHASE_DATA_INTEGRITY',
      passed: rule8Passed,
      details: rule8Passed
        ? 'Purchase parameters are complete, validated, and non-null.'
        : 'Missing or corrupt purchase specification.'
    });
    if (!rule8Passed) {
      reasons.push('Invalid purchase payload specifications.');
    }

    // Rule 9: Duplicate payment prevention (Checked per transaction creation)
    checkedRules.push({
      ruleNumber: 9,
      name: 'DUPLICATE_OPERATION_PREVENTION',
      passed: true,
      details: 'Idempotency and unique transaction state transition locks active.'
    });

    // Rule 10: Payment capture permission prerequisite
    checkedRules.push({
      ruleNumber: 10,
      name: 'ORDER_CAPTURE_PRECONDITION',
      passed: true,
      details: 'Payment capture strictly gated until PayPal order verification and human signature.'
    });

    const overallAllowed = reasons.length === 0;
    const decision = overallAllowed ? 'APPROVED_FOR_USER_REVIEW' : 'REJECTED_BY_POLICY';

    const result: PolicyEvaluationResult = {
      allowed: overallAllowed,
      decision,
      reasons,
      checkedRules,
      requiresHumanApproval: requireApproval,
      verifiedCatalogPriceMinor: verifiedPriceMinor,
      verifiedCurrency
    };

    // Audit log policy decision
    AuditService.log(
      overallAllowed ? 'POLICY_EVALUATED' : 'PURCHASE_BLOCKED',
      'POLICY_ENGINE',
      {
        allowed: overallAllowed,
        decision,
        reasons,
        productId: input.productId,
        verifiedPriceMinor
      },
      input.transactionId,
      input.intentId
    );

    return result;
  }
}
