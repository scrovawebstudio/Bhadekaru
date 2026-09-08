import React, { useState } from 'react';
import { Download, Smartphone, Apple } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'topbar' | 'sidebar' | 'banner' | 'icon';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'topbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running inside an installed PWA (standalone window), suppress the prompt
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
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
      {variant === 'topbar' && (
        <button
          id="pwa-install-btn-topbar"
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all ${className}`}
          title="Install Bhadekaru App on Android / iOS"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Download App</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          id="pwa-install-btn-sidebar"
          onClick={handleClick}
          className={`w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black text-xs shadow-xs group-hover:scale-105 transition-transform">
                भा
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Download App</span>
                <span className="text-[10px] text-slate-400 block font-medium">Android & iOS</span>
              </div>
            </div>
            <div className="w-6 h-6 rounded-lg bg-slate-700/70 flex items-center justify-center text-slate-300 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Download className="w-3.5 h-3.5" />
            </div>
          </div>
        </button>
      )}

      {variant === 'banner' && (
        <div
          id="pwa-install-banner"
          className={`p-3.5 bg-gradient-to-r from-sky-900 via-slate-900 to-slate-950 text-white rounded-2xl border border-sky-800 shadow-md flex items-center justify-between gap-3 ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              भा
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Download Bhadekaru Mobile App</span>
              <span className="text-[11px] text-slate-300 block">
                Direct Android & iPhone installation • Instant offline sync
              </span>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </div>
      )}

      {variant === 'icon' && (
        <button
          id="pwa-install-btn-icon"
          onClick={handleClick}
          className={`p-2 rounded-xl text-slate-600 hover:text-sky-600 hover:bg-slate-100 transition-colors ${className}`}
          title="Install App on Device"
        >
          <Download className="w-4 h-4" />
        </button>
      )}

      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
