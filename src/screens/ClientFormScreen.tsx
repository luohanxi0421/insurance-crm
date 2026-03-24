import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  View,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createClient, updateClient, fetchClientById } from '../lib/api';
import { useClientStore } from '../store/clientStore';
import { useAuth } from '../store/authStore';

type Props = {
  route: RouteProp<RootStackParamList, 'ClientForm'>;
  navigation: any;
};

export default function ClientFormScreen({ route, navigation }: Props) {
  const clientId = route.params?.clientId;
  const isEdit = Boolean(clientId);
  const { user } = useAuth();
  const { addClient, updateClient: updateInStore } = useClientStore();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthdayType, setBirthdayType] = useState<'solar' | 'lunar'>('solar');
  const [lunarMonth, setLunarMonth] = useState('');
  const [lunarDay, setLunarDay] = useState('');
  const [lunarIsLeap, setLunarIsLeap] = useState(false);
  const [lunarLeapOrder, setLunarLeapOrder] = useState('1');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && clientId) {
      loadClient(clientId);
    }
  }, [isEdit, clientId]);

  const loadClient = async (id: string) => {
    try {
      const c = await fetchClientById(id);
      setName(c.name || '');
      setGender((c.gender as any) || '');
      setPhone(c.phone || '');
      setBirthDate(c.birth_date ? c.birth_date.split('T')[0] : '');
      setBirthdayType(c.birthday_type || 'solar');
      setLunarMonth(c.lunar_birthday_month ? String(c.lunar_birthday_month) : '');
      setLunarDay(c.lunar_birthday_day ? String(c.lunar_birthday_day) : '');
      setLunarIsLeap(Boolean(c.lunar_is_leap_month));
      setLunarLeapOrder(c.lunar_leap_month_order ? String(c.lunar_leap_month_order) : '1');
      setNotes(c.notes || '');
    } catch {
      Alert.alert('Error', 'Failed to load client data.');
    }
  };

  const validDate = (raw: string) => /^\d{4}-\d{2}-\d{2}$/.test(raw);

  const handleSave = async () => {
    if (!user) {
      return;
    }

    if (!name.trim()) {
      Alert.alert('Validation', 'Client name is required.');
      return;
    }

    if (birthdayType === 'solar') {
      if (birthDate && !validDate(birthDate)) {
        Alert.alert('Validation', 'Solar birthday must be YYYY-MM-DD format.');
        return;
      }
    } else {
      const month = Number(lunarMonth);
      const day = Number(lunarDay);
      if (!month || month < 1 || month > 12) {
        Alert.alert('Validation', 'Lunar month must be 1-12.');
        return;
      }
      if (!day || day < 1 || day > 30) {
        Alert.alert('Validation', 'Lunar day must be 1-30.');
        return;
      }
      if (lunarIsLeap && !['1', '2'].includes(lunarLeapOrder)) {
        Alert.alert('Validation', 'Leap month order must be 1 or 2.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        user_id: user.id,
        name: name.trim(),
        gender: gender || null,
        phone: phone.trim() || null,
        birthday_type: birthdayType,
        birth_date: birthdayType === 'solar' ? birthDate || null : null,
        lunar_birthday_month: birthdayType === 'lunar' ? Number(lunarMonth) || null : null,
        lunar_birthday_day: birthdayType === 'lunar' ? Number(lunarDay) || null : null,
        lunar_is_leap_month: birthdayType === 'lunar' ? lunarIsLeap : null,
        lunar_leap_month_order:
          birthdayType === 'lunar' && lunarIsLeap ? Number(lunarLeapOrder) || null : null,
        notes: notes.trim() || null,
      };

      if (isEdit && clientId) {
        const updated = await updateClient(clientId, payload);
        updateInStore(clientId, updated);
      } else {
        const created = await createClient(payload);
        addClient(created);
      }

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Save failed', err?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Client name" />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
        {(['male', 'female'] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.choiceButton, gender === g && styles.choiceButtonActive]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.choiceText, gender === g && styles.choiceTextActive]}>
              {g === 'male' ? 'Male' : 'Female'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone number"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Birthday Type</Text>
      <View style={styles.row}>
        {(['solar', 'lunar'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.choiceButton, birthdayType === type && styles.choiceButtonActive]}
            onPress={() => setBirthdayType(type)}
          >
            <Text style={[styles.choiceText, birthdayType === type && styles.choiceTextActive]}>
              {type === 'solar' ? 'Solar' : 'Lunar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {birthdayType === 'solar' ? (
        <>
          <Text style={styles.label}>Solar Birthday</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Lunar Month</Text>
          <TextInput
            style={styles.input}
            value={lunarMonth}
            onChangeText={setLunarMonth}
            placeholder="1-12"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Lunar Day</Text>
          <TextInput
            style={styles.input}
            value={lunarDay}
            onChangeText={setLunarDay}
            placeholder="1-30"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Leap Month</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.choiceButton, !lunarIsLeap && styles.choiceButtonActive]}
              onPress={() => setLunarIsLeap(false)}
            >
              <Text style={[styles.choiceText, !lunarIsLeap && styles.choiceTextActive]}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceButton, lunarIsLeap && styles.choiceButtonActive]}
              onPress={() => setLunarIsLeap(true)}
            >
              <Text style={[styles.choiceText, lunarIsLeap && styles.choiceTextActive]}>Yes</Text>
            </TouchableOpacity>
          </View>

          {lunarIsLeap ? (
            <>
              <Text style={styles.label}>Leap Month Order</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.choiceButton, lunarLeapOrder === '1' && styles.choiceButtonActive]}
                  onPress={() => setLunarLeapOrder('1')}
                >
                  <Text style={[styles.choiceText, lunarLeapOrder === '1' && styles.choiceTextActive]}>
                    First
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.choiceButton, lunarLeapOrder === '2' && styles.choiceButtonActive]}
                  onPress={() => setLunarLeapOrder('2')}
                >
                  <Text style={[styles.choiceText, lunarLeapOrder === '2' && styles.choiceTextActive]}>
                    Second
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </>
      )}

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes"
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, color: '#666', marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', columnGap: 12 },
  choiceButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  choiceButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e8f0fe',
  },
  choiceText: { fontSize: 15, color: '#666' },
  choiceTextActive: { color: '#007AFF', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
