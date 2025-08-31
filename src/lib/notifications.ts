import type { PoolType } from "@/types";

export interface NotificationSettings {
  enabled: boolean;
  sound: string;
  volume: number;
}

export interface PoolNotificationSettings {
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

class NotificationManager {
  private settings: PoolNotificationSettings;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Load settings from localStorage
    const saved = localStorage.getItem('notification-settings');
    this.settings = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    this.preloadSounds();
  }

  private preloadSounds() {
    // Preload notification sounds
    const sounds = [
      { pool: 'CRM', file: '/sounds/crm-notification.mp3' },
      { pool: 'BLASTER', file: '/sounds/blaster-notification.mp3' },
      { pool: 'WARMUP', file: '/sounds/warmup-notification.mp3' },
    ];

    sounds.forEach(({ pool, file }) => {
      const audio = new Audio(file);
      audio.preload = 'auto';
      this.audioCache.set(pool, audio);
    });
  }

  getSettings(): PoolNotificationSettings {
    return { ...this.settings };
  }

  updateSettings(pool: PoolType, settings: Partial<NotificationSettings>) {
    this.settings[pool] = { ...this.settings[pool], ...settings };
    localStorage.setItem('notification-settings', JSON.stringify(this.settings));
    
    // Update audio if sound changed
    if (settings.sound) {
      const audio = new Audio(`/sounds/${settings.sound}`);
      audio.preload = 'auto';
      this.audioCache.set(pool, audio);
    }
  }

  async playNotification(pool: PoolType) {
    const poolSettings = this.settings[pool];
    
    if (!poolSettings.enabled) return;

    // Request notification permission if not granted
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(`New ${pool} Message`, {
        body: `You have received a new message in ${pool} pool`,
        icon: '/favicon.ico',
        tag: `${pool}-message`,
      });
    }

    // Play sound
    this.playSound(pool);
  }

  private playSound(pool: PoolType) {
    const poolSettings = this.settings[pool];
    const audio = this.audioCache.get(pool);
    
    if (audio && poolSettings.enabled) {
      audio.volume = poolSettings.volume;
      audio.currentTime = 0;
      audio.play().catch(console.error);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  testNotification(pool: PoolType) {
    this.playNotification(pool);
  }
}

export const notificationManager = new NotificationManager();
export default notificationManager;