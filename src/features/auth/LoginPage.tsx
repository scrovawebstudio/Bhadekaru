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
  UserCheck
} from 'lucide-react';
import { useToast } from '../../components/feedback/Toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('scrovawebstudio@gmail.com');
  const [password, setPassword] = useState('DemoPassword123!');
  const [isLoading, setIsLoading] = useState(false);
  const [suspendedError, setSuspendedError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setSuspendedError(null);
    setIsLoading(true);
    const targetEmail = customEmail || email;

    try {
      const res = await authService.login(targetEmail, password);
      toast.success('Signed in successfully', `Welcome back, ${res.user.full_name || 'Landlord'}.`);
      if (res.session.role === 'super_admin') {
        navigate('/admin');
      } else {
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

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    handleLogin(undefined, userEmail);
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
                <span className="font-bold text-white block">SaaS Server Layer</span>
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
          </div>
        </div>

        {/* Right Side: Login Form & Persona Switcher */}
        <div className="md:col-span-7 bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">Landlord Sign In</h3>
              <p className="text-xs text-slate-400">Enter your credentials or pick a demo account</p>
            </div>
            <span className="text-[10px] font-extrabold bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded-full">
              Multi-Tenant
            </span>
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
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />

            <Button
              type="submit"
              size="lg"
              className="w-full font-bold"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Portfolio
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-left">
              Quick Test Accounts (Click to Instant Login)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickLogin('scrovawebstudio@gmail.com')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-sky-500/50 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Rajesh Patil</span>
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">Pro Trial</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Patil Real Estate • Pune</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('vikram@sharmaproperties.in')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-sky-500/50 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Vikram Sharma</span>
                  <span className="text-[9px] font-black text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded">Growth</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Sharma Living • Bengaluru</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('anand@vermaholdings.com')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-rose-900/50 hover:border-rose-500 text-left transition-all"
                title="Test SaaS lockout enforcement"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300">Anand Verma</span>
                  <span className="text-[9px] font-black text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded">Suspended</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Verma Holdings (Locked Out)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@bhadekaru.app')}
                className="p-2.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/80 hover:border-sky-500 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-200">Super Admin</span>
                  <span className="text-[9px] font-black text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded">Console</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Subscription & Landlord Controls</p>
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
