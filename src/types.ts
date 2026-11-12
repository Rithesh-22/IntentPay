export type TransactionState =
  | 'REQUEST_RECEIVED'
  | 'INTENT_PARSED'
  | 'PRODUCT_SELECTED'
  | 'POLICY_EVALUATED'
  | 'AWAITING_USER_APPROVAL'
  | 'PAYMENT_ORDER_CREATED'
  | 'CAPTURE_REQUESTED'
  | 'CAPTURE_CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'BLOCKED';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  priceMinor: number;
  currency: string;
  stock: number;
  specs: Record<string, any>;
  imageUrl: string;
  createdAt: string;
}

export interface UserPolicy {
  id: string;
  userId: string;
  maxTransactionAmountMinor: number;
  monthlySpendingLimitMinor: number;
  allowedCategories: string[];
  restrictedCategories: string[];
  currency: string;
  requireHumanApproval: boolean;
  updatedAt: string;
}

export interface ParsedIntent {
  category: string;
  requirements: string[];
  maximumBudget: number;
  currency: string;
  clarificationNeeded?: string;
  rawPrompt: string;
}

export interface ProductRecommendation {
  product: Product;
  matchScore: number;
  matchExplanation: string;
  budgetCompatible: boolean;
  requirementAlignment: {
    matched: string[];
    unmatched: string[];
  };
}

export interface PolicyRuleCheck {
  ruleNumber: number;
  name: string;
  passed: boolean;
  details: string;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  decision: 'APPROVED_FOR_USER_REVIEW' | 'REJECTED_BY_POLICY';
  reasons: string[];
  checkedRules: PolicyRuleCheck[];
  requiresHumanApproval: boolean;
  verifiedCatalogPriceMinor: number;
  verifiedCurrency: string;
}

export interface Transaction {
  id: string;
  intentId?: string;
  productId: string;
  userId: string;
  amountMinor: number;
  currency: string;
  state: TransactionState;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  approvedAt?: string;
  capturedAt?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    title: string;
    description?: string;
    category: string;
    imageUrl: string;
    specs?: Record<string, any>;
  };
  policyDecision?: PolicyEvaluationResult;
}

export interface AuditEvent {
  id: string;
  transactionId?: string;
  intentId?: string;
  eventType: string;
  actor: 'USER' | 'AI_AGENT' | 'POLICY_ENGINE' | 'PAYPAL_GATEWAY' | 'SYSTEM';
  details: Record<string, any>;
  createdAt: string;
}

export interface DashboardStats {
  spending: {
    maxTransactionAmountMinor: number;
    monthlySpendingLimitMinor: number;
    currentMonthlySpentMinor: number;
    currency: string;
  };
  counts: {
    totalTransactions: number;
    successfulPurchases: number;
    totalVolumeMinor: number;
    blockedAttempts: number;
  };
  recentActivity: Array<{
    id: string;
    state: TransactionState;
    amount_minor: number;
    currency: string;
    created_at: string;
    product_title: string;
  }>;
  systemIntegrations: {
    paypalStatus: string;
    geminiStatus: string;
  };
}
