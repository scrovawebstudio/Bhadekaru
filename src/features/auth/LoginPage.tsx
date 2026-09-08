import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import {
  Shield,
  Phone,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Building2,
  RefreshCw,
  UserCheck,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';
import { useToast } from '../../components/feedback/Toast';

export const LoginPage: React.FC = () => {
  // Step 1: phone/identifier lookup, Step 2: password entry and verification
  const [step, setStep] = useState<'identifier' | 'password'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    exists: boolean;
    role?: 'super_admin' | 'landlord';
    title?: string;
    subtitle?: string;
    name?: string;
    orgName?: string;
    phone?: string;
    isSuspended?: boolean;
    suspensionReason?: string;
    avatarUrl?: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const navigate = useNavigate();
  const toast = useToast();

  // Step 1: Lookup landlord or admin account by phone number via backend API
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const clean = identifier.trim();
    if (!clean) {
      setLookupError('Please enter your registered mobile number or email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.lookupAccount(clean);
      if (!res.exists) {
        setLookupResult(null);
        setLookupError(
          res.message ||
            'No registered landlord account found with this phone number. Please verify your phone number or register a new workspace below.'
        );
      } else {
        setLookupResult(res);
        setLookupError(null);

        // If landlord account is suspended by SaaS Admin, halt
        if (res.isSuspended) {
          setLookupError(
            `ACCOUNT_SUSPENDED: ${res.suspensionReason || 'This landlord account has been suspended by the platform administrator. Contact admin@bhadekaru.app.'}`
          );
        } else {
          // Proceed to Step 2 (password verification)
          setStep('password');
        }
      }
    } catch (err: any) {
      setLookupError(err?.message || 'Failed to verify phone number. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Strict password verification on server via API
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Password Required', 'Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login(identifier, password);

      if (res.session.role === 'super_admin') {
        toast.success('Super Admin Authenticated', 'Access granted to Bhadekaru SaaS Platform Governance Console.');
        navigate('/admin');
      } else {
        toast.success('Welcome Back', `Successfully signed in to ${res.org.name || 'your portfolio'}.`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err?.message?.includes('ACCOUNT_SUSPENDED')) {
        setLookupError(err.message.replace('ACCOUNT_SUSPENDED:', '').trim());
      } else {
        toast.error('Authentication Failed', err?.message || 'Incorrect password. Please verify and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetStep = () => {
    setStep('identifier');
    setPassword('');
    setLookupError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 antialiased selection:bg-sky-500 selection:text-white">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Side: Brand & Architecture Info */}
        <div className="md:col-span-5 space-y-6 text-left p-2 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-sky-500/30">
              भा
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">भाडेकरू</h1>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Bhadekaru SaaS</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Enterprise Rental & Multi-Tenant Property Manager
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete rental automation with strict multi-tenant data isolation, biometric security, and private cloud synchronization across Android and Web.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-start gap-3">
              <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-white block">Strict Data Isolation</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Tenant records, leases, financial ledgers, and KYC files are isolated per landlord.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-white block">Persistent Mobile Session</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Stay signed in on your Android mobile device even after closing or restarting the app.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-white block">Server-Side Credentials Verification</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Passwords and admin credentials are verified strictly on the backend through secure API calls.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Two-Step Secure Login Form */}
        <div className="md:col-span-7 bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          {/* Header */}
          <div className="space-y-1.5 border-b border-slate-800 pb-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Sign In to Bhadekaru</h3>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-sky-950 text-sky-400 border-sky-800">
                Secure 2-Factor Verification
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {step === 'identifier'
                ? 'Enter your registered mobile number to locate your workspace'
                : 'Account verified. Enter your password to access your dashboard.'}
            </p>
          </div>

          {/* Suspended or Lookup Error Alert */}
          {lookupError && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-start gap-3 text-left animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 flex-1">
                <p className="font-bold text-rose-200">Authentication Alert</p>
                <p className="text-rose-300/90 leading-relaxed">{lookupError}</p>
                {lookupError.includes('No registered landlord account') && (
                  <div className="pt-2">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 underline"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Register a New Landlord Workspace
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: Phone Number / Identifier Lookup */}
          {step === 'identifier' && (
            <form onSubmit={handleLookup} className="space-y-5 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    Registered Mobile Number or Email
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="phone-identifier-input"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (lookupError) setLookupError(null);
                    }}
                    placeholder="e.g. 9823045678 or landlord@bhadekaru.app"
                    autoFocus
                    required
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Enter your 10-digit mobile number or admin credentials configured in the environment.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue & Verify Number
              </Button>
            </form>
          )}

          {/* STEP 2: Password Verification on Backend */}
          {step === 'password' && lookupResult && (
            <form onSubmit={handleLogin} className="space-y-5 text-left animate-in fade-in duration-300">
              {/* Verified Account Badge */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      lookupResult.role === 'super_admin'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    {lookupResult.role === 'super_admin' ? (
                      <Crown className="w-5 h-5" />
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">
                        {lookupResult.role === 'super_admin'
                          ? 'Super Admin Governance Console'
                          : lookupResult.name || 'Verified Landlord'}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          lookupResult.role === 'super_admin'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {lookupResult.role === 'super_admin'
                        ? 'Platform Administrator • Environment Credentials'
                        : `${lookupResult.orgName || 'Rental Portfolio'} • ${identifier}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetStep}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold px-2 py-1 rounded hover:bg-slate-800/80 transition-all shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    {lookupResult.role === 'super_admin' ? 'Super Admin PIN / Password' : 'Account Password'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your secret password"
                    autoFocus
                    required
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className={`w-full font-bold shadow-lg ${
                  lookupResult.role === 'super_admin'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                }`}
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {lookupResult.role === 'super_admin' ? 'Authenticate Super Admin' : 'Sign In to Workspace'}
              </Button>
            </form>
          )}

          {/* Bottom Footer: Register & Switch link */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              New property landlord?{' '}
              <Link to="/register" className="text-sky-400 font-bold hover:underline">
                Create Free Workspace
              </Link>
            </span>
            <span className="text-[11px] text-slate-500">Android & Web Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !password) {
      toast.error('Missing Details', 'Full Name, Phone Number, and Password are required.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(email, password, fullName, phone, orgName);
      toast.success('Workspace Created', '7-Day Free Professional Trial activated.');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error('Registration Failed', err?.message || 'Failed to create landlord account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 antialiased selection:bg-sky-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md shadow-sky-500/30">
            भा
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Create Landlord Workspace</h2>
          <p className="text-xs text-slate-400">Isolated database partition • Cross-device Android & Web sync</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rajesh Patil"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Property / Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Patil Real Estate & Rentals"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98230 45678"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="landlord@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              required
              minLength={6}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-bold bg-sky-500 hover:bg-sky-400 text-white mt-2"
            isLoading={isLoading}
          >
            Create Workspace & Start 7-Day Trial
          </Button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-400">
          Already have a landlord account?{' '}
          <Link to="/login" className="text-sky-400 font-bold hover:underline">
            Sign In with Phone
          </Link>
        </div>
      </div>
    </div>
  );
};
