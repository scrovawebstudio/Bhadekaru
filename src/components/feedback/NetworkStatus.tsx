import React, { useState, useEffect } from 'react';
import { WifiOff, Download, Smartphone, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4" />
      <span>You are currently offline. Changes will sync once your connection is restored.</span>
    </div>
  );
};

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || isDismissed || (!deferredPrompt && !isIOS)) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4 text-xs md:text-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shrink-0">
          भा
        </div>
        <div>
          <span className="font-bold text-slate-100">Install Bhadekaru App</span>
          <p className="text-xs text-slate-400">
            {isIOS ? 'Tap Share → "Add to Home Screen" for one-tap mobile access.' : 'Install on your device for lightning-fast property & rent management.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-slate-200 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
