import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Transaction, TransactionState } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('ALL');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTransactions();
      setTransactions(res.transactions);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      (tx.product?.title && tx.product.title.toLowerCase().includes(search.toLowerCase())) ||
      (tx.paypalOrderId && tx.paypalOrderId.toLowerCase().includes(search.toLowerCase())) ||
      (tx.paypalCaptureId && tx.paypalCaptureId.toLowerCase().includes(search.toLowerCase()));

    const matchesState = stateFilter === 'ALL' || tx.state === stateFilter;
    return matchesSearch && matchesState;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#343A30]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#C7F36B]">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Financial Settlement Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F0F0E9] mt-1">Transaction History</h1>
          <p className="text-sm text-[#A4AA9A] mt-1">
            Authoritative record of all intent evaluations, human approvals, and PayPal Sandbox payment captures.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTransactions}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-[#A4AA9A] hover:text-[#F0F0E9] bg-[#20241E] border border-[#343A30] rounded transition-colors self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#20241E] border border-[#D95D5D]/50 text-xs text-[#D95D5D]">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#A4AA9A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Transaction ID, product, or PayPal reference..."
            className="w-full pl-9 pr-4 py-2 bg-[#20241E] border border-[#343A30] rounded text-xs text-[#F0F0E9] placeholder-[#A4AA9A]/50 focus:outline-none focus:border-[#C7F36B]"
          />
        </div>

        {/* State filter segmented controls */}
        <div className="flex items-center gap-1 p-1 bg-[#20241E] border border-[#343A30] rounded overflow-x-auto">
          {['ALL', 'CAPTURE_CONFIRMED', 'AWAITING_USER_APPROVAL', 'BLOCKED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                stateFilter === st
                  ? 'bg-[#272C23] text-[#C7F36B] font-semibold border border-[#343A30]'
                  : 'text-[#A4AA9A] hover:text-[#F0F0E9]'
              }`}
            >
              {st === 'ALL' ? 'All Transactions' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="h-64 rounded bg-[#20241E] animate-pulse" />
      ) : filtered.length > 0 ? (
        <div className="border border-[#343A30] rounded bg-[#20241E] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#272C23] border-b border-[#343A30] text-[#A4AA9A] font-mono">
              <tr>
                <th className="py-3 px-5">Transaction Reference</th>
                <th className="py-3 px-5">Product</th>
                <th className="py-3 px-5 text-right">Authoritative Price</th>
                <th className="py-3 px-5">State</th>
                <th className="py-3 px-5">PayPal Order ID</th>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343A30]/50 text-[#F0F0E9]">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#272C23]/40 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-[#A4AA9A]">
                    {tx.id}
                  </td>
                  <td className="py-3.5 px-5 font-medium max-w-xs truncate">
                    {tx.product?.title || 'Catalog Purchase'}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-right tabular-nums font-semibold">
                    ${(tx.amountMinor / 100).toFixed(2)} <span className="text-[10px] text-[#A4AA9A] font-normal">{tx.currency}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusBadge state={tx.state} />
                  </td>
                  <td className="py-3.5 px-5 font-mono text-[11px] text-[#A4AA9A] max-w-xs truncate">
                    {tx.paypalOrderId || '—'}
                  </td>
                  <td className="py-3.5 px-5 text-[#A4AA9A] font-mono text-[11px]">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      to={`/approve/${tx.id}`}
                      className="text-xs text-[#C7F36B] hover:underline"
                    >
                      Inspect Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 rounded bg-[#20241E] border border-[#343A30] text-center space-y-3">
          <p className="text-xs text-[#A4AA9A]">No transactions match your current search or state filter.</p>
          <Link
            to="/assistant"
            className="inline-flex items-center gap-1.5 text-xs text-[#C7F36B] hover:underline font-semibold"
          >
            <span>Initiate an AI Shopping Request</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
