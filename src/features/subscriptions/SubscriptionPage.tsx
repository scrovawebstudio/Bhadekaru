import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../../services/documentService';
import { Crown, Check, Sparkles, Shield, Zap, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatINR } from '../../lib/utils';
import { useToast } from '../../components/feedback/Toast';

export const SubscriptionPage: React.FC = () => {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>('annual');
  const toast = useToast();

  const { data: sub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getSubscription(),
  });

  const handleSelectPlan = (planName: string) => {
    toast.success('Subscription Updated', `Switched to ${planName} plan.`);
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      priceMonthly: 0,
      priceAnnual: 0,
      units: 'Up to 2 Units',
      desc: 'For individual landlords with a single flat or room.',
      features: ['2 Active rental units', 'Manual rent tracking', 'Basic payment receipts', '1 Agreement document'],
      buttonText: 'Current Plan',
      isPopular: false,
    },
    {
      id: 'starter',
      name: 'Landlord Starter',
      priceMonthly: 99,
      priceAnnual: 79,
      units: 'Up to 5 Units',
      desc: 'Perfect for managing small residential investments.',
      features: [
        '5 Active rental units',
        'Printable PDF rent receipts',
        'WhatsApp payment reminders',
        'Document KYC vault',
        'Maintenance ticket tracker',
      ],
      buttonText: 'Choose Starter',
      isPopular: false,
    },
    {
      id: 'growth',
      name: 'Portfolio Growth',
      priceMonthly: 249,
      priceAnnual: 199,
      units: 'Up to 20 Units',
      desc: 'Ideal for multi-property owners and building landlords.',
      features: [
        '20 Active rental units',
        'Unlimited PDF receipts with UPI',
        'Move-out deposit calculation',
        'Expense & tax reports (CSV)',
        'Vendor directory & tracking',
        'Priority email support',
      ],
      buttonText: 'Choose Growth',
      isPopular: true,
    },
    {
      id: 'pro',
      name: 'Real Estate Pro',
      priceMonthly: 499,
      priceAnnual: 399,
      units: 'Up to 50+ Units',
      desc: 'For commercial complexes, PG operators, and estate agencies.',
      features: [
        '50+ Active rental units',
        'Multi-property portfolio analytics',
        'Automated rent escalations',
        'Custom branding on PDF receipts',
        'Dedicated account manager',
      ],
      buttonText: 'Choose Pro',
      isPopular: false,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
          Transparent India-first Pricing
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Simple, Affordable Plans for Every Landlord
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Start with a 7-day full feature trial. No credit card required. Upgrade as your property portfolio grows.
        </p>

        {/* Billing toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setSelectedBilling('monthly')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedBilling === 'monthly' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setSelectedBilling('annual')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedBilling === 'annual' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="bg-sky-400/30 text-white text-[10px] px-1.5 py-0.2 rounded-md">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Trial Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Active Pro Trial: {sub?.daysRemaining || 7} Days Remaining</h3>
            <p className="text-xs text-sky-200 mt-0.5">
              You are currently managing <strong>{sub?.activeUnitsCount || 5} units</strong> on your trial account.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => {
          const price = selectedBilling === 'annual' ? p.priceAnnual : p.priceMonthly;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-6 border flex flex-col justify-between transition-all ${
                p.isPopular
                  ? 'border-sky-500 shadow-xl ring-2 ring-sky-500/20 relative'
                  : 'border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                {p.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-base font-extrabold text-slate-900">{p.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.desc}</p>
                </div>

                <div className="my-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">
                      {price === 0 ? 'Free' : `₹${price}`}
                    </span>
                    {price > 0 && <span className="text-xs text-slate-400 font-medium">/ month</span>}
                  </div>
                  <span className="text-[11px] font-bold text-sky-600 mt-1 block">{p.units}</span>
                </div>

                <div className="space-y-2.5 py-4 border-t border-slate-100 text-xs">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant={p.isPopular ? 'primary' : 'outline'}
                  className="w-full font-bold"
                  onClick={() => handleSelectPlan(p.name)}
                >
                  {p.buttonText}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
