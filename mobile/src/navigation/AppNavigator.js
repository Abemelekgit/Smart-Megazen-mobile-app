/**
 * @file AppNavigator.js
 * @description Navigation structure for the Smart-Megazen Investor Suite.
 *
 * Structure:
 *  - Bottom Tab Navigator (Dashboard, Alerts)
 *  - Stack Navigator wrapping Tabs (enables NodeDetail push screen)
 */

import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { LayoutDashboard, BellRing } from 'lucide-react-native';

import DashboardScreen  from '../screens/DashboardScreen';
import AlertsScreen     from '../screens/AlertsScreen';
import NodeDetailScreen from '../screens/NodeDetailScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Inner tab navigator — lives inside the root Stack.
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          height: 72,
          paddingBottom: 14,
          paddingTop: 8,
          position: 'absolute',
        },
        tabBarActiveTintColor:   '#06b6d4',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ color, focused }) => {
          const size = 22;
          if (route.name === 'Dashboard') {
            return (
              <View style={{
                padding: 6, borderRadius: 10,
                backgroundColor: focused ? '#06b6d422' : 'transparent',
              }}>
                <LayoutDashboard size={size} color={color} />
              </View>
            );
          }
          if (route.name === 'Alerts') {
            return (
              <View style={{
                padding: 6, borderRadius: 10,
                backgroundColor: focused ? '#06b6d422' : 'transparent',
              }}>
                <BellRing size={size} color={color} />
              </View>
            );
          }
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Alerts"    component={AlertsScreen}    />
    </Tab.Navigator>
  );
}

/**
 * Root navigator — stack allows full-screen NodeDetail push.
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main"       component={MainTabs}        />
        <Stack.Screen
          name="NodeDetail"
          component={NodeDetailScreen}
          options={{
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
