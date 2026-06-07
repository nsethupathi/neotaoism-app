import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { requestNotificationPermissions } from '../src/notifications';
import { useSettings } from '../src/useSettings';

export default function SettingsScreen() {
  const { settings, saveSettings, loaded } = useSettings();

  const [hourText, setHourText] = useState('');
  const [minuteText, setMinuteText] = useState('');
  const [radiusText, setRadiusText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loaded) {
      setHourText(String(settings.hour));
      setMinuteText(String(settings.minute).padStart(2, '0'));
      setRadiusText(String(settings.radiusKm));
    }
  }, [loaded]);

  async function handleSave() {
    const hour = parseInt(hourText, 10);
    const minute = parseInt(minuteText, 10);
    const radiusKm = parseFloat(radiusText);

    if (isNaN(hour) || hour < 0 || hour > 23) {
      Alert.alert('Invalid hour', 'Enter a number between 0 and 23.');
      return;
    }
    if (isNaN(minute) || minute < 0 || minute > 59) {
      Alert.alert('Invalid minute', 'Enter a number between 0 and 59.');
      return;
    }
    if (isNaN(radiusKm) || radiusKm <= 0 || radiusKm > 500) {
      Alert.alert('Invalid radius', 'Enter a distance between 1 and 500 km.');
      return;
    }

    setSaving(true);
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert(
        'Notifications blocked',
        'Enable notifications in Settings so the daily reminder can fire.'
      );
      setSaving(false);
      return;
    }

    await saveSettings({ hour, minute, radiusKm });
    setSaving(false);
    Alert.alert(
      'Saved',
      `Daily tone scheduled for ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} · ${radiusKm} km radius`
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Playback time</Text>
        <Text style={styles.sectionHint}>A notification will fire at this time each day.</Text>

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>Hour (0–23)</Text>
            <TextInput
              style={styles.input}
              value={hourText}
              onChangeText={setHourText}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="9"
              placeholderTextColor="#4A4A4A"
            />
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>Minute (0–59)</Text>
            <TextInput
              style={styles.input}
              value={minuteText}
              onChangeText={setMinuteText}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="00"
              placeholderTextColor="#4A4A4A"
            />
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Community radius</Text>
        <Text style={styles.sectionHint}>
          How far to search for other listeners (in kilometres).
        </Text>

        <TextInput
          style={[styles.input, styles.radiusInput]}
          value={radiusText}
          onChangeText={setRadiusText}
          keyboardType="decimal-pad"
          maxLength={6}
          placeholder="10"
          placeholderTextColor="#4A4A4A"
        />
        <Text style={styles.fieldLabel}>km</Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save & schedule'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    padding: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    color: '#E8E0D5',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  sectionHint: {
    color: '#4A4A4A',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  timeField: {
    flex: 1,
  },
  fieldLabel: {
    color: '#4A4A4A',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#E8E0D5',
    fontSize: 24,
    fontVariant: ['tabular-nums'],
    padding: 16,
    textAlign: 'center',
  },
  timeSeparator: {
    color: '#4A4A4A',
    fontSize: 32,
    paddingBottom: 14,
  },
  radiusInput: {
    fontSize: 24,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#1A1A1A',
    marginVertical: 32,
  },
  saveBtn: {
    backgroundColor: '#6B8F71',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 40,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#0A0A0A',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
