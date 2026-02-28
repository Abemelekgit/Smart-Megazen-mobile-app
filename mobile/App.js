/**
 * @file App.js
 * @description Root entry point for the Smart-Megazen Investor Suite (Expo).
 */

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Push notification registration is native-only (not supported on web)
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const Notifications = await import('expo-notifications');
          const Device       = await import('expo-device');
          const Constants    = await import('expo-constants');

          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge:  true,
            }),
          });

          if (!Device.default.isDevice) return;

          const { status: existingStatus } = await Notifications.default.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.default.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') return;

          const projectId = Constants.default.expoConfig?.extra?.eas?.projectId;
          const token = (await Notifications.default.getExpoPushTokenAsync({ projectId })).data;
          console.info('[Megazen] Push token:', token);
        } catch (e) {
          console.warn('[Megazen] Push setup skipped:', e.message);
        }
      })();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

