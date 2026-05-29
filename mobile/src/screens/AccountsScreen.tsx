import React, { useState } from 'react';

import { ScaledSheet } from 'react-native-size-matters';
import { View, FlatList, Alert } from 'react-native';
import { useAppStore } from '../store/appStore';
import AppText from '../components/common/AppText';
import AppCard from '../components/common/AppCard';
import AppHeader from '../components/layout/AppHeader';
import AppButton from '../components/common/AppButton';
import AppModal from '../components/modals/AppModal';
import AppInput from '../components/inputs/AppInput';
import AppBadge from '../components/common/AppBadge';
import { SafeAreaView } from 'react-native-safe-area-context';

export const AccountsScreen = () => {
  const theme = useAppStore(state => state.theme);
  const { accountsData, addAccount } = useAppStore();
  const [accounts, setAccounts] = useState(accountsData);

  // Add Account Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accName, setAccName] = useState('');
  const [accNo, setAccNo] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState('');

  const handleAddAccount = () => {
    if (!bankName.trim() || !accName.trim() || !accNo.trim()) return;

    const newAcc = {
      id: `BANK-00${accounts.length + 1}`,
      bankName: bankName.trim(),
      accountName: accName.trim(),
      accountNumber: accNo.trim(),
      routingNumber: '02100000',
      currency,
      balance: parseFloat(balance) || 0,
      status: 'Active',
    };

    const updatedAcc = [newAcc, ...accounts];
    setAccounts(updatedAcc);
    addAccount(newAcc);

    setBankName('');
    setAccName('');
    setAccNo('');
    setBalance('');
    setModalOpen(false);
    Alert.alert('Account Linked', 'New bank channel linked successfully.');
  };

  const getCurrencySymbol = (cur: string) => {
    if (cur === 'GBP') return '£';
    if (cur === 'EUR') return '€';
    if (cur === 'INR') return '₹';
    return '$';
  };

  const totalLiquidityUSD = accounts
    .filter(a => a.currency === 'USD')
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <SafeAreaView
      style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}
    >
      <AppHeader
        title="Bank Balances"
        showBack={true}
        rightAction={
          <AppButton
            title="+ Link Bank"
            onPress={() => setModalOpen(true)}
            style={styles.appButton1}
          />
        }
      />

      <View style={styles.view2}>
        {/* Total Liquidity Panel */}
        <AppCard
          variant="bordered"
          style={[styles.appCard1, theme === 'dark' && styles.appCard1Dark]}
        >
          <AppText
            style={styles.appText8}
          >
            Total Liquid Assets (USD)
          </AppText>
          <AppText
            style={styles.appText7}
          >
            $
            {totalLiquidityUSD.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </AppText>
          <AppText
            style={styles.appText6}
          >
            Active balances across{' '}
            {accounts.filter(a => a.currency === 'USD').length} USD channels
          </AppText>
        </AppCard>

        {/* Channels List */}
        <AppText
          variant="h3"
          style={styles.appText5}
        >
          Connected Accounts
        </AppText>

        <FlatList
          data={accounts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <AppCard
              variant="glass"
              style={styles.appCard}
            >
              <View
                style={styles.view1}
              >
                <View>
                  <AppText
                    variant="bodySemibold"
                    style={[styles.appText4, theme === 'dark' && styles.appText4Dark]}
                  >
                    {item.bankName}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={styles.appText3}
                  >
                    {item.accountName} • •••• {item.accountNumber.slice(-4)}
                  </AppText>
                </View>

                <AppBadge
                  label={item.status}
                  variant={item.status === 'Active' ? 'success' : 'gray'}
                />
              </View>

              <View
                style={[styles.view, theme === 'dark' && styles.viewDark]}
              >
                <View>
                  <AppText
                    variant="captionSemibold"
                    style={styles.appText2}
                  >
                    Account Type
                  </AppText>
                  <AppText
                    variant="body"
                    style={styles.appText1}
                  >
                    {item.currency} Currency Ledger
                  </AppText>
                </View>

                <AppText
                  variant="h2"
                  style={[styles.appText, theme === 'dark' && styles.appTextDark]}
                >
                  {getCurrencySymbol(item.currency)}
                  {item.balance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </AppText>
              </View>
            </AppCard>
          )}
        />
      </View>

      {/* Link bank modal */}
      <AppModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Link Bank Account"
      >
        <AppInput
          label="Bank Name"
          placeholder="e.g. Chase Bank"
          value={bankName}
          onChangeText={setBankName}
        />
        <AppInput
          label="Account Name"
          placeholder="e.g. Main Operating Ledger"
          value={accName}
          onChangeText={setAccName}
        />
        <AppInput
          label="Account Number"
          placeholder="e.g. 1234567890"
          value={accNo}
          onChangeText={setAccNo}
          keyboardType="numeric"
        />
        <AppInput
          label="Currency Code"
          placeholder="e.g. USD, EUR, INR"
          value={currency}
          onChangeText={setCurrency}
          autoCapitalize="characters"
        />
        <AppInput
          label="Initial Balance Ledger"
          placeholder="e.g. 50000"
          value={balance}
          onChangeText={setBalance}
          keyboardType="numeric"
        />

        <AppButton
          title="Verify & Link Bank"
          onPress={handleAddAccount}
          style={styles.appButton}
        />
      </AppModal>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  appButton: {
    marginTop: '16@ms',
  },
  appButton1: {
    height: '34.0@vs',
    paddingHorizontal: '14@ms',
  },
  appCard: {
    marginBottom: '14@ms',
    padding: '16@ms',
  },
  appCard1: {
    marginBottom: '16@ms',
    backgroundColor: '#8b5cf6',
    borderColor: 'transparent',
    padding: '20@ms',
  },
  appCard1Dark: {
    backgroundColor: '#7c3aed',
  },
  appText: {
    fontWeight: '800',
    color: '#7c3aed',
  },
  appText1: {
    marginTop: '2@ms',
  },
  appText2: {
    color: '#9ca3af',
  },
  appText3: {
    color: '#6b7280',
    marginTop: '2@ms',
  },
  appText4: {
    fontSize: '16@ms',
    fontWeight: 'bold',
    color: '#111827',
  },
  appText4Dark: {
    color: '#ffffff',
  },
  appText5: {
    fontWeight: 'bold',
    marginBottom: '12@ms',
    marginLeft: '4@ms',
  },
  appText6: {
    color: 'rgba(255, 255, 255, 0.60)',
    fontSize: '10@ms',
    marginTop: '6@ms',
    fontWeight: '500',
  },
  appText7: {
    color: '#ffffff',
    fontSize: '30@ms',
    fontWeight: '800',
    marginTop: '4@ms',
  },
  appText8: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: '12@ms',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  appTextDark: {
    color: '#c084fc',
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeAreaViewDark: {
    backgroundColor: '#0c0e12',
  },
  view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: '12@ms',
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    marginTop: '4@ms',
  },
  view1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12@ms',
  },
  view2: {
    flex: 1,
    padding: '16@ms',
  },
  viewDark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
});

export default AccountsScreen;
