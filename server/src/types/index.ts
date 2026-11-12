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
  priceMinor: number; // e.g. 6900 for $69.00
  currency: string;   // e.g. 'USD'
  stock: number;
  specs: Record<string, string | number | boolean>;
  imageUrl: string;
  createdAt: string;
}

export interface UserPolicy {
  id: string;
  userId: string;
  maxTransactionAmountMinor: number; // e.g. 20000 ($200.00)
  monthlySpendingLimitMinor: number;   // e.g. 80000 ($800.00)
  allowedCategories: string[];
  restrictedCategories: string[];
  currency: string;
  requireHumanApproval: boolean;
  updatedAt: string;
}

export interface ParsedIntent {
  category: string;
  requirements: string[];
  maximumBudget: number; // In major units (e.g. 70 or 2000)
  currency: string;      // 'USD', 'INR', etc.
  clarificationNeeded?: string;
  rawPrompt: string;
}

export interface ProductRecommendation {
  product: Product;
  matchScore: number; // 0 - 100
  matchExplanation: string;
  budgetCompatible: boolean;
  requirementAlignment: {
    matched: string[];
    unmatched: string[];
  };
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  decision: 'APPROVED_FOR_USER_REVIEW' | 'REJECTED_BY_POLICY';
  reasons: string[];
  checkedRules: Array<{
    ruleNumber: number;
    name: string;
    passed: boolean;
    details: string;
  }>;
  requiresHumanApproval: boolean;
  verifiedCatalogPriceMinor: number;
  verifiedCurrency: string;
}

export interface Transaction {
  id: string;
  intentId?: string;
  productId: string;
  product?: Product;
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
