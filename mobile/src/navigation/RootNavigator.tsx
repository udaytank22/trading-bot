import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store/appStore';
import { RootStackParamList, TabParamList } from './types';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InquiriesScreen from '../screens/InquiriesScreen';
import InquiryDetailScreen from '../screens/InquiryDetailScreen';
import SupplyScreen from '../screens/SupplyScreen';
import TodoScreen from '../screens/TodoScreen';
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
import AppText from '../components/common/AppText';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabBarIcon = ({ focused, icon }: { focused: boolean; icon: string }) => {
  return (
    <View className="items-center justify-center pt-1">
      <AppText className={`text-base ${focused ? 'scale-110 opacity-100' : 'opacity-60'}`}>
        {icon}
      </AppText>
    </View>
  );
};

const DashboardIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon focused={focused} icon="📊" />
);
const InquiriesIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon focused={focused} icon="📩" />
);
const SupplyIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon focused={focused} icon="🚚" />
);
const TodoIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon focused={focused} icon="✅" />
);
const MoreIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon focused={focused} icon="🍔" />
);

const TabNavigator = () => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8b5cf6', // purple-500
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: isDark ? '#12141c' : '#ffffff',
          borderTopColor: isDark ? '#2a2d33' : '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: 'bold',
        }
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tab.Screen
        name="Inquiries"
        component={InquiriesScreen}
        options={{
          tabBarLabel: 'Inquiries',
          tabBarIcon: InquiriesIcon,
        }}
      />
      <Tab.Screen
        name="Supply"
        component={SupplyScreen}
        options={{
          tabBarLabel: 'Logistics',
          tabBarIcon: SupplyIcon,
        }}
      />
      <Tab.Screen
        name="Todo"
        component={TodoScreen}
        options={{
          tabBarLabel: 'Checklist',
          tabBarIcon: TodoIcon,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: MoreIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { isAuthenticated, theme, initStore } = useAppStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const isDark = theme === 'dark';
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  // Custom Navigation styling overrides
  navigationTheme.colors.background = isDark ? '#0c0e12' : '#f9fafb';

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
            <Stack.Screen name="Invoices" component={InvoicesScreen} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
            <Stack.Screen name="Inventory" component={InventoryScreen} />
            <Stack.Screen name="Employees" component={EmployeesScreen} />
            <Stack.Screen name="Accounts" component={AccountsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default RootNavigator;
