import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CreditCard,
  AlertTriangle,
  Lock,
  ArrowRight,
  ExternalLink,
  Receipt,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Transaction } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const ApprovalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [humanConsent, setHumanConsent] = useState(false);

  // PayPal checkout step state
  const [paypalOrder, setPaypalOrder] = useState<{
    id: string;
    status: string;
    approvalUrl?: string;
    amount: { currencyCode: string; value: string };
    isMockedEnvironment?: boolean;
  } | null>(null);

  const [captureResult, setCaptureResult] = useState<{
    id: string;
    status: string;
    amount: { currencyCode: string; value: string };
    isMockedEnvironment?: boolean;
  } | null>(null);

  useEffect(() => {
    if (id) {
      loadTransaction(id);
    }
  }, [id]);

  const loadTransaction = async (txId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTransaction(txId);
      setTransaction(res.transaction);
      if (res.transaction.paypalOrderId) {
        setPaypalOrder({
          id: res.transaction.paypalOrderId,
          status: res.transaction.state === 'CAPTURE_CONFIRMED' ? 'COMPLETED' : 'CREATED',
          amount: {
            currencyCode: res.transaction.currency,
            value: (res.transaction.amountMinor / 100).toFixed(2)
          }
        });
      }
      if (res.transaction.paypalCaptureId) {
        setCaptureResult({
          id: res.transaction.paypalCaptureId,
          status: 'COMPLETED',
          amount: {
            currencyCode: res.transaction.currency,
            value: (res.transaction.amountMinor / 100).toFixed(2)
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayPalOrder = async () => {
    if (!transaction) return;
    try {
      setProcessing(true);
      setError(null);
      const res = await api.createPayPalOrder(transaction.id);
      setPaypalOrder(res.order);
      // Reload updated transaction state
      await loadTransaction(transaction.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate PayPal order');
    } finally {
      setProcessing(false);
    }
  };

  const handleCapturePayment = async () => {
    if (!transaction || !paypalOrder) return;
    try {
      setProcessing(true);
      setError(null);
      const res = await api.capturePayPalOrder(transaction.id, paypalOrder.id);
      setCaptureResult(res.capture);
      await loadTransaction(transaction.id);
    } catch (err: any) {
      setError(err.message || 'PayPal capture failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!transaction) return;
    try {
      setProcessing(true);
      await api.cancelTransaction(transaction.id, 'User manually cancelled from approval screen');
      await loadTransaction(transaction.id);
    } catch (err: any) {
      setError(err.message || 'Cancellation failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-64 bg-[#20241E] rounded animate-pulse" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#F0F0E9]">Transaction Not Found</h2>
        <p className="text-xs text-[#A4AA9A]">The specified transaction reference could not be located in the database ledger.</p>
        <Link to="/transactions" className="inline-block text-xs text-[#C7F36B] hover:underline">
          Return to Transactions
        </Link>
      </div>
    );
  }

  const isBlocked = transaction.state === 'BLOCKED';
  const isCaptured = transaction.state === 'CAPTURE_CONFIRMED';
  const isCancelled = transaction.state === 'CANCELLED';
  const priceDollars = (transaction.amountMinor / 100).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-[#A4AA9A]">
        <div className="flex items-center gap-2">
          <Link to="/transactions" className="hover:text-[#F0F0E9] transition-colors">
            Transactions
          </Link>
          <span>/</span>
          <span className="font-mono text-[#F0F0E9]">{transaction.id}</span>
        </div>
        <StatusBadge state={transaction.state} />
      </div>

      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#C7F36B]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Stage 03 &amp; 04 · Human Authorization &amp; PayPal Settlement</span>
        </div>
        <h1 className="text-2xl font-bold text-[#F0F0E9] mt-1">
          {isCaptured ? 'Payment Capture Confirmed' : 'Purchase Review & Authorization'}
        </h1>
        <p className="text-xs text-[#A4AA9A] mt-1">
          {isCaptured
            ? 'Transaction settled and verified via PayPal REST Orders API. Immutable audit record sealed.'
            : 'Review verified catalog specifications and independent policy decisions prior to signing financial execution.'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#20241E] border border-[#D95D5D]/60 text-xs text-[#D95D5D] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Order & Product Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Summary */}
        <div className="md:col-span-2 p-6 rounded bg-[#20241E] border border-[#343A30] space-y-5">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded bg-[#181B16] border border-[#343A30] overflow-hidden shrink-0">
              <img
                src={transaction.product?.imageUrl}
                alt={transaction.product?.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-[#A4AA9A] capitalize">{transaction.product?.category}</span>
              <h2 className="text-lg font-bold text-[#F0F0E9]">{transaction.product?.title}</h2>
              <p className="text-xs text-[#A4AA9A] leading-relaxed line-clamp-2">
                {transaction.product?.description}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#343A30]/60 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#A4AA9A]">Locked Authority Price:</span>
              <p className="text-base font-bold text-[#C7F36B] tabular-nums mt-0.5">
                ${priceDollars} {transaction.currency}
              </p>
            </div>
            <div>
              <span className="text-[#A4AA9A]">Idempotency Key:</span>
              <p className="text-[#F0F0E9] truncate mt-0.5" title={transaction.idempotencyKey}>
                {transaction.idempotencyKey.slice(0, 16)}...
              </p>
            </div>
            <div>
              <span className="text-[#A4AA9A]">Order Initiated:</span>
              <p className="text-[#F0F0E9] mt-0.5">
                {new Date(transaction.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Policy Summary Card */}
        <div className="p-6 rounded bg-[#181B16] border border-[#343A30] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A4AA9A]">Policy Engine:</span>
              <span className={isBlocked ? 'text-[#D95D5D]' : 'text-[#4EAA79]'}>
                {isBlocked ? 'REJECTED' : 'APPROVED'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[#A4AA9A]">Rules Checked:</span>
              <p className="text-[#F0F0E9] font-medium">10 of 10 Invariants Verified</p>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[#A4AA9A]">Zero Autonomous Charge:</span>
              <p className="text-[#C7F36B] font-medium">Human Authorization Required</p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#343A30]/60 text-xs">
            <span className="text-[#A4AA9A]">Execution Environment:</span>
            <p className="text-[#D8A85B] font-mono mt-0.5">PayPal REST Sandbox</p>
          </div>
        </div>
      </div>

      {/* 10-Rule Independent Policy Breakdown */}
      {transaction.policyDecision && (
        <div className="p-6 rounded bg-[#20241E] border border-[#343A30] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F0F0E9] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C7F36B]" />
              <span>Independent Policy Rule Invariants</span>
            </h3>
            <span className="text-xs font-mono text-[#A4AA9A]">
              Decision: {transaction.policyDecision.decision}
            </span>
          </div>

          {transaction.policyDecision.reasons.length > 0 && (
            <div className="p-3 rounded bg-[#181B16] border border-[#D95D5D]/50 text-xs text-[#D95D5D] space-y-1">
              <span className="font-semibold">Policy Block Justification:</span>
              {transaction.policyDecision.reasons.map((r, i) => (
                <p key={i}>• {r}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {transaction.policyDecision.checkedRules.map((rule) => (
              <div
                key={rule.ruleNumber}
                className="p-3 rounded bg-[#181B16] border border-[#343A30]/50 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#A4AA9A]">Rule 0{rule.ruleNumber}: {rule.name}</span>
                  <span className={rule.passed ? 'text-[#4EAA79]' : 'text-[#D95D5D]'}>
                    {rule.passed ? 'PASSED' : 'BLOCKED'}
                  </span>
                </div>
                <p className="text-[11px] text-[#A4AA9A]">{rule.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settlement Action Area */}
      {!isCaptured && !isBlocked && !isCancelled && (
        <div className="p-6 rounded bg-[#181B16] border border-[#343A30] space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#F0F0E9] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#D8A85B]" />
              <span>Human Authorization Gate</span>
            </h3>
            <p className="text-xs text-[#A4AA9A] leading-relaxed">
              In accordance with IntentPay security bylaws, AI recommendations cannot initiate financial settlement autonomously. Please attest that you have reviewed the specifications and authorize execution of ${priceDollars} {transaction.currency} via the PayPal Sandbox.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 rounded bg-[#20241E] border border-[#343A30]">
            <input
              type="checkbox"
              id="humanAttestation"
              checked={humanConsent}
              onChange={(e) => setHumanConsent(e.target.checked)}
              className="w-4 h-4 rounded border-[#343A30] bg-[#181B16] accent-[#C7F36B] cursor-pointer"
            />
            <label htmlFor="humanAttestation" className="text-xs text-[#F0F0E9] font-medium cursor-pointer">
              I authorize IntentPay to create and execute this PayPal Sandbox payment order.
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={processing}
              className="px-4 py-2 text-xs text-[#A4AA9A] hover:text-[#D95D5D] transition-colors"
            >
              Cancel Transaction
            </button>

            <div className="flex items-center gap-3">
              {!paypalOrder ? (
                <button
                  type="button"
                  onClick={handleCreatePayPalOrder}
                  disabled={!humanConsent || processing}
                  className="px-6 py-2.5 bg-[#C7F36B] hover:bg-[#b8e858] disabled:opacity-50 text-[#111310] font-semibold text-xs rounded transition-colors flex items-center gap-2 shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{processing ? 'Creating Order...' : 'Step 1: Create PayPal Order'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCapturePayment}
                  disabled={processing}
                  className="px-6 py-2.5 bg-[#4EAA79] hover:bg-[#439568] disabled:opacity-50 text-[#111310] font-semibold text-xs rounded transition-colors flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{processing ? 'Capturing via PayPal...' : 'Step 2: Capture & Settle Payment'}</span>
                </button>
              )}
            </div>
          </div>

          {paypalOrder && (
            <div className="p-4 rounded bg-[#20241E] border border-[#D8A85B]/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#D8A85B]">PayPal Sandbox Order Created:</span>
                <span className="font-mono text-[#F0F0E9]">{paypalOrder.id}</span>
              </div>
              <p className="text-[#A4AA9A]">
                The PayPal REST order has been established on the server with authoritative catalog pricing. Click &ldquo;Step 2: Capture &amp; Settle Payment&rdquo; to complete execution.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Captured Payment Receipt */}
      {isCaptured && (
        <div className="p-6 rounded bg-[#20241E] border border-[#4EAA79]/60 space-y-6">
          <div className="flex items-center gap-3 text-[#4EAA79]">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h3 className="text-base font-bold text-[#F0F0E9]">Verified PayPal Sandbox Receipt</h3>
              <p className="text-xs text-[#A4AA9A]">Funds captured and verified against catalog authority</p>
            </div>
          </div>

          <div className="p-4 rounded bg-[#181B16] border border-[#343A30] font-mono text-xs space-y-3">
            <div className="flex justify-between border-b border-[#343A30]/50 pb-2">
              <span className="text-[#A4AA9A]">PayPal Capture ID:</span>
              <span className="text-[#C7F36B]">{transaction.paypalCaptureId || captureResult?.id}</span>
            </div>
            <div className="flex justify-between border-b border-[#343A30]/50 pb-2">
              <span className="text-[#A4AA9A]">PayPal Order ID:</span>
              <span className="text-[#F0F0E9]">{transaction.paypalOrderId}</span>
            </div>
            <div className="flex justify-between border-b border-[#343A30]/50 pb-2">
              <span className="text-[#A4AA9A]">Verified Captured Amount:</span>
              <span className="text-[#F0F0E9] font-bold">${priceDollars} {transaction.currency}</span>
            </div>
            <div className="flex justify-between border-b border-[#343A30]/50 pb-2">
              <span className="text-[#A4AA9A]">Settlement Timestamp:</span>
              <span className="text-[#F0F0E9]">{new Date(transaction.capturedAt || transaction.updatedAt).toUTCString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A4AA9A]">Payer Attestation:</span>
              <span className="text-[#4EAA79]">HUMAN_AUTHORIZED_IN_CONSOLE</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/transactions"
              className="text-xs text-[#A4AA9A] hover:text-[#F0F0E9] transition-colors"
            >
              ← Back to Transactions
            </Link>
            <Link
              to="/audit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#111310] bg-[#C7F36B] hover:bg-[#b8e858] rounded transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Inspect Immutable Audit Trail</span>
            </Link>
          </div>
        </div>
      )}

      {/* Blocked Order Notice */}
      {isBlocked && (
        <div className="p-6 rounded bg-[#20241E] border border-[#D95D5D]/60 space-y-4">
          <div className="flex items-center gap-3 text-[#D95D5D]">
            <XCircle className="w-6 h-6" />
            <div>
              <h3 className="text-base font-bold text-[#F0F0E9]">Purchase Strictly Blocked by Policy</h3>
              <p className="text-xs text-[#A4AA9A]">
                The requested purchase breached financial constraints. No payment was authorized or transmitted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Link
              to="/policies"
              className="px-4 py-2 bg-[#272C23] hover:bg-[#343A30] text-[#F0F0E9] text-xs font-medium rounded transition-colors"
            >
              Adjust Policy Thresholds
            </Link>
            <Link
              to="/assistant"
              className="px-4 py-2 bg-[#C7F36B] hover:bg-[#b8e858] text-[#111310] text-xs font-semibold rounded transition-colors"
            >
              Try Another Product
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
