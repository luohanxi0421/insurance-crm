import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createClient, updateClient, fetchClientById } from '../lib/api';
import { useClientStore } from '../store/clientStore';
import { useAuth } from '../store/authStore';

type Props = { route: RouteProp<RootStackParamList, 'ClientForm'>; navigation: any };

export default function ClientFormScreen({ route, navigation }: Props) {
  const { clientId } = route.params || {};
  const isEdit = !!clientId;
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
  const [lunarLeapOrder, setLunarLeapOrder] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (isEdit && clientId) loadClient(); }, [clientId]);

  const loadClient = async () => {
    try {
      const c = await fetchClientById(clientId!);
      setName(c.name); setGender(c.gender || ''); setPhone(c.phone || '');
      setBirthDate(c.birth_date ? c.birth_date.split('T')[0] : '');
      setBirthdayType(c.birthday_type || 'solar');
      setLunarMonth(c.lunar_birthday_month?.toString() || '');
      setLunarDay(c.lunar_birthday_day?.toString() || '');
      setLunarIsLeap(c.lunar_is_leap_month || false);
      setLunarLeapOrder(c.lunar_leap_month_order?.toString() || '');
      setNotes(c.notes || '');
    } catch { Alert.alert('错误', '加载客户信息失败'); }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('提示', '请输入客户姓名'); return; }
    if (!user) return;
    setSaving(true);
    try {
      const d: any = {
        user_id: user.id, name: name.trim(), gender: gender || null, phone: phone.trim() || null,
        birth_date: birthDate || null, birthday_type: birthdayType,
        lunar_birthday_month: lunarMonth ? parseInt(lunarMonth) : null,
        lunar_birthday_day: lunarDay ? parseInt(lunarDay) : null,
        lunar_is_leap_month: lunarIsLeap || null,
        lunar_leap_month_order: lunarLeapOrder ? parseInt(lunarLeapOrder) : null,
        notes: notes.trim() || null,
      };
      if (isEdit) { const u = await updateClient(clientId!, d); updateInStore(clientId!, u); }
      else { const c = await createClient(d); addClient(c); }
      navigation.goBack();
    } catch (err: any) { Alert.alert('保存失败', err.message || '请稍后重试'); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>姓名 *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="请输入姓名" />
      <Text style={styles.label}>性别</Text>
      <View style={styles.row}>
        {(['male', 'female'] as const).map((g) => (
          <TouchableOpacity key={g} style={[styles.btn, gender === g && styles.btnActive]} onPress={() => setGender(g)}>
            <Text style={[styles.btnText, gender === g && styles.btnTextActive]}>{g === 'male' ? '男' : '女'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>手机号</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="请输入手机号" keyboardType="phone-pad" />
      <Text style={styles.label}>生日类型</Text>
      <View style={styles.row}>
        {(['solar', 'lunar'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.btn, birthdayType === t && styles.btnActive]} onPress={() => setBirthdayType(t)}>
            <Text style={[styles.btnText, birthdayType === t && styles.btnTextActive]}>{t === 'solar' ? '阳历' : '阴历'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {birthdayType === 'solar' ? (
        <><Text style={styles.label}>阳历生日</Text>
        <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" /></>
      ) : (
        <><Text style={styles.label}>阴历月</Text>
        <TextInput style={styles.input} value={lunarMonth} onChangeText={setLunarMonth} placeholder="1-12" keyboardType="number-pad" />
        <Text style={styles.label}>阴历日</Text>
        <TextInput style={styles.input} value={lunarDay} onChangeText={setLunarDay} placeholder="1-30" keyboardType="number-pad" /></>
      )}
      <Text style={styles.label}>备注</Text>
      <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="备注信息" multiline numberOfLines={4} />
      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? '保存中...' : '保存'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, color: '#666', marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center' },
  btnActive: { borderColor: '#007AFF', backgroundColor: '#e8f0fe' },
  btnText: { fontSize: 15, color: '#666' },
  btnTextActive: { color: '#007AFF', fontWeight: '600' },
  saveBtn: { backgroundColor: '#007AFF', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});