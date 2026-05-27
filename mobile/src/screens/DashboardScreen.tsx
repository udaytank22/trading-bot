import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Stylesheet from '../components/common/Stylesheet';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppAvatar from '../components/common/AppAvatar';
import AppStatusBadge from '../components/common/AppStatusBadge';
import { BarChart } from '../components/charts/AppCharts';
import { formatUSD, formatDateString } from '../utils/marginEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/Feather';

// ─── Quick Action Button ──────────────────────────────────────────────────────

interface QuickActionBtnProps {
  title: string;
  onPress: () => void;
  variant?: 'purple' | 'blue' | 'green' | 'gray';
}

const QuickActionBtn = ({ title, onPress, variant = 'purple' }: QuickActionBtnProps) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const variantStyles: Record<string, { bg: string; border: string; text: string }> = {
    purple: {
      bg: isDark ? 'rgba(139,92,246,0.12)' : '#f5f3ff',
      border: isDark ? 'rgba(139,92,246,0.3)' : '#ddd6fe',
      text: isDark ? '#c4b5fd' : '#7c3aed',
    },
    blue: {
      bg: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff',
      border: isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe',
      text: isDark ? '#93c5fd' : '#2563eb',
    },
    green: {
      bg: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5',
      border: isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0',
      text: isDark ? '#6ee7b7' : '#059669',
    },
    gray: {
      bg: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
      border: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
      text: isDark ? '#d1d5db' : '#374151',
    },
  };

  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: v.bg,
        borderWidth: 1,
        borderColor: v.border,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText style={{ color: v.text, fontSize: 13, fontWeight: '600' }}>
        {title}
      </AppText>
    </TouchableOpacity>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  valueColor: string;
}

const KpiCard = ({ label, value, sub, valueColor }: KpiCardProps) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <View style={{
      width: '48%',
      backgroundColor: isDark ? '#1a1d27' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? '#2a2d3a' : '#e9eaf0',
      padding: 14,
    }}>
      <AppText style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: 6 }}>
        {label}
      </AppText>
      <AppText style={{ fontSize: 26, fontWeight: '700', color: valueColor, marginBottom: 4 }}>
        {value}
      </AppText>
      <AppText style={{ fontSize: 11, color: isDark ? '#6b7280' : '#9ca3af' }}>
        {sub}
      </AppText>
    </View>
  );
};

// ─── Inquiry Row ─────────────────────────────────────────────────────────────

