# IntentPay — System Architecture

## 1. Architectural Philosophy

IntentPay is built around the governing principle:
> **"AI recommends. Policy enforces. Humans authorize. PayPal executes."**

In traditional agentic commerce prototypes, developers often grant language models direct tool-calling authority over financial APIs. This pattern introduces critical security, non-repudiation, and financial vulnerabilities—including prompt injection attacks, budget evasion, and hallucinated discounts.

IntentPay decouples financial authority from machine learning inference through four isolated stages:

```mermaid
flowchart TD
    User([User Prompt: 'Mechanical keyboard for coding < $70']) --> Stage1[Stage 1: Gemini 3.8 Flash Intent Parser]
    Stage1 --> ParsedIntent[Structured Intent: Category, Requirements, Budget, Currency]
    ParsedIntent --> CatalogSearch[(Authoritative Merchant Catalog)]
    CatalogSearch --> Stage2[Stage 2: Deterministic 10-Rule Policy Engine]
    
    subgraph PolicyEngine[Backend Policy Gate - Completely Decoupled from AI]
        Rule1[Rule 1: Catalog Product Exists]
        Rule2[Rule 2: Locked Catalog Price]
        Rule3[Rule 3: Currency Alignment]
        Rule4[Rule 4: Single-Tx Spending Cap]
        Rule5[Rule 5: Monthly Aggregated Limit]
        Rule6[Rule 6: Category Allowlist/Restricted]
        Rule7[Rule 7: Mandatory Human Gate]
        Rule8[Rule 8: Payload Non-Null Integrity]
        Rule9[Rule 9: Idempotency Lock]
        Rule10[Rule 10: Pre-Capture Sign-off]
    end
    
    Stage2 --> PolicyEngine
    PolicyEngine -->|Violations Found| Blocked[State: BLOCKED - Transaction Terminated]
    PolicyEngine -->|Passed| Stage3[Stage 3: Explicit Human Review Console]
    
    Stage3 -->|User Approves| Stage4[Stage 4: Server-Side PayPal Orders REST API]
    Stage3 -->|User Cancels| Cancelled[State: CANCELLED]
    
    Stage4 --> PayPalSandbox[(PayPal Developer Sandbox Gateway)]
    PayPalSandbox --> CaptureCheck{Verify Capture Response}
    CaptureCheck -->|Amount & Status Confirmed| Confirmed[State: CAPTURE_CONFIRMED]
    CaptureCheck -->|Mismatch or Decline| Failed[State: FAILED]
    
    Confirmed --> AuditLog[(Immutable SQLite Audit Ledger)]
    Blocked --> AuditLog
    Failed --> AuditLog
```

---

## 2. Component Taxonomy

### A. Intent Intelligence Engine (`server/src/ai/intentParser.ts`)
- **Model**: `gemini-3.8-flash` via `@google/genai` TypeScript SDK.
- **Header**: `User-Agent: 'aistudio-build'`
- **Validation**: Strict Zod schema enforcing typing on `category`, `requirements`, `maximumBudget`, `currency`, and `clarificationNeeded`.
- **Constraint**: Zero write permissions to payment credentials or transaction states.
- **Fail-safe**: Deterministic semantic fallback parser when API keys are absent or offline.

### B. Independent Policy Engine (`server/src/policies/policyEngine.ts`)
- Evaluates 10 hard deterministic rules without calling external LLMs.
- Queries SQLite directly for user limits, monthly totals, and category restrictions.
- Overrides any client-submitted pricing with authoritative `price_minor` from the catalog.

### C. PayPal REST Integration (`server/src/payments/paypalService.ts`)
- Direct integration with PayPal REST Orders API v2 (`/v2/checkout/orders` and `/v2/checkout/orders/{id}/capture`).
- Server-authoritative amount calculation.
- Duplicate capture prevention using strict idempotency checks and state transitions.

### D. Transaction State Machine
Transitions are forward-only:
1. `REQUEST_RECEIVED`
2. `INTENT_PARSED`
3. `PRODUCT_SELECTED`
4. `POLICY_EVALUATED`
5. `AWAITING_USER_APPROVAL`
6. `PAYMENT_ORDER_CREATED`
7. `CAPTURE_REQUESTED`
8. `CAPTURE_CONFIRMED`
*(Terminal exceptions: `BLOCKED`, `CANCELLED`, `FAILED`)*

### E. Database Layer (`server/src/database/db.ts`)
- SQLite with `better-sqlite3` and Write-Ahead Logging (`WAL`).
- All financial balances stored in integer minor units (cents).
- Foreign key cascading and indexed audit tables.
