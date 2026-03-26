import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { AccessGate } from '../../../components/shared/AccessGate';
import { Avatar } from '../../../components/primitives/Avatar';
import { Icon } from '../../../components/primitives/Icon';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useAccess } from '../../../hooks/useAccess';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  phone?: string;
  avatar?: string;
}

/**
 * Family members list. Premium only (AccessGate).
 * Allows adding and managing family members linked to the wedding.
 */
export default function FamilyMembersScreen() {
  const router = useRouter();
  const { role, accent } = useAccess();

  // Placeholder data -- in production from a useFamilyMembers() hook
  const [members, setMembers] = useState<FamilyMember[]>([
    { id: '1', name: 'Rahul Mehta', role: 'Groom', phone: '+91 98765 43210' },
    { id: '2', name: 'Priya Mehta', role: 'Mother of Groom', phone: '+91 98765 43211' },
    { id: '3', name: 'Sanjay Mehta', role: 'Father of Groom' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newRole.trim()) {
      Alert.alert('Missing Info', 'Name and role are required.');
      return;
    }
    setMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newName.trim(),
        role: newRole.trim(),
        phone: newPhone.trim() || undefined,
      },
    ]);
    setShowAddModal(false);
    setNewName('');
    setNewRole('');
    setNewPhone('');
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      'Remove Member',
      `Remove ${name} from family members?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setMembers((prev) => prev.filter((m) => m.id !== id)),
        },
      ],
    );
  };

  return (
    <AccessGate
      flag="isPremium"
      lockedLabel="Upgrade to Premium"
      onLockedPress={() => router.push('/packages' as any)}
    >
      <AppShell
        scroll={false}
        padded={false}
        header={
          <ScreenHeader
            title="Family Members"
            onBack={() => router.back()}
            right={
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={styles.addBtn}
                accessibilityLabel="Add family member"
                accessibilityRole="button"
              >
                <Icon name="plus" size={22} color={accent} />
              </TouchableOpacity>
            }
          />
        }
        testID="family-members-screen"
      >
        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color={T.muted} />
            <Text style={styles.emptyTitle}>No family members</Text>
            <Text style={styles.emptyBody}>
              Add family members to share your wedding details and styling preferences.
            </Text>
            <Button
              title="Add First Member"
              onPress={() => setShowAddModal(true)}
              variant="outline"
              testID="add-first-btn"
            />
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.memberCard}>
                <Avatar
                  source={item.avatar}
                  initials={item.name.slice(0, 2)}
                  size={48}
                  bg={accent + '22'}
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.name}</Text>
                  <Text style={styles.memberRole}>{item.role}</Text>
                  {item.phone && (
                    <Text style={styles.memberPhone}>{item.phone}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemove(item.id, item.name)}
                  style={styles.removeBtn}
                  accessibilityLabel={`Remove ${item.name}`}
                  accessibilityRole="button"
                >
                  <Icon name="close" size={16} color={T.rose} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {/* Add member modal */}
        <Modal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          testID="add-member-modal"
        >
          <Text style={styles.modalTitle}>Add Family Member</Text>
          <Input
            label="Name"
            placeholder="Full name"
            value={newName}
            onChangeText={setNewName}
            autoCapitalize="words"
            testID="input-member-name"
          />
          <Input
            label="Role"
            placeholder="e.g. Mother of Bride"
            value={newRole}
            onChangeText={setNewRole}
            autoCapitalize="words"
            testID="input-member-role"
          />
          <Input
            label="Phone (optional)"
            placeholder="+91 98765 43210"
            value={newPhone}
            onChangeText={setNewPhone}
            keyboardType="phone-pad"
            testID="input-member-phone"
          />
          <Button
            title="Add Member"
            onPress={handleAdd}
            variant="primary"
            fullWidth
            testID="confirm-add-btn"
          />
        </Modal>
      </AppShell>
    </AccessGate>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    ...SHADOW.card,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 14,
  },
  memberName: {
    fontSize: 15,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  memberRole: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    marginTop: 2,
  },
  memberPhone: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
    marginTop: 2,
  },
  removeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 16,
    textAlign: 'center',
  },
});
