import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import Stylesheet from '../components/common/Stylesheet';

import { View, FlatList, TouchableOpacity, Alert } from 'react-native';
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
import { Product } from '../data/products';

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
    <SafeAreaView style={Stylesheet.cls(theme, "flex-1 bg-gray-50 dark:bg-darkbg")}>
      <AppHeader 
        title="Inventory Stock" 
        showBack={true} 
        rightAction={
          <AppButton
            title="+ Add Item"
            onPress={handleAddNewPress}
            style={Stylesheet.cls(theme, "h-[34px] px-3.5")}
          />
        }
      />

      <View style={Stylesheet.cls(theme, "flex-1 p-4")}>
        <AppSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search by ID, name or category..."
          style={Stylesheet.cls(theme, "mb-4")}
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
              <AppCard variant="glass" style={Stylesheet.cls(theme, "mb-3 p-4")}>
                <View style={Stylesheet.cls(theme, "flex-row justify-between items-start mb-2")}>
                  <View>
                    <AppText style={Stylesheet.cls(theme, "font-mono text-purple-600 dark:text-purple-400 font-bold text-xs")}>
                      {item.id}
                    </AppText>
                    <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "text-base font-bold text-gray-900 dark:text-white mt-0.5")}>
                      {item.name}
                    </AppText>
                  </View>
                  <AppBadge label={item.status} variant={statusColor} />
                </View>

                <View style={Stylesheet.cls(theme, "flex-row justify-between items-center py-2 border-t border-gray-150 dark:border-white/[0.04] mt-2")}>
                  <View>
                    <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Category / Loc</AppText>
                    <AppText variant="body" style={Stylesheet.cls(theme, "mt-0.5")}>{item.category} ({item.location})</AppText>
                  </View>

                  <View style={Stylesheet.cls(theme, "items-end")}>
                    <AppText variant="captionSemibold" style={Stylesheet.cls(theme, "text-gray-400")}>Qty / Price</AppText>
                    <AppText variant="bodySemibold" style={Stylesheet.cls(theme, "mt-0.5")}>{item.quantity} units • {item.price}</AppText>
                  </View>
                </View>

                <View style={Stylesheet.cls(theme, "flex-row justify-end space-x-3 pt-2 mt-1")}>
                  <TouchableOpacity 
                    onPress={() => handleEditPress(item)}
                    style={Stylesheet.cls(theme, "px-3.5 py-1.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/30 rounded-xl mr-2")}
                  >
                    <AppText style={Stylesheet.cls(theme, "text-[11px] font-bold text-purple-600 dark:text-purple-450")}>Edit</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id)}
                    style={Stylesheet.cls(theme, "px-3.5 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-xl")}
                  >
                    <AppText style={Stylesheet.cls(theme, "text-[11px] font-bold text-red-500")}>Delete</AppText>
                  </TouchableOpacity>
                </View>
              </AppCard>
            );
          }}
          ListEmptyComponent={
            <View style={Stylesheet.cls(theme, "mt-8")}>
              <AppText variant="subtitle" style={Stylesheet.cls(theme, "text-center text-sm text-gray-500")}>
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
          style={Stylesheet.cls(theme, "mt-4")}
        />
      </AppModal>
    </SafeAreaView>
  );
};
export default InventoryScreen;
