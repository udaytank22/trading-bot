import React, { useMemo } from 'react';
import { SafeAreaView, useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ScrollView, TouchableOpacity, RefreshControl, Animated, Modal, Dimensions, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/appStore';
import AppText from '../../components/common/AppText';
import AppAvatar from '../../components/common/AppAvatar';
import AppStatusBadge from '../../components/common/AppStatusBadge';
import { BarChart } from '../../components/charts/AppCharts';
import { formatUSD, formatDateString } from '../../utils/marginEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/Feather';
import { s, vs, ms } from 'react-native-size-matters';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = WINDOW_WIDTH * 0.75;

interface SidebarItemProps {
  title: string;
  desc: string;
  icon: string;
  onPress: () => void;
  isDark: boolean;
}

const SidebarItem = ({ title, desc, icon, onPress, isDark }: SidebarItemProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(12),
        paddingHorizontal: s(16),
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
      }}
    >
      <View style={{
        width: s(36),
        height: s(36),
        borderRadius: ms(10),
        backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#f3e8ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: s(12),
      }}>
        <AppText style={{ fontSize: ms(16) }}>{icon}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={{
          fontSize: ms(14),
          fontWeight: '700',
          color: isDark ? '#ffffff' : '#111827',
        }}>
          {title}
        </AppText>
        <AppText style={{
          fontSize: ms(11),
          color: isDark ? '#9ca3af' : '#6b7280',
          marginTop: vs(1),
        }}>
          {desc}
        </AppText>
      </View>
      <Icon name="chevron-right" size={16} color={isDark ? '#4b5563' : '#d1d5db'} />
    </TouchableOpacity>
  );
};

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
        paddingHorizontal: s(16),
        paddingVertical: vs(10),
        borderRadius: ms(999),
        marginRight: s(10),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText style={{ color: v.text, fontSize: ms(13), fontWeight: '600' }}>
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
      borderRadius: ms(14),
      borderWidth: 1,
      borderColor: isDark ? '#2a2d3a' : '#e9eaf0',
      padding: ms(14),
    }}>
      <AppText style={{ fontSize: ms(12), color: isDark ? '#9ca3af' : '#6b7280', marginBottom: vs(6) }}>
        {label}
      </AppText>
      <AppText style={{ fontSize: ms(26), fontWeight: '700', color: valueColor, marginBottom: vs(4) }}>
        {value}
      </AppText>
      <AppText style={{ fontSize: ms(11), color: isDark ? '#6b7280' : '#9ca3af' }}>
        {sub}
      </AppText>
    </View>
  );
};

const InquiryRow = ({ inq, onPress, isDark }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      paddingVertical: vs(14),
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#23262f' : '#f0f1f5',
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      {/* Left content */}
      <View style={{ flex: 1, paddingRight: s(10) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vs(3) }}>
          <AppText style={{
            fontSize: ms(11),
            fontWeight: '600',
            color: isDark ? '#818cf8' : '#6366f1',
            fontFamily: 'monospace',
            marginRight: s(8),
          }}>
            {inq.inquiry_id}
          </AppText>
          <AppText style={{ fontSize: ms(11), color: isDark ? '#6b7280' : '#9ca3af' }}>
            {formatDateString(inq.date_received)}
          </AppText>
        </View>
        <AppText style={{
          fontSize: ms(14),
          fontWeight: '700',
          color: isDark ? '#f1f5f9' : '#111827',
          marginBottom: vs(2),
        }} numberOfLines={1}>
          {inq.buyer_name}
        </AppText>
        <AppText style={{ fontSize: ms(12), color: isDark ? '#6b7280' : '#9ca3af' }} numberOfLines={1}>
          {inq.products[0]?.product_name}{inq.products.length > 1 ? ` +${inq.products.length - 1} more` : ''}
        </AppText>
      </View>

      {/* Right content */}
      <View style={{ alignItems: 'flex-end' }}>
        <AppStatusBadge status={inq.status} />
        <AppText style={{
          fontSize: ms(11),
          fontWeight: '600',
          color: isDark ? '#6b7280' : '#9ca3af',
          marginTop: vs(6),
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
  const insets = useSafeAreaInsets();
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
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSidebarVisible(false));
  };

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
        paddingHorizontal: s(16),
        paddingVertical: vs(12),
        backgroundColor: bgColor,
      }}>
        {/* Left: Menu button + Avatar + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openSidebar} style={{ marginRight: s(12), padding: s(2) }}>
            <Icon name="menu" size={22} color={isDark ? '#e5e7eb' : '#374151'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: s(10) }}>
            <AppAvatar name={currentUser?.name || 'Admin'} size="sm" showStatus={true} />
          </TouchableOpacity>
          <AppText style={{
            fontSize: ms(18),
            fontWeight: '700',
            color: isDark ? '#f1f5f9' : '#111827',
          }}>
            TradeMind
          </AppText>
        </View>

        {/* Right: Theme toggle + Bell */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              width: s(36),
              height: s(36),
              borderRadius: s(18),
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
              width: s(36),
              height: s(36),
              borderRadius: s(18),
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
              top: vs(7),
              right: s(7),
              width: s(7),
              height: s(7),
              borderRadius: s(4),
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
        contentContainerStyle={{ paddingHorizontal: s(16), paddingBottom: vs(40) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        {/* Welcome */}
        <View style={{ marginBottom: vs(20), marginTop: vs(4) }}>
          <AppText style={{ fontSize: ms(11), fontWeight: '600', color: isDark ? '#6b7280' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: vs(4) }}>
            Overview
          </AppText>
          <AppText style={{ fontSize: ms(26), fontWeight: '800', color: isDark ? '#f1f5f9' : '#111827' }}>
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Trader'}
          </AppText>
        </View>

        {/* KPI Grid */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(12) }}>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(24) }}>
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
        <View style={{ marginBottom: vs(24) }}>
          <AppText style={{ fontSize: ms(16), fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827', marginBottom: vs(12) }}>
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
              onPress={() => navigation.navigate('Todo')}
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
          borderRadius: ms(16),
          borderWidth: 1,
          borderColor: borderColor,
          padding: ms(16),
          marginBottom: vs(24),
        }}>
          <AppText style={{ fontSize: ms(15), fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827', marginBottom: vs(2) }}>
            Weekly Profit Trend
          </AppText>
          <AppText style={{ fontSize: ms(12), color: isDark ? '#6b7280' : '#9ca3af', marginBottom: vs(14) }}>
            Daily closed deals margin yields
          </AppText>
          <BarChart
            data={weeklyTrendData.map(item => ({ label: item.day, value: item.profit }))}
            height={vs(160)}
            color="#8b5cf6"
          />
        </View>

        {/* Recent Inquiries */}
        <View style={{ marginBottom: vs(8) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(4) }}>
            <AppText style={{ fontSize: ms(16), fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}>
              Recent Inquiries
            </AppText>
            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs', { screen: 'Inquiries' })}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <AppText style={{ fontSize: ms(13), fontWeight: '600', color: '#8b5cf6', marginRight: s(2) }}>
                View All
              </AppText>
              <Icon name="chevron-right" size={14} color="#8b5cf6" />
            </TouchableOpacity>
          </View>

          <View style={{
            backgroundColor: cardBg,
            borderRadius: ms(16),
            borderWidth: 1,
            borderColor: borderColor,
            paddingHorizontal: s(14),
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

      {/* ── Sidebar Drawer Modal ── */}
      <Modal
        visible={sidebarVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <SafeAreaProvider>
          <View style={styles.modalOverlay}>
            {/* Transparent Backdrop */}
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={closeSidebar}
            />

            {/* Sidebar Panel */}
            <Animated.View style={[
              styles.sidebarContainer,
              { transform: [{ translateX: slideAnim }] },
              isDark ? styles.sidebarDark : styles.sidebarLight
            ]}>
              <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={[
                  styles.sidebarHeader,
                  isDark ? styles.headerDark : styles.headerLight
                ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: s(8) }}>
                    <AppAvatar name={currentUser?.name || 'Admin'} size="md" />
                    <View style={{ marginLeft: s(12), flex: 1 }}>
                      <AppText style={{
                        fontSize: ms(16),
                        fontWeight: '800',
                        color: isDark ? '#ffffff' : '#111827',
                      }} numberOfLines={1}>
                        {currentUser?.name || 'Administrator'}
                      </AppText>
                      <AppText style={{
                        fontSize: ms(12),
                        color: isDark ? '#c084fc' : '#7c3aed',
                        fontWeight: '600',
                      }} numberOfLines={1}>
                        {currentUser?.role || 'System Manager'}
                      </AppText>
                    </View>
                  </View>

                  <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
                    <Icon name="x" size={20} color={isDark ? '#e5e7eb' : '#374151'} />
                  </TouchableOpacity>
                </View>

                {/* Menu Options */}
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  <SidebarItem
                    title="Purchase Orders"
                    desc="Manage buyer PO contracts"
                    icon="📄"
                    isDark={isDark}
                    onPress={() => {
                      closeSidebar();
                      navigation.navigate('PurchaseOrders');
                    }}
                  />
                  <SidebarItem
                    title="Invoices"
                    desc="Billings & draft invoices"
                    icon="💰"
                    isDark={isDark}
                    onPress={() => {
                      closeSidebar();
                      navigation.navigate('MainTabs', { screen: 'Invoices' });
                    }}
                  />
                  <SidebarItem
                    title="Inventory"
                    desc="Stock levels & warehouse A/B"
                    icon="📦"
                    isDark={isDark}
                    onPress={() => {
                      closeSidebar();
                      navigation.navigate('Inventory');
                    }}
                  />
                  <SidebarItem
                    title="Employees"
                    desc="Team directory & roles"
                    icon="👥"
                    isDark={isDark}
                    onPress={() => {
                      closeSidebar();
                      navigation.navigate('Employees');
                    }}
                  />
                  <SidebarItem
                    title="Bank Accounts"
                    desc="Liquid cash balances"
                    icon="🏦"
                    isDark={isDark}
                    onPress={() => {
                      closeSidebar();
                      navigation.navigate('Accounts');
                    }}
                  />
                  <SidebarItem
                    title="Settings & Defaults"
                    desc="Margins & defaults setup"
                    icon="⚙️"
                    isDark={isDark}
                    onPress={() => {
                      closeSidebar();
                      navigation.navigate('Settings');
                    }}
                  />
                </ScrollView>

                {/* Bottom Brand */}
                <View style={{
                  padding: ms(16),
                  borderTopWidth: 1,
                  borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                  alignItems: 'center',
                }}>
                  <AppText style={{ fontSize: ms(11), color: isDark ? '#4b5563' : '#9ca3af' }}>
                    TradeMind v1.0.0
                  </AppText>
                </View>
              </SafeAreaView>
            </Animated.View>
          </View>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sidebarContainer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  sidebarLight: {
    backgroundColor: '#ffffff',
  },
  sidebarDark: {
    backgroundColor: '#12141c',
  },
  sidebarHeader: {
    padding: ms(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLight: {
    borderBottomColor: '#f3f4f6',
  },
  headerDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  closeBtn: {
    padding: ms(8),
    borderRadius: ms(20),
  },
});

export default DashboardScreen;
