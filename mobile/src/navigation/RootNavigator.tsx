import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store/appStore';
import { RootStackParamList, TabParamList } from './types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InquiriesScreen from '../screens/InquiriesScreen';
import InquiryDetailScreen from '../screens/InquiryDetailScreen';
import SupplyScreen from '../screens/SupplyScreen';
import MoreScreen from '../screens/MoreScreen';
import PurchaseOrdersScreen from '../screens/PurchaseOrdersScreen';
import PurchaseOrderDetailScreen from '../screens/PurchaseOrderDetailScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';
import InventoryScreen from '../screens/InventoryScreen';
import EmployeesScreen from '../screens/EmployeesScreen';
import AccountsScreen from '../screens/AccountsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import TodoScreen from '../screens/TodoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const TabNavigator = () => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const tabBg = isDark ? '#12141c' : '#ffffff';
  const tabBorder = isDark ? '#1e2029' : '#e9eaf0';
  // Height = icon+label area (48) + bottom safe area inset
  const tabBarHeight = 48 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: isDark ? '#6b7280' : '#9ca3af',
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopWidth: 1,
          borderTopColor: tabBorder,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 1,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Inquiries"
        component={InquiriesScreen}
        options={{
          tabBarLabel: 'Inquiries',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'email' : 'email-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Supply"
        component={SupplyScreen}
        options={{
          tabBarLabel: 'Logistics',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'truck' : 'truck-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{
          tabBarLabel: 'Invoices',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'file-document' : 'file-document-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'menu' : 'menu'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─── Root Navigator ───────────────────────────────────────────────────────────

export const RootNavigator = () => {
  const { isAuthenticated, theme, initStore } = useAppStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const isDark = theme === 'dark';
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  navigationTheme.colors.background = isDark ? '#0c0e12' : '#f4f5fb';

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="InquiryDetail" component={InquiryDetailScreen} />
            <Stack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
            <Stack.Screen name="PurchaseOrderDetail" component={PurchaseOrderDetailScreen} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
            <Stack.Screen name="Inventory" component={InventoryScreen} />
            <Stack.Screen name="Employees" component={EmployeesScreen} />
            <Stack.Screen name="Accounts" component={AccountsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Todo" component={TodoScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
