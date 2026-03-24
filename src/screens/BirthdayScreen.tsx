import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../store/authStore';
import { fetchBirthdayReminders } from '../lib/api';
import { BirthdayReminder } from '../types';

export default function BirthdayScreen({ navigation }: any) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<BirthdayReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReminders();
  }, [user]);

  const loadReminders = async () => {
    if (!user) {
      return;
    }

    try {
      const data = await fetchBirthdayReminders(user.id);
      const ordered = [...data].sort((a, b) => a.days_until - b.days_until);
      setReminders(ordered);
    } catch {
      Alert.alert('Error', 'Failed to load birthday reminders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReminders();
  };

  const renderItem = ({ item }: { item: BirthdayReminder }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ClientDetail', { clientId: item.client_id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={[styles.badge, item.days_until === 0 && styles.badgeToday]}>
          <Text style={styles.badgeText}>
            {item.days_until === 0 ? 'Today' : `${item.days_until} day(s)`}
          </Text>
        </View>
      </View>
      <Text style={styles.dateText}>
        Birthday: {item.birth_date} ({item.birthday_type})
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <Text>Loading...</Text>
        </View>
      ) : reminders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No birthdays in the next 7 days.</Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderItem}
          keyExtractor={(item) => item.client_id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { fontSize: 17, fontWeight: '600', color: '#333' },
  badge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeToday: { backgroundColor: '#FF3B30' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 14, color: '#666' },
});
