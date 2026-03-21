import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../store/authStore';
import { useClientStore } from '../store/clientStore';
import { fetchClients, searchClients, deleteClient, signOut } from '../lib/api';

export default function ClientListScreen({ navigation }: any) {
  const { user, setUser } = useAuth();
  const { clients, setClients, removeClient, loading, setLoading } = useClientStore();
  const [searchQuery, setSearchQuery] = useState('');

  const loadClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { const data = await fetchClients(user.id); setClients(data); }
    catch { Alert.alert('错误', '加载客户列表失败'); }
    finally { setLoading(false); }
  }, [user, setClients, setLoading]);

  useEffect(() => { loadClients(); }, [loadClients]);

  useEffect(() => {
    if (!user || !searchQuery.trim()) { if (searchQuery === '') loadClients(); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { const data = await searchClients(user.id, searchQuery.trim()); setClients(data); }
      catch {} finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('确认删除', '确定要删除客户"' + name + '"吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { try { await deleteClient(id); removeClient(id); } catch { Alert.alert('错误', '删除失败'); } } },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: async () => { await signOut(); setUser(null); } },
    ]);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })} onLongPress={() => handleDelete(item.id, item.name)}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.gender}>{item.gender === 'male' ? '男' : item.gender === 'female' ? '女' : ''}</Text>
      </View>
      {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
      {item.birth_date ? <Text style={styles.birth}>生日: {new Date(item.birth_date).toLocaleDateString('zh-CN')}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput style={styles.searchInput} placeholder="搜索客户姓名..." value={searchQuery} onChangeText={setSearchQuery} />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出</Text>
        </TouchableOpacity>
      </View>
      {loading ? <View style={styles.emptyContainer}><Text style={styles.emptyText}>加载中...</Text></View>
        : clients.length === 0 ? <View style={styles.emptyContainer}><Text style={styles.emptyText}>{searchQuery ? '没有找到匹配的客户' : '还没有客户，点击 + 添加'}</Text></View>
        : <FlatList data={clients} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} />}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ClientForm')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInput: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, fontSize: 15 },
  logoutButton: { alignSelf: 'flex-end', marginTop: 8 },
  logoutText: { color: '#ff3b30', fontSize: 14 },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '600', color: '#333' },
  gender: { fontSize: 13, color: '#888' },
  phone: { fontSize: 14, color: '#666', marginTop: 4 },
  birth: { fontSize: 13, color: '#999', marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '300' },
});