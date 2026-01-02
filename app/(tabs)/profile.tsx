import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { signOut } from "firebase/auth";
import { auth, db } from "../../FirebaseConfig";
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export default function ProfileScreen() {
  const { uid, accountNumber } = useLocalSearchParams();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAccountVisible, setIsAccountVisible] = useState(false);

  interface UserData {
    uid?: string;
    name?: string;
    accountNumber?: string;
    deposit?: string;
    email?: string;
    mobile?: string;
    dateOfBirth?: Date;
    createdAt?: Date;
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (typeof uid === "string") {
          // Try to get from userInfo collection first
          const userInfoCollectionRef = collection(db, "users", uid, "userInfo");
          const querySnapshot = await getDocs(userInfoCollectionRef);
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            setUserData({ 
              accountNumber: doc.id, // The document ID is the account number
              ...doc.data() as UserData 
            });
          } else if (typeof accountNumber === "string") {
            // Fallback to specific document
            const docRef = doc(db, "users", uid, "userInfo", accountNumber);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUserData({ 
                accountNumber: accountNumber,
                ...docSnap.data() as UserData 
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [uid, accountNumber]);

  const formatDeposit = (deposit: string) => {
    const number = parseFloat(deposit);
    if (isNaN(number)) return "0.00";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/login");
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Error", "Failed to log out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleSwitchAccount = () => {
    Alert.alert("Switch Account", "Switch account functionality coming soon!");
  };

  const formatAccountNumber = (accNum: string) => {
    if (!accNum) return "****";
    
    if (isAccountVisible) {
      return accNum;
    } else {
      // Show only last 4 digits
      return `**** **** **** ${accNum.slice(-4)}`;
    }
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Personal Information',
      onPress: () => Alert.alert("Coming Soon", "Personal Information feature coming soon!"),
      showArrow: true,
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      onPress: () => Alert.alert("Coming Soon", "Notifications feature coming soon!"),
      showArrow: true,
      hasNotification: true,
    },
    {
      icon: 'chatbubble-outline',
      title: 'Message Center',
      onPress: () => Alert.alert("Coming Soon", "Message Center feature coming soon!"),
      showArrow: true,
    },
    {
      icon: 'location-outline',
      title: 'Address',
      onPress: () => Alert.alert("Coming Soon", "Address feature coming soon!"),
      showArrow: true,
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      onPress: () => Alert.alert("Coming Soon", "Settings feature coming soon!"),
      showArrow: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarIcon}>
              <Ionicons name="person" size={30} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData?.name || "User Name"}</Text>
            <View style={styles.accountNumberContainer}>
              <Text style={styles.accountNumberText}>
                Account number - {formatAccountNumber(userData?.accountNumber || "")}
              </Text>
              <TouchableOpacity
                onPress={() => setIsAccountVisible(!isAccountVisible)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={isAccountVisible ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.verificationText}>Verified User</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={20} color="#666666" />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.hasNotification && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>3</Text>
                  </View>
                )}
                {item.showArrow && (
                  <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.switchAccountButton} onPress={handleSwitchAccount}>
            <Text style={styles.switchAccountButtonText}>Switch Account</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>


      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
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
  moreButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 28,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFBD00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  accountNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountNumberText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    flex: 1,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 14,
    color: '#34C759',
    marginLeft: 4,
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#FFBD00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchAccountButton: {
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchAccountButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});