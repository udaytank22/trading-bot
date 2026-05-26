import React, { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
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
  const isSelected = activeSubTab === type;
  return (
    <TouchableOpacity
      onPress={() => onPress(type)}
      className={`flex-1 py-2 items-center border-b-2 ${
        isSelected ? 'border-purple-650 dark:border-purple-400' : 'border-transparent'
      }`}
    >
      <AppText className={isSelected ? 'text-purple-650 dark:text-purple-450 font-bold' : 'text-gray-550 dark:text-gray-400 font-semibold'}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

export const TodoScreen = () => {
  const { todoData, addTodo, toggleTodo, deleteTodo } = useAppStore();

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
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-darkbg">
      <AppHeader 
        title="Checklist & Events"
        rightAction={
          <AppButton
            title="+ Add"
            onPress={() => setIsAddModalOpen(true)}
            className="h-[34px] px-3.5"
          />
        }
      />

      {/* Sub tabs */}
      <View className="flex-row bg-white dark:bg-[#12141c] border-b border-gray-150 dark:border-white/[0.03] px-2 mb-3">
        <SubTabButton type="TASKS" label="Active Checklist" activeSubTab={activeSubTab} onPress={setActiveSubTab} />
        <SubTabButton type="CALENDAR" label="Leaves & Celebrations" activeSubTab={activeSubTab} onPress={setActiveSubTab} />
      </View>

      {activeSubTab === 'TASKS' ? (
        <View className="flex-1 p-4">
          <AppSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Search checklist tasks..."
            className="mb-4"
          />

          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const priorityColor = 
                item.priority === 'High' ? 'danger' :
                item.priority === 'Medium' ? 'warning' : 'info';

              return (
                <AppCard variant="glass" className={`mb-2.5 p-3 flex-row items-center justify-between ${item.completed ? 'opacity-55' : ''}`}>
                  <View className="flex-row items-center flex-1 pr-3">
                    <TouchableOpacity 
                      onPress={() => toggleTodo(item.id)}
                      className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${
                        item.completed 
                          ? 'bg-purple-600 border-purple-600' 
                          : 'border-gray-400 dark:border-gray-600'
                      }`}
                    >
                      {item.completed && <AppText className="text-white text-xs font-bold">✓</AppText>}
                    </TouchableOpacity>

                    <View className="flex-1">
                      <AppText 
                        variant="bodySemibold" 
                        className={item.completed ? 'line-through text-gray-550' : 'text-gray-800 dark:text-gray-100'}
                      >
                        {item.title}
                      </AppText>
                      <AppText variant="caption" className="text-gray-500 mt-0.5">
                        🕒 {item.time} | 📍 {item.location}
                      </AppText>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <AppBadge label={item.priority} variant={priorityColor} className="mr-2" />
                    
                    <TouchableOpacity onPress={() => deleteTodo(item.id)} className="p-1">
                      <AppText className="text-red-500 font-bold text-sm">✕</AppText>
                    </TouchableOpacity>
                  </View>
                </AppCard>
              );
            }}
            ListEmptyComponent={
              <View className="mt-8">
                <AppText variant="subtitle" className="text-center text-sm text-gray-500">
                  Checklist is empty. Add a new task above!
                </AppText>
              </View>
            }
          />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Celebrations */}
          <AppCard variant="glass" className="mb-4">
            <AppText variant="h3" className="font-bold text-rose-500 mb-3">
              🎂 Today's Birthdays
            </AppText>
            
            <View className="flex-row items-center p-2 border-b border-gray-100 dark:border-white/[0.04] pb-3 mb-2">
              <View className="w-10 h-10 rounded-full bg-rose-500/10 items-center justify-center mr-3">
                <AppText className="text-rose-500 font-bold">PP</AppText>
              </View>
              <View>
                <AppText variant="bodySemibold">Priya Patel</AppText>
                <AppText variant="caption" className="text-gray-500">Sales Executive • May 13</AppText>
              </View>
            </View>

            <View className="flex-row items-center p-2">
              <View className="w-10 h-10 rounded-full bg-rose-500/10 items-center justify-center mr-3">
                <AppText className="text-rose-500 font-bold">RV</AppText>
              </View>
              <View>
                <AppText variant="bodySemibold">Rahul Verma</AppText>
                <AppText variant="caption" className="text-gray-500">Sourcing Manager • Work Anniversary (3 Years)</AppText>
              </View>
            </View>
          </AppCard>

          {/* Leaves */}
          <AppCard variant="glass" className="mb-4">
            <AppText variant="h3" className="font-bold text-blue-500 mb-3">
              ✈️ Out of Office Today
            </AppText>
            
            {mockLeaves.map(leave => (
              <View key={leave.id} className="flex-row justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/[0.04] last:border-0">
                <AppText variant="bodySemibold" className="text-gray-800 dark:text-gray-200">
                  {leave.name}
                </AppText>
                <AppText variant="caption" className="text-gray-500">
                  {leave.type} ({leave.duration})
                </AppText>
              </View>
            ))}
          </AppCard>

          {/* Office Festival */}
          <AppCard variant="glass" className="bg-amber-500/5 dark:bg-amber-950/10 border border-amber-250/20">
            <AppText variant="h3" className="font-bold text-amber-600 dark:text-amber-400 mb-1">
              🎉 Upcoming Festival
            </AppText>
            <AppText variant="bodySemibold" className="mt-1">Ganesh Chaturthi</AppText>
            <AppText variant="caption" className="text-gray-500 dark:text-gray-400 mt-0.5">
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
          className="mt-4"
        />
      </AppModal>
    </SafeAreaView>
  );
};
export default TodoScreen;
