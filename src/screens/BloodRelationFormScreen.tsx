import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchClients, addBloodRelationship } from '../lib/api';
import { useAuth } from '../store/authStore';
import { Client } from '../types';

type Props = {
  route: RouteProp<RootStackParamList, 'BloodRelationForm'>;
  navigation: any;
};

export default function BloodRelationFormScreen({ route, navigation }: Props) {
  const { clientId } = route.params;
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [relationType, setRelationType] = useState<'father' | 'mother'>('father');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
  }, [user]);

  const loadClients = async () => {
    if (!user) return;
    try {
      const data = await fetchClients(user.id);
      setClients(data.filter((c) => c.id !== clientId));
    } catch {
      Alert.alert('错误', '加载候选客户失败。');
    }
  };

  const save = async () => {
    if (!selectedId) {
      Alert.alert('校验失败', '请选择一个关联人。');
      return;
    }

    setSaving(true);
    try {
      await addBloodRelationship(clientId, selectedId, relationType);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('保存失败', err?.message || '未知错误');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>关系类型</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.choiceButton, relationType === 'father' && styles.choiceButtonActive]}
          onPress={() => setRelationType('father')}
        >
          <Text style={[styles.choiceText, relationType === 'father' && styles.choiceTextActive]}>
            父亲
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.choiceButton, relationType === 'mother' && styles.choiceButtonActive]}
          onPress={() => setRelationType('mother')}
        >
          <Text style={[styles.choiceText, relationType === 'mother' && styles.choiceTextActive]}>
            母亲
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>选择关联人</Text>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.clientItem, selectedId === item.id && styles.clientItemActive]}
            onPress={() => setSelectedId(item.id)}
          >
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientMeta}>{item.phone || '-'}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={save}>
        <Text style={styles.saveButtonText}>{saving ? '保存中...' : '保存关系'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', columnGap: 12, marginBottom: 14 },
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
