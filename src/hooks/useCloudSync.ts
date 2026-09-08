import { useState, useEffect, useCallback } from 'react';
import { cloudSyncService, CloudSyncInfo } from '../services/cloudSyncService';
import { capacitorService } from '../services/capacitorService';

export function useCloudSync() {
  const [syncInfo, setSyncInfo] = useState<CloudSyncInfo>(cloudSyncService.getStatus());
  const deviceInfo = capacitorService.getDeviceInfo();

  useEffect(() => {
    // Initial status
    setSyncInfo(cloudSyncService.getStatus());

    const handleSyncEvent = (e: any) => {
      if (e.detail) {
        setSyncInfo(e.detail);
      }
    };

    window.addEventListener('bhadekaru_cloud_sync', handleSyncEvent);
    return () => {
      window.removeEventListener('bhadekaru_cloud_sync', handleSyncEvent);
    };
  }, []);

  const syncNow = useCallback(async () => {
    capacitorService.triggerHaptic('light');
    return await cloudSyncService.pullLatest();
  }, []);

  const forcePush = useCallback(async () => {
    capacitorService.triggerHaptic('medium');
    return await cloudSyncService.pushCurrentState();
  }, []);

  const setServerUrl = useCallback(async (url: string) => {
    await cloudSyncService.setServerUrl(url);
  }, []);

  return {
    ...syncInfo,
    deviceInfo,
    syncNow,
    forcePush,
    setServerUrl,
  };
}
