import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { PoolType } from "@/types";

interface NotificationSettings {
  enabled: boolean;
  sound: string;
  volume: number;
}

interface PoolNotificationSettings {
  CRM: NotificationSettings;
  BLASTER: NotificationSettings;
  WARMUP: NotificationSettings;
}

const DEFAULT_SETTINGS: PoolNotificationSettings = {
  CRM: {
    enabled: true,
    sound: "crm-notification.mp3",
    volume: 0.7,
  },
  BLASTER: {
    enabled: true,
    sound: "blaster-notification.mp3", 
    volume: 0.5,
  },
  WARMUP: {
    enabled: true,
    sound: "warmup-notification.mp3",
    volume: 0.3,
  },
};

export const useNotifications = () => {
  const [settings, setSettings] = useState<PoolNotificationSettings>(DEFAULT_SETTINGS);
  const [audioCache] = useState(new Map<string, HTMLAudioElement>());
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // Preload notification sounds
    const sounds = [
      { pool: 'CRM', file: '/sounds/crm-notification.mp3' },
      { pool: 'BLASTER', file: '/sounds/blaster-notification.mp3' },
      { pool: 'WARMUP', file: '/sounds/warmup-notification.mp3' },
    ];

    sounds.forEach(({ pool, file }) => {
      const audio = new Audio(file);
      audio.preload = 'auto';
      audioCache.set(pool, audio);
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [audioCache]);

  const updateSettings = (pool: PoolType, newSettings: Partial<NotificationSettings>) => {
    const updated = {
      ...settings,
      [pool]: { ...settings[pool], ...newSettings }
    };
    setSettings(updated);
    localStorage.setItem('notification-settings', JSON.stringify(updated));
    
    // Update audio if sound changed
    if (newSettings.sound) {
      const audio = new Audio(`/sounds/${newSettings.sound}`);
      audio.preload = 'auto';
      audioCache.set(pool, audio);
    }
  };

  const playNotification = async (pool: PoolType, message?: string) => {
    const poolSettings = settings[pool];
    
    if (!poolSettings.enabled) return;

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(`New ${pool} Message`, {
        body: message || `You have received a new message in ${pool} pool`,
        icon: '/favicon.ico',
        tag: `${pool}-message`,
      });
    }

    // Show toast notification
    toast({
      title: `New ${pool} Message`,
      description: message || `You have a new message in ${pool}`,
    });

    // Play sound
    const audio = audioCache.get(pool);
    if (audio && poolSettings.enabled) {
      audio.volume = poolSettings.volume;
      audio.currentTime = 0;
      audio.play().catch(console.error);
    }
  };

  const testNotification = (pool: PoolType) => {
    playNotification(pool, `This is a test notification for ${pool} pool`);
  };

  return {
    settings,
    updateSettings,
    playNotification,
    testNotification,
  };
};