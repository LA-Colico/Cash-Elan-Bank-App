import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Category {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface Biller {
  id: string;
  name: string;
  category: string;
  logo?: any;
  route: string;
}

const PayBillsScreen = () => {
  const router = useRouter();
  const { uid, accountNumber } = useLocalSearchParams();
  const [searchText, setSearchText] = useState('');

  // Comprehensive list of all billers across categories
  const allBillers: Biller[] = [
    // Electric Utilities
    { id: 'ateco', name: 'ATECO - Access to Energy for comm.', category: 'Electric Utilities', route: './electricutility' },
    { id: 'clark', name: 'Clark Electric Cooperative Inc', category: 'Electric Utilities', route: './electricutility' },
    { id: 'firstbay', name: 'First Bay Power Corp.', category: 'Electric Utilities', route: './electricutility' },
    { id: 'meralco', name: 'Meralco', category: 'Electric Utilities', route: './electricutility' },
    { id: 'meralcoload', name: 'Meralco Kuryente Load', category: 'Electric Utilities', route: './electricutility' },
    
    // Water Utilities
    { id: 'angat', name: 'Angat Water District', category: 'Water Utilities', route: './waterutility' },
    { id: 'basic', name: 'Basic Water Enterprises, Inc', category: 'Water Utilities', route: './waterutility' },
    { id: 'manila', name: 'Manila Water', category: 'Water Utilities', route: './waterutility' },
    { id: 'maynilad', name: 'Maynilad', category: 'Water Utilities', route: './waterutility' },
    { id: 'prime', name: 'PrimeWater', category: 'Water Utilities', route: './waterutility' },
    
    // Cable/TV
    { id: 'cignal', name: 'Cignal TV', category: 'Cable', route: './cables' },
    { id: 'skycable', name: 'SkyCable', category: 'Cable', route: './cables' },
    { id: 'gsat', name: 'G Sat', category: 'Cable', route: './cables' },
    { id: 'planetcable', name: 'Planet Cable', category: 'Cable', route: './cables' },
    { id: 'aircable', name: 'AirCable', category: 'Cable', route: './cables' },
    { id: 'royalcable', name: 'Royal Cable', category: 'Cable', route: './cables' },
    
    // Telecoms
    { id: 'globe', name: 'Globe', category: 'Telecoms', route: './internet' },
    { id: 'smart', name: 'Smart', category: 'Telecoms', route: './internet' },
    { id: 'pldt', name: 'PLDT', category: 'Telecoms', route: './internet' },
    { id: 'sun', name: 'Sun Cellular', category: 'Telecoms', route: './internet' },
    { id: 'tnt', name: 'TNT', category: 'Telecoms', route: './internet' },
    { id: 'tm', name: 'TM', category: 'Telecoms', route: './internet' },
    
    // Credit Cards
    { id: 'bdo', name: 'BDO Credit Card', category: 'Credit Cards', route: './creditcards' },
    { id: 'bpi', name: 'BPI Credit Card', category: 'Credit Cards', route: './creditcards' },
    { id: 'metrobank', name: 'Metrobank Credit Card', category: 'Credit Cards', route: './creditcards' },
    { id: 'unionbank', name: 'UnionBank Credit Card', category: 'Credit Cards', route: './creditcards' },
    
    // Streaming
    { id: 'netflix', name: 'Netflix', category: 'Streaming', route: './streaming' },
    { id: 'spotify', name: 'Spotify', category: 'Streaming', route: './streaming' },
    { id: 'disney', name: 'Disney+', category: 'Streaming', route: './streaming' },
    { id: 'hbo', name: 'HBO Go', category: 'Streaming', route: './streaming' },
    
    // Government
    { id: 'sss', name: 'SSS', category: 'Government', route: './government' },
    { id: 'philhealth', name: 'PhilHealth', category: 'Government', route: './government' },
    { id: 'pagibig', name: 'Pag-IBIG', category: 'Government', route: './government' },
    { id: 'bir', name: 'BIR', category: 'Government', route: './government' },
  ];

  const handleCategoryPress = (category: string) => {
    // Map categories to existing routes
    const routeMap: { [key: string]: string } = {
      'Electric Utilities': './electricutility',
      'Water Utilities': './waterutility',
      'Cable': './cables',
      'Telecoms': './internet',
      'Transportation': './transportation',
      'Credit Cards': './creditcards',
      'Games': './games',
      'Government': './government',
      'Streaming': './streaming',
      'Others': './BillsPayment'
    };

    const route = routeMap[category] || './BillsPayment';
    router.push({ pathname: route as any, params: { uid, accountNumber } });
  };

  const handleBillerPress = (biller: Biller) => {
    router.push({ 
      pathname: biller.route as any, 
      params: { uid, accountNumber, selectedBiller: biller.name } 
    });
  };

  const handleSchedulePress = () => {
    // Navigate to schedule bills page
    router.push({ pathname: './schedulebills' as any, params: { uid, accountNumber } });
  };

  const handleAddBiller = () => {
    // Navigate to add biller page
    router.push({ pathname: './addbiller' as any, params: { uid, accountNumber } });
  };

  const clearSearch = () => {
    setSearchText('');
  };

  // Filter billers based on search text
  const filteredBillers = searchText 
    ? allBillers.filter(biller => 
        biller.name.toLowerCase().includes(searchText.toLowerCase()) ||
        biller.category.toLowerCase().includes(searchText.toLowerCase())
      )
    : [];

  // Category data with icons
  const categories: Category[] = [
    { name: 'Electric Utilities', icon: 'flash' },
    { name: 'Water Utilities', icon: 'water' },
    { name: 'Cable', icon: 'wifi' },
    { name: 'Telecoms', icon: 'radio' },
    { name: 'Credit Cards', icon: 'card' },
    { name: 'Games', icon: 'game-controller' },
    { name: 'Government', icon: 'business' },
    { name: 'Streaming', icon: 'play-circle' },
    { name: 'Transportation', icon: 'bus' },
    { name: 'Others', icon: 'ellipsis-horizontal' }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Bills</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search billers"
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

        {/* Search Results */}
        {searchText.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>
              {filteredBillers.length > 0 
                ? `Found ${filteredBillers.length} result${filteredBillers.length !== 1 ? 's' : ''} for "${searchText}"`
                : `No results found for "${searchText}"`
              }
            </Text>
            
            {filteredBillers.length > 0 ? (
              filteredBillers.map((biller) => (
                <TouchableOpacity
                  key={biller.id}
                  style={styles.searchResultItem}
                  onPress={() => handleBillerPress(biller)}
                >
                  <View style={styles.billerIconContainer}>
                    <Ionicons 
                      name={
                        biller.category === 'Electric Utilities' ? 'flash' :
                        biller.category === 'Water Utilities' ? 'water' :
                        biller.category === 'Cable' ? 'wifi' :
                        biller.category === 'Telecoms' ? 'radio' :
                        biller.category === 'Credit Cards' ? 'card' :
                        biller.category === 'Streaming' ? 'play-circle' :
                        biller.category === 'Government' ? 'business' :
                        'business'
                      } 
                      size={20} 
                      color="#F8BB54" 
                    />
                  </View>
                  <View style={styles.billerInfo}>
                    <Text style={styles.billerName}>{biller.name}</Text>
                    <Text style={styles.billerCategory}>{biller.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#ccc" style={styles.noResultsIcon} />
                <Text style={styles.noResultsText}>No billers found</Text>
                <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
              </View>
            )}
          </View>
        )}

        {/* Show default content only when not searching */}
        {searchText.length === 0 && (
          <>
            {/* Favorite Billers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Favorite Billers</Text>
              <TouchableOpacity style={styles.addBillerButton} onPress={handleAddBiller}>
                <View style={styles.addIconContainer}>
                  <Ionicons name="add" size={24} color="#F8BB54" />
                </View>
                <Text style={styles.addBillerText}>
                  Save your favorite billers for easier access!
                </Text>
              </TouchableOpacity>
              <Text style={styles.addBillerSubtext}>Add a biller</Text>
            </View>

            {/* Schedule Bill Payments */}
            <TouchableOpacity style={styles.scheduleContainer} onPress={handleSchedulePress}>
              <View style={styles.scheduleLeft}>
                <Ionicons name="calendar-outline" size={24} color="#999" />
                <Text style={styles.scheduleText}>Schedule Bill Payments</Text>
              </View>
              <Ionicons name="add-circle-outline" size={24} color="#000" />
            </TouchableOpacity>

            {/* Categories */}
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category, index) => (
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
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#000',
    fontSize: 16,
  },
  searchResultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchResultsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  billerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billerInfo: {
    flex: 1,
  },
  billerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  billerCategory: {
    fontSize: 12,
    color: '#666',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsIcon: {
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  addBillerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF5E6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addBillerText: {
    flex: 1,
    color: '#666',
    fontSize: 13,
  },
  addBillerSubtext: {
    color: '#999',
    fontSize: 12,
    marginLeft: 52,
  },
  scheduleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 8,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    color: '#666',
    marginLeft: 12,
  },
  categoriesSection: {
    padding: 16,
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
});

export default PayBillsScreen;