import React, { useState } from 'react';
import Stylesheet from '../components/common/Stylesheet';

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
      style={Stylesheet.cls(theme, 'flex-1 bg-gray-50 dark:bg-darkbg')}
    >
      <AppHeader
        title="Bank Balances"
        showBack={true}
        rightAction={
          <AppButton
            title="+ Link Bank"
            onPress={() => setModalOpen(true)}
            style={Stylesheet.cls(theme, 'h-[34px] px-3.5')}
          />
        }
      />

      <View style={Stylesheet.cls(theme, 'flex-1 p-4')}>
        {/* Total Liquidity Panel */}
        <AppCard
          variant="bordered"
          style={Stylesheet.cls(
            theme,
            'mb-4 bg-purple-650 dark:bg-purple-600 border-transparent p-5',
          )}
        >
          <AppText
            style={Stylesheet.cls(
              theme,
              'text-white/70 text-xs font-semibold uppercase tracking-wider',
            )}
          >
            Total Liquid Assets (USD)
          </AppText>
          <AppText
            style={Stylesheet.cls(
              theme,
              'text-white text-3xl font-extrabold mt-1',
            )}
          >
            $
            {totalLiquidityUSD.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </AppText>
          <AppText
            style={Stylesheet.cls(
              theme,
              'text-white/60 text-[10px] mt-1.5 font-medium',
            )}
          >
            Active balances across{' '}
            {accounts.filter(a => a.currency === 'USD').length} USD channels
          </AppText>
        </AppCard>

        {/* Channels List */}
        <AppText
          variant="h3"
          style={Stylesheet.cls(theme, 'font-bold mb-3 ml-1')}
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
              style={Stylesheet.cls(theme, 'mb-3.5 p-4')}
            >
              <View
                style={Stylesheet.cls(
                  theme,
                  'flex-row justify-between items-start mb-3',
                )}
              >
                <View>
                  <AppText
                    variant="bodySemibold"
                    style={Stylesheet.cls(
                      theme,
                      'text-base font-bold text-gray-900 dark:text-white',
                    )}
                  >
                    {item.bankName}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={Stylesheet.cls(theme, 'text-gray-500 mt-0.5')}
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
                style={Stylesheet.cls(
                  theme,
                  'flex-row justify-between items-end pt-3 border-t border-gray-100 dark:border-white/[0.04] mt-1',
                )}
              >
                <View>
                  <AppText
                    variant="captionSemibold"
                    style={Stylesheet.cls(theme, 'text-gray-400')}
                  >
                    Account Type
                  </AppText>
                  <AppText
                    variant="body"
                    style={Stylesheet.cls(theme, 'mt-0.5')}
                  >
                    {item.currency} Currency Ledger
                  </AppText>
                </View>

                <AppText
                  variant="h2"
                  style={Stylesheet.cls(
                    theme,
                    'font-extrabold text-purple-600 dark:text-purple-400',
                  )}
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
          style={Stylesheet.cls(theme, 'mt-4')}
        />
      </AppModal>
    </SafeAreaView>
  );
};
export default AccountsScreen;
