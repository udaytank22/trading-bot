import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import { View, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAppStore } from '../../store/appStore';
import AppText from '../../components/common/AppText';
import AppCard from '../../components/common/AppCard';
import AppHeader from '../../components/layout/AppHeader';
import AppSearch from '../../components/inputs/AppSearch';
import AppButton from '../../components/common/AppButton';
import AppModal from '../../components/modals/AppModal';
import AppInput from '../../components/inputs/AppInput';
import AppDropdown from '../../components/inputs/AppDropdown';
import AppAvatar from '../../components/common/AppAvatar';
import { Employee } from '../../data/users';

export const EmployeesScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const { employeesData, addEmployee, deleteEmployee } = useAppStore();

  const [search, setSearch] = useState('');
  
  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Sales Executive');
  const [dept, setDept] = useState('Sales');
  const [phone, setPhone] = useState('');

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employeesData;
    const q = search.toLowerCase();
    return employeesData.filter(emp => 
      emp.name.toLowerCase().includes(q) || 
      emp.email.toLowerCase().includes(q) || 
      emp.role.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q)
    );
  }, [employeesData, search]);

  const handleAddEmployee = () => {
    if (!name.trim() || !email.trim()) return;

    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const newEmp: Employee = {
      id: `EMP-00${employeesData.length + 1}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      department: dept,
      status: 'Active',
      joiningDate: new Date().toISOString().split('T')[0],
      phone: phone.trim() || 'N/A',
      avatar: initials
    };

    addEmployee(newEmp);

    // reset
    setName('');
    setEmail('');
    setPhone('');
    setModalOpen(false);
    Alert.alert('Staff Added', `${newEmp.name} has been added to the directory.`);
  };

  const handleDeleteEmployee = (id: string, empName: string) => {
    Alert.alert(
      'Remove Staff?',
      `Are you sure you want to remove ${empName} from the company directory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            deleteEmployee(id);
            Alert.alert('Removed', `${empName} was removed from the directory.`);
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader 
        title="Staff Directory" 
        showBack={true} 
        rightAction={
          <AppButton
            title="+ Add Staff"
            onPress={() => setModalOpen(true)}
            style={styles.appButton1}
          />
        }
      />

      <View style={styles.view3}>
        <AppSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, email or department..."
          style={styles.style}
        />

        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <AppCard variant="glass" style={styles.appCard}>
              <View style={styles.view2}>
                <AppAvatar name={item.name} size="md" showStatus={item.status === 'Active'} />
                
                <View style={styles.view1}>
                  <AppText variant="bodySemibold" style={[styles.appText4, theme === 'dark' && styles.appText4Dark]} numberOfLines={1}>
                    {item.name}
                  </AppText>
                  <AppText variant="caption" style={styles.appText3} numberOfLines={1}>
                    {item.role} • {item.department}
                  </AppText>
                  <AppText variant="small" style={styles.appText2} numberOfLines={1}>
                    📧 {item.email} | 📞 {item.phone}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => handleDeleteEmployee(item.id, item.name)} 
                style={styles.touchableOpacity}
              >
                <AppText style={styles.appText1}>REMOVE</AppText>
              </TouchableOpacity>
            </AppCard>
          )}
          ListEmptyComponent={
            <View style={styles.view}>
              <AppText variant="subtitle" style={styles.appText}>
                No staff members found.
              </AppText>
            </View>
          }
        />
      </View>

      {/* Add Staff Modal */}
      <AppModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Staff Member"
      >
        <AppInput
          label="Full Name"
          placeholder="e.g. Arjun Sharma"
          value={name}
          onChangeText={setName}
        />

        <AppInput
          label="Email Address"
          placeholder="e.g. arjun@trademind.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AppInput
          label="Phone Number"
          placeholder="e.g. +91 99887 66554"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <AppDropdown
          label="Department"
          value={dept}
          onSelect={(val) => setDept(val.toString())}
          options={[
            { value: 'Sales', label: 'Sales' },
            { value: 'Operations', label: 'Operations' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Management', label: 'Management' }
          ]}
        />

        <AppDropdown
          label="Role Title"
          value={role}
          onSelect={(val) => setRole(val.toString())}
          options={[
            { value: 'Sales Executive', label: 'Sales Executive' },
            { value: 'Sourcing Manager', label: 'Sourcing Manager' },
            { value: 'Accountant', label: 'Accountant' },
            { value: 'Logistics Coordinator', label: 'Logistics Coordinator' },
            { value: 'Admin', label: 'Admin' }
          ]}
        />

        <AppButton
          title="Save Staff Member"
          onPress={handleAddEmployee}
          style={styles.appButton}
        />
      </AppModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appButton: {
    marginTop: 16,
  },
  appButton1: {
    height: 34.0,
    paddingHorizontal: 14,
  },
  appCard: {
    marginBottom: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  appText1: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  appText2: {
    color: '#6b7280',
    marginTop: 2,
  },
  appText3: {
    color: '#9ca3af',
  },
  appText4: {
    color: '#111827',
  },
  appText4Dark: {
    color: '#ffffff',
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeAreaViewDark: {
    backgroundColor: '#0c0e12',
  },
  style: {
    marginBottom: 16,
  },
  touchableOpacity: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  view: {
    marginTop: 32,
  },
  view1: {
    marginLeft: 12,
    flex: 1,
  },
  view2: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  view3: {
    flex: 1,
    padding: 16,
  },
});

export default EmployeesScreen;
