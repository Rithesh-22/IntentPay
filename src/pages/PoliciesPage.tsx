import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  DollarSign,
  Save,
  RefreshCw,
  Play
} from 'lucide-react';
import { api } from '../services/api';
import { UserPolicy, Product, PolicyEvaluationResult } from '../types';

export const PoliciesPage: React.FC = () => {
  const [policy, setPolicy] = useState<UserPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [maxTxDollars, setMaxTxDollars] = useState<number>(250);
  const [monthlyLimitDollars, setMonthlyLimitDollars] = useState<number>(1000);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [restrictedCategories, setRestrictedCategories] = useState<string[]>([]);
  const [currency, setCurrency] = useState<string>('USD');
  const [requireHumanApproval, setRequireHumanApproval] = useState<boolean>(true);

  // Simulator state
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [simProductId, setSimProductId] = useState<string>('');
  const [simResult, setSimResult] = useState<PolicyEvaluationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  const ALL_SYSTEM_CATEGORIES = [
    'keyboards',
    'audio',
    'monitors',
    'workspace',
    'accessories',
    'crypto_hardware',
    'gambling',
    'weapons',
    'luxury_jewelry'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [policyRes, catalogRes] = await Promise.all([
        api.getPolicy(),
        api.getCatalog()
      ]);
      setPolicy(policyRes.policy);
      setMaxTxDollars(policyRes.policy.maxTransactionAmountMinor / 100);
      setMonthlyLimitDollars(policyRes.policy.monthlySpendingLimitMinor / 100);
      setAllowedCategories(policyRes.policy.allowedCategories);
      setRestrictedCategories(policyRes.policy.restrictedCategories);
      setCurrency(policyRes.policy.currency);
      setRequireHumanApproval(policyRes.policy.requireHumanApproval);

      setCatalog(catalogRes.products);
      if (catalogRes.products.length > 0) {
        setSimProductId(catalogRes.products[0].id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load policy data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (maxTxDollars <= 0 || monthlyLimitDollars <= 0) {
      setFeedback({ type: 'error', message: 'Spending limits must be positive amounts.' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await api.updatePolicy({
        maxTransactionAmountMinor: Math.round(maxTxDollars * 100),
        monthlySpendingLimitMinor: Math.round(monthlyLimitDollars * 100),
        allowedCategories,
        restrictedCategories,
        currency,
        requireHumanApproval
      });
      setFeedback({ type: 'success', message: 'Financial policy rules updated and verified in database.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update policy' });
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (cat: string, type: 'allowed' | 'restricted') => {
    if (type === 'restricted') {
      if (restrictedCategories.includes(cat)) {
        setRestrictedCategories(restrictedCategories.filter((c) => c !== cat));
      } else {
        setRestrictedCategories([...restrictedCategories, cat]);
        setAllowedCategories(allowedCategories.filter((c) => c !== cat));
      }
    } else {
      if (allowedCategories.includes(cat)) {
        setAllowedCategories(allowedCategories.filter((c) => c !== cat));
      } else {
        setAllowedCategories([...allowedCategories, cat]);
        setRestrictedCategories(restrictedCategories.filter((c) => c !== cat));
      }
    }
  };

  const runSimulation = async () => {
    if (!simProductId) return;
    try {
      setSimulating(true);
      const res = await api.evaluateTransaction({
        productId: simProductId,
        currency
      });
      setSimResult(res.policyResult);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Simulation failed' });
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-64 bg-[#20241E] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#343A30]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#D8A85B]">
            <Sliders className="w-3.5 h-3.5" />
            <span>Deterministic Rule Gate</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F0F0E9] mt-1">Spending Policy Settings</h1>
          <p className="text-sm text-[#A4AA9A] mt-1 max-w-2xl">
            Configure hard financial limits. These constraints are evaluated directly by the server-side policy engine, completely independent of AI recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-[#A4AA9A] hover:text-[#F0F0E9] bg-[#20241E] border border-[#343A30] rounded transition-colors self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Active Policy</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#20241E] border-[#4EAA79]/60 text-[#4EAA79]'
              : 'bg-[#20241E] border-[#D95D5D]/60 text-[#D95D5D]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          {/* Numerical Limits */}
          <div className="p-6 rounded bg-[#20241E] border border-[#343A30] space-y-6">
            <h2 className="text-sm font-semibold text-[#F0F0E9] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#C7F36B]" />
              <span>Monetary Thresholds</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#F0F0E9]">
                  Max Single Transaction Limit ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#A4AA9A] font-mono">$</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="10000"
                    value={maxTxDollars}
                    onChange={(e) => setMaxTxDollars(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 bg-[#181B16] border border-[#343A30] rounded text-sm text-[#F0F0E9] font-mono focus:outline-none focus:border-[#C7F36B]"
                  />
                </div>
                <p className="text-[11px] text-[#A4AA9A]">
                  Any purchase with catalog price exceeding this value is instantly blocked by Rule 4.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#F0F0E9]">
                  Monthly Spending Cap ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#A4AA9A] font-mono">$</span>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="50000"
                    value={monthlyLimitDollars}
                    onChange={(e) => setMonthlyLimitDollars(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 bg-[#181B16] border border-[#343A30] rounded text-sm text-[#F0F0E9] font-mono focus:outline-none focus:border-[#C7F36B]"
                  />
                </div>
                <p className="text-[11px] text-[#A4AA9A]">
                  Aggregates all completed orders this calendar month (Rule 5).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#F0F0E9]">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181B16] border border-[#343A30] rounded text-sm text-[#F0F0E9] font-mono focus:outline-none focus:border-[#C7F36B]"
                >
                  <option value="USD">USD — United States Dollar (PayPal Sandbox Primary)</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="INR">INR — Indian Rupee</option>
                </select>
                <p className="text-[11px] text-[#A4AA9A]">
                  PayPal sandbox checkout executes in verified supported currencies.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#F0F0E9]">
                  Human Authorization Gate
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="requireApproval"
                    checked={requireHumanApproval}
                    onChange={(e) => setRequireHumanApproval(e.target.checked)}
                    className="w-4 h-4 rounded border-[#343A30] bg-[#181B16] accent-[#C7F36B]"
                  />
                  <label htmlFor="requireApproval" className="text-xs text-[#F0F0E9] font-medium cursor-pointer">
                    Mandatory explicit human approval before payment
                  </label>
                </div>
                <p className="text-[11px] text-[#A4AA9A]">
                  Strict zero-autonomous-charge policy. An agent cannot trigger PayPal capture without human sign-off.
                </p>
              </div>
            </div>
          </div>

          {/* Category Restrictions */}
          <div className="p-6 rounded bg-[#20241E] border border-[#343A30] space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[#F0F0E9]">
                Category Allowlist &amp; Security Restrictions (Rule 6)
              </h2>
              <p className="text-xs text-[#A4AA9A] mt-1">
                Toggle categories to restrict or allow. Restricted categories are blocked immediately during policy evaluation.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {ALL_SYSTEM_CATEGORIES.map((cat) => {
                const isRestricted = restrictedCategories.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => handleCategoryToggle(cat, isRestricted ? 'allowed' : 'restricted')}
                    className={`p-3 rounded border text-left text-xs transition-colors flex flex-col justify-between h-20 ${
                      isRestricted
                        ? 'bg-[#181B16] border-[#D95D5D]/60 text-[#D95D5D]'
                        : 'bg-[#272C23] border-[#343A30] text-[#F0F0E9] hover:border-[#C7F36B]/50'
                    }`}
                  >
                    <span className="font-mono capitalize font-medium">{cat.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] uppercase font-mono">
                      {isRestricted ? 'Restricted' : 'Allowed'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#C7F36B] hover:bg-[#b8e858] disabled:opacity-50 text-[#111310] font-semibold text-xs rounded transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Financial Policy'}</span>
            </button>
          </div>
        </form>

        {/* Live Policy Simulator */}
        <div className="space-y-6">
          <div className="p-6 rounded bg-[#181B16] border border-[#343A30] space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#C7F36B]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Live Rule Engine Simulator</span>
            </div>
            <h2 className="text-sm font-semibold text-[#F0F0E9]">Test Current Constraints</h2>
            <p className="text-xs text-[#A4AA9A]">
              Select a catalog product to test how the 10-rule independent policy engine evaluates it against your current settings.
            </p>

            <div className="space-y-3 pt-2">
              <label className="block text-xs text-[#A4AA9A]">Select Test Product:</label>
              <select
                value={simProductId}
                onChange={(e) => setSimProductId(e.target.value)}
                className="w-full px-3 py-2 bg-[#20241E] border border-[#343A30] rounded text-xs text-[#F0F0E9] focus:outline-none focus:border-[#C7F36B]"
              >
                {catalog.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (${(p.priceMinor / 100).toFixed(2)} · {p.category})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={runSimulation}
                disabled={simulating}
                className="w-full py-2 bg-[#20241E] hover:bg-[#272C23] border border-[#343A30] text-[#F0F0E9] font-medium text-xs rounded transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span>{simulating ? 'Evaluating...' : 'Run Policy Verification'}</span>
              </button>
            </div>

            {simResult && (
              <div className="pt-4 border-t border-[#343A30]/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A4AA9A]">Evaluation Decision:</span>
                  <span
                    className={`font-mono font-bold ${
                      simResult.allowed ? 'text-[#4EAA79]' : 'text-[#D95D5D]'
                    }`}
                  >
                    {simResult.decision}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {simResult.checkedRules.map((r) => (
                    <div
                      key={r.ruleNumber}
                      className="p-2 rounded bg-[#20241E] border border-[#343A30]/50 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#A4AA9A]">Rule 0{r.ruleNumber}: {r.name}</span>
                        <span className={r.passed ? 'text-[#4EAA79]' : 'text-[#D95D5D]'}>
                          {r.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <p className="text-[#A4AA9A] leading-tight">{r.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
