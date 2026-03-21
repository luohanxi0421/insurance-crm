import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Visit } from '../types';
import { fetchVisits, fetchVisitGifts, deleteVisit } from '../lib/api';

type Props = { route: RouteProp<RootStackParamList, 'VisitList'>; navigation: any };

export default function VisitListScreen({ route, navigation }: Props) {
  const { clientId } = route.params;
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVisits = useCallback(async () => {
    try {
      const data = await fetchVisits(clientId);
      const withGifts = await Promise.all(data.map(async (v) => { const gifts = await fetchVisitGifts(v.id); return { ...v, gifts }; }));
      setVisits(withGifts);
    } catch { Alert.alert('错误', '加载拜访记录失败'); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { loadVisits(); const unsub = navigation.addListener('focus', loadVisits); return unsub; }, [clientId, navigation, loadVisits]);

  const handleDelete = (id: string) => {
    Alert.alert('确认删除', '确定要删除这条拜访记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await deleteVisit(id); setVisits((p) => p.filter((v) => v.id !== id)); } },
    ]);
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const renderItem = ({ item }: { item: Visit }) => (
    <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item.id)}>
      <Text style={styles.date}>{fmtDate(item.visit_date)}</Text>
      <Text style={styles.content} numberOfLines={4}>{item.content}</Text>
      {item.notes ? <Text style={styles.notes}>备注: {item.notes}</Text> : null}
      {item.gifts && item.gifts.length > 0 && (
        <View style={styles.giftsRow}>
          {item.gifts.map((g) => <Text key={g.id} style={styles.giftText}>{g.gift_name} x{g.quantity}{g.delivery_type === 'mailed' ? ' (邮寄)' : ''}</Text>)}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? <View style={styles.center}><Text>加载中...</Text></View>
        : visits.length === 0 ? <View style={styles.center}><Text style={styles.emptyText}>暂无拜访记录</Text></View>
        : <FlatList data={visits} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} />}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('VisitForm', { clientId })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  date: { fontSize: 13, color: '#007AFF', fontWeight: '500', marginBottom: 6 },
  content: { fontSize: 14, color: '#333', lineHeight: 20 },
  notes: { fontSize: 13, color: '#888', marginTop: 6 },
  giftsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  giftText: { fontSize: 13, color: '#666', marginRight: 12 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '300' },
});