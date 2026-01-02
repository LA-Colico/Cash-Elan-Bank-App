import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../FirebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { Alert } from 'react-native';

const HomeScreen = () => {
  const { uid } = useLocalSearchParams();

  // Updated interface to include card information
  interface UserData {
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string; // For backward compatibility
    balance?: number;
    email?: string;
    mobile?: string;
    dateOfBirth?: Date;
    createdAt?: Date;
    cardNumber?: string;
    accountNumber?: string;
  }

  interface Transaction {
    id: string;
    name: string;
    amount: number;
    type: string;
    date: Date;
    description?: string;
    status?: string;
    reference?: string;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  // Generate card number for display (this should be done during signup)
  const generateCardNumber = (): string => {
    // Generate a card number starting with 4562 (like your original)
    const prefix = "4562";
    let cardNumber = prefix;
    
    for (let i = 0; i < 12; i++) {
      cardNumber += Math.floor(Math.random() * 10).toString();
    }
    
    // Format as XXXX XXXX XXXX XXXX
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
  };

  // Calculate card expiry (5 years from account creation) - FIXED
  const calculateCardExpiry = (createdAt: Date): string => {
    try {
      // Ensure we have a valid Date object
      let date: Date;
      
      if (createdAt instanceof Date) {
        date = createdAt;
      } else if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
        // Handle Firestore Timestamp
        date = (createdAt as any).toDate();
      } else if (createdAt) {
        // Try to parse as date string or timestamp
        date = new Date(createdAt);
      } else {
        // Fallback to current date
        date = new Date();
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date for card expiry, using current date');
        date = new Date();
      }

      const expiryDate = new Date(date);
      expiryDate.setFullYear(expiryDate.getFullYear() + 5);
      
      const month = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
      const year = expiryDate.getFullYear().toString();
      
      return `${month}/${year}`;
    } catch (error) {
      console.error('Error calculating card expiry:', error);
      // Return a default expiry 5 years from now
      const defaultExpiry = new Date();
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 5);
      const month = (defaultExpiry.getMonth() + 1).toString().padStart(2, '0');
      const year = defaultExpiry.getFullYear().toString();
      return `${month}/${year}`;
    }
  };

  // Helper function to safely convert Firestore timestamp to Date - FIXED
  const convertTimestampToDate = (timestamp: any): Date | undefined => {
    try {
      if (!timestamp) return undefined;
      
      if (timestamp instanceof Date) {
        return timestamp;
      }
      
      if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
        return timestamp.toDate();
      }
      
      if (timestamp && (typeof timestamp === 'string' || typeof timestamp === 'number')) {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? undefined : date;
      }
      
      return undefined;
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return undefined;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof uid === "string") {
        try {
          // Try to get user data directly from users collection
          const userDocRef = doc(db, "users", uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const rawUserData = userDocSnap.data();
            
            // Convert timestamps to Date objects safely
            const userData: UserData = {
              ...rawUserData,
              id: userDocSnap.id,
              createdAt: convertTimestampToDate(rawUserData.createdAt),
              dateOfBirth: convertTimestampToDate(rawUserData.dateOfBirth),
            };
            
            console.log('User data loaded:', {
              createdAt: userData.createdAt,
              createdAtType: typeof userData.createdAt,
              isValidDate: userData.createdAt instanceof Date ? !isNaN(userData.createdAt.getTime()) : false
            });
            
            setUserData(userData);
          } else {
            // Fallback: try the nested userInfo structure
            const userInfoCollectionRef = collection(db, "users", uid, "userInfo");
            const querySnapshot = await getDocs(userInfoCollectionRef);
            const documents = querySnapshot.docs.map((doc) => {
              const rawData = doc.data();
              return {
                id: doc.id,
                ...rawData,
                createdAt: convertTimestampToDate(rawData.createdAt),
                dateOfBirth: convertTimestampToDate(rawData.dateOfBirth),
              };
            });

            if (documents.length > 0) {
              setUserData(documents[0] as UserData);
            } else {
              console.log("No user data found.");
            }
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      }
    };

    const fetchTransactions = async () => {
      if (typeof uid === "string") {
        try {
          // Fetch transactions for this user
          const transactionsQuery = query(
            collection(db, "transactions"),
            where("userId", "==", uid),
            orderBy("timestamp", "desc")
          );
          
          const querySnapshot = await getDocs(transactionsQuery);
          const fetchedTransactions = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.description || data.name || "Transaction",
              amount: data.amount || 0,
              type: data.type || "transaction",
              date: convertTimestampToDate(data.timestamp) || new Date(),
              description: data.description,
              status: data.status,
              reference: data.reference,
            } as Transaction;
          });
          
          setTransactions(fetchedTransactions);
        } catch (error) {
          console.error("Error fetching transactions: ", error);
        }
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserData(), fetchTransactions()]);
      setIsLoading(false);
    };

    fetchData();
  }, [uid]);

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("en-PH", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(balance);
  };

  const getDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userData?.name || "loading...";
  };

  const getFirstName = () => {
    let firstName = "";
    
    if (userData?.firstName) {
      firstName = userData.firstName;
    } else if (userData?.name) {
      // Extract first name from full name
      firstName = userData.name.split(' ')[0];
    } else {
      return "loading...";
    }
    
    // Capitalize first letter and make rest lowercase
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  const getCardNumber = () => {
    // If card number exists in userData, use it; otherwise generate one
    // Note: In production, this should be generated during signup and stored in the database
    if (userData?.cardNumber) {
      return userData.cardNumber;
    }
    
    // This is temporary - in production, card number should be generated during signup
    if (userData?.accountNumber) {
      // Use account number as base for consistent card number generation
      const seed = userData.accountNumber.replace(/[^0-9]/g, '');
      return `4562 ${seed.padEnd(12, '0').substring(0, 12).replace(/(.{4})/g, '$1 ').trim()}`;
    }
    
    return "•••• •••• •••• ••••"; // Placeholder if no data
  };

  const getCardExpiry = () => {
    if (userData?.createdAt) {
      console.log('Calculating expiry for:', userData.createdAt);
      const expiry = calculateCardExpiry(userData.createdAt);
      console.log('Calculated expiry:', expiry);
      return expiry;
    }
    console.log('No createdAt date, returning placeholder');
    return "••/••••";
  };

  // Fixed function to properly detect incoming vs outgoing transactions
  const isIncomingTransaction = (type: string): boolean => {
    const incomingTypes = [
      'express_receive',
      'transfer_in', 
      'receive', 
      'deposit'
    ];
    return incomingTypes.includes(type.toLowerCase());
  };

  const getTransactionIcon = (transaction: Transaction) => {
    // Generate icons based on transaction type/description
    switch (transaction.type.toLowerCase()) {
      case 'bills':
      case 'bill':
        return (
          <View style={styles.transactionIconContainer}>
            <Ionicons name="receipt" size={20} color="#FF6B6B" />
          </View>
        );
      case 'load':
        return (
          <View style={styles.transactionIconContainer}>
            <Ionicons name="phone-portrait" size={20} color="#4ECDC4" />
          </View>
        );
      case 'express_send':
      case 'padala_send':
      case 'transfer_out':
      case 'transfer':
      case 'send':
        return (
          <View style={styles.transactionIconContainer}>
            <Ionicons name="arrow-up" size={20} color="#FF9F43" />
          </View>
        );
      case 'express_receive':
      case 'transfer_in':
      case 'receive':
      case 'deposit':
        return (
          <View style={styles.transactionIconContainer}>
            <Ionicons name="arrow-down" size={20} color="#26DE81" />
          </View>
        );
      default:
        return (
          <View style={styles.transactionIconContainer}>
            <Ionicons name="card" size={20} color="#A55EEA" />
          </View>
        );
    }
  };

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    switch(tab) {
      case "home":
        // Stay on home screen
        break;
      case "payments":
        // Navigate to history.tsx
        router.push({
          pathname: "/(tabs)/history",
          params: { uid: uid },
        });
        break;
      case "account":
        // Navigate to profile.tsx
        router.push({
          pathname: "/(tabs)/profile",
          params: { uid: uid },
        });
        break;
      case "more":
        // Navigate to more.tsx - UPDATED
        router.push({
          pathname: "/(tabs)/more",
          params: { uid: uid },
        });
        break;
    }
  };

  const handleNotificationPress = () => {
    // You can add navigation to notifications screen here
    console.log('Notifications pressed');
    // router.push({ pathname: "/(tabs)/notifications", params: { uid: uid } });
  };

  const handleBuyLoadPress = () => {
    if (!userData?.id) {
      Alert.alert("Error", "Account information not available. Please try again.");
      return;
    }
    router.push({
      pathname: "/(tabs)/buyload",
      params: { 
        uid: uid,
        accountNumber: userData.accountNumber || userData.id,
        balance: userData.balance || 0
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>
            {getFirstName()}
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
          <Ionicons name="notifications-outline" size={22} color="#666" />
          {/* Optional: Add notification badge */}
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <LinearGradient
          colors={['#FE8E6D', '#A8D8A8', '#F4E89B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.cardContent}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              ₱{userData?.balance ? formatBalance(userData.balance) : "0.00"}
            </Text>
            <Text style={styles.cardNumber}>{getCardNumber()}</Text>
            <Text style={styles.cardExpiry}>{getCardExpiry()}</Text>
          </View>
          <View style={styles.cardBrandContainer}>
            <View style={styles.masterCardLogo}>
              <View style={[styles.circle, { backgroundColor: '#FF0000' }]} />
              <View style={[styles.circle, { backgroundColor: '#FFCC00', marginLeft: -10 }]} />
            </View>
            <Text style={styles.masterCardText}>Mastercard</Text>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {/* First Row - 4 items */}
          <View style={styles.actionRowFour}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({
              pathname: "/transfer",
              params: { uid: uid },
            })}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="paper-plane" size={22} color="#333" />
              </View>
              <Text style={styles.actionText}>Send /{"\n"}Transfer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({
              pathname: "/deposit",
              params: { uid: uid },
            })}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="wallet" size={22} color="#333" />
              </View>
              <Text style={styles.actionText}>Deposit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({
              pathname: "/(tabs)/withdraw",
              params: { uid: uid },
            })}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="cash" size={22} color="#333" />
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({
              pathname: "/(tabs)/investscreen",
              params: { uid: uid },
            })}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="trending-up" size={22} color="#333" />
              </View>
              <Text style={styles.actionText}>Investment</Text>
            </TouchableOpacity>
          </View>

          {/* Second Row - 3 items centered */}
          <View style={styles.actionRowThree}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({
              pathname: "/(tabs)/paybills",
              params: { uid: uid, accountNumber: userData?.accountNumber || userData?.id },
            })}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="receipt" size={22} color="#333" />
              </View>
              <Text style={styles.actionText}>Pay Bills</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleBuyLoadPress}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="phone-portrait" size={22} color="#333" />
              </View>
              <Text style={styles.actionText}>Buy Load</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                if (!userData?.id) {
                  Alert.alert("Error", "Account information not available. Please try again.");
                  return;
                }
                router.push({
                  pathname: "/(tabs)/loanscreen",
                  params: { 
                    uid: uid,
                    accountNumber: userData.id  // Pass the account number
                  },
                });
              }}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="cash-outline" size={22} color="#333" />
              </View>
              <Text style={styles.actionText}>Loan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Transactions</Text>
            <TouchableOpacity onPress={() => router.push({
              pathname: "/(tabs)/history",
              params: { uid: uid },
            })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction List */}
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((transaction, index) => (
              <View key={transaction.id} style={[
                styles.transactionItem,
                { borderBottomWidth: index === Math.min(transactions.length - 1, 4) ? 0 : 1 }
              ]}>
                {getTransactionIcon(transaction)}
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionName}>{transaction.name}</Text>
                  <Text style={styles.transactionType}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('_', ' ')}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { 
                    color: isIncomingTransaction(transaction.type) ? '#26DE81' : '#FF6B6B'
                  }
                ]}>
                  {isIncomingTransaction(transaction.type) ? '+' : '-'}₱{formatBalance(transaction.amount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.noTransactionsContainer}>
              <Ionicons name="receipt-outline" size={50} color="#ccc" />
              <Text style={styles.noTransactionsText}>No transactions yet</Text>
              <Text style={styles.noTransactionsSubtext}>Start using your account to see transactions here</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => handleNavigation("home")}
        >
          <Ionicons name="home" size={22} color="#FFBD00" />
          <Text style={[styles.navLabel, { color: '#FFBD00' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleNavigation("payments")}
        >
          <Ionicons 
            name="card-outline" 
            size={22} 
            color={activeTab === "payments" ? "#FFBD00" : "#999"} 
          />
          <Text style={[styles.navLabel, { color: activeTab === "payments" ? "#FFBD00" : "#8E8E93" }]}>
            Payments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.centralButton}
          onPress={() => router.push({
            pathname: "/(tabs)/qrcode",
            params: { uid: uid },
          })}
        >
          <View style={styles.centralButtonInner}>
            <Ionicons name="qr-code" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleNavigation("account")}
        >
          <Ionicons 
            name="person-outline" 
            size={22} 
            color={activeTab === "account" ? "#FFBD00" : "#999"} 
          />
          <Text style={[styles.navLabel, { color: activeTab === "account" ? "#FFBD00" : "#8E8E93" }]}>
            Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleNavigation("more")}
        >
          <Ionicons 
            name="ellipsis-horizontal" 
            size={22} 
            color={activeTab === "more" ? "#FFBD00" : "#999"} 
          />
          <Text style={[styles.navLabel, { color: activeTab === "more" ? "#FFBD00" : "#8E8E93" }]}>
            More
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  profileImageContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f8f9fa',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 20,
    padding: 24,
    height: 200,
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  cardContent: {
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 50,
  },
  cardNumber: {
    color: '#fff',
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: '500',
    marginTop: -5,
  },
  cardExpiry: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 1,
  },
  cardBrandContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    alignItems: 'flex-end',
  },
  masterCardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  masterCardText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionRowFour: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionRowThree: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: '12.5%', // This centers 3 items with proper spacing
  },
  actionButton: {
    alignItems: 'center',
    minWidth: 70,
  },
  actionIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    maxWidth: 65,
  },
  transactionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 100,
    minHeight: 300,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FFBD00',
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomColor: '#F2F2F7',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  noTransactionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTransactionsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 12,
    marginBottom: 4,
  },
  noTransactionsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingHorizontal: 20,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 11,
    marginTop: 4,
    color: '#8E8E93',
    fontWeight: '500',
  },
  centralButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  centralButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFBD00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HomeScreen;