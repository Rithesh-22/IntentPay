import { Router, Request, Response } from 'express';
import { db } from '../database/db.ts';
import { IntentEngine } from '../ai/intentParser.ts';
import { PolicyEngine } from '../policies/policyEngine.ts';
import { PayPalService } from '../payments/paypalService.ts';
import { AuditService } from '../audit/auditService.ts';
import { Product, UserPolicy } from '../types/index.ts';

export const apiRouter = Router();

// Default user demo ID
const DEFAULT_USER_ID = 'user_demo_01';

// -------------------------------------------------------------
// Catalog Routes
// -------------------------------------------------------------
apiRouter.get('/catalog', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY category, title').all() as any[];
  const products: Product[] = rows.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    priceMinor: r.price_minor,
    currency: r.currency,
    stock: r.stock,
    specs: JSON.parse(r.specs_json || '{}'),
    imageUrl: r.image_url,
    createdAt: r.created_at
  }));
  res.json({ products });
});

apiRouter.get('/catalog/:id', (req: Request, res: Response) => {
  const r = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
  if (!r) {
    return res.status(404).json({ error: 'Product not found in catalog' });
  }
  const product: Product = {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    priceMinor: r.price_minor,
    currency: r.currency,
    stock: r.stock,
    specs: JSON.parse(r.specs_json || '{}'),
    imageUrl: r.image_url,
    createdAt: r.created_at
  };
  res.json({ product });
});

// -------------------------------------------------------------
// AI Purchase Assistant Routes
// -------------------------------------------------------------
apiRouter.post('/assistant/intent', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'A natural language purchase prompt is required.' });
    }

    const intentId = `intent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const parsedIntent = await IntentEngine.parseIntent(prompt, intentId);

    // Save purchase intent to database
    db.prepare(`
      INSERT INTO purchase_intents (
        id, user_id, raw_prompt, parsed_category, requirements_json,
        max_budget_minor, currency, clarification_needed, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      intentId,
      DEFAULT_USER_ID,
      prompt,
      parsedIntent.category,
      JSON.stringify(parsedIntent.requirements),
      Math.round(parsedIntent.maximumBudget * 100),
      parsedIntent.currency,
      parsedIntent.clarificationNeeded || null,
      'PROCESSED'
    );

    // Fetch all catalog products to ground recommendations
    const productRows = db.prepare('SELECT * FROM products').all() as any[];
    const catalog: Product[] = productRows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      priceMinor: r.price_minor,
      currency: r.currency,
      stock: r.stock,
      specs: JSON.parse(r.specs_json || '{}'),
      imageUrl: r.image_url,
      createdAt: r.created_at
    }));

    const recommendations = IntentEngine.rankCatalogProducts(parsedIntent, catalog);

    // Persist recommendations
    const insertRec = db.prepare(`
      INSERT INTO recommendations (
        id, intent_id, product_id, match_score, match_explanation, budget_compatible
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      for (const rec of recommendations.slice(0, 5)) {
        insertRec.run(
          `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          intentId,
          rec.product.id,
          rec.matchScore,
          rec.matchExplanation,
          rec.budgetCompatible ? 1 : 0
        );
      }
    });
    tx();

    AuditService.log('PRODUCT_RECOMMENDED', 'AI_AGENT', {
      intentId,
      recommendedCount: recommendations.length,
      topPick: recommendations[0]?.product.title
    }, undefined, intentId);

    res.json({
      intentId,
      intent: parsedIntent,
      recommendations
    });
  } catch (err: any) {
    console.error('Error processing intent:', err);
    res.status(500).json({ error: err.message || 'Failed to process purchase intent' });
  }
});

// -------------------------------------------------------------
// Spending Policy Settings Routes
// -------------------------------------------------------------
apiRouter.get('/policies', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM user_policies WHERE user_id = ?').get(DEFAULT_USER_ID) as any;
  if (!row) {
    return res.status(404).json({ error: 'User policy not found' });
  }

  const policy: UserPolicy = {
    id: row.id,
    userId: row.user_id,
    maxTransactionAmountMinor: row.max_transaction_amount_minor,
    monthlySpendingLimitMinor: row.monthly_spending_limit_minor,
    allowedCategories: JSON.parse(row.allowed_categories_json || '[]'),
    restrictedCategories: JSON.parse(row.restricted_categories_json || '[]'),
    currency: row.currency,
    requireHumanApproval: Boolean(row.require_human_approval),
    updatedAt: row.updated_at
  };

  res.json({ policy });
});

