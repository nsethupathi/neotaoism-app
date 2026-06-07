import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleDailyNotification } from './notifications';

export interface Settings {
  hour: number;
  minute: number;
  radiusKm: number;
}

const DEFAULTS: Settings = { hour: 9, minute: 0, radiusKm: 10 };
const STORAGE_KEY = 'neotaoism_settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
        } catch {
          // corrupted, fall back to defaults
        }
      }
      setLoaded(true);
    });
  }, []);

  async function saveSettings(next: Partial<Settings>): Promise<void> {
    const merged = { ...settings, ...next };
    setSettings(merged);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    await scheduleDailyNotification(merged.hour, merged.minute);
  }

  return { settings, saveSettings, loaded };
}

const LISTENED_KEY = 'neotaoism_listened_date';

export async function markListenedToday(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await AsyncStorage.setItem(LISTENED_KEY, today);
}

export async function hasListenedToday(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(LISTENED_KEY);
  const today = new Date().toISOString().split('T')[0];
  return stored === today;
}
