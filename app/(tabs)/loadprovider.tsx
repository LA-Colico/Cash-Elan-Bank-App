import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Provider {
  id: string;
  name: string;
  logo: any;
}

const LoadProviderScreen = () => {
  const router = useRouter();
  const { uid, accountNumber, mobileNumber, notes } = useLocalSearchParams();

  const providers: Provider[] = [
    { id: 'globe', name: 'GLOBE', logo: require('../../assets/images/globe.png') },
    { id: 'smart', name: 'SMART', logo: require('../../assets/images/smart.png') },
    { id: 'sun', name: 'SUN', logo: require('../../assets/images/sun.png') },
    { id: 'tm', name: 'TM', logo: require('../../assets/images/tm.png') },
    { id: 'tnt', name: 'TNT', logo: require('../../assets/images/tnt.jpg') },
  ];

  const handleProviderSelect = (provider: Provider) => {
    router.push({
      pathname: './loadpackages',
      params: {
        uid,
        accountNumber,
        mobileNumber,
        notes,
        provider: provider.name,
        providerId: provider.id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header - Updated to match transfer.tsx */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Load</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Select a Load Provider</Text>
        <Text style={styles.subtitle}>
          Please make sure to select telco provider so the transaction does not fail.
        </Text>

        {/* Providers List */}
        <View style={styles.providersList}>
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={styles.providerItem}
              onPress={() => handleProviderSelect(provider)}
            >
              <View style={styles.providerInfo}>
                <Image source={provider.logo} style={styles.providerLogo} />
                <Text style={styles.providerName}>{provider.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 30,
  },
  providersList: {
    flex: 1,
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

export default LoadProviderScreen;