import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Network } from '@capacitor/network';

export interface NativeDeviceInfo {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
}

class CapacitorService {
  private initialized = false;

  public getDeviceInfo(): NativeDeviceInfo {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
    return {
      isNative,
      platform,
      isAndroid: platform === 'android',
      isIOS: platform === 'ios',
      isWeb: platform === 'web' || !isNative,
    };
  }

  public async initNativeFeatures(onAppResume?: () => void) {
    if (this.initialized) return;
    this.initialized = true;

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Configure Status Bar on mobile
      await StatusBar.setStyle({ style: Style.Dark });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#0284c7' });
      }
    } catch {
      // Ignored if plugin not available
    }

    try {
      // Hide Splash Screen once webview is ready
      await SplashScreen.hide();
    } catch {
      // Ignored
    }

    try {
      // Handle Android hardware back button
      await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });

      // Handle App Resume / Foregrounding (trigger synchronization)
      await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && onAppResume) {
          onAppResume();
        }
      });
    } catch {
      // Ignored
    }
  }

  // Tactile Haptic Feedback
  public async triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const impactStyle =
        style === 'heavy'
          ? ImpactStyle.Heavy
          : style === 'medium'
          ? ImpactStyle.Medium
          : ImpactStyle.Light;
      await Haptics.impact({ style: impactStyle });
    } catch {
      // Ignored on unsupported platforms
    }
  }

  // Native Native Share (for Rent Invoices, Reminders, WhatsApp text)
  public async shareContent(options: { title: string; text?: string; url?: string; dialogTitle?: string }) {
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: options.dialogTitle || 'Share with Tenant',
        });
        return true;
      } catch {
        return false;
      }
    }

    // Web Fallback
    if (navigator.share) {
      try {
        await navigator.share(options);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  // Listen to network changes natively
  public async addNetworkListener(callback: (connected: boolean) => void) {
    if (Capacitor.isNativePlatform()) {
      try {
        await Network.addListener('networkStatusChange', (status) => {
          callback(status.connected);
        });
        const status = await Network.getStatus();
        callback(status.connected);
        return;
      } catch {
        // Fallback to web
      }
    }

    // Web fallback
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    callback(navigator.onLine);
  }
}

export const capacitorService = new CapacitorService();
