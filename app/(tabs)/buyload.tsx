import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';

const BuyLoadScreen = () => {
  const router = useRouter();
  const { uid, accountNumber } = useLocalSearchParams();
  const [mobileNumber, setMobileNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  interface UserData {
    balance?: number;
    deposit?: number;
    name?: string;
    firstName?: string;
    lastName?: string;
  }

  useEffect(() => {
    // Fetch user data when component mounts
    const fetchUserData = async () => {
      if (typeof uid === "string") {
        try {
          // Try to get user data from main users collection (consistent with LoadConfirm)
          const userDocRef = doc(db, "users", uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            setUserData(userData);
          } else {
            // Fallback: try the nested userInfo structure
            const docRef = doc(db, "users", uid, "userInfo", accountNumber as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const userData = docSnap.data() as UserData;
              setUserData(userData);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [uid, accountNumber]);

  const getUserDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userData?.name || "Account Holder";
  };

  const getUserInitials = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();
    }
    if (userData?.name) {
      const nameParts = userData.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      }
      return userData.name.charAt(0).toUpperCase();
    }
    return "AH"; // Account Holder
  };

  const handleNext = () => {
    if (mobileNumber.length >= 10) {
      router.push({
        pathname: '/(tabs)/loadprovider',
        params: { 
          uid, 
          accountNumber, 
          mobileNumber: `+63 ${mobileNumber}`,
          notes 
        },
      });
    }
  };

  const handleLoadProductPress = () => {
    // Require mobile number before proceeding to load provider selection
    if (mobileNumber.length >= 10) {
      router.push({
        pathname: '/(tabs)/loadprovider',
        params: { 
          uid, 
          accountNumber, 
          mobileNumber: `+63 ${mobileNumber}`,
          notes 
        },
      });
    }
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
        {/* From Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>From</Text>
          <TouchableOpacity style={styles.accountContainer}>
            <View style={styles.accountInfo}>
              <View style={styles.accountIcon}>
                <Text style={styles.accountIconText}>
                  {isLoading ? "..." : getUserInitials()}
                </Text>
              </View>
              <View>
                <Text style={styles.accountName}>
                  {isLoading ? "Loading..." : getUserDisplayName()}
                </Text>
                <Text style={styles.accountNumber}>ACCOUNT NUMBER - {accountNumber}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Load Product Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Load Product</Text>
          <TouchableOpacity 
            style={[styles.dropdown, { opacity: mobileNumber.length >= 10 ? 1 : 0.5 }]} 
            onPress={handleLoadProductPress}
            disabled={mobileNumber.length < 10}
          >
            <Text style={styles.dropdownText}>Select a load product</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Mobile Number Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mobile Number</Text>
          <View style={styles.phoneContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇵🇭</Text>
              <Text style={styles.code}>+63</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="909 833 6236"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Enter Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>
      </View>

      {/* Next Button */}
      <TouchableOpacity 
        style={[styles.nextButton, { opacity: mobileNumber.length >= 10 ? 1 : 0.5 }]}
        onPress={handleNext}
        disabled={mobileNumber.length < 10}
      >
        <Text style={styles.nextButtonText}>Next</Text>
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  accountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8BB54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  accountName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  accountNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  code: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  notesInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  nextButton: {
    backgroundColor: '#F8BB54',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BuyLoadScreen;