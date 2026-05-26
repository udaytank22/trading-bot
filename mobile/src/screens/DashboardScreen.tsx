import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppAvatar from '../components/common/AppAvatar';
import AppHeader from '../components/layout/AppHeader';
import AppStatusBadge from '../components/common/AppStatusBadge';
import { BarChart } from '../components/charts/AppCharts';
import { formatUSD, formatDateString } from '../utils/marginEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

interface QuickActionBtnProps {
  title: string;
  bg: string;
  labelColor: string;
  onPress: () => void;
}

const QuickActionBtn = ({ title, bg, labelColor, onPress }: QuickActionBtnProps) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`px-4 py-2.5 rounded-xl border border-transparent mr-2.5 active:opacity-75 items-center justify-center ${bg}`}
  >
    <AppText variant="captionSemibold" className={`font-bold ${labelColor}`}>
      {title}
    </AppText>
  </TouchableOpacity>
);

export const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { 
    currentUser, 
    inquiriesData, 
    closedDealsData, 
    weeklyTrendData,
    theme,
    toggleTheme 
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let totalInqToday = 0;
    let pendingReplies = 0;
    let quotesSent = 0;
    let profitToday = 0;

    inquiriesData.forEach((inq) => {
      if (inq.date_received?.startsWith(todayStr)) {
        totalInqToday++;
      }
      if (['PENDING', 'RFQ_SENT'].includes(inq.status)) {
        pendingReplies++;
      }
      if (['QUOTE_SENT', 'CONFIRMED'].includes(inq.status)) {
        quotesSent++;
      }
    });

    closedDealsData.forEach((deal) => {
      if (deal.date_closed?.startsWith(todayStr)) {
        profitToday += deal.profit;
      }
    });

    // Fallback if no profit is logged today for demo purposes
    if (profitToday === 0) {
      profitToday = 14500; // Mon trend value from mock
    }

    return {
      totalInqToday,
      pendingReplies,
      quotesSent,
      profitToday
    };
  }, [inquiriesData, closedDealsData]);

  // Get latest 5 inquiries
  const latestInquiries = useMemo(() => {
    return [...inquiriesData]
      .sort((a, b) => new Date(b.date_received).getTime() - new Date(a.date_received).getTime())
      .slice(0, 4);
  }, [inquiriesData]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-darkbg">
      <AppHeader
        title="TradeMind"
        leftAction={
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <AppAvatar name={currentUser?.name || 'Admin'} size="sm" showStatus={true} />
          </TouchableOpacity>
        }
        rightAction={
          <View className="flex-row items-center">
            {/* Theme Toggle */}
            <TouchableOpacity 
              onPress={toggleTheme}
              className="mr-3 p-1.5 rounded-xl bg-gray-200 dark:bg-white/10 active:opacity-75"
            >
              <AppText className="text-sm">
                {theme === 'dark' ? '☀️' : '🌙'}
              </AppText>
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Notifications')}
              className="p-1.5 rounded-xl bg-gray-200 dark:bg-white/10 active:opacity-75 relative"
            >
              <AppText className="text-sm">🔔</AppText>
              <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        className="flex-1 px-4 py-3"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Welcome Section */}
        <View className="mb-4 mt-1">
          <AppText variant="subtitle" className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Overview
          </AppText>
          <AppText variant="h1" className="font-extrabold mt-0.5">
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Trader'}
          </AppText>
        </View>

        {/* 2x2 KPI Grid */}
        <View className="flex-row justify-between mb-4">
          <AppCard variant="glass" className="w-[48%] p-3.5 border-l-4 border-l-blue-500">
            <AppText variant="captionSemibold" className="text-gray-400">Total Inquiries</AppText>
            <AppText variant="h1" className="font-bold mt-1 text-blue-500">{metrics.totalInqToday || '14'}</AppText>
            <AppText variant="small" className="text-[10px] text-gray-500 mt-0.5">Assigned today</AppText>
          </AppCard>

          <AppCard variant="glass" className="w-[48%] p-3.5 border-l-4 border-l-emerald-500">
            <AppText variant="captionSemibold" className="text-gray-400">Quotes Sent</AppText>
            <AppText variant="h1" className="font-bold mt-1 text-emerald-500">{metrics.quotesSent || '8'}</AppText>
            <AppText variant="small" className="text-[10px] text-gray-500 mt-0.5">Pipeline conversion</AppText>
          </AppCard>
        </View>

        <View className="flex-row justify-between mb-5">
          <AppCard variant="glass" className="w-[48%] p-3.5 border-l-4 border-l-amber-500">
            <AppText variant="captionSemibold" className="text-gray-400">Pending Replies</AppText>
            <AppText variant="h1" className="font-bold mt-1 text-amber-500">{metrics.pendingReplies || '6'}</AppText>
            <AppText variant="small" className="text-[10px] text-gray-500 mt-0.5">Awaiting supplier RFQ</AppText>
          </AppCard>

          <AppCard variant="glass" className="w-[48%] p-3.5 border-l-4 border-l-purple-500">
            <AppText variant="captionSemibold" className="text-gray-400">Today's Profit</AppText>
            <AppText variant="h1" className="font-bold mt-1 text-purple-500">{formatUSD(metrics.profitToday)}</AppText>
            <AppText variant="small" className="text-[10px] text-gray-500 mt-0.5">Real-time margin math</AppText>
          </AppCard>
        </View>

        {/* Quick Actions Scroll */}
        <View className="mb-5">
          <AppText variant="h3" className="font-bold mb-2.5">Quick Actions</AppText>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} className="flex-row">
            <QuickActionBtn 
              title="+ New Inquiry" 
              bg="bg-purple-100 dark:bg-purple-950/20" 
              labelColor="text-purple-600 dark:text-purple-400"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Inquiries' })}
            />
            <QuickActionBtn 
              title="🚚 Allot Vehicle" 
              bg="bg-blue-100 dark:bg-blue-950/20" 
              labelColor="text-blue-600 dark:text-blue-400"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Supply' })}
            />
            <QuickActionBtn 
              title="📝 Checklist" 
              bg="bg-emerald-100 dark:bg-emerald-950/20" 
              labelColor="text-emerald-600 dark:text-emerald-400"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Todo' })}
            />
            <QuickActionBtn 
              title="⚙️ Settings" 
              bg="bg-gray-200 dark:bg-white/10" 
              labelColor="text-gray-700 dark:text-gray-300"
              onPress={() => navigation.navigate('Settings')}
            />
          </ScrollView>
        </View>

        {/* Weekly Profit Chart Card */}
        <AppCard variant="glass" className="mb-5 p-4">
          <AppText variant="h3" className="font-bold mb-1">
            Weekly Profit Trend
          </AppText>
          <AppText variant="captionSemibold" className="text-gray-400 dark:text-gray-500 mb-4">
            Daily closed deals margin yields
          </AppText>

          <BarChart 
            data={weeklyTrendData.map(item => ({ label: item.day, value: item.profit }))}
            height={160}
            color="#8b5cf6"
          />
        </AppCard>

        {/* Recent Inquiries List */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <AppText variant="h3" className="font-bold">Recent Inquiries</AppText>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Inquiries' })}>
              <AppText className="text-xs text-purple-600 dark:text-purple-450 font-bold">View All</AppText>
            </TouchableOpacity>
          </View>

          {latestInquiries.map((inq) => (
            <TouchableOpacity 
              key={inq.inquiry_id}
              onPress={() => navigation.navigate('InquiryDetail', { inquiryId: inq.inquiry_id })}
              activeOpacity={0.85}
              className="mb-2.5"
            >
              <AppCard variant="glass" className="p-3.5 flex-row justify-between items-center">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center">
                    <AppText className="font-mono text-purple-600 dark:text-purple-400 text-xs font-bold mr-2">
                      {inq.inquiry_id}
                    </AppText>
                    <AppText variant="caption" className="text-gray-550">
                      {formatDateString(inq.date_received)}
                    </AppText>
                  </View>
                  
                  <AppText variant="bodySemibold" className="mt-1" numberOfLines={1}>
                    {inq.buyer_name}
                  </AppText>
                  
                  <AppText variant="caption" className="mt-0.5 text-gray-500" numberOfLines={1}>
                    {inq.products[0]?.product_name} {inq.products.length > 1 ? `+${inq.products.length - 1} more` : ''}
                  </AppText>
                </View>

                <View className="items-end">
                  <AppStatusBadge status={inq.status} />
                  <AppText variant="captionSemibold" className="mt-2 text-gray-400">
                    {inq.vessel_name}
                  </AppText>
                </View>
              </AppCard>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};
export default DashboardScreen;
