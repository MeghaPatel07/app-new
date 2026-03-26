import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import RecommendProductsScreen from '../../../screens/stylist/RecommendProductsScreen';

export default function RecommendProductsRoute() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  return <RecommendProductsScreen clientId={clientId ?? ''} />;
}
