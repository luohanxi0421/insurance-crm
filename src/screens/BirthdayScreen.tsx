import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../store/authStore';
import { fetchBirthdayReminders } from '../lib/api';
import { BirthdayReminder } from '../types';

export default function BirthdayScreen() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<BirthdayReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReminders(); }, [user]);

  const loadReminders = async () => {
    if (!user) return;
    try { const data = await fetchBirthdayReminders(user.id); setReminders(data); }
    catch { Alert.alert('错误', '加载生日提醒失败'); }
    finally { setLoading(false); }
  };

  const renderItem = ({ item }: { item: BirthdayReminder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={[styles.badge, item.days_until === 0 && styles.badgeToday]}>
          <Text style={styles.badgeText}>{item.days_until === 0 ? '今天' : item.days_until + '天后'}</Text>
        </View>
      </View>
      <Text style={styles.date}>生日: {item.birth_date} ({item.birthday_type === 'solar' ? '阳历' : '阴历'})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? <View style={styles.center}><Text>加载中...</Text></View>
        : reminders.length === 0 ? <View style={styles.center}><Text style={styles.emptyText}>近期没有客户过生日</Text></View>
        : <FlatList data={reminders} renderItem={renderItem} keyExtractor={(item) => item.client_id} contentContainerStyle={styles.list} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 17, fontWeight: '600', color: '#333' },
  badge: { backgroundColor: '#FF9500', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeToday: { backgroundColor: '#FF3B30' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  date: { fontSize: 14, color: '#666' }
});