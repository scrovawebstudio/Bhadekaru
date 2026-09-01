import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Building2, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';
import { useToast } from '../../components/feedback/Toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('scrovawebstudio@gmail.com');
  const [password, setPassword] = useState('DemoPassword123!');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.login(email, password);
      toast.success('Signed in successfully', 'Welcome back to Bhadekaru.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Login Failed', err?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 antialiased">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 sm:p-10 border border-slate-700 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md">
            भा
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Sign In to Bhadekaru</h2>
          <p className="text-xs text-slate-400">Property & Tenant Management SaaS</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />

          <Button type="submit" size="lg" className="w-full font-bold" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Sign In
          </Button>
        </form>

        <div className="p-3.5 bg-slate-700/50 rounded-2xl border border-slate-600/50 text-xs text-slate-400 text-center">
          Demo Mode active: Click <strong>Sign In</strong> to enter with pre-loaded demo properties and tenants.
        </div>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-sky-400 font-bold hover:underline">
            Register for free trial
          </Link>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('Rajesh Patil');
  const [email, setEmail] = useState('scrovawebstudio@gmail.com');
  const [phone, setPhone] = useState('+91 98220 12345');
  const [password, setPassword] = useState('DemoPassword123!');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.register(email, password, fullName, phone);
      toast.success('Account Created', '7-Day Pro Trial activated.');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error('Registration Failed', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 antialiased">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 sm:p-10 border border-slate-700 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md">
            भा
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Create Bhadekaru Account</h2>
          <p className="text-xs text-slate-400">Start your 7-Day Free Professional Trial</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-slate-700 border-slate-600 text-white"
          />

          <Input
            label="Mobile Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="bg-slate-700 border-slate-600 text-white"
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-slate-700 border-slate-600 text-white"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-slate-700 border-slate-600 text-white"
          />

          <Button type="submit" size="lg" className="w-full font-bold" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Create Account
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
