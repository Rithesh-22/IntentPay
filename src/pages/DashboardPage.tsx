import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Sliders,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickPrompt, setQuickPrompt] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    navigate(`/assistant?q=${encodeURIComponent(quickPrompt.trim())}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[#20241E] rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-32 bg-[#20241E] rounded" />
            <div className="h-32 bg-[#20241E] rounded" />
            <div className="h-32 bg-[#20241E] rounded" />
            <div className="h-32 bg-[#20241E] rounded" />
          </div>
        </div>
      </div>
    );
  }

  const spending = stats?.spending || {
    maxTransactionAmountMinor: 25000,
    monthlySpendingLimitMinor: 100000,
    currentMonthlySpentMinor: 0,
    currency: 'USD'
  };

  const monthlySpentMajor = spending.currentMonthlySpentMinor / 100;
  const monthlyLimitMajor = spending.monthlySpendingLimitMinor / 100;
  const maxTxMajor = spending.maxTransactionAmountMinor / 100;
  const percentSpent = Math.min(100, Math.round((monthlySpentMajor / (monthlyLimitMajor || 1)) * 100));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header Profile / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#343A30]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#C7F36B]">
            <span>Active Account</span>
            <span>·</span>
            <span>demo.architect@intentpay.io</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F0F0E9] mt-1">Commerce Control Console</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/policies"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F0F0E9] bg-[#20241E] hover:bg-[#272C23] border border-[#343A30] rounded transition-colors whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-[#D8A85B]" />
            <span>Policy Settings</span>
          </Link>
          <Link
            to="/assistant"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#111310] bg-[#C7F36B] hover:bg-[#b8e858] rounded transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Intent</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#20241E] border border-[#D95D5D]/50 text-xs text-[#D95D5D]">
          {error}
        </div>
      )}

      {/* Spending Limit Overview Bar */}
      <div className="p-6 rounded bg-[#20241E] border border-[#343A30] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-semibold text-[#F0F0E9]">Monthly Spending Governance</span>
            <span className="text-[#A4AA9A] ml-2">Calendar month cycle</span>
          </div>
          <div className="font-mono text-[#A4AA9A] tabular-nums">
            <span className="text-[#F0F0E9] font-medium">${monthlySpentMajor.toFixed(2)}</span> of ${monthlyLimitMajor.toFixed(2)} {spending.currency} cap ({percentSpent}%)
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded bg-[#111310] overflow-hidden border border-[#343A30]/50">
          <div
            className={`h-full transition-all duration-300 ${
              percentSpent > 80 ? 'bg-[#D8A85B]' : 'bg-[#C7F36B]'
            }`}
            style={{ width: `${percentSpent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#A4AA9A] font-mono">
          <div>Max Single Transaction: <span className="text-[#F0F0E9]">${maxTxMajor.toFixed(2)}</span></div>
          <div>Remaining Monthly: <span className="text-[#C7F36B]">${Math.max(0, monthlyLimitMajor - monthlySpentMajor).toFixed(2)}</span></div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded bg-[#20241E] border border-[#343A30] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A4AA9A]">
            <span>Captured Purchases</span>
            <CheckCircle2 className="w-4 h-4 text-[#4EAA79]" />
          </div>
          <div className="text-2xl font-bold text-[#F0F0E9] font-mono tabular-nums">
            {stats?.counts.successfulPurchases ?? 0}
          </div>
          <p className="text-xs text-[#A4AA9A]">Verified via PayPal capture</p>
        </div>

        <div className="p-5 rounded bg-[#20241E] border border-[#343A30] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A4AA9A]">
            <span>Settled Volume</span>
            <TrendingUp className="w-4 h-4 text-[#C7F36B]" />
          </div>
          <div className="text-2xl font-bold text-[#F0F0E9] font-mono tabular-nums">
            ${((stats?.counts.totalVolumeMinor ?? 0) / 100).toFixed(2)}
          </div>
          <p className="text-xs text-[#A4AA9A]">Authoritative catalog totals</p>
        </div>

        <div className="p-5 rounded bg-[#20241E] border border-[#343A30] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A4AA9A]">
            <span>Policy Blocks</span>
            <AlertOctagon className="w-4 h-4 text-[#D95D5D]" />
          </div>
          <div className="text-2xl font-bold text-[#F0F0E9] font-mono tabular-nums">
            {stats?.counts.blockedAttempts ?? 0}
          </div>
          <p className="text-xs text-[#A4AA9A]">Blocked before any charge</p>
        </div>

        <div className="p-5 rounded bg-[#20241E] border border-[#343A30] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A4AA9A]">
            <span>System State</span>
            <ShieldCheck className="w-4 h-4 text-[#D8A85B]" />
          </div>
          <div className="text-xs font-mono space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[#A4AA9A]">PayPal:</span>
              <span className="text-[#C7F36B]">{stats?.systemIntegrations.paypalStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A4AA9A]">AI Model:</span>
              <span className="text-[#F0F0E9]">gemini-3.8-flash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Intent Input */}
      <div className="p-6 rounded bg-[#181B16] border border-[#343A30] space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#F0F0E9] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C7F36B]" />
            <span>Quick Agentic Intent Dispatch</span>
          </h2>
          <p className="text-xs text-[#A4AA9A] mt-1">
            Enter a natural-language shopping goal. The Gemini intent parser will extract specifications and evaluate catalog items.
          </p>
        </div>

        <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder="e.g. Wireless mechanical keyboard suitable for programming under $70"
            className="flex-1 px-4 py-2.5 bg-[#20241E] border border-[#343A30] rounded text-sm text-[#F0F0E9] placeholder-[#A4AA9A]/50 focus:outline-none focus:border-[#C7F36B]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#C7F36B] hover:bg-[#b8e858] text-[#111310] font-semibold text-xs rounded transition-colors whitespace-nowrap flex items-center justify-center gap-2"
          >
            <span>Parse & Recommend</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#A4AA9A]">
          <span>Suggestions:</span>
          <button
            type="button"
            onClick={() => setQuickPrompt('Wireless mechanical keyboard suitable for programming under $70')}
            className="hover:text-[#C7F36B] transition-colors underline decoration-[#343A30] underline-offset-4"
          >
            Mechanical keyboard under $70
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setQuickPrompt('Titanium wireless noise-cancelling headphones for travel under $200')}
            className="hover:text-[#C7F36B] transition-colors underline decoration-[#343A30] underline-offset-4"
          >
            ANC Headphones under $200
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setQuickPrompt('4K IPS ergonomic monitor for programming under $250')}
            className="hover:text-[#D8A85B] transition-colors underline decoration-[#343A30] underline-offset-4"
          >
            4K Monitor [Tests Policy Boundary]
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#F0F0E9] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#A4AA9A]" />
            <span>Recent Transactions & Activity</span>
          </h2>
          <Link to="/transactions" className="text-xs text-[#C7F36B] hover:underline">
            View All Transactions →
          </Link>
        </div>

        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="border border-[#343A30] rounded bg-[#20241E] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#272C23] border-b border-[#343A30] text-[#A4AA9A] font-mono">
                <tr>
                  <th className="py-3 px-5">Transaction ID</th>
                  <th className="py-3 px-5">Product Title</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5">State</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343A30]/50 text-[#F0F0E9]">
                {stats.recentActivity.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#272C23]/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-[#A4AA9A]">
                      {tx.id}
                    </td>
                    <td className="py-3.5 px-5 font-medium">
                      {tx.product_title || 'Catalog Purchase'}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-right tabular-nums">
                      ${(tx.amount_minor / 100).toFixed(2)} {tx.currency}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge state={tx.state} />
                    </td>
                    <td className="py-3.5 px-5 text-[#A4AA9A] font-mono">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/approve/${tx.id}`}
                        className="text-xs text-[#C7F36B] hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded bg-[#20241E] border border-[#343A30] text-center space-y-2">
            <p className="text-xs text-[#A4AA9A]">No transactions recorded yet in the ledger.</p>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#C7F36B] hover:underline"
            >
              <span>Try purchasing a product with the AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
