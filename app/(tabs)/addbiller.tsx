import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Category {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface FavoriteBiller {
  id: string;
  name: string;
  category: string;
  accountNumber: string;
}

interface PopularBiller {
  name: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const AddBillerScreen = () => {
  const router = useRouter();
  const { uid, accountNumber } = useLocalSearchParams();
  
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [billerName, setBillerName] = useState('');
  const [billerAccountNumber, setBillerAccountNumber] = useState('');

  // Mock favorite billers data
  const [favoriteBillers, setFavoriteBillers] = useState<FavoriteBiller[]>([
    {
      id: '1',
      name: 'Meralco',
      category: 'Electric Utilities',
      accountNumber: '1234567890'
    }
  ]);

  const categories: Category[] = [
    { name: 'Electric Utilities', icon: 'flash' },
    { name: 'Water Utilities', icon: 'water' },
    { name: 'Cable/Internet', icon: 'wifi' },
    { name: 'Telecoms', icon: 'radio' },
    { name: 'Transportation', icon: 'bus' },
    { name: 'Credit Cards', icon: 'card' },
    { name: 'Loans', icon: 'cash' },
    { name: 'Government', icon: 'business' },
    { name: 'Insurance', icon: 'shield-checkmark' },
    { name: 'Healthcare', icon: 'medical' },
    { name: 'Schools', icon: 'school' },
    { name: 'Others', icon: 'ellipsis-horizontal' }
  ];

  const popularBillers: PopularBiller[] = [
    { name: 'Meralco', category: 'Electric Utilities', icon: 'flash' },
    { name: 'Manila Water', category: 'Water Utilities', icon: 'water' },
    { name: 'PLDT Home', category: 'Cable/Internet', icon: 'wifi' },
    { name: 'Globe Telecom', category: 'Telecoms', icon: 'radio' },
    { name: 'Beep™', category: 'Transportation', icon: 'bus' },
  ];

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory(categoryName);
    // Navigate to specific category screen
    const routeMap: { [key: string]: string } = {
      'Electric Utilities': './electricutility',
      'Water Utilities': './waterutility',
      'Cable/Internet': './internet',
      'Telecoms': './internet',
      'Transportation': './transportation',
    };
    
    const route = routeMap[categoryName] || './BillsPayment';
    router.push({ pathname: route as any, params: { uid, accountNumber } });
  };

  const handleAddCustomBiller = () => {
    if (!billerName || !billerAccountNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newBiller: FavoriteBiller = {
      id: Date.now().toString(),
      name: billerName,
      category: selectedCategory || 'Others',
      accountNumber: billerAccountNumber
    };

    setFavoriteBillers([...favoriteBillers, newBiller]);
    setBillerName('');
    setBillerAccountNumber('');
    setShowAddForm(false);
    Alert.alert('Success', 'Biller added to favorites!');
  };

  const removeFavoriteBiller = (id: string) => {
    setFavoriteBillers(favoriteBillers.filter(biller => biller.id !== id));
  };

  const clearSearch = () => {
    setSearchText('');
  };

  const filteredCategories = searchText 
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : categories;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Biller</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search billers or categories"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Current Favorite Billers */}
        {favoriteBillers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Favorite Billers</Text>
            {favoriteBillers.map((biller) => (
              <View key={biller.id} style={styles.favoriteBillerItem}>
                <View style={styles.billerInfo}>
                  <Text style={styles.billerName}>{biller.name}</Text>
                  <Text style={styles.billerCategory}>{biller.category}</Text>
                  <Text style={styles.billerAccount}>Account: {biller.accountNumber}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFavoriteBiller(biller.id)}>
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Popular Billers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Billers</Text>
          {popularBillers.map((biller, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.popularBillerItem}
              onPress={() => handleCategoryPress(biller.category)}
            >
              <View style={styles.billerIconContainer}>
                <Ionicons name={biller.icon} size={24} color="#666" />
              </View>
              <View style={styles.billerDetails}>
                <Text style={styles.billerName}>{biller.name}</Text>
                <Text style={styles.billerCategory}>{biller.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category.name)}
              >
                <View style={styles.categoryIconContainer}>
                  <Ionicons name={category.icon} size={24} color="#666" />
                </View>
                <Text style={styles.categoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Custom Biller */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.customBillerButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFB800" />
            <Text style={styles.customBillerText}>Add Custom Biller</Text>
          </TouchableOpacity>

          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.formLabel}>Biller Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter biller name"
                value={billerName}
                onChangeText={setBillerName}
              />

              <Text style={styles.formLabel}>Account Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter your account number"
                value={billerAccountNumber}
                onChangeText={setBillerAccountNumber}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleAddCustomBiller}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#333',
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  favoriteBillerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  billerInfo: {
    flex: 1,
  },
  billerName: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  billerCategory: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
  },
  billerAccount: {
    color: '#999',
    fontSize: 11,
  },
  popularBillerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  billerIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billerDetails: {
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: '90%',
  },
  customBillerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  customBillerText: {
    color: '#FFB800',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  addForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  formLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFB800',
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AddBillerScreen;