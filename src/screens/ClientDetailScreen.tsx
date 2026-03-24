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
      Alert.alert('Error', 'Failed to load details.');
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
    Alert.alert('Delete relation', `Delete blood relation with ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBloodRelationship(id);
          setBloodRelations((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  const handleDeleteSpouse = (id: string, name: string) => {
    Alert.alert('Delete relation', `Delete partner relation with ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!client) {
    return null;
  }

  const bloodLabel = (type: string) => {
    const map: Record<string, string> = { father: 'Father', mother: 'Mother' };
    return map[type] || type;
  };

  const partnerLabel = (type: string) => {
    const map: Record<string, string> = { spouse: 'Spouse', cohabiting: 'Cohabiting' };
    return map[type] || type;
  };

  const currentPartnerRelations = spouseRelations.filter((r) => !r.end_date);
  const historyPartnerRelations = spouseRelations.filter((r) => Boolean(r.end_date));

  const renderPartner = (r: SpouseRelationship) => {
    const partnerName = r.male_id === clientId ? r.female_name : r.male_name;
    const dateText = r.start_date
      ? `${r.start_date} ~ ${r.end_date || 'present'}`
      : 'date unknown';

    return (
      <View key={r.id} style={styles.relationItem}>
        <View>
          <Text style={styles.relationName}>{partnerName || 'Unknown'}</Text>
          <Text style={styles.relationType}>{`${partnerLabel(r.relation_type)} | ${dateText}`}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteSpouse(r.id, partnerName || 'Unknown')}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const birthdayValue =
    client.birthday_type === 'solar'
      ? client.birth_date || '-'
      : `Lunar ${client.lunar_birthday_month || '?'}-${client.lunar_birthday_day || '?'}` +
        (client.lunar_is_leap_month
          ? ` (Leap #${client.lunar_leap_month_order || '?'})`
          : '');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ClientForm', { clientId })}>
            <Text style={styles.linkText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <InfoRow label="Name" value={client.name} />
        <InfoRow
          label="Gender"
          value={client.gender === 'male' ? 'Male' : client.gender === 'female' ? 'Female' : '-'}
        />
        <InfoRow label="Phone" value={client.phone || '-'} />
        <InfoRow label="Birthday" value={birthdayValue} />
        {client.notes ? <InfoRow label="Notes" value={client.notes} /> : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Blood Relations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BloodRelationForm', { clientId })}>
            <Text style={styles.linkText}>Add</Text>
          </TouchableOpacity>
        </View>

        {bloodRelations.length === 0 ? (
          <Text style={styles.emptyText}>No blood relations.</Text>
        ) : (
          bloodRelations.map((r) => (
            <View key={r.id} style={styles.relationItem}>
              <View>
                <Text style={styles.relationName}>{r.related_name || 'Unknown'}</Text>
                <Text style={styles.relationType}>{bloodLabel(r.relation_type)}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteBlood(r.id, r.related_name || 'Unknown')}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Partner Relations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SpouseRelationForm', { clientId })}>
            <Text style={styles.linkText}>Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.groupTitle}>Current</Text>
        {currentPartnerRelations.length === 0 ? (
          <Text style={styles.emptyText}>No active relation.</Text>
        ) : (
          currentPartnerRelations.map(renderPartner)
        )}

        <Text style={styles.groupTitle}>History</Text>
        {historyPartnerRelations.length === 0 ? (
          <Text style={styles.emptyText}>No historical relation.</Text>
        ) : (
          historyPartnerRelations.map(renderPartner)
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('VisitList', { clientId })}
        >
          <Text style={styles.primaryButtonText}>View Visits</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('VisitForm', { clientId })}
        >
          <Text style={styles.secondaryButtonText}>Add Visit</Text>
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
