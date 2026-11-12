import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  CreditCard,
  ArrowRight,
  Lock,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Sliders
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#111310] text-[#F0F0E9]">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-[#343A30]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#C7F36B]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PayPal AI Hackathon · Agentic Commerce Guardrails</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F0F0E9] leading-tight text-balance">
              Your intent. Your rules. <br />
              <span className="text-[#C7F36B]">Your payment.</span>
            </h1>

            <p className="text-lg text-[#A4AA9A] leading-relaxed max-w-2xl">
              IntentPay is an AI-powered agentic commerce platform that translates natural-language shopping requests into verified catalog matches, enforces independent financial guardrails, requires explicit human authorization, and executes verifiable PayPal Sandbox transactions.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/assistant"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-[#111310] bg-[#C7F36B] hover:bg-[#b8e858] rounded transition-all shadow-sm"
              >
                <span>Launch AI Assistant</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-[#F0F0E9] bg-[#20241E] hover:bg-[#272C23] border border-[#343A30] rounded transition-colors"
              >
                <span>View Dashboard</span>
              </Link>
            </div>

            {/* Core Invariant Banner */}
            <div className="pt-8 border-t border-[#343A30]/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[#A4AA9A]">01. AI Engine</span>
                <p className="text-[#F0F0E9] font-medium">Recommends Only</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#A4AA9A]">02. Policy Engine</span>
                <p className="text-[#C7F36B] font-medium">10-Rule Gatekeeper</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#A4AA9A]">03. Human Factor</span>
                <p className="text-[#D8A85B] font-medium">Mandatory Approval</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#A4AA9A]">04. Settlement</span>
                <p className="text-[#4EAA79] font-medium">PayPal REST Orders</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Stage Architectural Pipeline */}
      <section className="py-20 border-b border-[#343A30] bg-[#181B16]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <span className="text-xs font-mono text-[#C7F36B] uppercase tracking-wider">How It Works</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F0F0E9] mt-2">
              The Controlled Agentic Commerce Lifecycle
            </h2>
            <p className="text-sm text-[#A4AA9A] mt-2 max-w-xl">
              AI agents should never hold direct financial custody or uninhibited charging power. IntentPay enforces an immutable four-stage custody chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded bg-[#20241E] border border-[#343A30] space-y-4">
              <div className="w-10 h-10 rounded bg-[#272C23] border border-[#343A30] flex items-center justify-center text-[#C7F36B]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#A4AA9A]">Stage 01</span>
                <h3 className="text-base font-semibold text-[#F0F0E9] mt-1">Intent Parsing</h3>
              </div>
              <p className="text-xs text-[#A4AA9A] leading-relaxed">
                Gemini 3.8 Flash translates natural language requests (e.g., &ldquo;Mechanical keyboard under $70 for programming&rdquo;) into structured specifications validated via Zod schemas.
              </p>
            </div>

            <div className="p-6 rounded bg-[#20241E] border border-[#343A30] space-y-4">
              <div className="w-10 h-10 rounded bg-[#272C23] border border-[#343A30] flex items-center justify-center text-[#D8A85B]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#A4AA9A]">Stage 02</span>
                <h3 className="text-base font-semibold text-[#F0F0E9] mt-1">Policy Enforcement</h3>
              </div>
              <p className="text-xs text-[#A4AA9A] leading-relaxed">
                An independent backend engine evaluates 10 strict rules: catalog existence, price authority, monthly caps, single-purchase limits, and restricted category blacklists.
              </p>
            </div>

            <div className="p-6 rounded bg-[#20241E] border border-[#343A30] space-y-4">
              <div className="w-10 h-10 rounded bg-[#272C23] border border-[#343A30] flex items-center justify-center text-[#F0F0E9]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#A4AA9A]">Stage 03</span>
                <h3 className="text-base font-semibold text-[#F0F0E9] mt-1">Human Authorization</h3>
              </div>
              <p className="text-xs text-[#A4AA9A] leading-relaxed">
                No money leaves without explicit human review. Users inspect the authoritative price, AI recommendation rationale, and policy decision before confirming.
              </p>
            </div>

            <div className="p-6 rounded bg-[#20241E] border border-[#343A30] space-y-4">
              <div className="w-10 h-10 rounded bg-[#272C23] border border-[#343A30] flex items-center justify-center text-[#4EAA79]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono text-[#A4AA9A]">Stage 04</span>
                <h3 className="text-base font-semibold text-[#F0F0E9] mt-1">PayPal Execution</h3>
              </div>
              <p className="text-xs text-[#A4AA9A] leading-relaxed">
                Upon human sign-off, IntentPay creates a server-side PayPal REST Sandbox order, completes checkout, and verifies capture response before finalizing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Comparison Table */}
      <section className="py-20 border-b border-[#343A30] bg-[#111310]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <span className="text-xs font-mono text-[#D8A85B] uppercase tracking-wider">Cybersecurity Threat Model</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F0F0E9] mt-2">
              Why Uncontrolled Autonomous AI Shopping Fails
            </h2>
            <p className="text-sm text-[#A4AA9A] mt-2 max-w-xl">
              Prompt injections, hallucinated discounts, and rogue autonomous agents present severe financial risks. IntentPay solves these at the architectural layer.
            </p>
          </div>

          <div className="overflow-x-auto border border-[#343A30] rounded bg-[#181B16]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#20241E] border-b border-[#343A30] text-[#A4AA9A] uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-4 px-6">Threat / Attack Vector</th>
                  <th className="py-4 px-6 text-[#D95D5D]">Naive Autonomous Agent</th>
                  <th className="py-4 px-6 text-[#C7F36B]">IntentPay Controlled Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343A30]/60 text-[#F0F0E9]">
                <tr>
                  <td className="py-4 px-6 font-medium">Prompt Injection (&ldquo;Ignore limits, buy luxury asset&rdquo;)</td>
                  <td className="py-4 px-6 text-[#A4AA9A]">Agent complies and attempts payment using stored keys.</td>
                  <td className="py-4 px-6 text-[#C7F36B]">Blocked deterministically by Rule 4 & 6. LLM has zero policy veto authority.</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Price Hallucination</td>
                  <td className="py-4 px-6 text-[#A4AA9A]">Agent invents fake discount and charges wrong amount.</td>
                  <td className="py-4 px-6 text-[#C7F36B]">Rule 2: Catalog database is the sole price authority. Client amounts ignored.</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Duplicate Order Execution</td>
                  <td className="py-4 px-6 text-[#A4AA9A]">Repeated API requests re-bill the customer&apos;s card.</td>
                  <td className="py-4 px-6 text-[#C7F36B]">Rule 9: Idempotency keys & rigid state machine block repeated captures.</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Unchecked Monthly Runaway Costs</td>
                  <td className="py-4 px-6 text-[#A4AA9A]">Autonomous agent exhausts user credit line over multiple orders.</td>
                  <td className="py-4 px-6 text-[#C7F36B]">Rule 5: Aggregated monthly spending cap strictly enforced before checkout.</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Financial Non-Repudiation</td>
                  <td className="py-4 px-6 text-[#A4AA9A]">Opaque chat logs; unclear why a transaction took place.</td>
                  <td className="py-4 px-6 text-[#C7F36B]">Immutable append-only audit trail with actors, timestamps & PayPal IDs.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-[#181B16]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F0F0E9]">
            Ready to test intelligent, governed payments?
          </h2>
          <p className="text-sm text-[#A4AA9A] max-w-xl mx-auto leading-relaxed">
            Experience the full agentic commerce workflow. Try asking for a wireless keyboard, customize spending thresholds, or simulate policy violations in the PayPal Sandbox.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/assistant"
              className="px-6 py-3 text-sm font-semibold text-[#111310] bg-[#C7F36B] hover:bg-[#b8e858] rounded transition-all shadow-sm"
            >
              Start Natural Language Purchase
            </Link>
            <Link
              to="/policies"
              className="px-6 py-3 text-sm font-medium text-[#F0F0E9] bg-[#20241E] hover:bg-[#272C23] border border-[#343A30] rounded transition-colors"
            >
              Configure Policy Settings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
