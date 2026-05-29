import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  InquiryDetail: { inquiryId: string };
  PurchaseOrders: undefined;
  PurchaseOrderDetail: { poId: string };
  InvoiceDetail: { invoiceId: string };
  Inventory: undefined;
  Employees: undefined;
  Accounts: undefined;
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
  Todo: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Inquiries: undefined;
  Supply: undefined;
  Invoices: undefined;
  More: undefined;
};

export type AppNavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;

export type TabNavigationProp<T extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;
