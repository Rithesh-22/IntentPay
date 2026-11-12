import {
  Product,
  UserPolicy,
  ParsedIntent,
  ProductRecommendation,
  PolicyEvaluationResult,
  Transaction,
  AuditEvent,
  DashboardStats
} from '../types';

export const api = {
  // Catalog
  async getCatalog(): Promise<{ products: Product[] }> {
    const res = await fetch('/api/catalog');
    if (!res.ok) throw new Error('Failed to fetch catalog');
    return res.json();
  },

  async getProduct(id: string): Promise<{ product: Product }> {
    const res = await fetch(`/api/catalog/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  // Assistant
  async parseIntent(prompt: string): Promise<{
    intentId: string;
    intent: ParsedIntent;
    recommendations: ProductRecommendation[];
  }> {
    const res = await fetch('/api/assistant/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to process purchase intent');
    }
    return res.json();
  },

  // Policies
  async getPolicy(): Promise<{ policy: UserPolicy }> {
    const res = await fetch('/api/policies');
    if (!res.ok) throw new Error('Failed to load user policy');
    return res.json();
  },

  async updatePolicy(policy: Partial<UserPolicy>): Promise<{ message: string }> {
    const res = await fetch('/api/policies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update spending policy');
    }
    return res.json();
  },

  // Transactions & Evaluation
  async evaluateTransaction(payload: {
    productId: string;
    clientSuppliedAmountMinor?: number;
    currency?: string;
    intentId?: string;
  }): Promise<{
    transactionId: string;
    state: string;
    policyResult: PolicyEvaluationResult;
    product: Product;
  }> {
    const res = await fetch('/api/transactions/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Transaction policy evaluation failed');
    }
    return res.json();
  },

  async getTransactions(): Promise<{ transactions: Transaction[] }> {
    const res = await fetch('/api/transactions');
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async getTransaction(id: string): Promise<{ transaction: Transaction }> {
    const res = await fetch(`/api/transactions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch transaction details');
    return res.json();
  },

  // PayPal Sandbox Payments
  async createPayPalOrder(transactionId: string): Promise<{
    order: {
      id: string;
      status: string;
      approvalUrl?: string;
      amount: { currencyCode: string; value: string };
      isMockedEnvironment?: boolean;
    };
  }> {
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create PayPal payment order');
    }
    return res.json();
  },

  async capturePayPalOrder(transactionId: string, paypalOrderId: string): Promise<{
    capture: {
      id: string;
      status: string;
      amount: { currencyCode: string; value: string };
      isMockedEnvironment?: boolean;
    };
  }> {
    const res = await fetch('/api/payments/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, paypalOrderId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'PayPal capture failed');
    }
    return res.json();
  },

  async cancelTransaction(transactionId: string, reason?: string): Promise<{ message: string }> {
    const res = await fetch('/api/payments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to cancel transaction');
    }
    return res.json();
  },

  // Audit Center
  async getAuditEvents(): Promise<{ events: AuditEvent[] }> {
    const res = await fetch('/api/audit');
    if (!res.ok) throw new Error('Failed to load audit events');
    return res.json();
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) throw new Error('Failed to load dashboard statistics');
    return res.json();
  }
};
