import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ClientProfileScreen from '../../../screens/stylist/ClientProfileScreen';

export default function ClientProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ClientProfileScreen clientId={id ?? ''} />;
}
