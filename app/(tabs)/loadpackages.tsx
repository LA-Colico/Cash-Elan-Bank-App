import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Image, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface LoadPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  badge?: string;
}

const LoadPackagesScreen = () => {
  const router = useRouter();
  const { uid, accountNumber, mobileNumber, notes, provider, providerId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('specials');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<LoadPackage | null>(null);
  const [searchText, setSearchText] = useState('');

  // Extract name from mobile number for display
  const customerName = "RODELIO DEE"; // This should come from your user data

  // Provider logo mapping
  const getProviderLogo = (providerId: string) => {
    switch (providerId?.toLowerCase()) {
      case 'globe':
        return require('../../assets/images/globe.png');
      case 'smart':
        return require('../../assets/images/smart.png');
      case 'sun':
        return require('../../assets/images/sun.png');
      case 'tm':
        return require('../../assets/images/tm.png');
      case 'tnt':
        return require('../../assets/images/tnt.jpg');
      default:
        return require('../../assets/images/globe.png');
    }
  };

  const specialPackages: LoadPackage[] = [
    {
      id: 'power_fb_149',
      name: 'POWER ALL FB 149 + FREE UNLI',
      price: 149,
      description: 'Available to Smart Prepaid BIGGER DATA for 7 days! 16 GB for ALL SITES & APPS + UNLI FB, IG, Messenger +...'
    },
    {
      id: 'power_tiktok_149',
      name: 'POWER ALL TIKTOK 149 + F...',
      price: 149,
      description: 'Available in Smart Prepaid. 7 Days of FREE UNLI 5G + 16 GB + UNLI TikTok + Unli Calls & Texts.'
    },
    {
      id: 'power_fb_99',
      name: 'POWER ALL FB 99',
      price: 99,
      description: 'Available in Smart Prepaid. 10 GB for ALL SITES & APPS + UNLI FB, IG, Messenger + Unli Calls & Texts for ...'
    },
    {
      id: 'power_tiktok_99',
      name: 'POWER ALL TIKTOK 99',
      price: 99,
      description: 'Available in Smart Prepaid. 10 GB for ALL SITES & APPS + UNLI TikTok + Unli Calls & Texts for 7 days.'
    },
    {
      id: 'giga_stories_149',
      name: 'GIGA STORIES 149',
      price: 149,
      description: 'Available in Smart Prepaid. 7 Days of 12 GB + UNLI Stories on FB, IG, Snapchat + Unli Calls & Texts.'
    },
    {
      id: 'giga_video_99',
      name: 'GIGA VIDEO 99',
      price: 99,
      description: 'Available in Smart Prepaid. 7 Days of 8 GB + UNLI YouTube, Netflix, iWantTFC + Unli Calls & Texts.'
    },
    {
      id: 'surf_plus_50',
      name: 'SURF PLUS 50',
      price: 50,
      description: 'Available in Smart Prepaid. 3 Days of 2 GB + UNLI FB + Unli Calls & Texts to Smart/TNT.'
    },
    {
      id: 'all_out_surf_85',
      name: 'ALL OUT SURF 85',
      price: 85,
      description: 'Available in Smart Prepaid. 5 Days of 1 GB + 1 GB for YouTube + Unli Calls & Texts.'
    }
  ];

  const presetAmounts = [15, 20, 30, 50, 60, 75, 100, 150, 200, 300, 500, 1000];

  // Clear search function
  const clearSearch = () => {
    setSearchText('');
  };

  // Filter packages based on search text - search both name and description
  const filteredPackages = searchText 
    ? specialPackages.filter(pkg => 
        pkg.name.toLowerCase().includes(searchText.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchText.toLowerCase()) ||
        pkg.price.toString().includes(searchText)
      )
    : specialPackages;

  const handlePackageSelect = (pkg: LoadPackage) => {
    console.log('📦 Package selected:', pkg.name);
    setSelectedPackage(pkg);
  };

  const handlePresetAmount = (amount: number) => {
    console.log('💰 Preset amount selected:', amount);
    setCustomAmount(amount.toString());
  };

  const handleBuyNow = () => {
    console.log('💰 Buy Now button pressed!');
    let loadProduct, amount;
    
    if (activeTab === 'specials' && selectedPackage) {
      loadProduct = selectedPackage.name;
      amount = selectedPackage.price;
    } else if (activeTab === 'regular' && customAmount) {
      loadProduct = `Regular Load - PHP ${customAmount}`;
      amount = parseInt(customAmount);
    } else {
      console.log('❌ No selection made');
      return; // No selection made
    }

    console.log('✅ Navigating to confirm with:', { loadProduct, amount });
    router.push({
      pathname: '/(tabs)/loadconfirm',
      params: {
        uid,
        accountNumber,
        mobileNumber,
        notes,
        provider,
        providerId,
        loadProduct,
        amount: amount.toString(),
      },
    });
  };

  const handleBackPress = () => {
    console.log('🔙 Back button pressed!');
    try {
      router.back();
    } catch (error) {
      console.log('❌ Router.back() failed, trying alternative navigation');
      router.push('/(tabs)/loadprovider');
    }
  };

  const handleSearchChange = (text: string) => {
    console.log('🔍 Search text changed to:', text);
    setSearchText(text);
  };

  const canProceed = () => {
    if (activeTab === 'specials') {
      return selectedPackage !== null;
    }
    return customAmount && parseInt(customAmount) >= 5 && parseInt(customAmount) <= 1000;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header - Updated to match transfer.tsx */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mobile Load</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Provider Info Section - Centered */}
        <View style={styles.providerSection}>
          <Image source={getProviderLogo(providerId as string)} style={styles.providerLogo} />
          <Text style={styles.providerName}>{provider}</Text>
        </View>

        {/* Search Bar - Only show in specials tab */}
        {activeTab === 'specials' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for more products"
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearchChange}
              editable={true}
              selectTextOnFocus={true}
            />
            {searchText.length > 0 && (
              <TouchableOpacity 
                onPress={clearSearch}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'specials' && styles.activeTab]}
            onPress={() => {
              setActiveTab('specials');
              // Clear search when switching tabs
              setSearchText('');
              setSelectedPackage(null);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'specials' && styles.activeTabText]}>
              May Specials
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'regular' && styles.activeTab]}
            onPress={() => {
              setActiveTab('regular');
              // Clear search when switching tabs
              setSearchText('');
              setSelectedPackage(null);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'regular' && styles.activeTabText]}>
              Regular
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'specials' ? (
          <View style={styles.packagesContainer}>
            {searchText.length > 0 && (
              <Text style={styles.searchResultsText}>
                Found {filteredPackages.length} result{filteredPackages.length !== 1 ? 's' : ''} for "{searchText}"
              </Text>
            )}
            {filteredPackages.length === 0 && searchText.length > 0 ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#ccc" style={styles.noResultsIcon} />
                <Text style={styles.noResultsText}>No packages found</Text>
                <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
                <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
                  <Text style={styles.clearSearchText}>Clear search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredPackages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageItem,
                    selectedPackage?.id === pkg.id && styles.selectedPackage
                  ]}
                  onPress={() => handlePackageSelect(pkg)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <View style={styles.packageContent}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.packagePrice}>{pkg.price}</Text>
                      <Text style={styles.priceCurrency}>PHP</Text>
                    </View>
                    <View style={styles.packageInfo}>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      <Text style={styles.packageDescription}>{pkg.description}</Text>
                    </View>
                  </View>
                  <View style={styles.radioButton}>
                    {selectedPackage?.id === pkg.id && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={styles.regularContainer}>
            <Text style={styles.regularTitle}>Enter desired amount</Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencyLabel}>PHP</Text>
              <TextInput
                style={styles.amountInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
            
            <Text style={styles.amountNote}>
              Enter a value between PHP 5 – PHP 1,000 or choose one of the load values below.
            </Text>

            <View style={styles.presetAmounts}>
              {presetAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.presetButton,
                    customAmount === amount.toString() && styles.selectedPreset
                  ]}
                  onPress={() => handlePresetAmount(amount)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Text style={[
                    styles.presetAmount,
                    customAmount === amount.toString() && styles.selectedPresetText
                  ]}>
                    {amount}
                  </Text>
                  <Text style={[
                    styles.presetLabel,
                    customAmount === amount.toString() && styles.selectedPresetText
                  ]}>
                    PHP
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Buy Now Button */}
      <TouchableOpacity
        style={[styles.buyButton, { opacity: canProceed() ? 1 : 0.5 }]}
        onPress={handleBuyNow}
        disabled={!canProceed()}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.buyButtonText}>Buy Now</Text>
      </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  providerSection: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  providerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
    height: 44,
    paddingVertical: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#F8B319',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#F8B319',
    fontWeight: '600',
  },
  packagesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
    marginBottom: 16,
  },
  clearSearchButton: {
    backgroundColor: '#F8B319',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  packageItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPackage: {
    borderColor: '#F8B319',
    backgroundColor: '#FFF8E1',
  },
  packageContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  priceContainer: {
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packagePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8B319',
  },
  priceCurrency: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  packageInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    lineHeight: 20,
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  radioButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F8B319',
  },
  regularContainer: {
    paddingHorizontal: 20,
  },
  regularTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  currencyLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#000',
  },
  amountNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  presetAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPreset: {
    borderColor: '#F8B319',
    backgroundColor: '#FFF8E1',
  },
  presetAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8B319',
  },
  presetLabel: {
    fontSize: 12,
    color: '#666',
  },
  selectedPresetText: {
    color: '#F8B319',
  },
  buyButton: {
    backgroundColor: '#F8B319',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoadPackagesScreen;