import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { ensureSignedIn } from '../src/firebase';
import { recordListening } from '../src/listeners';
import { hasListenedToday, markListenedToday, useSettings } from '../src/useSettings';

interface Props {
  autoPlay: boolean;
  onAutoPlayHandled: () => void;
}

type PlayState = 'idle' | 'playing' | 'done' | 'error';

export default function HomeScreen({ autoPlay, onAutoPlayHandled }: Props) {
  const { settings } = useSettings();
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [listenedToday, setListenedToday] = useState(false);
  const [checkingHistory, setCheckingHistory] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    hasListenedToday().then((val) => {
      setListenedToday(val);
      setCheckingHistory(false);
    });
  }, []);

  useEffect(() => {
    if (autoPlay && !listenedToday && playState === 'idle') {
      play();
      onAutoPlayHandled();
    }
  }, [autoPlay, listenedToday, playState]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function play() {
    try {
      setPlayState('playing');
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        require('../assets/test-tone.mp3'),
        { shouldPlay: true }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayState('done');
          setListenedToday(true);
          markListenedToday();
          recordLocation();
          sound.unloadAsync();
        }
      });
    } catch {
      setPlayState('error');
    }
  }

  async function recordLocation() {
    try {
      await ensureSignedIn();
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await recordListening(loc.coords.latitude, loc.coords.longitude);
    } catch {
      // location recording is best-effort
    }
  }

  const timeLabel = `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}`;

  if (checkingHistory) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#6B8F71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Daily tone at</Text>
      <Text style={styles.time}>{timeLabel}</Text>

      {listenedToday ? (
        <View style={styles.doneWrapper}>
          <Text style={styles.doneIcon}>✓</Text>
          <Text style={styles.doneText}>Listened today</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.playBtn, playState === 'playing' && styles.playBtnActive]}
          onPress={play}
          disabled={playState === 'playing'}
          activeOpacity={0.8}
        >
          {playState === 'playing' ? (
            <ActivityIndicator color="#0A0A0A" size="large" />
          ) : (
            <Text style={styles.playIcon}>▶</Text>
          )}
        </TouchableOpacity>
      )}

      {playState === 'error' && (
        <Text style={styles.errorText}>Could not play audio. Tap to retry.</Text>
      )}

      <Text style={styles.hint}>
        {listenedToday
          ? 'Check the Community tab to see nearby listeners.'
          : 'Tap to play your daily tone.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  label: {
    color: '#7A7A7A',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  time: {
    color: '#E8E0D5',
    fontSize: 56,
    fontVariant: ['tabular-nums'],
    fontWeight: '200',
    marginBottom: 56,
  },
  playBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6B8F71',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  playBtnActive: {
    opacity: 0.7,
  },
  playIcon: {
    color: '#0A0A0A',
    fontSize: 32,
    marginLeft: 6,
  },
  doneWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  doneIcon: {
    color: '#6B8F71',
    fontSize: 56,
    lineHeight: 64,
  },
  doneText: {
    color: '#6B8F71',
    fontSize: 16,
    letterSpacing: 1,
  },
  hint: {
    color: '#4A4A4A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    marginBottom: 16,
  },
});
