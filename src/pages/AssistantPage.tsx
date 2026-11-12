import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scale,
  DollarSign,
  Cpu,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { ParsedIntent, ProductRecommendation } from '../types';

export const AssistantPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [evaluatingProductId, setEvaluatingProductId] = useState<string | null>(null);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query && !intent) {
      handleParse(query);
    }
  }, [searchParams]);

  const handleParse = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || prompt;
    if (!textToSubmit.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.parseIntent(textToSubmit.trim());
      setIntent(res.intent);
      setRecommendations(res.recommendations);
    } catch (err: any) {
      setError(err.message || 'Failed to parse shopping intent');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (productId: string) => {
    try {
      setEvaluatingProductId(productId);
      const res = await api.evaluateTransaction({
        productId,
        currency: intent?.currency || 'USD'
      });
      // Navigate to the Approval / Policy Review screen
      navigate(`/approve/${res.transactionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate purchase evaluation');
    } finally {
      setEvaluatingProductId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#C7F36B]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stage 01 · Intent Disambiguation</span>
        </div>
        <h1 className="text-2xl font-bold text-[#F0F0E9] mt-1">AI Purchase Assistant</h1>
        <p className="text-sm text-[#A4AA9A] mt-1 max-w-2xl">
          State your requirements in plain English. IntentPay extracts key specifications, evaluates compatibility against our verified catalog, and validates your budget limits.
        </p>
      </div>

      {/* Natural Language Prompt Card */}
      <div className="p-6 rounded bg-[#20241E] border border-[#343A30] space-y-4">
        <label className="block text-xs font-semibold text-[#F0F0E9] uppercase tracking-wider">
          Describe What You Wish to Purchase
        </label>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleParse();
          }}
          className="space-y-4"
        >
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. I need a compact wireless mechanical keyboard for programming under $70, with tactile switches."
              className="w-full px-4 py-3 bg-[#181B16] border border-[#343A30] rounded text-sm text-[#F0F0E9] placeholder-[#A4AA9A]/50 focus:outline-none focus:border-[#C7F36B] transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A4AA9A]">
              <span>Sample intents:</span>
              <button
                type="button"
                onClick={() => {
                  setPrompt('I need a wireless mechanical keyboard for programming under $70');
                  handleParse('I need a wireless mechanical keyboard for programming under $70');
                }}
                className="hover:text-[#C7F36B] transition-colors underline decoration-[#343A30] underline-offset-4"
              >
                Keyboard under $70
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setPrompt('Studio ANC wireless headphones with long battery under $200');
                  handleParse('Studio ANC wireless headphones with long battery under $200');
                }}
                className="hover:text-[#C7F36B] transition-colors underline decoration-[#343A30] underline-offset-4"
              >
                ANC Headphones under $200
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setPrompt('Cold storage biometric crypto hardware wallet for security');
                  handleParse('Cold storage biometric crypto hardware wallet for security');
                }}
                className="hover:text-[#D8A85B] transition-colors underline decoration-[#343A30] underline-offset-4"
              >
                Crypto Hardware (Restricted)
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#C7F36B] hover:bg-[#b8e858] disabled:opacity-50 text-[#111310] font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <span>Extracting Intent with Gemini...</span>
              ) : (
                <>
                  <span>Process Purchase Intent</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#20241E] border border-[#D95D5D]/50 text-xs text-[#D95D5D]">
          {error}
        </div>
      )}

      {/* Extracted Structured Intent Card */}
      {intent && (
        <div className="p-6 rounded bg-[#181B16] border border-[#343A30] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#343A30]/60">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#C7F36B]" />
              <h2 className="text-sm font-semibold text-[#F0F0E9]">
                Structured Intent Extraction (Validated via Zod)
              </h2>
            </div>
            <span className="text-xs font-mono text-[#A4AA9A]">Gemini 3.8 Flash</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#A4AA9A]">Target Category</span>
              <p className="font-semibold text-[#F0F0E9] capitalize mt-0.5">{intent.category}</p>
            </div>
            <div>
              <span className="text-[#A4AA9A]">Extracted Maximum Budget</span>
              <p className="font-semibold text-[#C7F36B] font-mono tabular-nums mt-0.5">
                {intent.currency === 'USD' ? '$' : `${intent.currency} `}
                {intent.maximumBudget.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[#A4AA9A]">Settlement Currency</span>
              <p className="font-semibold text-[#F0F0E9] font-mono mt-0.5">{intent.currency}</p>
            </div>
            <div>
              <span className="text-[#A4AA9A]">Identified Features</span>
              <p className="font-semibold text-[#F0F0E9] mt-0.5">
                {intent.requirements.length > 0 ? intent.requirements.join(', ') : 'Standard specifications'}
              </p>
            </div>
          </div>

          {intent.clarificationNeeded && (
            <div className="p-3 rounded bg-[#272C23] border border-[#D8A85B]/40 flex items-start gap-2.5 text-xs text-[#D8A85B]">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">AI Clarification Inquiry: </span>
                <span>{intent.clarificationNeeded}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grounded Recommendations Grid */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F0F0E9] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C7F36B]" />
              <span>Grounded Catalog Recommendations ({recommendations.length} items evaluated)</span>
            </h2>
            <span className="text-xs text-[#A4AA9A]">Strict catalog pricing · Zero hallucinated inventory</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((rec) => {
              const product = rec.product;
              const priceFormatted = (product.priceMinor / 100).toFixed(2);
              const isEvaluating = evaluatingProductId === product.id;

              return (
                <div
                  key={product.id}
                  className="rounded bg-[#20241E] border border-[#343A30] overflow-hidden flex flex-col justify-between hover:border-[#343A30]/80 transition-colors"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex gap-4">
                      {/* Product Image with styled fallback */}
                      <div className="w-28 h-28 rounded bg-[#181B16] border border-[#343A30] shrink-0 overflow-hidden relative">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-[#A4AA9A] font-mono -z-10">
                          Hardware
                        </div>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs text-[#A4AA9A]">
                          <span className="capitalize">{product.category}</span>
                          <span className="font-mono text-[#C7F36B] font-semibold">
                            {rec.matchScore}% Match
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#F0F0E9] leading-snug">
                          {product.title}
                        </h3>
                        <div className="font-mono text-base font-semibold text-[#F0F0E9] tabular-nums pt-1">
                          ${priceFormatted} <span className="text-xs text-[#A4AA9A] font-normal">{product.currency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grounded Match Explanation */}
                    <p className="text-xs text-[#A4AA9A] leading-relaxed border-t border-[#343A30]/50 pt-3">
                      {rec.matchExplanation}
                    </p>

                    {/* Requirements Alignment Check */}
                    <div className="space-y-1.5 text-xs">
                      {rec.requirementAlignment.matched.length > 0 && (
                        <div className="flex items-start gap-1.5 text-[#4EAA79]">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>Matched: {rec.requirementAlignment.matched.join(', ')}</span>
                        </div>
                      )}
                      {rec.requirementAlignment.unmatched.length > 0 && (
                        <div className="flex items-start gap-1.5 text-[#A4AA9A]">
                          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>Not specified in catalog: {rec.requirementAlignment.unmatched.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 bg-[#181B16] border-t border-[#343A30] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/compare?p1=${product.id}`)}
                      className="text-xs text-[#A4AA9A] hover:text-[#F0F0E9] flex items-center gap-1.5 transition-colors"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Compare Matrix</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectProduct(product.id)}
                      disabled={isEvaluating}
                      className="px-4 py-2 bg-[#C7F36B] hover:bg-[#b8e858] text-[#111310] font-semibold text-xs rounded transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {isEvaluating ? (
                        <span>Evaluating Policy...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Select & Review Policy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
