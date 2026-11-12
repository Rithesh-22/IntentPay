import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';

export const ComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([
    searchParams.get('p1') || 'prod_kb_01',
    searchParams.get('p2') || 'prod_kb_02'
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const res = await api.getCatalog();
      setProducts(res.products);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (index: number, id: string) => {
    const updated = [...selectedIds];
    updated[index] = id;
    setSelectedIds(updated);
  };

  const comparedProducts = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

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
          <div className="flex items-center gap-2 text-xs font-mono text-[#C7F36B]">
            <Scale className="w-3.5 h-3.5" />
            <span>Side-by-Side Evaluation</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F0F0E9] mt-1">Product Comparison Matrix</h1>
          <p className="text-sm text-[#A4AA9A] mt-1">
            Compare specifications, authoritative catalog pricing, and policy compatibility across genuine inventory.
          </p>
        </div>

        <Link
          to="/assistant"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#111310] bg-[#C7F36B] hover:bg-[#b8e858] rounded transition-colors whitespace-nowrap self-start"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Assistant</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#20241E] border border-[#D95D5D]/50 text-xs text-[#D95D5D]">
          {error}
        </div>
      )}

      {/* Comparison Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((slot) => (
          <div key={slot} className="space-y-2">
            <label className="text-xs font-semibold text-[#A4AA9A] uppercase tracking-wider">
              Product Slot {slot + 1}
            </label>
            <select
              value={selectedIds[slot] || ''}
              onChange={(e) => handleSelectSlot(slot, e.target.value)}
              className="w-full px-4 py-2.5 bg-[#20241E] border border-[#343A30] rounded text-sm text-[#F0F0E9] focus:outline-none focus:border-[#C7F36B]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — ${(p.priceMinor / 100).toFixed(2)} ({p.category})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Comparison Matrix Table */}
      {comparedProducts.length === 2 && (
        <div className="border border-[#343A30] rounded bg-[#20241E] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#272C23] border-b border-[#343A30] text-[#A4AA9A] font-mono">
              <tr>
                <th className="py-4 px-6 w-1/4">Specification</th>
                {comparedProducts.map((p) => (
                  <th key={p.id} className="py-4 px-6 w-3/8 text-sm font-bold text-[#F0F0E9]">
                    {p.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343A30]/60 text-[#F0F0E9]">
              {/* Product Preview Image & Price */}
              <tr>
                <td className="py-4 px-6 text-[#A4AA9A] font-mono">Image & Authority Price</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="py-4 px-6 space-y-2">
                    <div className="w-24 h-24 rounded bg-[#181B16] border border-[#343A30] overflow-hidden">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="font-mono text-base font-bold text-[#C7F36B] tabular-nums">
                      ${(p.priceMinor / 100).toFixed(2)} <span className="text-xs text-[#A4AA9A]">{p.currency}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Category */}
              <tr>
                <td className="py-4 px-6 text-[#A4AA9A] font-mono">Category</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="py-4 px-6 capitalize">
                    {p.category}
                  </td>
                ))}
              </tr>

              {/* Description */}
              <tr>
                <td className="py-4 px-6 text-[#A4AA9A] font-mono">Description</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="py-4 px-6 text-[#A4AA9A] leading-relaxed">
                    {p.description}
                  </td>
                ))}
              </tr>

              {/* Dynamic Technical Specs */}
              <tr>
                <td className="py-4 px-6 text-[#A4AA9A] font-mono">Detailed Specs</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="py-4 px-6 space-y-1 font-mono text-[11px]">
                    {Object.entries(p.specs).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-[#343A30]/40 py-1">
                        <span className="text-[#A4AA9A] capitalize">{k}:</span>
                        <span className="text-[#F0F0E9] text-right">{String(v)}</span>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>

              {/* Grounded Pros / Strengths */}
              <tr>
                <td className="py-4 px-6 text-[#A4AA9A] font-mono">Grounded Advantage</td>
                {comparedProducts.map((p) => {
                  const isLowerPrice =
                    p.priceMinor <
                    comparedProducts.find((other) => other.id !== p.id)!.priceMinor;
                  return (
                    <td key={p.id} className="py-4 px-6 text-xs text-[#4EAA79] space-y-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {isLowerPrice
                            ? 'More budget-friendly catalog price point'
                            : 'Higher performance grade specification profile'}
                        </span>
                      </div>
                      <p className="text-[#A4AA9A]">
                        Stock availability verified ({p.stock} units reserved in merchant database).
                      </p>
                    </td>
                  );
                })}
              </tr>

              {/* Policy Suitability */}
              <tr>
                <td className="py-4 px-6 text-[#A4AA9A] font-mono">Standard Policy Verdict</td>
                {comparedProducts.map((p) => {
                  const passesDefaultLimit = p.priceMinor <= 25000;
                  return (
                    <td key={p.id} className="py-4 px-6">
                      {passesDefaultLimit ? (
                        <div className="flex items-center gap-2 text-xs text-[#4EAA79]">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Within default $250.00 transaction limit</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-[#D95D5D]">
                          <X className="w-4 h-4" />
                          <span>Exceeds standard $250.00 single purchase cap</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Actions */}
              <tr>
                <td className="py-4 px-6 text-[#A4AA9A] font-mono">Action</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="py-4 px-6">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await api.evaluateTransaction({
                          productId: p.id,
                          currency: p.currency
                        });
                        navigate(`/approve/${res.transactionId}`);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#C7F36B] hover:bg-[#b8e858] text-[#111310] font-semibold text-xs rounded transition-colors"
                    >
                      <span>Proceed with this Item</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
