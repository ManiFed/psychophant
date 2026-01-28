'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCreditsStore, formatCents } from '@/stores/credits';
import { creditsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface CreditPackage {
  id: string;
  name: string;
  priceCents: number;
  creditsCents: number;
  bonus: number;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pack_100', name: 'Starter', priceCents: 100, creditsCents: 100, bonus: 0 },
  { id: 'pack_500', name: 'Basic', priceCents: 500, creditsCents: 550, bonus: 10 },
  { id: 'pack_2000', name: 'Pro', priceCents: 2000, creditsCents: 2400, bonus: 20 },
  { id: 'pack_5000', name: 'Power', priceCents: 5000, creditsCents: 6500, bonus: 30 },
];

// Initialize Stripe outside component to avoid re-initialization
let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment=success`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setIsProcessing(false);
    } else {
      // Payment succeeded
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <div className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 p-3">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-orange-500 text-black py-3 font-medium hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'processing...' : 'pay now'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-6 py-3 border border-white/10 hover:border-white/30 transition-colors disabled:opacity-50"
        >
          cancel
        </button>
      </div>
    </form>
  );
}

interface CreditsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsPurchaseModal({ isOpen, onClose }: CreditsPurchaseModalProps) {
  const { freeCents, purchasedCents, totalCents, lastFreeReset, fetchBalance } = useCreditsStore();
  const { token } = useAuthStore();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Stripe on mount
  useEffect(() => {
    getStripe().then(setStripeInstance);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPackage(null);
      setClientSecret(null);
      setError(null);
    }
  }, [isOpen]);

  const handleInitiatePurchase = async () => {
    if (!selectedPackage || !token) return;

    setIsInitiating(true);
    setError(null);

    try {
      const response = await creditsApi.purchase(token, selectedPackage);
      setClientSecret(response.clientSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate purchase';
      setError(message);
    } finally {
      setIsInitiating(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh balance after successful payment
    fetchBalance();
    setClientSecret(null);
    setSelectedPackage(null);
    alert('Payment successful! Credits have been added to your account.');
    onClose();
  };

  const handleCancelPayment = () => {
    setClientSecret(null);
  };

  const formatResetTime = () => {
    if (!lastFreeReset) return 'Unknown';
    const resetDate = new Date(lastFreeReset);
    const nextReset = new Date(resetDate);
    nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    nextReset.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const hoursUntilReset = Math.max(0, Math.floor((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60)));
    const minutesUntilReset = Math.max(0, Math.floor(((nextReset.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)));

    return `${hoursUntilReset}h ${minutesUntilReset}m`;
  };

  if (!isOpen) return null;

  const selectedPack = selectedPackage
    ? CREDIT_PACKAGES.find((p) => p.id === selectedPackage)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={clientSecret ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-black border border-white/20 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {clientSecret ? 'complete payment' : 'credits'}
            </h2>
            {!clientSecret && (
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white transition-colors text-2xl leading-none"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {clientSecret && stripeInstance ? (
          // Payment Form
          <div className="p-6">
            {selectedPack && (
              <div className="mb-6 p-4 border border-white/10 bg-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedPack.name} Package</p>
                    <p className="text-sm text-white/50">
                      {formatCents(selectedPack.creditsCents)} credits
                    </p>
                  </div>
                  <p className="text-xl font-bold">{formatCents(selectedPack.priceCents)}</p>
                </div>
              </div>
            )}

            <Elements
              stripe={stripeInstance}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#f97316',
                    colorBackground: '#000000',
                    colorText: '#ffffff',
                    colorDanger: '#ef4444',
                    fontFamily: 'ui-monospace, monospace',
                    borderRadius: '0px',
                  },
                },
              }}
            >
              <CheckoutForm
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancelPayment}
              />
            </Elements>
          </div>
        ) : (
          <>
            {/* Current Balance */}
            <div className="p-6 border-b border-white/10">
              <div className="text-center">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-2">current balance</p>
                <p className="text-4xl font-bold text-orange-500">{formatCents(totalCents)}</p>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div>
                    <span className="text-white/50">free: </span>
                    <span className="text-green-400">{formatCents(freeCents)}</span>
                  </div>
                  <div>
                    <span className="text-white/50">purchased: </span>
                    <span>{formatCents(purchasedCents)}</span>
                  </div>
                </div>
                <p className="text-xs text-white/30 mt-3">
                  free credits reset in {formatResetTime()}
                </p>
              </div>
            </div>

            {/* Packages */}
            <div className="p-6">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-4">buy credits</p>

              {error && (
                <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-sm text-red-400">
                  {error}
                </div>
              )}

              {!stripeInstance ? (
                <div className="text-center py-8 text-white/50">
                  <p>Payment processing is not available.</p>
                  <p className="text-xs mt-2">Please check your configuration.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {CREDIT_PACKAGES.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={`p-4 border transition-all text-left ${
                          selectedPackage === pkg.id
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{pkg.name}</span>
                          {pkg.bonus > 0 && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5">
                              +{pkg.bonus}%
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold">{formatCents(pkg.priceCents)}</p>
                        <p className="text-xs text-white/50 mt-1">
                          get {formatCents(pkg.creditsCents)} credits
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={handleInitiatePurchase}
                    disabled={!selectedPackage || isInitiating}
                    className="w-full mt-6 bg-orange-500 text-black py-3 font-medium hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isInitiating
                      ? 'processing...'
                      : selectedPackage
                      ? 'continue to payment'
                      : 'select a package'}
                  </button>
                </>
              )}

              <p className="text-xs text-white/30 text-center mt-4">
                secure payment powered by Stripe
              </p>
            </div>

            {/* Info */}
            <div className="p-6 border-t border-white/10 bg-white/5">
              <p className="text-xs text-white/50 leading-relaxed">
                credits are used for AI message generation. costs vary by model -
                cheaper models like GPT-4o-mini cost fractions of a cent per message,
                while premium models like Claude Opus cost more. you get 10 cents of
                free credits daily.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