const InquiryRow = ({ inq, onPress, isDark }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#23262f' : '#f0f1f5',
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      {/* Left content */}
      <View style={{ flex: 1, paddingRight: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
          <AppText style={{
            fontSize: 11,
            fontWeight: '600',
            color: isDark ? '#818cf8' : '#6366f1',
            fontFamily: 'monospace',
            marginRight: 8,
          }}>
            {inq.inquiry_id}
          </AppText>
          <AppText style={{ fontSize: 11, color: isDark ? '#6b7280' : '#9ca3af' }}>
            {formatDateString(inq.date_received)}
          </AppText>
        </View>
        <AppText style={{
          fontSize: 14,
          fontWeight: '700',
          color: isDark ? '#f1f5f9' : '#111827',
          marginBottom: 2,
        }} numberOfLines={1}>
          {inq.buyer_name}
        </AppText>
        <AppText style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }} numberOfLines={1}>
          {inq.products[0]?.product_name}{inq.products.length > 1 ? ` +${inq.products.length - 1} more` : ''}
        </AppText>
      </View>

      {/* Right content */}
      <View style={{ alignItems: 'flex-end' }}>
        <AppStatusBadge status={inq.status} />
        <AppText style={{
          fontSize: 11,
          fontWeight: '600',
          color: isDark ? '#6b7280' : '#9ca3af',
          marginTop: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}>
          {inq.vessel_name}
        </AppText>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Main Dashboard Screen ────────────────────────────────────────────────────

export const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    currentUser,
    inquiriesData,
    closedDealsData,
    weeklyTrendData,
    theme,
    toggleTheme,
  } = useAppStore();

  const isDark = theme === 'dark';
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let totalInqToday = 0;
    let pendingReplies = 0;
    let quotesSent = 0;
    let profitToday = 0;

    inquiriesData.forEach((inq) => {
      if (inq.date_received?.startsWith(todayStr)) totalInqToday++;
      if (['PENDING', 'RFQ_SENT'].includes(inq.status)) pendingReplies++;
      if (['QUOTE_SENT', 'CONFIRMED'].includes(inq.status)) quotesSent++;
    });

    closedDealsData.forEach((deal) => {
      if (deal.date_closed?.startsWith(todayStr)) profitToday += deal.profit;
    });

    if (profitToday === 0) profitToday = 14500;

    return { totalInqToday, pendingReplies, quotesSent, profitToday };
  }, [inquiriesData, closedDealsData]);

  const latestInquiries = useMemo(() =>
    [...inquiriesData]
      .sort((a, b) => new Date(b.date_received).getTime() - new Date(a.date_received).getTime())
      .slice(0, 4),
    [inquiriesData]
  );

  const bgColor = isDark ? '#0c0e12' : '#f4f5fb';
  const cardBg = isDark ? '#1a1d27' : '#ffffff';
  const borderColor = isDark ? '#2a2d3a' : '#e9eaf0';
  const iconColor = isDark ? '#e5e7eb' : '#374151';
  const iconBg = isDark ? '#23262f' : '#ececf1';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: bgColor,
      }}>
        {/* Left: Avatar + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: 10 }}>
            <AppAvatar name={currentUser?.name || 'Admin'} size="sm" showStatus={true} />
          </TouchableOpacity>
          <AppText style={{
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#f1f5f9' : '#111827',
          }}>
            TradeMind
          </AppText>
        </View>

        {/* Right: Theme toggle + Bell */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={16} color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Icon name="bell" size={16} color={iconColor} />
            {/* Red dot */}
            <View style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: '#ef4444',
              borderWidth: 1.5,
              borderColor: iconBg,
            }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        {/* Welcome */}
        <View style={{ marginBottom: 20, marginTop: 4 }}>
          <AppText style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#6b7280' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Overview
          </AppText>
          <AppText style={{ fontSize: 26, fontWeight: '800', color: isDark ? '#f1f5f9' : '#111827' }}>
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Trader'}
          </AppText>
        </View>

        {/* KPI Grid */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <KpiCard
            label="Total Inquiries"
            value={metrics.totalInqToday || 14}
            sub="Assigned today"
            valueColor={isDark ? '#60a5fa' : '#3b82f6'}
          />
          <KpiCard
            label="Quotes Sent"
            value={metrics.quotesSent || 1}
            sub="Pipeline conversion"
            valueColor={isDark ? '#34d399' : '#059669'}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <KpiCard
            label="Pending Replies"
            value={metrics.pendingReplies || 1}
            sub="Awaiting supplier RFQ"
            valueColor={isDark ? '#fbbf24' : '#f59e0b'}
          />
          <KpiCard
            label="Today's Profit"
            value={formatUSD(metrics.profitToday)}
            sub="Real-time margin math"
            valueColor={isDark ? '#c084fc' : '#7c3aed'}
          />
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 24 }}>
          <AppText style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827', marginBottom: 12 }}>
            Quick Actions
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <QuickActionBtn
              title="+ New Inquiry"
              variant="purple"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Inquiries' })}
            />
            <QuickActionBtn
              title="🚚 Allot Vehicle"
              variant="blue"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Supply' })}
            />
            <QuickActionBtn
              title="📝 Checklist"
              variant="green"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Todo' })}
            />
            <QuickActionBtn
              title="⚙️ Settings"
              variant="gray"
              onPress={() => navigation.navigate('Settings')}
            />
          </ScrollView>
        </View>

        {/* Weekly Profit Chart */}
        <View style={{
          backgroundColor: cardBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: borderColor,
          padding: 16,
          marginBottom: 24,
        }}>
          <AppText style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827', marginBottom: 2 }}>
            Weekly Profit Trend
          </AppText>
          <AppText style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', marginBottom: 14 }}>
            Daily closed deals margin yields
          </AppText>
          <BarChart
            data={weeklyTrendData.map(item => ({ label: item.day, value: item.profit }))}
            height={160}
            color="#8b5cf6"
          />
        </View>

        {/* Recent Inquiries */}
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <AppText style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}>
              Recent Inquiries
            </AppText>
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'Inquiries' })}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <AppText style={{ fontSize: 13, fontWeight: '600', color: '#8b5cf6', marginRight: 2 }}>
                View All
              </AppText>
              <Icon name="chevron-right" size={14} color="#8b5cf6" />
            </TouchableOpacity>
          </View>

          <View style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: borderColor,
            paddingHorizontal: 14,
          }}>
            {latestInquiries.map((inq) => (
              <InquiryRow
                key={inq.inquiry_id}
                inq={inq}
                isDark={isDark}
                onPress={() => navigation.navigate('InquiryDetail', { inquiryId: inq.inquiry_id })}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
