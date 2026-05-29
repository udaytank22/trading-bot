import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { ScaledSheet } from 'react-native-size-matters';
import { View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppSearch from '../components/inputs/AppSearch';
import AppButton from '../components/common/AppButton';
import AppModal from '../components/modals/AppModal';
import AppInput from '../components/inputs/AppInput';
import AppDropdown from '../components/inputs/AppDropdown';
import AppBadge from '../components/common/AppBadge';
import { TodoItem, mockLeaves } from '../data/activities';

interface SubTabButtonProps {
  type: 'TASKS' | 'CALENDAR';
  label: string;
  activeSubTab: 'TASKS' | 'CALENDAR';
  onPress: (type: 'TASKS' | 'CALENDAR') => void;
}

const SubTabButton = ({ type, label, activeSubTab, onPress }: SubTabButtonProps) => {
  const theme = useAppStore((state) => state.theme);
  const isSelected = activeSubTab === type;
  const isDark = theme === 'dark';
  return (
    <TouchableOpacity
      onPress={() => onPress(type)}
      style={[
        styles.subTabButton,
        isSelected ? (isDark ? styles.subTabButtonSelectedDark : styles.subTabButtonSelected) : styles.subTabButtonUnselected,
      ]}
    >
      <AppText style={
        isSelected 
          ? (isDark ? styles.subTabTextSelectedDark : styles.subTabTextSelected) 
          : (isDark ? styles.subTabTextUnselectedDark : styles.subTabTextUnselected)
      }>
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

export const TodoScreen = () => {
  const { todoData, addTodo, toggleTodo, deleteTodo, theme } = useAppStore();

  const [search, setSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'TASKS' | 'CALENDAR'>('TASKS');
  
  // Add Todo Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('Medium');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = todoData;
    
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.location.toLowerCase().includes(q)
      );
    }
    
    // Sort uncompleted first, then high priority first
    return result.sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      
      const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const wA = priorityWeight[a.priority as 'High' | 'Medium' | 'Low'] || 0;
      const wB = priorityWeight[b.priority as 'High' | 'Medium' | 'Low'] || 0;
      return wB - wA;
    });
  }, [todoData, search]);

  const handleAddTask = () => {
    if (!title.trim()) return;

    const newTask: TodoItem = {
      id: Date.now(),
      title: title.trim(),
      time,
      location: location.trim() || 'Office',
      priority,
      date: new Date().toISOString().split('T')[0],
      completed: false
    };

    addTodo(newTask);
    setTitle('');
    setLocation('');
    setIsAddModalOpen(false);
  };

  return (
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]} edges={["top"]}>
      <AppHeader 
        title="Checklist & Events"
        rightAction={
          <AppButton
            title="+ Add"
            onPress={() => setIsAddModalOpen(true)}
            style={styles.appButton1}
          />
        }
      />

      {/* Sub tabs */}
      <View style={[styles.view10, theme === 'dark' && styles.view10Dark]}>
        <SubTabButton type="TASKS" label="Active Checklist" activeSubTab={activeSubTab} onPress={setActiveSubTab} />
        <SubTabButton type="CALENDAR" label="Leaves & Celebrations" activeSubTab={activeSubTab} onPress={setActiveSubTab} />
      </View>

      {activeSubTab === 'TASKS' ? (
        <View style={styles.view9}>
          <AppSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Search checklist tasks..."
            style={styles.style}
          />

          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const priorityColor = 
                item.priority === 'High' ? 'danger' :
                item.priority === 'Medium' ? 'warning' : 'info';

              const isDark = theme === 'dark';
              return (
                <AppCard 
                  variant="glass" 
                  style={[
                    styles.taskCard,
                    item.completed && styles.taskCardCompleted,
                  ]}
                >
                  <View style={styles.view8}>
                    <TouchableOpacity 
                      onPress={() => toggleTodo(item.id)}
                      style={[
                        styles.checkbox,
                        item.completed 
                          ? styles.checkboxCompleted 
                          : (isDark ? styles.checkboxUncompletedDark : styles.checkboxUncompleted),
                      ]}
                    >
                      {item.completed && <AppText style={styles.appText14}>✓</AppText>}
                    </TouchableOpacity>

                    <View style={styles.view7}>
                      <AppText 
                        variant="bodySemibold" 
                        style={[
                          styles.taskTitle,
                          item.completed 
                            ? styles.taskTitleCompleted 
                            : (isDark ? styles.taskTitleActiveDark : styles.taskTitleActive),
                        ]}
                      >
                        {item.title}
                      </AppText>
                      <AppText variant="caption" style={styles.appText13}>
                        🕒 {item.time} | 📍 {item.location}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.view6}>
                    <AppBadge label={item.priority} variant={priorityColor} style={styles.appBadge} />
                    
                    <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.touchableOpacity}>
                      <AppText style={styles.appText12}>✕</AppText>
                    </TouchableOpacity>
                  </View>
                </AppCard>
              );
            }}
            ListEmptyComponent={
              <View style={styles.view5}>
                <AppText variant="subtitle" style={styles.appText11}>
                  Checklist is empty. Add a new task above!
                </AppText>
              </View>
            }
          />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Celebrations */}
          <AppCard variant="glass" style={styles.appCard2}>
            <AppText variant="h3" style={styles.appText10}>
              🎂 Today's Birthdays
            </AppText>
            
            <View style={[styles.view4, theme === 'dark' && styles.view4Dark]}>
              <View style={styles.view3}>
                <AppText style={styles.appText9}>PP</AppText>
              </View>
              <View>
                <AppText variant="bodySemibold">Priya Patel</AppText>
                <AppText variant="caption" style={styles.appText8}>Sales Executive • May 13</AppText>
              </View>
            </View>

            <View style={styles.view2}>
              <View style={styles.view1}>
                <AppText style={styles.appText7}>RV</AppText>
              </View>
              <View>
                <AppText variant="bodySemibold">Rahul Verma</AppText>
                <AppText variant="caption" style={styles.appText6}>Sourcing Manager • Work Anniversary (3 Years)</AppText>
              </View>
            </View>
          </AppCard>

          {/* Leaves */}
          <AppCard variant="glass" style={styles.appCard1}>
            <AppText variant="h3" style={styles.appText5}>
              ✈️ Out of Office Today
            </AppText>
            
            {mockLeaves.map(leave => (
              <View key={leave.id} style={[styles.view, theme === 'dark' && styles.viewDark]}>
                <AppText variant="bodySemibold" style={[styles.appText4, theme === 'dark' && styles.appText4Dark]}>
                  {leave.name}
                </AppText>
                <AppText variant="caption" style={styles.appText3}>
                  {leave.type} ({leave.duration})
                </AppText>
              </View>
            ))}
          </AppCard>

          {/* Office Festival */}
          <AppCard variant="glass" style={styles.appCard}>
            <AppText variant="h3" style={styles.appText2}>
              🎉 Upcoming Festival
            </AppText>
            <AppText variant="bodySemibold" style={styles.appText1}>Ganesh Chaturthi</AppText>
            <AppText variant="caption" style={[styles.appText, theme === 'dark' && styles.appTextDark]}>
              Traditional celebration and sweets arrangement in the office lobby at 4 PM.
            </AppText>
          </AppCard>
        </ScrollView>
      )}

      {/* Add Task Modal */}
      <AppModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Task"
      >
        <AppInput
          label="Task Description"
          placeholder="e.g. Call supplier for invoice details"
          value={title}
          onChangeText={setTitle}
        />
        <AppInput
          label="Scheduled Time"
          placeholder="e.g. 10:00 AM"
          value={time}
          onChangeText={setTime}
        />
        <AppInput
          label="Meeting Location / Room"
          placeholder="e.g. Conference Room A"
          value={location}
          onChangeText={setLocation}
        />
        
        <AppDropdown
          label="Priority"
          value={priority}
          onSelect={(val) => setPriority(val.toString())}
          options={[
            { value: 'High', label: 'High Priority' },
            { value: 'Medium', label: 'Medium Priority' },
            { value: 'Low', label: 'Low Priority' }
          ]}
        />

        <AppButton
          title="Confirm & Schedule Task"
          onPress={handleAddTask}
          style={styles.appButton}
        />
      </AppModal>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  appBadge: {
    marginRight: '8@ms',
  },
  appButton: {
    marginTop: '16@ms',
  },
  appButton1: {
    height: '34.0@vs',
    paddingHorizontal: '14@ms',
  },
  appCard: {
    borderWidth: 1,
  },
  appCard1: {
    marginBottom: '16@ms',
  },
  appCard2: {
    marginBottom: '16@ms',
  },
  appText: {
    color: '#6b7280',
    marginTop: '2@ms',
  },
  appText1: {
    marginTop: '4@ms',
  },
  appText10: {
    fontWeight: 'bold',
    marginBottom: '12@ms',
  },
  appText11: {
    textAlign: 'center',
    fontSize: '14@ms',
    color: '#6b7280',
  },
  appText12: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: '14@ms',
  },
  appText13: {
    color: '#6b7280',
    marginTop: '2@ms',
  },
  appText14: {
    color: '#ffffff',
    fontSize: '12@ms',
    fontWeight: 'bold',
  },
  appText2: {
    fontWeight: 'bold',
    marginBottom: '4@ms',
  },
  appText3: {
    color: '#6b7280',
  },
  appText4: {
    color: '#1f2937',
  },
  appText4Dark: {
    color: '#e5e7eb',
  },
  appText5: {
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: '12@ms',
  },
  appText6: {
    color: '#6b7280',
  },
  appText7: {
    fontWeight: 'bold',
  },
  appText8: {
    color: '#6b7280',
  },
  appText9: {
    fontWeight: 'bold',
  },
  appTextDark: {
    color: '#9ca3af',
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeAreaViewDark: {
    backgroundColor: '#0c0e12',
  },
  scrollView: {
    flex: 1,
    padding: '16@ms',
  },
  style: {
    marginBottom: '16@ms',
  },
  touchableOpacity: {
    padding: '4@ms',
  },
  view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '10@ms',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  view1: {
    width: '40@s',
    height: '40@vs',
    borderRadius: '9999@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@ms',
  },
  view10: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#eef2f6',
    paddingHorizontal: '8@ms',
    marginBottom: '12@ms',
  },
  view10Dark: {
    backgroundColor: '#12141c',
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  view2: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '8@ms',
  },
  view3: {
    width: '40@s',
    height: '40@vs',
    borderRadius: '9999@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@ms',
  },
  view4: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '8@ms',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    paddingBottom: '12@ms',
    marginBottom: '8@ms',
  },
  view4Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view5: {
    marginTop: '32@ms',
  },
  view6: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  view7: {
    flex: 1,
  },
  view8: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: '12@ms',
  },
  view9: {
    flex: 1,
    padding: '16@ms',
  },
  viewDark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  subTabButton: {
    flex: 1,
    paddingVertical: '8@ms',
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  subTabButtonSelected: {
    borderColor: '#8b5cf6',
  },
  subTabButtonSelectedDark: {
    borderColor: '#c084fc',
  },
  subTabButtonUnselected: {
    borderColor: 'transparent',
  },
  subTabTextSelected: {
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  subTabTextSelectedDark: {
    color: '#c084fc',
    fontWeight: 'bold',
  },
  subTabTextUnselected: {
    color: '#4b5563',
    fontWeight: '600',
  },
  subTabTextUnselectedDark: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  taskCard: {
    marginBottom: '10@ms',
    padding: '12@ms',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardCompleted: {
    opacity: 0.55,
  },
  checkbox: {
    width: '24@s',
    height: '24@vs',
    borderRadius: '8@ms',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12@ms',
  },
  checkboxCompleted: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  checkboxUncompleted: {
    borderColor: '#9ca3af',
  },
  checkboxUncompletedDark: {
    borderColor: '#4b5563',
  },
  taskTitle: {
    fontSize: '14@ms',
    fontWeight: '600',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#4b5563',
  },
  taskTitleActive: {
    color: '#1f2937',
  },
  taskTitleActiveDark: {
    color: '#f3f4f6',
  },
});

export default TodoScreen;
