import React from 'react';
import ClientMessagesScreen from '../../../screens/stylist/ClientMessagesScreen';

/**
 * Expo Router wrapper for ClientMessagesScreen.
 * Params (clientId, clientName) are read inside the screen via useLocalSearchParams.
 */
export default function ClientMessagesRoute() {
  return <ClientMessagesScreen />;
}
