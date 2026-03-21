import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createVisit, addVisitGift } from '../lib/api';

type Props = { route: RouteProp<RootStackParamList, 'VisitForm'>; navigation: any };

interface GiftInput { gift_name: string; quantity: string; price: string; delivery_type: 'in_person' | 'mailed'; }

export default function VisitFormScreen({ route, navigation }: Props) {
  const { clientId } = route.params;
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [gifts, setGifts] = useState<GiftInput[]>([{ gift_name: '', quantity: '1', price: '', delivery_type: 'in_person' }]);
  const [saving, setSaving] = useState(false);

  const updateGift = (i: number, f: keyof GiftInput, v: string) => setGifts((p) => { const u = [...p]; u[i] = { ...u[i], [f]: v }; return u; });
  const addGiftRow = () => setGifts((p) => [...p, { gift_name: '', quantity: '1', price: '', delivery_type: 'in_person' }]);
  const removeGiftRow = (i: number) => { if (gifts.length <= 1) return; setGifts((p) => p.filter((_, idx) => idx !== i)); };

  const handleSave = async () => {
    if (!content.trim()) { Alert.alert('提示', '请输入聊天记录'); return; }
    setSaving(true);
    try {
      const visit = await createVisit({ client_id: clientId, visit_date: visitDate ? new Date(visitDate).toISOString() : new Date().toISOString(), content: content.trim(), notes: notes.trim() || null });
      for (const g of gifts.filter((g) => g.gift_name.trim())) {
        await addVisitGift({ visit_id: visit.id, gift_name: g.gift_name.trim(), quantity: parseInt(g.quantity) || 1, price: g.price ? parseFloat(g.price) : null, delivery_type: g.delivery_type });
      }
      navigation.goBack();
    } catch (err: any) { Alert.alert('保存失败', err.message || '请稍后重试'); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>拜访日期</Text>
      <TextInput style={styles.input} value={visitDate} onChangeText={setVisitDate} placeholder="YYYY-MM-DD" />
      <Text style={styles.label}>聊天记录 *</Text>
      <TextInput style={[styles.input, styles.textArea]} value={content} onChangeText={setContent} placeholder="记录拜访时的聊天内容..." multiline numberOfLines={8} />
      <Text style={styles.label}>备注</Text>
      <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="其他备注信息" multiline numberOfLines={3} />
      <View style={styles.giftsSection}>
        <View style={styles.giftsHeader}>
          <Text style={styles.giftsTitle}>礼物记录</Text>
          <TouchableOpacity onPress={addGiftRow}><Text style={styles.addGiftText}>+ 添加礼物</Text></TouchableOpacity>
        </View>
        {gifts.map((gift, i) => (
          <View key={i} style={styles.giftCard}>
            <View style={styles.giftCardHeader}>
              <Text style={styles.giftCardLabel}>礼物 {i + 1}</Text>
              {gifts.length > 1 && <TouchableOpacity onPress={() => removeGiftRow(i)}><Text style={styles.removeGiftText}>移除</Text></TouchableOpacity>}
            </View>
            <TextInput style={styles.input} value={gift.gift_name} onChangeText={(v) => updateGift(i, 'gift_name', v)} placeholder="礼物名称" />
            <div style={styles.giftRow}>
              <View style={styles.giftField}><TextInput style={styles.input} value={gift.quantity} onChangeText={(v) => updateGift(i, 'quantity', v)} placeholder="数量" keyboardType="number-pad" /></View>
              <View style={styles.giftField}><TextInput style={styles.input} value={gift.price} onChangeText={(v) => updateGift(i, 'price', v)} placeholder="价格（可选）" keyboardType="decimal-pad" /></View>
            </div>
            <View style={styles.deliveryRow}>
              {(['in_person', 'mailed'] as const).map((t) => (
                <TouchableOpacity key={t} style={[styles.delBtn, gift.delivery_type === t && styles.delBtnActive]} onPress={() => updateGift(i, 'delivery_type', t)}>
                  <Text style={[styles.delText, gift.delivery_type === t && styles.delTextActive]}>{t === 'in_person' ? '现场赠送' : '邮寄'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
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
  giftsSection: { marginTop: 20 },
  giftsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  giftsTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  addGiftText: { color: '#007AFF', fontSize: 14 },
  giftCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  giftCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  giftCardLabel: { fontSize: 14, fontWeight: '500', color: '#666' },
  removeGiftText: { color: '#ff3b30', fontSize: 13 },
  giftRow: { flexDirection: 'row', gap: 10 },
  giftField: { flex: 1 },
  deliveryRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  delBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center' },
  delBtnActive: { borderColor: '#007AFF', backgroundColor: '#e8f0fe' },
  delText: { fontSize: 14, color: '#666' },
  delTextActive: { color: '#007AFF', fontWeight: '600' },
  saveBtn: { backgroundColor: '#007AFF', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});