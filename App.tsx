import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { ensureSignedIn } from './src/firebase';
import { requestNotificationPermissions } from './src/notifications';
import HomeScreen from './screens/HomeScreen';
import CommunityScreen from './screens/CommunityScreen';
import SettingsScreen from './screens/SettingsScreen';

type Tab = 'home' | 'community' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Listen', icon: '◉' },
  { id: 'community', label: 'Nearby', icon: '◎' },
  { id: 'settings', label: 'Settings', icon: '⊙' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [autoPlay, setAutoPlay] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    // Anonymous auth so Firestore rules can identify users.
    ensureSignedIn().catch(() => {});

    // Request notification permission on first launch (best-effort).
    requestNotificationPermissions().catch(() => {});

    // Handle foreground notification display (no-op; handler above controls behavior).
    notificationListener.current = Notifications.addNotificationReceivedListener((_n) => {});

    // When user taps the daily-tone notification, navigate to Home and auto-play.
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        if (response.notification.request.content.data?.autoPlay) {
          setActiveTab('home');
          setAutoPlay(true);
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen autoPlay={autoPlay} onAutoPlayHandled={() => setAutoPlay(false)} />
        )}
        {activeTab === 'community' && <CommunityScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 20,
    color: '#3A3A3A',
    marginBottom: 3,
  },
  tabIconActive: {
    color: '#6B8F71',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#3A3A3A',
  },
  tabLabelActive: {
    color: '#6B8F71',
  },
});
