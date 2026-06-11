import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import AppText from './AppText';
import { useAppStore } from '../../store/appStore';

interface AppStatusBadgeProps {
  status: string;
  style?: StyleProp<ViewStyle>;
}

type BadgeVariant = {
  bg: { light: string; dark: string };
  text: { light: string; dark: string };
  label: string;
};

const BADGE_MAP: Record<string, BadgeVariant> = {
  PENDING: {
    bg: { light: '#fff7ed', dark: 'rgba(251,191,36,0.15)' },
    text: { light: '#b45309', dark: '#fbbf24' },
    label: 'Datasheet',
  },
  RFQ_SENT: {
    bg: { light: '#eff6ff', dark: 'rgba(96,165,250,0.15)' },
    text: { light: '#1d4ed8', dark: '#60a5fa' },
    label: 'RFQ sent',
  },
  RFQ_RECEIVED: {
    bg: { light: '#f5f3ff', dark: 'rgba(167,139,250,0.15)' },
    text: { light: '#6d28d9', dark: '#a78bfa' },
    label: 'RFQ Received',
  },
  RFQ_READY: {
    bg: { light: '#eff6ff', dark: 'rgba(96,165,250,0.15)' },
    text: { light: '#1d4ed8', dark: '#60a5fa' },
    label: 'RFQ Ready',
  },
  CLIENT_QUOTING: {
    bg: { light: '#f5f3ff', dark: 'rgba(167,139,250,0.15)' },
    text: { light: '#6d28d9', dark: '#a78bfa' },
    label: 'Client Quoting',
  },
  QUOTE_SENT: {
    bg: { light: '#ecfdf5', dark: 'rgba(52,211,153,0.15)' },
    text: { light: '#065f46', dark: '#34d399' },
    label: 'Quoted',
  },
  TL_REVIEW: {
    bg: { light: '#fff7ed', dark: 'rgba(251,191,36,0.15)' },
    text: { light: '#b45309', dark: '#fbbf24' },
    label: 'TL Review',
  },
  ADMIN_APPROVAL: {
    bg: { light: '#fef2f2', dark: 'rgba(248,113,113,0.15)' },
    text: { light: '#b91c1c', dark: '#f87171' },
    label: 'Admin Approval',
  },
  EMPLOYEE_VERIFY: {
    bg: { light: '#fff7ed', dark: 'rgba(251,191,36,0.15)' },
    text: { light: '#b45309', dark: '#fbbf24' },
    label: 'Employee Verify',
  },
  CLIENT_FINAL_APPROVAL: {
    bg: { light: '#ecfdf5', dark: 'rgba(52,211,153,0.15)' },
    text: { light: '#065f46', dark: '#34d399' },
    label: 'Client Final Approval',
  },
  CONFIRMED: {
    bg: { light: '#ecfdf5', dark: 'rgba(52,211,153,0.15)' },
    text: { light: '#065f46', dark: '#34d399' },
    label: 'Confirmed',
  },
  PAID: {
    bg: { light: '#ecfdf5', dark: 'rgba(52,211,153,0.15)' },
    text: { light: '#065f46', dark: '#34d399' },
    label: 'Paid',
  },
  DELIVERED: {
    bg: { light: '#ecfdf5', dark: 'rgba(52,211,153,0.15)' },
    text: { light: '#065f46', dark: '#34d399' },
    label: 'Delivered',
  },
  ACTIVE: {
    bg: { light: '#ecfdf5', dark: 'rgba(52,211,153,0.15)' },
    text: { light: '#065f46', dark: '#34d399' },
    label: 'Active',
  },
  CANCELLED: {
    bg: { light: '#fef2f2', dark: 'rgba(248,113,113,0.15)' },
    text: { light: '#b91c1c', dark: '#f87171' },
    label: 'Cancelled',
  },
  EXPIRED: {
    bg: { light: '#fef2f2', dark: 'rgba(248,113,113,0.15)' },
    text: { light: '#b91c1c', dark: '#f87171' },
    label: 'Expired',
  },
  INACTIVE: {
    bg: { light: '#fef2f2', dark: 'rgba(248,113,113,0.15)' },
    text: { light: '#b91c1c', dark: '#f87171' },
    label: 'Inactive',
  },
  IN_TRANSIT: {
    bg: { light: '#eff6ff', dark: 'rgba(96,165,250,0.15)' },
    text: { light: '#1d4ed8', dark: '#60a5fa' },
    label: 'In Transit',
  },
  LOADING: {
    bg: { light: '#fff7ed', dark: 'rgba(251,191,36,0.15)' },
    text: { light: '#b45309', dark: '#fbbf24' },
    label: 'Loading',
  },
  DRAFT: {
    bg: { light: '#f3f4f6', dark: 'rgba(156,163,175,0.15)' },
    text: { light: '#6b7280', dark: '#9ca3af' },
    label: 'Draft',
  },
  SENT: {
    bg: { light: '#ecfdf5', dark: 'rgba(52,211,153,0.15)' },
    text: { light: '#065f46', dark: '#34d399' },
    label: 'Sent',
  },
  VALID: {
    bg: { light: '#ecfdf5', dark: 'rgba(52,211,153,0.15)' },
    text: { light: '#065f46', dark: '#34d399' },
    label: 'Valid',
  },
};

export const AppStatusBadge: React.FC<AppStatusBadgeProps> = ({ status, style }) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const normStatus = status.toUpperCase();
  const variant = BADGE_MAP[normStatus] ?? {
    bg: { light: '#f3f4f6', dark: 'rgba(156,163,175,0.15)' },
    text: { light: '#6b7280', dark: '#9ca3af' },
    label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' '),
  };

  return (
    <View style={[{
      backgroundColor: isDark ? variant.bg.dark : variant.bg.light,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
    }, style as any]}>
      <AppText style={{
        fontSize: 10,
        fontWeight: '700',
        color: isDark ? variant.text.dark : variant.text.light,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}>
        {variant.label}
      </AppText>
    </View>
  );
};

export default AppStatusBadge;
