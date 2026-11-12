# IntentPay — Evaluation & Test Report

## 1. Evaluation Methodology

IntentPay was evaluated across three core engineering vectors:
1. **Financial Policy Determinism**: Verifying that the 10-rule policy engine blocks violations and authorizes valid requests without false positives or false negatives.
2. **AI Intent Accuracy & Grounding**: Ensuring natural language shopping prompts are correctly parsed, grounded strictly in actual catalog items, and resistant to adversarial jailbreaks.
3. **PayPal Sandbox Settlement & Idempotency**: Testing the complete REST Orders API workflow, server-side capture verification, and duplicate operation prevention.

---

## 2. Automated Test Suite Metrics

Automated tests are executed using Vitest.

### Test Matrix Breakdown:

| Test Suite | File | Tests | Status | Key Coverage |
| :--- | :--- | :---: | :---: | :--- |
| **Independent Policy Engine** | `tests/policy.test.ts` | 7 | **PASS** | Budget limits, price authority, restricted categories, tampering, currency checks |
| **AI Intent & Catalog Grounding** | `tests/ai.test.ts` | 5 | **PASS** | Zod schema validation, prompt injection resistance, ambiguous queries, catalog ranking |
| **PayPal REST Settlement** | `tests/payments.test.ts` | 5 | **PASS** | Order creation, capture confirmation, duplicate capture rejection, state transitions |
| **Total Automated Tests** | **3 Suites** | **17 Tests** | **100% PASS** | Zero regressions across critical financial pathways |

---

## 3. Policy Rule Verification Invariants

| Rule # | Invariant Tested | Verified Behavior |
| :---: | :--- | :--- |
| **01** | `TRUSTED_CATALOG_PRODUCT_EXISTENCE` | Blocked immediately if SKU does not exist in SQLite catalog table. |
| **02** | `AUTHORITATIVE_CATALOG_PRICING` | Discards client-tampered price; locks true catalog price. |
| **03** | `CURRENCY_ALIGNMENT_VERIFICATION` | Blocks transaction if currency mismatches product base currency. |
| **04** | `SINGLE_TRANSACTION_SPENDING_LIMIT` | Blocks any item priced above configured user threshold (e.g. $250.00). |
| **05** | `MONTHLY_SPENDING_LIMIT_ENFORCEMENT` | Computes calendar-month aggregate and blocks purchases that would breach cap. |
| **06** | `CATEGORY_ALLOWLIST_AND_RESTRICTION` | Prevents checkout of prohibited categories (e.g., crypto hardware, gambling). |
| **07** | `MANDATORY_EXPLICIT_HUMAN_APPROVAL` | Enforces human approval gate; no autonomous charges permitted. |
| **08** | `PURCHASE_DATA_INTEGRITY` | Validates non-null, non-negative numerical invariants. |
| **09** | `DUPLICATE_OPERATION_PREVENTION` | Rejects duplicate captures using unique idempotency keys. |
| **10** | `ORDER_CAPTURE_PRECONDITION` | Blocks capture requests unless order is in verified created state. |
