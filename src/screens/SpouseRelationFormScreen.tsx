import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchClients, addSpouseRelationship } from '../lib/api';
import { useAuth } from '../store/authStore';
import { Client } from '../types';

type Props = {
  route: RouteProp<RootStackParamList, 'SpouseRelationForm'>;
  navigation: any;
};

export default function SpouseRelationFormScreen({ route, navigation }: Props) {
  const { clientId } = route.params;
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [relationType, setRelationType] = useState<'spouse' | 'cohabiting'>('spouse');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
  }, [user]);

  const currentClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const loadClients = async () => {
    if (!user) return;
    try {
      const data = await fetchClients(user.id);
      setClients(data);
    } catch {
      Alert.alert('Error', 'Failed to load candidate clients.');
    }
  };

  const validDate = (raw: string) => /^\d{4}-\d{2}-\d{2}$/.test(raw);

  const save = async () => {
    if (!selectedId) {
      Alert.alert('Validation', 'Please select one related person.');
      return;
    }

    if (startDate && !validDate(startDate)) {
      Alert.alert('Validation', 'Start date must be YYYY-MM-DD.');
      return;
    }

    if (endDate && !validDate(endDate)) {
      Alert.alert('Validation', 'End date must be YYYY-MM-DD.');
      return;
    }

    const source = currentClient;
    const target = clients.find((c) => c.id === selectedId);
    if (!source || !target) {
      Alert.alert('Validation', 'Invalid relation data.');
      return;
    }

    const maleId = source.gender === 'male' ? source.id : target.gender === 'male' ? target.id : source.id;
    const femaleId = source.gender === 'female' ? source.id : target.gender === 'female' ? target.id : target.id;

    setSaving(true);
    try {
      await addSpouseRelationship(
        maleId,
        femaleId,
        relationType,
        startDate || undefined,
        endDate || undefined
      );
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Save failed', err?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Relation Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.choiceButton, relationType === 'spouse' && styles.choiceButtonActive]}
          onPress={() => setRelationType('spouse')}
        >
          <Text style={[styles.choiceText, relationType === 'spouse' && styles.choiceTextActive]}>
            Spouse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.choiceButton, relationType === 'cohabiting' && styles.choiceButtonActive]}
          onPress={() => setRelationType('cohabiting')}
        >
          <Text style={[styles.choiceText, relationType === 'cohabiting' && styles.choiceTextActive]}>
            Cohabiting
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Start Date (optional)</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.title}>End Date (optional, for historical relation)</Text>
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={setEndDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.title}>Select Related Person</Text>
      <FlatList
        data={clients.filter((c) => c.id !== clientId)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.clientItem, selectedId === item.id && styles.clientItemActive]}
            onPress={() => setSelectedId(item.id)}
          >
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientMeta}>{item.gender || 'unknown'}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={save}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Relation'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', columnGap: 12, marginBottom: 10 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  choiceButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  choiceButtonActive: { borderColor: '#007AFF', backgroundColor: '#e8f0fe' },
  choiceText: { fontSize: 15, color: '#666' },
  choiceTextActive: { color: '#007AFF', fontWeight: '600' },
  list: { paddingBottom: 10 },
  clientItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  clientItemActive: { borderColor: '#007AFF' },
  clientName: { fontSize: 15, color: '#333', fontWeight: '500' },
  clientMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
