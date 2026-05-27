import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import Stylesheet from '../components/common/Stylesheet';

import { View, FlatList } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';

export const NotificationsScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const { notificationsData, markNotificationsAsRead } = useAppStore();

  // Mark all notifications as read when the screen is viewed
  useEffect(() => {
    markNotificationsAsRead();
  }, [markNotificationsAsRead]);

  const getIconColor = (type: string) => {
    switch (type) {
      case 'inquiry': return 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400';
      case 'purchase-order': return 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
      case 'document': return 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400';
      case 'supply': return 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getIconEmoji = (type: string) => {
    switch (type) {
      case 'inquiry': return '📩';
      case 'purchase-order': return '📄';
      case 'document': return '📂';
      case 'supply': return '🚚';
      default: return '⚙️';
    }
  };

  return (
    <SafeAreaView style={Stylesheet.cls(theme, "flex-1 bg-gray-50 dark:bg-darkbg")}>
      <AppHeader title="Notifications Log" showBack={true} />

      <FlatList
        data={notificationsData}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <AppCard 
            variant="glass" 
            style={Stylesheet.cls(theme, `mb-3.5 p-4 flex-row items-start ${item.isRead ? 'opacity-70' : 'border-l-4 border-l-purple-600'}`)}
          >
            <View style={Stylesheet.cls(theme, `w-9 h-9 rounded-xl items-center justify-center mr-3.5 ${getIconColor(item.type)}`)}>
              <AppText style={Stylesheet.cls(theme, "text-base")}>{getIconEmoji(item.type)}</AppText>
            </View>

            <View style={Stylesheet.cls(theme, "flex-1")}>
              <View style={Stylesheet.cls(theme, "flex-row justify-between items-center mb-1")}>
                <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-gray-905 dark:text-white")}>
                  {item.title}
                </AppText>
                <AppText variant="caption" style={Stylesheet.cls(theme, "text-[10px] text-gray-500")}>
                  {item.time}
                </AppText>
              </View>
              
              <AppText variant="caption" style={Stylesheet.cls(theme, "text-gray-600 dark:text-gray-400 leading-relaxed")}>
                {item.message}
              </AppText>
            </View>
          </AppCard>
        )}
        ListEmptyComponent={
          <View style={Stylesheet.cls(theme, "mt-8")}>
            <AppText variant="subtitle" style={Stylesheet.cls(theme, "text-center text-sm text-gray-500")}>
              No recent notifications logs.
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};
export default NotificationsScreen;
