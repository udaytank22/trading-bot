import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { View, FlatList, StyleSheet } from 'react-native';
import { useAppStore } from '../../store/appStore';
import AppText from '../../components/common/AppText';
import AppCard from '../../components/common/AppCard';
import AppHeader from '../../components/layout/AppHeader';

export const NotificationsScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const { notificationsData, markNotificationsAsRead } = useAppStore();

  // Mark all notifications as read when the screen is viewed
  useEffect(() => {
    markNotificationsAsRead();
  }, [markNotificationsAsRead]);

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
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader title="Notifications Log" showBack={true} />

      <FlatList
        data={notificationsData}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item }) => {
          const isDark = theme === 'dark';
          const cardStyle = [
            styles.card,
            item.isRead ? styles.cardRead : styles.cardUnread,
          ];

          const getIconBgStyle = () => {
            switch (item.type) {
              case 'inquiry':
                return isDark ? styles.iconInquiryDark : styles.iconInquiry;
              case 'purchase-order':
                return isDark ? styles.iconPODark : styles.iconPO;
              case 'document':
                return isDark ? styles.iconDocumentDark : styles.iconDocument;
              case 'supply':
                return isDark ? styles.iconSupplyDark : styles.iconSupply;
              default:
                return isDark ? styles.iconDefaultDark : styles.iconDefault;
            }
          };

          return (
            <AppCard 
              variant="glass" 
              style={cardStyle}
            >
              <View style={[styles.iconContainer, getIconBgStyle()]}>
                <AppText style={styles.appText4}>{getIconEmoji(item.type)}</AppText>
              </View>

            <View style={styles.view2}>
              <View style={styles.view1}>
                <AppText variant="bodySemibold" style={[styles.appText3, theme === 'dark' && styles.appText3Dark]}>
                  {item.title}
                </AppText>
                <AppText variant="caption" style={styles.appText2}>
                  {item.time}
                </AppText>
              </View>
              
              <AppText variant="caption" style={[styles.appText1, theme === 'dark' && styles.appText1Dark]}>
                {item.message}
              </AppText>
            </View>
          </AppCard>
        );
      }}
        ListEmptyComponent={
          <View style={styles.view}>
            <AppText variant="subtitle" style={styles.appText}>
              No recent notifications logs.
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  appText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  appText1: {},
  appText1Dark: {
    color: '#9ca3af',
  },
  appText2: {
    fontSize: 10,
    color: '#6b7280',
  },
  appText3: {},
  appText3Dark: {
    color: '#ffffff',
  },
  appText4: {
    fontSize: 16,
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeAreaViewDark: {
    backgroundColor: '#0c0e12',
  },
  view: {
    marginTop: 32,
  },
  view1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  view2: {
    flex: 1,
  },
  card: {
    marginBottom: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardRead: {
    opacity: 0.7,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconInquiry: {
    backgroundColor: '#f3e8ff',
  },
  iconInquiryDark: {
    backgroundColor: 'rgba(59, 7, 100, 0.3)',
  },
  iconPO: {
    backgroundColor: '#d1fae5',
  },
  iconPODark: {
    backgroundColor: 'rgba(6, 78, 59, 0.3)',
  },
  iconDocument: {
    backgroundColor: '#dbeafe',
  },
  iconDocumentDark: {
    backgroundColor: 'rgba(23, 37, 84, 0.3)',
  },
  iconSupply: {
    backgroundColor: '#fef3c7',
  },
  iconSupplyDark: {
    backgroundColor: 'rgba(69, 26, 3, 0.3)',
  },
  iconDefault: {
    backgroundColor: '#f3f4f6',
  },
  iconDefaultDark: {
    backgroundColor: '#1f2937',
  },
});

export default NotificationsScreen;
