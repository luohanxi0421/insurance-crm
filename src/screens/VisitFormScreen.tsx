import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createVisit, addVisitGift } from '../lib/api';

type Props = { route: RouteProp<RootStackParamList, 'VisitForm'>; navigation: any };

interface GiftInput {
  gift_name: string;
  quantity: string;
  price: string;
  delivery_type: 'in_person' | 'mailed';
}

export default function VisitFormScreen({ route, navigation }: Props) {
  const { clientId } = route.params;
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [gifts, setGifts] = useState<GiftInput[]>([
    { gift_name: '', quantity: '1', price: '', delivery_type: 'in_person' },
  ]);
  const [saving, setSaving] = useState(false);

  const updateGift = (index: number, field: keyof GiftInput, value: string) => {
    setGifts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as GiftInput;
      return updated;
    });
  };

  const addGiftRow = () => {
    setGifts((prev) => [
      ...prev,
      { gift_name: '', quantity: '1', price: '', delivery_type: 'in_person' },
    ]);
  };

  const removeGiftRow = (index: number) => {
    if (gifts.length <= 1) {
      return;
    }
    setGifts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validDate = (raw: string) => /^\d{4}-\d{2}-\d{2}$/.test(raw);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Validation', 'Visit content is required.');
      return;
    }

    if (visitDate && !validDate(visitDate)) {
      Alert.alert('Validation', 'Visit date must be YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    try {
      const visit = await createVisit({
        client_id: clientId,
        visit_date: visitDate
          ? new Date(`${visitDate}T00:00:00`).toISOString()
          : new Date().toISOString(),
        content: content.trim(),
        notes: notes.trim() || null,
      });

      const validGifts = gifts.filter((g) => g.gift_name.trim());

      for (const gift of validGifts) {
        const quantity = Number(gift.quantity) || 1;
        if (quantity <= 0) {
          continue;
        }

        await addVisitGift({
          visit_id: visit.id,
          gift_name: gift.gift_name.trim(),
          quantity,
          price: gift.price ? Number(gift.price) : null,
          delivery_type: gift.delivery_type,
        });
      }

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Save failed', err?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Visit Date</Text>
      <TextInput
        style={styles.input}
        value={visitDate}
        onChangeText={setVisitDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>Visit Content *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={content}
        onChangeText={setContent}
        placeholder="Conversation notes"
        multiline
        numberOfLines={8}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Additional notes"
        multiline
        numberOfLines={3}
      />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gift Records</Text>
          <TouchableOpacity onPress={addGiftRow}>
            <Text style={styles.linkText}>+ Add Gift</Text>
          </TouchableOpacity>
        </View>

        {gifts.map((gift, index) => (
          <View key={index} style={styles.giftCard}>
            <View style={styles.giftCardHeader}>
              <Text style={styles.giftCardTitle}>Gift {index + 1}</Text>
              {gifts.length > 1 ? (
                <TouchableOpacity onPress={() => removeGiftRow(index)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TextInput
              style={styles.input}
              value={gift.gift_name}
              onChangeText={(value) => updateGift(index, 'gift_name', value)}
              placeholder="Gift name"
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInput
                  style={styles.input}
                  value={gift.quantity}
                  onChangeText={(value) => updateGift(index, 'quantity', value)}
                  placeholder="Quantity"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfField}>
                <TextInput
                  style={styles.input}
                  value={gift.price}
                  onChangeText={(value) => updateGift(index, 'price', value)}
                  placeholder="Price (optional)"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.choiceButton,
                  gift.delivery_type === 'in_person' && styles.choiceButtonActive,
                ]}
                onPress={() => updateGift(index, 'delivery_type', 'in_person')}
              >
                <Text
                  style={[
                    styles.choiceText,
                    gift.delivery_type === 'in_person' && styles.choiceTextActive,
                  ]}
                >
                  In Person
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.choiceButton,
                  gift.delivery_type === 'mailed' && styles.choiceButtonActive,
                ]}
                onPress={() => updateGift(index, 'delivery_type', 'mailed')}
              >
                <Text
                  style={[
                    styles.choiceText,
                    gift.delivery_type === 'mailed' && styles.choiceTextActive,
                  ]}
                >
                  Mailed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Visit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, color: '#666', marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  linkText: { color: '#007AFF', fontSize: 14 },
  giftCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  giftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  giftCardTitle: { fontSize: 14, fontWeight: '500', color: '#666' },
  deleteText: { color: '#ff3b30', fontSize: 13 },
  row: { flexDirection: 'row', columnGap: 10, marginTop: 8 },
  halfField: { flex: 1 },
  choiceButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  choiceButtonActive: { borderColor: '#007AFF', backgroundColor: '#e8f0fe' },
  choiceText: { fontSize: 14, color: '#666' },
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
