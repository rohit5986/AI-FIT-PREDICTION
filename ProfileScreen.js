import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { PRODUCTS } from './productsData';
import { UserProfileContext } from './UserProfileContext';
import { AuthContext } from './AuthContext';

export default function ProfileScreen({ navigation }) {
  const { profile, updateProfile, resetProfile } = useContext(UserProfileContext);
  const { user, logout } = useContext(AuthContext);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [audience, setAudience] = useState('all');
  const [preferredBrands, setPreferredBrands] = useState([]);

  useEffect(() => {
    const measurements = profile?.measurements || {};
    setHeight(measurements.height ? String(measurements.height) : '');
    setWeight(measurements.weight ? String(measurements.weight) : '');
    setChest(measurements.chest ? String(measurements.chest) : '');
    setWaist(measurements.waist ? String(measurements.waist) : '');
    setAudience(profile?.audience || 'all');
    setPreferredBrands(Array.isArray(profile?.preferredBrands) ? profile.preferredBrands : []);
  }, [profile]);

  const audienceOptions = useMemo(
    () => [
      { id: 'all', label: 'All' },
      { id: 'men', label: 'Men' },
      { id: 'women', label: 'Women' }
    ],
    []
  );

  const brandOptions = useMemo(() => {
    const ids = [...new Set(PRODUCTS.map((item) => String(item.brandId || '').trim()).filter(Boolean))];
    return ids
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({
        id,
        label: id
          .replace(/[-_]+/g, ' ')
          .replace(/\b(menswear|womenswear|kidswear|unisex)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b\w/g, (char) => char.toUpperCase())
      }));
  }, []);

  const toggleBrand = (brandId) => {
    setPreferredBrands((prev) => {
      if (prev.includes(brandId)) {
        return prev.filter((id) => id !== brandId);
      }
      return [...prev, brandId];
    });
  };

  const saveProfile = () => {
    updateProfile({
      measurements: {
        height: height.trim(),
        weight: weight.trim(),
        chest: chest.trim(),
        waist: waist.trim()
      },
      audience,
      preferredBrands
    });

    Alert.alert('Saved', 'Your profile preferences were saved and will auto-fill Home Fit Finder.');
  };

  const handleReset = () => {
    resetProfile();
    Alert.alert('Reset done', 'Profile preferences cleared.');
  };

  const confirmLogout = () => {
    Alert.alert('Sign out', 'Do you want to log out from this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        }
      }
    ]);
  };

  const renderChips = (options, selectedId, onSelect) => (
    <View style={styles.chipGroup}>
      {options.map((option) => {
        const selected = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.subtitle}>Save your fit profile once and use it across recommendations.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.accountEmail}>{user?.email || 'Logged in user'}</Text>

        <Pressable style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saved Measurements</Text>
        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          style={styles.input}
          placeholder="Chest (cm)"
          keyboardType="numeric"
          value={chest}
          onChangeText={setChest}
        />
        <TextInput
          style={styles.input}
          placeholder="Waist (cm)"
          keyboardType="numeric"
          value={waist}
          onChangeText={setWaist}
        />

        <Text style={styles.sectionLabel}>Audience Preference</Text>
        {renderChips(audienceOptions, audience, setAudience)}

        <Text style={styles.sectionLabel}>Preferred Brands</Text>
        <View style={styles.brandWrap}>
          {brandOptions.map((brand) => {
            const selected = preferredBrands.includes(brand.id);
            return (
              <Pressable
                key={brand.id}
                style={[styles.brandChip, selected && styles.brandChipSelected]}
                onPress={() => toggleBrand(brand.id)}
              >
                <Text style={[styles.brandChipText, selected && styles.brandChipTextSelected]}>
                  {brand.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.primaryButton} onPress={saveProfile}>
          <Text style={styles.primaryButtonText}>Save Profile</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Reset Profile</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Predictor')}>
          <Text style={styles.actionButtonText}>Go to Home Fit Finder</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('StyleAI')}>
          <Text style={styles.actionButtonText}>Open Style AI</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Shopping')}>
          <Text style={styles.actionButtonText}>Browse Products</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Wishlist')}>
          <Text style={styles.actionButtonText}>View Wishlist</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f6f5f2'
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 18
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  accountEmail: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: 10
  },
  logoutButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
    paddingVertical: 10,
    alignItems: 'center'
  },
  logoutButtonText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 12
  },
  cardText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600'
  },
  cardHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: '#111827'
  },
  sectionLabel: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12,
    color: '#374151',
    fontWeight: '700'
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c4bcb0',
    backgroundColor: '#fff',
    marginRight: 10,
    marginBottom: 10
  },
  chipSelected: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937'
  },
  chipText: {
    fontSize: 12,
    color: '#1f2937'
  },
  chipTextSelected: {
    color: '#fef3c7'
  },
  brandWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  brandChip: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  brandChipSelected: {
    backgroundColor: '#fff7ed',
    borderColor: '#f59e0b'
  },
  brandChipText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600'
  },
  brandChipTextSelected: {
    color: '#9a3412'
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fef3c7',
    fontWeight: '700',
    fontSize: 13
  },
  secondaryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 12
  },
  actionButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 8
  },
  actionButtonText: {
    color: '#fef3c7',
    fontWeight: '700',
    fontSize: 13
  }
});
