# IntentPay — AI-Powered Agentic Commerce

**AI recommends. Policy enforces. Humans authorize. PayPal executes.**

IntentPay is an AI-powered agentic commerce platform that transforms natural-language shopping requests into controlled, transparent, and human-approved transactions.

It combines Google Gemini for understanding purchase intent, a deterministic policy engine for enforcing spending rules, and PayPal Sandbox for payment execution.

The goal is to make AI-assisted purchasing more responsible by ensuring that intelligent recommendations never bypass spending limits, policy restrictions, or user authorization.

---

## The Problem

Traditional AI shopping assistants can recommend products, but autonomous purchasing introduces important risks:

- AI-generated product or price information may be inaccurate.
- Purchases may exceed a user's spending limits.
- Restricted product categories may be recommended.
- Payments could be initiated without meaningful user authorization.
- Transaction decisions may lack transparency and traceability.

IntentPay addresses these challenges through an independent policy enforcement layer and mandatory human approval.

## Our Solution

IntentPay introduces a policy-controlled purchasing workflow:

1. **Understand intent:** Users describe what they want in natural language.
2. **AI-powered interpretation:** Google Gemini extracts relevant purchase requirements.
3. **Verified product selection:** Recommendations are matched against the application's product catalog.
4. **Policy evaluation:** A deterministic backend engine checks spending limits and purchasing restrictions.
5. **Human authorization:** Users review the purchase and explicitly authorize proceeding.
6. **Payment execution:** PayPal Sandbox handles order approval and payment capture.
7. **Audit and transparency:** Transaction states and relevant events are recorded for review.

## Key Features

### 1. AI Purchase Assistant
- Natural-language purchase requests.
- Gemini-powered intent interpretation.
- Product recommendations based on catalog information.
- Product comparison and purchase review.

### 2. Independent Policy Engine
- Per-transaction spending limits.
- Monthly spending limits.
- Category restrictions.
- Product and price validation.
- Currency consistency checks.
- Purchase approval requirements.
- Duplicate-operation safeguards.

### 3. Human-in-the-Loop Authorization
- Purchase details are presented before payment.
- Users explicitly authorize the transaction.
- AI recommendations cannot independently authorize a payment.

### 4. PayPal Payment Integration
- PayPal REST API integration.
- Sandbox order creation.
- PayPal buyer checkout and approval.
- Server-side capture workflow.
- Transaction status tracking.

**Payment environment:** PayPal Sandbox. No real-money transactions are intended by this hackathon prototype.

### 5. Transaction Management
- Transaction history.
- Purchase status visibility.
- Payment order and capture references.
- Audit event inspection.

### 6. Audit and Transparency
- Records of important purchase workflow events.
- Policy evaluation visibility.
- Transaction lifecycle tracking.
- Reviewable purchase decisions.

## How It Works

```text
User Purchase Request
         |
         v
Gemini AI Intent Parsing
         |
         v
Verified Product Catalog
         |
         v
Deterministic Policy Engine
         |
         v
Policy Evaluation
         |
         v
Human Authorization
         |
         v
PayPal Sandbox Order
         |
         v
Buyer Approval
         |
         v
Payment Capture
         |
         v
Transaction & Audit Records
```

**Core design principle:** AI assists with decisions, but deterministic backend policies and explicit user authorization control payment execution.

## Example Scenario

A user enters:

"I want wireless noise-cancelling headphones under $250."

IntentPay interprets the request and identifies a matching product from its catalog.

Suppose the selected headphones cost **$189**.

The policy engine evaluates:
- Is the product present in the trusted catalog?
- Does the price match the catalog?
- Is the currency consistent?
- Is the purchase within the individual spending limit?
- Does it remain within the monthly budget?
- Is the product category permitted?
- Is human approval required?

If the applicable policies pass, the user can review and authorize the purchase.

The user then approves the PayPal Sandbox checkout, after which the backend initiates the capture workflow and records the resulting transaction state.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript |
| Build Tool | Vite |
| Backend | Node.js |
| AI Integration | Google Gemini API |
| Payments | PayPal REST API (Sandbox) |
| Database | SQLite |
| Validation | Zod |
| Testing | Vitest |
| Styling | CSS |

## Project Structure

```text
IntentPay/
│
├── docs/
│   ├── architecture.md
│   ├── evaluation.md
│   └── threat-model.md
│
├── server/
│   └── src/
│       ├── ai/
│       ├── audit/
│       ├── database/
│       ├── payments/
│       ├── policies/
│       ├── routes/
│       └── types/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── assets/
│
├── tests/
│   ├── ai.test.ts
│   ├── payments.test.ts
│   └── policy.test.ts
│
├── .env.example
├── .gitignore
├── package.json
├── server.ts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm.
- A Google Gemini API key.
- A PayPal Developer account with Sandbox REST API credentials.

### 1. Clone the Repository

```bash
git clone https://github.com/Rithesh-22/IntentPay.git
cd IntentPay
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root using `.env.example` as a reference.

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
PORT=3000

PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_ENVIRONMENT=sandbox
```

Replace the placeholder values with your own credentials.

**Security:** Never commit `.env` or expose API secrets in source code or public repositories.

### 4. Start the Application

```bash
npm run dev
```

Open:

http://localhost:3000

### 5. Run Tests

```bash
npm test
```

### 6. Run Type Checking

```bash
npm run lint
```

### 7. Build for Production

```bash
npm run build
```

## Testing and Validation

The project includes automated tests covering three major areas:

| Test Suite | Coverage |
|---|---|
| Policy tests | Spending rules and policy enforcement |
| Payment tests | Payment workflow behavior |
| AI tests | Intent parsing behavior |

**Recorded development verification:**
- 17 automated tests passed.
- TypeScript checks passed.
- Production build completed successfully.
- Gemini integration tested.
- PayPal Sandbox OAuth authentication verified.
- PayPal Sandbox checkout and capture successfully demonstrated.

These results describe the tested hackathon prototype, not a production certification.

## Security and Responsible AI

IntentPay follows several important design principles:

- API credentials are maintained in environment variables.
- Product information is validated against application catalog data.
- Purchasing policies are enforced independently of AI output.
- Human authorization is required before proceeding with payment.
- Payment operations are handled through the backend.
- Transaction and audit information supports traceability.

## Current Scope and Limitations

IntentPay is a hackathon prototype demonstrating policy-controlled AI commerce.

- PayPal integration is configured for Sandbox testing.
- Production payment deployment has not been established.
- The prototype is not intended for real-money commercial transactions.
- Additional payment verification, operational monitoring, security hardening, and production testing would be required before deployment in a real fintech environment.

## Future Improvements

- Stronger payment reconciliation and verification.
- Advanced fraud and risk detection.
- Multi-user spending profiles.
- Recurring purchase policies.
- More detailed audit analytics.
- Production-grade authentication and authorization.
- Additional payment provider integrations.

## Why IntentPay?

IntentPay explores a practical approach to responsible agentic commerce.

Instead of allowing an AI model to make and execute purchases independently, it introduces independent policy enforcement, transparent decision-making, and human authorization into the purchasing lifecycle.

**AI intelligence with financial control and accountability.**

## Author

**Rithesh P**

GitHub: https://github.com/Rithesh-22

## License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.
