'use client';

import { useState, useEffect } from 'react';
import { useCreditsStore, formatCents } from '@/stores/credits';
import { creditsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const SUBSCRIPTION_PLANS = [
  { id: 'plus', name: 'Plus', priceCents: 300, description: '$3/month of usage', features: ['Full model selection', 'Usage-based billing', 'Extra usage available'] },
  { id: 'pro', name: 'Pro', priceCents: 1000, description: '$10/month of usage', features: ['Full model selection', 'Usage-based billing', 'Extra usage available', 'Priority support'] },
  { id: 'max', name: 'Max', priceCents: 2000, description: '$20/month of usage', features: ['Full model selection', 'Usage-based billing', 'Extra usage available', 'Priority support', 'Early access to features'] },
] as const;

const EXTRA_USAGE_PACKAGES = [
  { id: 'extra_100', name: '$1.00', cents: 100 },
  { id: 'extra_500', name: '$5.00', cents: 500 },
  { id: 'extra_1000', name: '$10.00', cents: 1000 },
] as const;

interface CreditsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsPurchaseModal({ isOpen, onClose }: CreditsPurchaseModalProps) {
  const { freeCents, subscription, fetchBalance } = useCreditsStore();
  const { token } = useAuthStore();
  const [tab, setTab] = useState<'overview' | 'plans' | 'extra'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTab('overview');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleSubscribe = async (planId: string) => {
    if (!token) return;
    setIsProcessing(true);
    setError(null);
    try {
      await creditsApi.subscribe(token, planId);
      await fetchBalance();
      setSuccess(`Subscribed to ${planId} plan!`);
      setTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!token || !confirm('Cancel your subscription? You can still use it until the end of the billing period.')) return;
    setIsProcessing(true);
    setError(null);
    try {
      await creditsApi.cancelSubscription(token);
      await fetchBalance();
      setSuccess('Subscription cancelled.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddExtraUsage = async (packageId: string) => {
    if (!token) return;
    setIsProcessing(true);
    setError(null);
    try {
      await creditsApi.addExtraUsage(token, packageId);
      await fetchBalance();
      setSuccess('Extra usage added!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add extra usage');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatResetTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const hoursUntilReset = Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)));
    const minutesUntilReset = Math.max(0, Math.floor(((tomorrow.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)));
    return `${hoursUntilReset}h ${minutesUntilReset}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-black border border-white/20 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">credits & plans</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-2xl leading-none">
              &times;
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {(['overview', 'plans', ...(subscription ? ['extra'] : [])] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t as typeof tab); setError(null); setSuccess(null); }}
                className={`text-xs px-3 py-1.5 transition-colors ${
                  tab === t ? 'bg-orange-500 text-black font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 border border-red-500/30 bg-red-500/10 text-xs text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 border border-green-500/30 bg-green-500/10 text-xs text-green-400">
            {success}
          </div>
        )}

        {tab === 'overview' && (
          <div className="p-6 space-y-6">
            {subscription ? (
              <>
                <div className="text-center">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">{subscription.planName} plan</p>
                  <div className="relative w-full h-4 bg-white/10 rounded-full overflow-hidden mt-3">
                    <div
                      className="absolute inset-y-0 left-0 bg-orange-500 rounded-full transition-all"
                      style={{ width: `${subscription.usagePercent}%` }}
                    />
                  </div>
                  <p className="text-3xl font-bold text-orange-500 mt-3">{subscription.usagePercent}% used</p>
                  <p className="text-xs text-white/40 mt-1">
                    {formatCents(subscription.usageCents)} / {formatCents(subscription.totalBudgetCents)} budget
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    {formatCents(subscription.remainingCents)} remaining
                    {subscription.extraUsageCents > 0 && (
                      <span> (incl. {formatCents(subscription.extraUsageCents)} extra)</span>
                    )}
                  </p>
                  <p className="text-xs text-white/20 mt-2">
                    period ends {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setTab('extra')}
                    className="flex-1 bg-orange-500/20 text-orange-400 py-2 text-xs font-medium hover:bg-orange-500/30 transition-colors"
                  >
                    add extra usage
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isProcessing}
                    className="px-4 py-2 text-xs text-white/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors"
                  >
                    cancel plan
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">free plan</p>
                  <p className="text-4xl font-bold text-orange-500">{freeCents} credits</p>
                  <p className="text-xs text-white/40 mt-2">10 credits/day · resets in {formatResetTime()}</p>
                </div>

                <div className="border border-white/10 p-4 space-y-2">
                  <p className="text-xs text-white/60 font-medium">model costs (free plan)</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">GLM 4.5 Air (Standard)</span>
                    <span className="text-orange-400">1 credit</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">GPT-OSS 120B (Advanced)</span>
                    <span className="text-orange-400">2 credits</span>
                  </div>
                </div>

                <button
                  onClick={() => setTab('plans')}
                  className="w-full bg-orange-500 text-black py-3 text-xs font-medium hover:bg-orange-400 transition-colors"
                >
                  upgrade to a paid plan
                </button>
                <p className="text-xs text-white/30 text-center">
                  paid plans unlock all models and usage-based billing
                </p>
              </>
            )}
          </div>
        )}

        {tab === 'plans' && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-white/50 uppercase tracking-wider">subscription plans</p>
            <p className="text-xs text-white/40">
              paid plans give you a monthly usage budget and access to all models.
              pay for what you use - when you hit your limit, add extra usage.
            </p>

            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="border border-white/10 p-4 hover:border-orange-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-lg">{plan.name}</span>
                    <span className="ml-2 text-white/50 text-sm">{plan.description}</span>
                  </div>
                </div>
                <ul className="space-y-1 mb-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-white/50">
                      <span className="text-green-400 mr-1">+</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isProcessing || (subscription?.plan === plan.id)}
                  className="w-full bg-orange-500 text-black py-2 text-xs font-medium hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {subscription?.plan === plan.id ? 'current plan' : isProcessing ? 'processing...' : `subscribe - ${formatCents(plan.priceCents)}/mo`}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'extra' && subscription && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-white/50 uppercase tracking-wider">add extra usage</p>
            <p className="text-xs text-white/40">
              add one-time extra usage to your {subscription.planName} plan.
              extra usage expires at the end of your billing period.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {EXTRA_USAGE_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handleAddExtraUsage(pkg.id)}
                  disabled={isProcessing}
                  className="border border-white/10 p-4 hover:border-orange-500/30 transition-colors text-center disabled:opacity-50"
                >
                  <p className="text-xl font-bold">{pkg.name}</p>
                  <p className="text-[10px] text-white/40 mt-1">extra usage</p>
                </button>
              ))}
            </div>

            <div className="border border-white/10 p-4 space-y-2">
              <p className="text-xs text-white/60 font-medium">auto-reload</p>
              <p className="text-xs text-white/40">
                automatically add usage when your budget runs out.
                {subscription.autoReloadCents > 0 && (
                  <span className="text-orange-400"> Currently: {formatCents(subscription.autoReloadCents)}/reload</span>
                )}
              </p>
              <div className="flex gap-2">
                {[0, 100, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={async () => {
                      if (!token) return;
                      setIsProcessing(true);
                      try {
                        await creditsApi.setAutoReload(token, amount);
                        await fetchBalance();
                        setSuccess(amount === 0 ? 'Auto-reload disabled' : `Auto-reload set to ${formatCents(amount)}`);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    className={`text-xs px-3 py-1.5 border transition-colors ${
                      subscription.autoReloadCents === amount
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-white/10 text-white/50 hover:border-white/30'
                    }`}
                  >
                    {amount === 0 ? 'off' : formatCents(amount)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
