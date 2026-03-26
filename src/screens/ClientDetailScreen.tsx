import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Client, BloodRelationship, SpouseRelationship } from '../types';
import {
  fetchClientById,
  fetchBloodRelationships,
  fetchSpouseRelationships,
  deleteBloodRelationship,
  deleteSpouseRelationship,
} from '../lib/api';

type Props = {
  route: RouteProp<RootStackParamList, 'ClientDetail'>;
  navigation: any;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export default function ClientDetailScreen({ route, navigation }: Props) {
  const { clientId } = route.params;
  const [client, setClient] = useState<Client | null>(null);
  const [bloodRelations, setBloodRelations] = useState<BloodRelationship[]>([]);
  const [spouseRelations, setSpouseRelations] = useState<SpouseRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [c, blood, spouse] = await Promise.all([
        fetchClientById(clientId),
        fetchBloodRelationships(clientId),
        fetchSpouseRelationships(clientId),
      ]);
      setClient(c);
      setBloodRelations(blood);
      setSpouseRelations(spouse);
    } catch {
      Alert.alert('错误', '加载详情失败。');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, loadData]);

  const handleDeleteBlood = (id: string, name: string) => {
    Alert.alert('删除关系', `确认删除与 ${name} 的血缘关系吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteBloodRelationship(id);
          setBloodRelations((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  const handleDeleteSpouse = (id: string, name: string) => {
    Alert.alert('删除关系', `确认删除与 ${name} 的伴侣关系吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteSpouseRelationship(id);
          setSpouseRelations((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!client) {
    return null;
  }

  const bloodLabel = (type: string) => {
    const map: Record<string, string> = { father: '父亲', mother: '母亲' };
    return map[type] || type;
  };

  const partnerLabel = (type: string) => {
    const map: Record<string, string> = { spouse: '配偶', cohabiting: '同居' };
    return map[type] || type;
  };

  const currentPartnerRelations = spouseRelations.filter((r) => !r.end_date);
  const historyPartnerRelations = spouseRelations.filter((r) => Boolean(r.end_date));

  const renderPartner = (r: SpouseRelationship) => {
    const partnerName = r.male_id === clientId ? r.female_name : r.male_name;
    const dateText = r.start_date ? `${r.start_date} ~ ${r.end_date || '至今'}` : '日期未知';

    return (
      <View key={r.id} style={styles.relationItem}>
        <View>
          <Text style={styles.relationName}>{partnerName || '未知'}</Text>
          <Text style={styles.relationType}>{`${partnerLabel(r.relation_type)} | ${dateText}`}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteSpouse(r.id, partnerName || '未知')}>
          <Text style={styles.deleteText}>删除</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const birthdayValue =
    (client.birth_date || '-') + `（${client.birthday_type === 'solar' ? '公历' : '农历'}）`;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>基础信息</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ClientForm', { clientId })}>
            <Text style={styles.linkText}>编辑</Text>
          </TouchableOpacity>
        </View>

        <InfoRow label="姓名" value={client.name} />
        <InfoRow
          label="性别"
          value={client.gender === 'male' ? '男' : client.gender === 'female' ? '女' : '-'}
        />
        <InfoRow label="手机号" value={client.phone || '-'} />
        <InfoRow label="生日" value={birthdayValue} />
        {client.notes ? <InfoRow label="备注" value={client.notes} /> : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>血缘关系</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BloodRelationForm', { clientId })}>
            <Text style={styles.linkText}>添加</Text>
          </TouchableOpacity>
        </View>

        {bloodRelations.length === 0 ? (
          <Text style={styles.emptyText}>暂无血缘关系。</Text>
        ) : (
          bloodRelations.map((r) => (
            <View key={r.id} style={styles.relationItem}>
              <View>
                <Text style={styles.relationName}>{r.related_name || '未知'}</Text>
                <Text style={styles.relationType}>{bloodLabel(r.relation_type)}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteBlood(r.id, r.related_name || '未知')}>
                <Text style={styles.deleteText}>删除</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>伴侣关系</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SpouseRelationForm', { clientId })}>
            <Text style={styles.linkText}>添加</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.groupTitle}>当前关系</Text>
        {currentPartnerRelations.length === 0 ? (
          <Text style={styles.emptyText}>暂无有效关系。</Text>
        ) : (
          currentPartnerRelations.map(renderPartner)
        )}

        <Text style={styles.groupTitle}>历史关系</Text>
        {historyPartnerRelations.length === 0 ? (
          <Text style={styles.emptyText}>暂无历史关系。</Text>
        ) : (
          historyPartnerRelations.map(renderPartner)
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('VisitList', { clientId })}
        >
          <Text style={styles.primaryButtonText}>查看拜访</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('VisitForm', { clientId })}
        >
          <Text style={styles.secondaryButtonText}>新增拜访</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { backgroundColor: '#fff', marginTop: 10, padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  linkText: { color: '#007AFF', fontSize: 14 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  infoLabel: { fontSize: 14, color: '#888', width: 80 },
  infoValue: { fontSize: 14, color: '#333', flex: 1, textAlign: 'right' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 12 },
  relationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  relationName: { fontSize: 15, color: '#333', fontWeight: '500' },
  relationType: { fontSize: 13, color: '#888', marginTop: 2 },
  deleteText: { color: '#ff3b30', fontSize: 14, padding: 8 },
  groupTitle: {
    marginTop: 8,
    marginBottom: 4,
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondaryButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
});
