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
      setNotes(c.notes || '');
    } catch {
      Alert.alert('错误', '加载客户数据失败。');
    }
  };

  const validDate = (raw: string) => /^\d{4}-\d{2}-\d{2}$/.test(raw);

  const handleSave = async () => {
    if (!user) {
      return;
    }

    if (!name.trim()) {
      Alert.alert('校验失败', '客户姓名不能为空。');
      return;
    }

    if (birthDate && !validDate(birthDate)) {
      Alert.alert('校验失败', '生日格式必须为 YYYY-MM-DD。');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        gender: gender || null,
        phone: phone.trim() || null,
        birthday_type: birthdayType,
        birth_date: birthDate || null,
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
      Alert.alert('保存失败', err?.message || '未知错误');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>姓名 *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="请输入客户姓名" />

      <Text style={styles.label}>性别</Text>
      <View style={styles.row}>
        {(['male', 'female'] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.choiceButton, gender === g && styles.choiceButtonActive]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.choiceText, gender === g && styles.choiceTextActive]}>
              {g === 'male' ? '男' : '女'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>手机号</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="请输入手机号"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>生日类型</Text>
      <Text style={styles.hint}>客户习惯过阳历生日还是阴历生日</Text>
      <View style={styles.radioGroup}>
        {([
          { value: 'solar', label: '公历' },
          { value: 'lunar', label: '农历' },
        ] as const).map((item) => (
          <TouchableOpacity
            key={item.value}
            style={styles.radioItem}
            onPress={() => setBirthdayType(item.value)}
          >
            <View style={[styles.radioOuter, birthdayType === item.value && styles.radioOuterActive]}>
              {birthdayType === item.value ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.radioLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>生日</Text>
      <TextInput
        style={styles.input}
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>备注</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="请输入备注"
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? '保存中...' : '保存'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, color: '#666', marginTop: 16, marginBottom: 6 },
  hint: { fontSize: 12, color: '#999', marginBottom: 4 },
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
  radioGroup: { rowGap: 10, marginTop: 4 },
  radioItem: { flexDirection: 'row', alignItems: 'center' },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioOuterActive: { borderColor: '#007AFF' },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  radioLabel: { fontSize: 15, color: '#333' },
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
