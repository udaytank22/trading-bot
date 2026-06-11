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
import AppBadge from '../../components/common/AppBadge';
import { Product } from '../../data/products';

export const InventoryScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const { productsData } = useAppStore();
  const [products, setProducts] = useState<Product[]>(productsData);

  const [search, setSearch] = useState('');
  
  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [qty, setQty] = useState('0');
  const [price, setPrice] = useState('$0.00');
  const [location, setLocation] = useState('Warehouse A');
  const [status, setStatus] = useState('In Stock');

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.id.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const handleEditPress = (product: Product) => {
    setSelectedProduct(product);
    setName(product.name);
    setCategory(product.category);
    setQty(product.quantity.toString());
    setPrice(product.price);
    setLocation(product.location);
    setStatus(product.status);
    setFormOpen(true);
  };

  const handleAddNewPress = () => {
    setSelectedProduct(null);
    setName('');
    setCategory('');
    setQty('0');
    setPrice('$0.00');
    setLocation('Warehouse A');
    setStatus('In Stock');
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (selectedProduct) {
      // Edit
      setProducts(prev => prev.map(p => 
        p.id === selectedProduct.id 
          ? { 
              ...p, 
              name: name.trim(), 
              category: category.trim() || 'General', 
              quantity: parseInt(qty, 10) || 0,
              price: price.trim(), 
              location: location.trim(),
              status 
            } 
          : p
      ));
      Alert.alert('Saved', 'Product details updated successfully.');
    } else {
      // Add
      const newProduct: Product = {
        id: `INV-100${products.length + 1}`,
        name: name.trim(),
        category: category.trim() || 'General',
        quantity: parseInt(qty, 10) || 0,
        price: price.trim(),
        location: location.trim(),
        status
      };
      setProducts(prev => [...prev, newProduct]);
      Alert.alert('Added', 'New inventory item added successfully.');
    }
    setFormOpen(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Product?',
      'Are you sure you want to remove this item from the catalog?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setProducts(prev => prev.filter(p => p.id !== id));
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeAreaView, theme === 'dark' && styles.safeAreaViewDark]}>
      <AppHeader 
        title="Inventory Stock" 
        showBack={true} 
        rightAction={
          <AppButton
            title="+ Add Item"
            onPress={handleAddNewPress}
            style={styles.appButton1}
          />
        }
      />

      <View style={styles.view5}>
        <AppSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search by ID, name or category..."
          style={styles.style}
        />

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const statusColor = 
              item.status === 'In Stock' ? 'success' :
              item.status === 'Low Stock' ? 'warning' : 'danger';

            return (
              <AppCard variant="glass" style={styles.appCard}>
                <View style={styles.view4}>
                  <View>
                    <AppText style={[styles.appText8, theme === 'dark' && styles.appText8Dark]}>
                      {item.id}
                    </AppText>
                    <AppText variant="bodySemibold" style={[styles.appText7, theme === 'dark' && styles.appText7Dark]}>
                      {item.name}
                    </AppText>
                  </View>
                  <AppBadge label={item.status} variant={statusColor} />
                </View>

                <View style={[styles.view3, theme === 'dark' && styles.view3Dark]}>
                  <View>
                    <AppText variant="captionSemibold" style={styles.appText6}>Category / Loc</AppText>
                    <AppText variant="body" style={styles.appText5}>{item.category} ({item.location})</AppText>
                  </View>

                  <View style={styles.view2}>
                    <AppText variant="captionSemibold" style={styles.appText4}>Qty / Price</AppText>
                    <AppText variant="bodySemibold" style={styles.appText3}>{item.quantity} units • {item.price}</AppText>
                  </View>
                </View>

                <View style={styles.view1}>
                  <TouchableOpacity 
                    onPress={() => handleEditPress(item)}
                    style={[styles.touchableOpacity1, theme === 'dark' && styles.touchableOpacity1Dark]}
                  >
                    <AppText style={styles.appText2}>Edit</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id)}
                    style={styles.touchableOpacity}
                  >
                    <AppText style={styles.appText1}>Delete</AppText>
                  </TouchableOpacity>
                </View>
              </AppCard>
            );
          }}
          ListEmptyComponent={
            <View style={styles.view}>
              <AppText variant="subtitle" style={styles.appText}>
                No inventory products found.
              </AppText>
            </View>
          }
        />
      </View>

      {/* Add / Edit Modal */}
      <AppModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        title={selectedProduct ? 'Edit Inventory Item' : 'Add New Item'}
      >
        <AppInput
          label="Item Name"
          placeholder="e.g. Copper Wires"
          value={name}
          onChangeText={setName}
        />

        <AppInput
          label="Category"
          placeholder="e.g. Raw Materials"
          value={category}
          onChangeText={setCategory}
        />

        <AppInput
          label="Unit Price"
          placeholder="e.g. $45.00"
          value={price}
          onChangeText={setPrice}
        />

        <AppInput
          label="Quantity"
          placeholder="e.g. 150"
          value={qty}
          onChangeText={setQty}
          keyboardType="numeric"
        />

        <AppInput
          label="Warehouse Location"
          placeholder="e.g. Warehouse A"
          value={location}
          onChangeText={setLocation}
        />

        <AppDropdown
          label="Stock Status"
          value={status}
          onSelect={(val) => setStatus(val.toString())}
          options={[
            { value: 'In Stock', label: 'In Stock' },
            { value: 'Low Stock', label: 'Low Stock' },
            { value: 'Out of Stock', label: 'Out of Stock' }
          ]}
        />

        <AppButton
          title="Save Inventory Details"
          onPress={handleSave}
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
    padding: 16,
  },
  appText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  appText1: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  appText2: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  appText3: {
    marginTop: 2,
  },
  appText4: {
    color: '#9ca3af',
  },
  appText5: {
    marginTop: 2,
  },
  appText6: {
    color: '#9ca3af',
  },
  appText7: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  appText7Dark: {
    color: '#ffffff',
  },
  appText8: {
    fontFamily: 'monospace',
    color: '#7c3aed',
    fontWeight: 'bold',
    fontSize: 12,
  },
  appText8Dark: {
    color: '#c084fc',
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 12,
  },
  touchableOpacity1: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(243, 232, 255, 0.5)',
    borderRadius: 12,
    marginRight: 8,
  },
  touchableOpacity1Dark: {
    backgroundColor: 'rgba(59, 7, 100, 0.2)',
  },
  view: {
    marginTop: 32,
  },
  view1: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    marginTop: 4,
  },
  view2: {
    alignItems: 'flex-end',
  },
  view3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#eef2f6',
    marginTop: 8,
  },
  view3Dark: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  view4: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  view5: {
    flex: 1,
    padding: 16,
  },
});

export default InventoryScreen;
