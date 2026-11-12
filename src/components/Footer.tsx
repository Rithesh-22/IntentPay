import React from 'react';
import { Shield, Lock, CreditCard, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#343A30] bg-[#181B16] text-[#A4AA9A] text-xs">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F0F0E9]">
              <Shield className="w-4 h-4 text-[#C7F36B]" />
              <span>IntentPay Architecture</span>
            </div>
            <p className="text-xs leading-relaxed text-[#A4AA9A]">
              Governed agentic commerce. Bridging generative intent parsing with deterministic policy engines and verified PayPal Sandbox capture.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#F0F0E9] uppercase tracking-wider">Governing Core</h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[#C7F36B]" /> Gemini 3.8 Flash Intent Parser</li>
              <li className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-[#D8A85B]" /> 10-Rule Policy Verification</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-[#A4AA9A]" /> Mandatory Human Authorization</li>
              <li className="flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-[#4EAA79]" /> PayPal REST Sandbox Orders</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#F0F0E9] uppercase tracking-wider">Platform Links</h4>
            <ul className="space-y-1.5">
              <li><Link to="/dashboard" className="hover:text-[#F0F0E9] transition-colors">Executive Dashboard</Link></li>
              <li><Link to="/assistant" className="hover:text-[#F0F0E9] transition-colors">AI Natural Intent Agent</Link></li>
              <li><Link to="/compare" className="hover:text-[#F0F0E9] transition-colors">Catalog Product Matrix</Link></li>
              <li><Link to="/policies" className="hover:text-[#F0F0E9] transition-colors">Spending Policy Controls</Link></li>
              <li><Link to="/transactions" className="hover:text-[#F0F0E9] transition-colors">Transaction Ledger</Link></li>
              <li><Link to="/audit" className="hover:text-[#F0F0E9] transition-colors">Security & Audit Center</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#F0F0E9] uppercase tracking-wider">Compliance Boundary</h4>
            <p className="text-xs leading-relaxed text-[#A4AA9A]">
              Transactions are processed via PayPal Sandbox with server-authoritative amount validation. No LLM can authorize or execute financial settlement.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#343A30]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A4AA9A]">
          <p>© 2026 IntentPay. Intelligent Commerce. Controlled Payments. Built for PayPal AI Hackathon.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#C7F36B] font-mono">Core Invariant: Zero Autonomous Charges</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
