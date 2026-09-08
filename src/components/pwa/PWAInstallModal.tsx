import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Apple,
  Share2,
  PlusSquare,
  X,
  CheckCircle2,
  Zap,
  WifiOff,
  ShieldCheck,
  Chrome,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Button } from '../ui/Button';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div
      id="pwa-install-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="pwa-install-modal"
        className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 text-slate-900 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-sky-600/30 shrink-0">
            भा
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Install Bhadekaru App
              </h2>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                PWA Mobile
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Install directly to your Android or iPhone home screen with zero app store hassle.
            </p>
          </div>
        </div>

        {/* Success message if installed */}
        {isInstalled || installSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-800">App Successfully Installed!</h3>
            <p className="text-xs text-emerald-600">
              Bhadekaru is now ready on your device home screen. You can launch it anytime.
            </p>
          </div>
        ) : null}

        {/* OS Platform Selector Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'android'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android (APK / PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'ios'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-800" />
            <span>iPhone / iPad (iOS)</span>
          </button>
        </div>

        {/* Android Tab Content */}
        {activeTab === 'android' && (
          <div className="space-y-4 text-left">
            {isInstallable ? (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
                  <Download className="w-4 h-4 text-sky-600" />
                  <span>Ready for One-Tap Installation</span>
                </div>
                <p className="text-xs text-slate-600">
                  Your browser supports direct installation. Tap the button below to add Bhadekaru to your home screen.
                </p>
                <Button
                  onClick={handleNativeInstall}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Install on Android Now
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs">
                    <strong className="text-slate-800 block">Open in Chrome or Brave</strong>
                    <span className="text-slate-500">
                      Ensure you are visiting this app in Google Chrome or any modern Android browser.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs">
                    <strong className="text-slate-800 flex items-center gap-1">
                      Tap Browser Menu <MoreVertical className="w-3.5 h-3.5 text-slate-700 inline" /> (Top Right)
                    </strong>
                    <span className="text-slate-500">
                      Tap the three dots in the top right corner of Chrome.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs">
                    <strong className="text-slate-800 flex items-center gap-1">
                      Tap "Install App" or "Add to Home screen"
                    </strong>
                    <span className="text-slate-500">
                      Confirm the prompt. An APK-like standalone icon will be placed directly onto your home screen!
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* iOS Tab Content */}
        {activeTab === 'ios' && (
          <div className="space-y-3 text-left">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="text-xs">
                <strong className="text-slate-800 block">Open in Safari</strong>
                <span className="text-slate-500">
                  Apple only allows PWA installation via the built-in Safari browser.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="text-xs">
                <strong className="text-slate-800 flex items-center gap-1.5">
                  Tap the Share Button <Share2 className="w-3.5 h-3.5 text-sky-600 inline" />
                </strong>
                <span className="text-slate-500">
                  Located in the bottom navigation bar of Safari on iPhone (or top bar on iPad).
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="text-xs">
                <strong className="text-slate-800 flex items-center gap-1.5">
                  Select "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-emerald-600 inline" />
                </strong>
                <span className="text-slate-500">
                  Scroll down the share sheet and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top right.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-600">
          <div className="p-2 bg-slate-50 rounded-xl">
            <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <span className="font-bold block text-slate-800">Instant Load</span>
            <span>Cached locally</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <WifiOff className="w-4 h-4 text-sky-500 mx-auto mb-1" />
            <span className="font-bold block text-slate-800">Works Offline</span>
            <span>No data loss</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <span className="font-bold block text-slate-800">Full Screen</span>
            <span>No browser bar</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
