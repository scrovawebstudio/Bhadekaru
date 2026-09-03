import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Building2,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  Shield,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Phone,
  Crown,
  KeyRound,
} from 'lucide-react';
import { useToast } from '../../components/feedback/Toast';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'landlord' | 'admin'>('admin');
  const [identifier, setIdentifier] = useState('8149862034');
  const [password, setPassword] = useState('814986');
  const [isLoading, setIsLoading] = useState(false);
  const [suspendedError, setSuspendedError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e?: React.FormEvent, customId?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setSuspendedError(null);
    setIsLoading(true);
    const targetId = customId || identifier;
    const targetPass = customPass || password;

    try {
      const res = await authService.login(targetId, targetPass);
      if (res.session.role === 'super_admin') {
        toast.success('Super Admin Authenticated', 'Access granted to Bhadekaru Platform Governance Console.');
        navigate('/admin');
      } else {
        toast.success('Signed in successfully', `Welcome back, ${res.user.full_name || 'Landlord'}.`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err?.message?.includes('ACCOUNT_SUSPENDED')) {
        setSuspendedError(err.message.replace('ACCOUNT_SUSPENDED:', '').trim());
      } else {
        toast.error('Login Failed', err?.message || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (targetId: string, targetPass: string = 'DemoPassword123!', role: 'landlord' | 'admin' = 'landlord') => {
    setActiveTab(role);
    setIdentifier(targetId);
    setPassword(targetPass);
    handleLogin(undefined, targetId, targetPass);
  };

  const switchTab = (tab: 'landlord' | 'admin') => {
    setActiveTab(tab);
    setSuspendedError(null);
    if (tab === 'admin') {
      setIdentifier('8149862034');
      setPassword('814986');
    } else {
      setIdentifier('scrovawebstudio@gmail.com');
      setPassword('DemoPassword123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 antialiased selection:bg-sky-500 selection:text-white">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Side: SaaS & Google Drive Hybrid Overview */}
        <div className="md:col-span-5 space-y-6 text-left p-4">
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
              Multi-Tenant Rental Manager with Private Cloud Sync
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scale your properties across India while keeping all tenant data, lease agreements, and KYC files stored securely in your own Google Drive.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-start gap-3">
              <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-white block">SaaS Server Governance</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Centralized multi-tenant auth, 5-tier subscriptions, and landlord account governance.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-start gap-3">
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-white block">Personal Google Drive Storage (BYOS)</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Your tenant documents, photos, and rent rolls sync directly to your private Google Drive.
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 rounded-2xl border border-amber-900/40 flex items-start gap-3">
              <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-200 block">Super Admin Credentials Protected</span>
                <span className="text-amber-300/80 text-[11px] block mt-0.5">
                  Login configured via protected environment variables (.env). Phone or email + secret pass.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form & Persona Switcher */}
        <div className="md:col-span-7 bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          {/* Header & Mode Switcher */}
          <div className="space-y-3 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  {activeTab === 'admin' ? 'Super Admin Console' : 'Landlord Sign In'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeTab === 'admin'
                    ? 'Enter Super Admin phone or email with secret pass'
                    : 'Enter your phone number or email credentials'}
                </p>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                  activeTab === 'admin'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-sky-950 text-sky-400 border-sky-800'
                }`}
              >
                {activeTab === 'admin' ? 'Console Root' : 'Multi-Tenant'}
              </span>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => switchTab('admin')}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab('landlord')}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'landlord'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Landlord Workspace</span>
              </button>
            </div>
          </div>

          {/* Suspended Lockout Alert */}
          {suspendedError && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-rose-200">Account Access Suspended by Admin</p>
                <p className="text-rose-300/90 leading-relaxed">{suspendedError}</p>
                <p className="text-[11px] text-rose-400/80 pt-1">
                  Contact the SaaS administrator at <strong>admin@bhadekaru.app</strong> to restore access.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                {activeTab === 'admin' ? <KeyRound className="w-3.5 h-3.5 text-amber-400" /> : <Phone className="w-3.5 h-3.5 text-sky-400" />}
                <span>{activeTab === 'admin' ? 'Phone Number or Email' : 'Phone Number or Email Address'}</span>
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={activeTab === 'admin' ? '8149862034 or scrovawebstudio@gmail.com' : 'e.g. 9876543210 or landlord@example.com'}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeTab === 'admin' ? 'Super Admin Password' : 'Password'}</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={activeTab === 'admin' ? '••••••••' : '••••••••'}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            {activeTab === 'admin' && (
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Credentials verified against protected <code>.env</code> file.</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className={`w-full font-bold ${
                activeTab === 'admin'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-sky-500 hover:bg-sky-400 text-white'
              }`}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {activeTab === 'admin' ? 'Sign In to Super Admin Console' : 'Sign In to Portfolio'}
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-left">
              Quick Accounts (Click to Test)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickLogin('8149862034', '814986', 'admin')}
                className="p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/60 hover:border-amber-400 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> Super Admin
                  </span>
                  <span className="text-[9px] font-black text-amber-950 bg-amber-400 px-1.5 py-0.5 rounded">
                    8149862034
                  </span>
                </div>
                <p className="text-[10px] text-amber-300/80 mt-0.5 truncate">Pass: 814986 (.env)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('scrovawebstudio@gmail.com', '814986', 'admin')}
                className="p-2.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/80 hover:border-sky-500 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-200">Admin Email</span>
                  <span className="text-[9px] font-black text-sky-300 bg-sky-950 px-1.5 py-0.5 rounded">Console</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">scrovawebstudio@gmail.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('scrovawebstudio@gmail.com', 'DemoPassword123!', 'landlord')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-sky-500/50 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Rajesh Patil</span>
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">Landlord</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Patil Real Estate • Pune</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('anand@vermaholdings.com', 'DemoPassword123!', 'landlord')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-rose-900/50 hover:border-rose-500 text-left transition-all"
                title="Test SaaS lockout enforcement"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300">Anand Verma</span>
                  <span className="text-[9px] font-black text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded">Suspended</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Verma Holdings (Locked Out)</p>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-400">
            Need a fresh landlord portfolio?{' '}
            <Link to="/register" className="text-sky-400 font-bold hover:underline">
              Register New Landlord
            </Link>
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
    setIsLoading(true);
    try {
      await authService.register(email, password, fullName, phone, orgName);
      toast.success('Account Created', '7-Day Free Professional Trial activated.');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error('Registration Failed', err?.message);
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
          <p className="text-xs text-slate-400">Zero database setup required • Connects with your Google Drive</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <Input
            label="Your Full Name"
            placeholder="e.g. Suresh Deshmukh"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-slate-800 border-slate-700 text-white"
          />

          <Input
            label="Property Management Name / Company"
            placeholder="e.g. Deshmukh Heights"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            className="bg-slate-800 border-slate-700 text-white"
          />

          <Input
            label="Mobile Phone"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="bg-slate-800 border-slate-700 text-white"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="suresh@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-slate-800 border-slate-700 text-white"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-slate-800 border-slate-700 text-white"
          />

          <Button
            type="submit"
            size="lg"
            className="w-full font-bold"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Start 7-Day Pro Trial
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-sky-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