apiRouter.put('/policies', (req: Request, res: Response) => {
  try {
    const {
      maxTransactionAmountMinor,
      monthlySpendingLimitMinor,
      allowedCategories,
      restrictedCategories,
      currency,
      requireHumanApproval
    } = req.body;

    if (
      typeof maxTransactionAmountMinor !== 'number' ||
      typeof monthlySpendingLimitMinor !== 'number' ||
      maxTransactionAmountMinor <= 0 ||
      monthlySpendingLimitMinor <= 0
    ) {
      return res.status(400).json({ error: 'Transaction and monthly limits must be positive numbers.' });
    }

    if (!Array.isArray(allowedCategories) || !Array.isArray(restrictedCategories)) {
      return res.status(400).json({ error: 'Allowed and restricted categories must be arrays.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE user_policies
      SET max_transaction_amount_minor = ?,
          monthly_spending_limit_minor = ?,
          allowed_categories_json = ?,
          restricted_categories_json = ?,
          currency = ?,
          require_human_approval = ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(
      Math.round(maxTransactionAmountMinor),
      Math.round(monthlySpendingLimitMinor),
      JSON.stringify(allowedCategories),
      JSON.stringify(restrictedCategories),
      currency || 'USD',
      requireHumanApproval ? 1 : 0,
      now,
      DEFAULT_USER_ID
    );

    AuditService.log('POLICY_UPDATED', 'USER', {
      maxTransactionAmountMinor,
      monthlySpendingLimitMinor,
      restrictedCategories
    });

    res.json({ message: 'Spending policies updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update policy' });
  }
});

// -------------------------------------------------------------
// Transaction & Policy Evaluation Routes
// -------------------------------------------------------------
apiRouter.post('/transactions/evaluate', (req: Request, res: Response) => {
  try {
    const { productId, clientSuppliedAmountMinor, currency = 'USD', intentId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const idempotencyKey = `idemp_${transactionId}_${Date.now()}`;

    // 1. Run independent policy engine
    const policyResult = PolicyEngine.evaluate({
      productId,
      userId: DEFAULT_USER_ID,
      clientSuppliedAmountMinor,
      currency,
      transactionId,
      intentId
    });

    const productRow = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    if (!productRow) {
      return res.status(404).json({ error: 'Product does not exist', policyResult });
    }

    const initialAmountMinor = policyResult.verifiedCatalogPriceMinor;
    const initialState = policyResult.allowed ? 'AWAITING_USER_APPROVAL' : 'BLOCKED';

    // 2. Persist transaction
    db.prepare(`
      INSERT INTO transactions (
        id, intent_id, product_id, user_id, amount_minor, currency,
        state, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transactionId,
      intentId || null,
      productId,
      DEFAULT_USER_ID,
      initialAmountMinor,
      policyResult.verifiedCurrency,
      initialState,
      idempotencyKey
    );

    // 3. Persist policy decision
    db.prepare(`
      INSERT INTO policy_decisions (
        id, transaction_id, allowed, decision, reasons_json, checked_rules_json, requires_human_approval
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `pdec_${Date.now()}`,
      transactionId,
      policyResult.allowed ? 1 : 0,
      policyResult.decision,
      JSON.stringify(policyResult.reasons),
      JSON.stringify(policyResult.checkedRules),
      policyResult.requiresHumanApproval ? 1 : 0
    );

    res.json({
      transactionId,
      state: initialState,
      policyResult,
      product: {
        id: productRow.id,
        title: productRow.title,
        description: productRow.description,
        category: productRow.category,
        priceMinor: productRow.price_minor,
        currency: productRow.currency,
        imageUrl: productRow.image_url,
        specs: JSON.parse(productRow.specs_json || '{}')
      }
    });
  } catch (err: any) {
    console.error('Error evaluating transaction policy:', err);
    res.status(500).json({ error: err.message || 'Policy evaluation error' });
  }
});

apiRouter.get('/transactions', (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT t.*, p.title as product_title, p.category as product_category,
           p.image_url as product_image_url
    FROM transactions t
    LEFT JOIN products p ON t.product_id = p.id
    ORDER BY t.created_at DESC
  `).all() as any[];

  const transactions = rows.map(r => ({
    id: r.id,
    intentId: r.intent_id || undefined,
    productId: r.product_id,
    userId: r.user_id,
    amountMinor: r.amount_minor,
    currency: r.currency,
    state: r.state,
    paypalOrderId: r.paypal_order_id || undefined,
    paypalCaptureId: r.paypal_capture_id || undefined,
    approvedAt: r.approved_at || undefined,
    capturedAt: r.captured_at || undefined,
    idempotencyKey: r.idempotency_key,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    product: {
      id: r.product_id,
      title: r.product_title || 'Unknown Product',
      category: r.product_category || 'General',
      imageUrl: r.product_image_url || ''
    }
  }));

  res.json({ transactions });
});

apiRouter.get('/transactions/:id', (req: Request, res: Response) => {
  const r = db.prepare(`
    SELECT t.*, p.title as product_title, p.description as product_description,
           p.category as product_category, p.image_url as product_image_url,
           p.specs_json as product_specs_json
    FROM transactions t
    LEFT JOIN products p ON t.product_id = p.id
    WHERE t.id = ?
  `).get(req.params.id) as any;

  if (!r) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Fetch policy decision
  const pd = db.prepare('SELECT * FROM policy_decisions WHERE transaction_id = ?').get(r.id) as any;

  const transaction = {
    id: r.id,
    intentId: r.intent_id || undefined,
    productId: r.product_id,
    userId: r.user_id,
    amountMinor: r.amount_minor,
    currency: r.currency,
    state: r.state,
    paypalOrderId: r.paypal_order_id || undefined,
    paypalCaptureId: r.paypal_capture_id || undefined,
    approvedAt: r.approved_at || undefined,
    capturedAt: r.captured_at || undefined,
    idempotencyKey: r.idempotency_key,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    product: {
      id: r.product_id,
      title: r.product_title,
      description: r.product_description,
      category: r.product_category,
      imageUrl: r.product_image_url,
      specs: JSON.parse(r.product_specs_json || '{}')
    },
    policyDecision: pd ? {
      allowed: Boolean(pd.allowed),
      decision: pd.decision,
      reasons: JSON.parse(pd.reasons_json || '[]'),
      checkedRules: JSON.parse(pd.checked_rules_json || '[]'),
      requiresHumanApproval: Boolean(pd.requires_human_approval)
    } : undefined
  };

  res.json({ transaction });
});

// -------------------------------------------------------------
// PayPal Payment Routes
// -------------------------------------------------------------
apiRouter.post('/payments/create-order', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    const order = await PayPalService.createOrder(transactionId);
    res.json({ order });
  } catch (err: any) {
    console.error('Error creating PayPal order:', err);
    res.status(500).json({ error: err.message || 'Failed to create PayPal payment order' });
  }
});

apiRouter.post('/payments/capture-order', async (req: Request, res: Response) => {
  try {
    const { transactionId, paypalOrderId } = req.body;
    if (!transactionId || !paypalOrderId) {
      return res.status(400).json({ error: 'Transaction ID and PayPal Order ID are required.' });
    }

    const capture = await PayPalService.captureOrder(transactionId, paypalOrderId);
    res.json({ capture });
  } catch (err: any) {
    console.error('Error capturing PayPal payment:', err);
    res.status(500).json({ error: err.message || 'Payment capture failed' });
  }
});

apiRouter.post('/payments/cancel', (req: Request, res: Response) => {
  try {
    const { transactionId, reason } = req.body;
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    PayPalService.cancelTransaction(transactionId, reason);
    res.json({ message: 'Transaction cancelled successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Cancellation failed' });
  }
});

// -------------------------------------------------------------
// Audit Center & Dashboard Stats
// -------------------------------------------------------------
apiRouter.get('/audit', (req: Request, res: Response) => {
  const events = AuditService.getEvents(100);
  res.json({ events });
});

apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  // Current user policy
  const policyRow = db.prepare('SELECT * FROM user_policies WHERE user_id = ?').get(DEFAULT_USER_ID) as any;

  // Monthly spent calculation
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const spentRow = db.prepare(`
    SELECT COALESCE(SUM(amount_minor), 0) as monthlySpentMinor, COUNT(*) as monthlyTxCount
    FROM transactions
    WHERE user_id = ?
      AND state = 'CAPTURE_CONFIRMED'
      AND created_at >= ?
  `).get(DEFAULT_USER_ID, startOfMonth.toISOString()) as any;

  const totalCapturedRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount_minor), 0) as totalMinor
    FROM transactions
    WHERE user_id = ? AND state = 'CAPTURE_CONFIRMED'
  `).get(DEFAULT_USER_ID) as any;

  const blockedCountRow = db.prepare(`
    SELECT COUNT(*) as count
    FROM transactions
    WHERE user_id = ? AND state = 'BLOCKED'
  `).get(DEFAULT_USER_ID) as any;

  const totalTransactionsCountRow = db.prepare(`
    SELECT COUNT(*) as count
    FROM transactions
    WHERE user_id = ?
  `).get(DEFAULT_USER_ID) as any;

  // Recent 5 transactions
  const recentTransactions = db.prepare(`
    SELECT t.id, t.state, t.amount_minor, t.currency, t.created_at, p.title as product_title
    FROM transactions t
    LEFT JOIN products p ON t.product_id = p.id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
    LIMIT 5
  `).all(DEFAULT_USER_ID);

  const hasPayPalSecrets = !!(
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET &&
    process.env.PAYPAL_CLIENT_ID !== 'sandbox_client_id_placeholder'
  );

  const hasGeminiKey = !!(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );

  res.json({
    spending: {
      maxTransactionAmountMinor: policyRow ? policyRow.max_transaction_amount_minor : 25000,
      monthlySpendingLimitMinor: policyRow ? policyRow.monthly_spending_limit_minor : 100000,
      currentMonthlySpentMinor: spentRow.monthlySpentMinor,
      currency: policyRow ? policyRow.currency : 'USD'
    },
    counts: {
      totalTransactions: totalTransactionsCountRow.count,
      successfulPurchases: totalCapturedRow.count,
      totalVolumeMinor: totalCapturedRow.totalMinor,
      blockedAttempts: blockedCountRow.count
    },
    recentActivity: recentTransactions,
    systemIntegrations: {
      paypalStatus: hasPayPalSecrets ? 'SANDBOX_LIVE_CREDENTIALS' : 'SANDBOX_DEV_VERIFIED',
      geminiStatus: hasGeminiKey ? 'GEMINI_ACTIVE' : 'FALLBACK_READY'
    }
  });
});
