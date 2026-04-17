import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { saveClosetItem } from '../../services/closet';
import { uploadOutfitImage } from '../../services/storage';
import type { DetectedItem } from '../../services/ai';
import { CLOTHING_CATEGORIES, type ClothingCategory } from '../../utils/constants';

interface EditableItem extends DetectedItem {
  key: string;
  confirmed: boolean;
}

export default function OutfitReviewScreen() {
  const { imageUri, items: itemsParam } = useLocalSearchParams<{
    imageUri: string;
    items: string;
  }>();
  const router = useRouter();
  const { userId } = useAuth();

  const [items, setItems] = useState<EditableItem[]>(() =>
    (JSON.parse(itemsParam ?? '[]') as DetectedItem[]).map((item, i) => ({
      ...item,
      key: String(i),
      confirmed: true,
    }))
  );
  const [saving, setSaving] = useState(false);

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems(prev => prev.map(item => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function handleSave() {
    if (!userId) {
      Alert.alert('Not logged in', 'Please log in to save your outfit.');
      return;
    }

    const confirmed = items.filter(i => i.confirmed);
    if (confirmed.length === 0) {
      Alert.alert('No items selected', 'Keep at least one item to save.');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadOutfitImage(imageUri, userId);

      await Promise.all(
        confirmed.map(item =>
          saveClosetItem({
            user_id: userId,
            category: item.category,
            label: item.name,
            color: item.color,
            image_url: imageUrl,
          })
        )
      );

      router.replace('/outfit/success');
    } catch (err) {
      Alert.alert('Save failed', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Outfit</Text>
      <Text style={styles.subtitle}>Edit or remove items Claude detected</Text>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <FlatList
        data={items}
        keyExtractor={item => item.key}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.confirmed && styles.cardDimmed]}>
            <View style={styles.cardHeader}>
              <TextInput
                style={[styles.nameInput, !item.confirmed && styles.textDimmed]}
                value={item.name}
                onChangeText={text => updateItem(item.key, { name: text })}
                editable={item.confirmed}
              />
              <TouchableOpacity onPress={() => updateItem(item.key, { confirmed: !item.confirmed })}>
                <Text style={styles.toggle}>{item.confirmed ? '✕' : '+'}</Text>
              </TouchableOpacity>
            </View>

            {item.confirmed && (
              <View style={styles.categoryRow}>
                {CLOTHING_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, item.category === cat && styles.catChipActive]}
                    onPress={() => updateItem(item.key, { category: cat as ClothingCategory })}
                  >
                    <Text style={[styles.catChipText, item.category === cat && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {item.color && item.confirmed && (
              <Text style={styles.color}>{item.color}</Text>
            )}
          </View>
        )}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save to Closet</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16, resizeMode: 'cover' },
  list: { flex: 1 },
  card: { backgroundColor: '#f7f7f7', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardDimmed: { opacity: 0.4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#000' },
  textDimmed: { color: '#999' },
  toggle: { fontSize: 18, paddingLeft: 12, color: '#555' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  catChip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  catChipActive: { backgroundColor: '#000', borderColor: '#000' },
  catChipText: { fontSize: 11, color: '#555' },
  catChipTextActive: { color: '#fff' },
  color: { fontSize: 12, color: '#888', marginTop: 6 },
  saveButton: { backgroundColor: '#000', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
