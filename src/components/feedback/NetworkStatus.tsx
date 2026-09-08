import React, { useState } from 'react';
import { WifiOff, Download, X, Smartphone, Apple } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../pwa/PWAInstallModal';

export const NetworkStatus: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md animate-in fade-in duration-200"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are currently offline. Changes are saved locally and will sync once connection returns.</span>
    </div>
  );
};

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Suppress if already running in standalone PWA or dismissed
  if (isInstalled || isDismissed) return null;

  const handleAction = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div
        id="pwa-install-banner-bar"
        className="bg-slate-900 text-white px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 text-xs md:text-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-xs">
            भा
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">Download Bhadekaru App</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.2 rounded">
                Android & iOS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {isIOS
                ? 'Install on your iPhone home screen: tap Share → Add to Home Screen.'
                : 'Install standalone app on your Android device for instant offline access & push reminders.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAction}
            className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstallable ? 'Install App' : 'Download for Phone'}</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
