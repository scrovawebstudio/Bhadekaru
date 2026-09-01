import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { Building2, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '../../components/feedback/Toast';

export const OnboardingWizard: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [unitsManaged, setUnitsManaged] = useState<string>('2–5');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Flats']);
  const [propertyName, setPropertyName] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('Apartment');
  const [city, setCity] = useState<string>('Pune');
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const toast = useToast();

  const propertyTypeOptions = ['Flats', 'Houses', 'Shops', 'Offices', 'Rooms', 'PG', 'Multiple types'];

  const toggleType = (t: string) => {
    if (selectedTypes.includes(t)) {
      setSelectedTypes(selectedTypes.filter((x) => x !== t));
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const handleFinish = async (skipProperty = false) => {
    setIsLoading(true);
    try {
      await authService.completeOnboarding({
        unitsManaged,
        propertyTypes: selectedTypes,
        propertyName: skipProperty ? undefined : propertyName || undefined,
        propertyType,
        city,
        address,
      });
      toast.success('Welcome to Bhadekaru!', 'Your rental business portfolio has been initialized.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Onboarding error', err?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 antialiased">
      <div className="max-w-xl w-full bg-slate-800 rounded-3xl p-6 sm:p-10 border border-slate-700 shadow-2xl">
        {/* Logo / Steps Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-lg">
              भा
            </div>
            <span className="font-extrabold text-lg tracking-tight">Bhadekaru</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <span>Step {step} of 4</span>
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Welcome to Bhadekaru</h2>
              <p className="text-sm text-slate-400 mt-1">
                "Manage your properties. Simplify your rentals." Let's set up your rental business in under 60 seconds.
              </p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600/60 space-y-2 text-xs text-slate-300">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Track monthly rent collections, deposits & pending dues
              </p>
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Instant printable PDF rent receipts with UPI reference
              </p>
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Agreements, KYC vault & maintenance ticket management
              </p>
            </div>
            <Button size="lg" className="w-full font-bold" onClick={() => setStep(2)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started
            </Button>
          </div>
        )}

        {/* Step 2: Units count */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">How many units do you manage?</h2>
              <p className="text-sm text-slate-400 mt-1">Select the approximate size of your rental portfolio.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['1', '2–5', '6–20', '21–50', '50+'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setUnitsManaged(opt)}
                  className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all ${
                    unitsManaged === opt
                      ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                      : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt} Units
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button size="lg" className="flex-1 font-bold" onClick={() => setStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Property types */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">What type of properties do you manage?</h2>
              <p className="text-sm text-slate-400 mt-1">Select all categories that apply to your business.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {propertyTypeOptions.map((t) => {
                const isSelected = selectedTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                        : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button size="lg" className="flex-1 font-bold" onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Add First Property */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Add your first property</h2>
              <p className="text-sm text-slate-400 mt-1">You can fill in details now or skip to view the dashboard.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Property Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shree Residency, Baner"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="House">House / Villa</option>
                    <option value="Shop">Commercial Shop</option>
                    <option value="Office">Office Space</option>
                    <option value="Room">Single Room / PG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Address Line
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 42, Baner Main Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                onClick={() => handleFinish(true)}
                isLoading={isLoading}
              >
                Skip for now
              </Button>
              <Button
                size="lg"
                className="flex-1 font-bold"
                onClick={() => handleFinish(false)}
                isLoading={isLoading}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
