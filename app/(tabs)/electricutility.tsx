// electricutility.tsx - Updated with transfer header style
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Provider {
  id: string;
  name: string;
  logo: any;
}

const ElectricUtilityScreen = () => {
  const router = useRouter();
  const { uid, accountNumber } = useLocalSearchParams();
  const [searchText, setSearchText] = useState('');

  const providers: Provider[] = [
    { id: 'anteco', name: 'ANTECO', logo: require('../../assets/images/anteco.png') }, 
    { id: 'aleco', name: 'ALECO', logo: require('../../assets/images/aleco.png') },
    { id: 'clark', name: 'Clark Electric Cooperative Inc', logo: require('../../assets/images/clark.jpg') }, 
    { id: 'firstbay', name: 'First Bay Power Corp.', logo: require('../../assets/images/firstbay.png') },
    { id: 'meralco', name: 'Meralco', logo: require('../../assets/images/meralco.png') },
    { id: 'meralcoload', name: 'Meralco Kuryente Load', logo: require('../../assets/images/meralcoload.jpg') },
  ];

  const handleProviderPress = (providerName: string) => {
    router.push({
      pathname: '../BillsPayment',
      params: { provider: providerName, uid: uid, accountNumber: accountNumber },
    });
  };

  const clearSearch = () => {
    setSearchText('');
  };

  const filteredProviders = searchText 
    ? providers.filter(provider => 
        provider.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : providers;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header - Updated to match transfer.tsx */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Electric Utilities</Text>
        <View style={{ width: 24 }} />
      </View>

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

      {/* Providers List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredProviders.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={styles.providerItem}
            onPress={() => handleProviderPress(provider.name)}
          >
            <Image source={provider.logo} style={styles.providerLogo} />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <View style={styles.creditBadge}>
                <Text style={styles.creditText}>Credit</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Updated header styles to match transfer.tsx
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  providerLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  creditBadge: {
    backgroundColor: '#FFB800',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  creditText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ElectricUtilityScreen;