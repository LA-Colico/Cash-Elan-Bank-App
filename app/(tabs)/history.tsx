import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';

const { width } = Dimensions.get('window');

const TransactionHistoryScreen = () => {
  const { uid } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('history');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
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

  interface UserData {
    balance?: number;
  }

  // Helper function to safely convert Firestore timestamp to Date
  const convertTimestampToDate = (timestamp: any): Date | null => {
    try {
      if (!timestamp) return null;
      
      if (timestamp instanceof Date) {
        return timestamp;
      }
      
      if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
        return timestamp.toDate();
      }
      
      if (timestamp && (typeof timestamp === 'string' || typeof timestamp === 'number')) {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
      }
      
      return null;
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return null;
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
            const userData: UserData = userDocSnap.data();
            setCurrentBalance(userData.balance || 0);
          } else {
            // Fallback: try the nested userInfo structure
            const userInfoCollectionRef = collection(db, "users", uid, "userInfo");
            const querySnapshot = await getDocs(userInfoCollectionRef);
            const documents = querySnapshot.docs.map((doc) => doc.data());

            if (documents.length > 0) {
              const userData = documents[0] as any;
              setCurrentBalance(parseFloat(userData.deposit || userData.balance || "0"));
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

  const getTransactionIcon = (transaction: Transaction) => {
    // Generate icons based on transaction type/description
    switch (transaction.type.toLowerCase()) {
      case 'bills':
      case 'bill':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FF6B6B20' }]}>
            <Ionicons name="receipt" size={20} color="#FF6B6B" />
          </View>
        );
      case 'load':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#4ECDC420' }]}>
            <Ionicons name="phone-portrait" size={20} color="#4ECDC4" />
          </View>
        );
      case 'express_send':
      case 'padala_send':
      case 'transfer_out':
      case 'transfer':
      case 'send':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FF9F4320' }]}>
            <Ionicons name="arrow-up" size={20} color="#FF9F43" />
          </View>
        );
      case 'express_receive':
      case 'transfer_in':
      case 'receive':
      case 'deposit':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#26DE8120' }]}>
            <Ionicons name="arrow-down" size={20} color="#26DE81" />
          </View>
        );
      default:
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#A55EEA20' }]}>
            <Ionicons name="card" size={20} color="#A55EEA" />
          </View>
        );
    }
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

  // Fixed function to properly format amounts with correct +/- signs
  const formatAmount = (amount: number, type: string) => {
    const formattedAmount = formatBalance(Math.abs(amount));
    const isIncoming = isIncomingTransaction(type);
    return isIncoming ? `+₱${formattedAmount}` : `-₱${formattedAmount}`;
  };

  // Fixed function to properly color amounts
  const getAmountColor = (type: string) => {
    return isIncomingTransaction(type) ? '#26DE81' : '#FF6B6B';
  };

  const renderBalanceChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartArea}>
        {/* Simplified chart representation */}
        <View style={styles.chartLine} />
        <View style={styles.chartDot1} />
        <View style={styles.chartDot2} />
        <View style={styles.chartDot3} />
      </View>
      <View style={styles.chartLabels}>
        <Text style={styles.chartLabel}>Oct</Text>
        <Text style={styles.chartLabel}>Nov</Text>
        <Text style={styles.chartLabel}>Dec</Text>
        <Text style={[styles.chartLabel, styles.activeMonth]}>Jan</Text>
        <Text style={styles.chartLabel}>Feb</Text>
        <Text style={styles.chartLabel}>Mar</Text>
      </View>
    </View>
  );

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = (date: Date) => {
      return date.toDateString() === today.toDateString();
    };
    
    const isYesterday = (date: Date) => {
      return date.toDateString() === yesterday.toDateString();
    };
    
    const todayTransactions = transactions.filter(t => isToday(t.date));
    const yesterdayTransactions = transactions.filter(t => isYesterday(t.date));
    const olderTransactions = transactions.filter(t => !isToday(t.date) && !isYesterday(t.date));
    
    return { todayTransactions, yesterdayTransactions, olderTransactions };
  };

  const getTransactionDisplayName = (transaction: Transaction) => {
    // Enhanced transaction names based on type
    switch (transaction.type.toLowerCase()) {
      case 'express_send':
        return transaction.name || 'Express Send';
      case 'express_receive':
        return transaction.name || 'Express Receive';
      case 'padala_send':
        return transaction.name || 'Padala Send';
      case 'bills':
      case 'bill':
        return transaction.name || 'Bill Payment';
      case 'load':
        return transaction.name || 'Mobile Load';
      default:
        return transaction.name || 'Transaction';
    }
  };

  const getTransactionDisplayType = (transaction: Transaction) => {
    // Enhanced transaction type display
    switch (transaction.type.toLowerCase()) {
      case 'express_send':
        return 'Express Send';
      case 'express_receive':
        return 'Express Receive';
      case 'padala_send':
        return 'Padala Send';
      case 'bills':
      case 'bill':
        return 'Bill Payment';
      case 'load':
        return 'Mobile Load';
      case 'transfer_in':
        return 'Transfer In';
      case 'transfer_out':
        return 'Transfer Out';
      case 'deposit':
        return 'Deposit';
      default:
        return transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('_', ' ');
    }
  };

  const renderTransactionGroup = (title: string, groupTransactions: Transaction[]) => {
    if (groupTransactions.length === 0) return null;
    
    return (
      <View style={styles.transactionGroup}>
        <Text style={styles.groupTitle}>{title}</Text>
        {groupTransactions.map((transaction, index) => (
          <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              {getTransactionIcon(transaction)}
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>
                  {getTransactionDisplayName(transaction)}
                </Text>
                <Text style={styles.transactionType}>
                  {getTransactionDisplayType(transaction)}
                </Text>
                {transaction.reference && (
                  <Text style={styles.transactionRef}>
                    Ref: {transaction.reference}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.amountContainer}>
              <Text style={[styles.transactionAmount, { color: getAmountColor(transaction.type) }]}>
                {formatAmount(transaction.amount, transaction.type)}
              </Text>
              <Text style={styles.transactionTime}>
                {transaction.date.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { todayTransactions, yesterdayTransactions, olderTransactions } = groupTransactionsByDate(transactions);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            ₱{formatBalance(currentBalance)}
          </Text>
          {renderBalanceChart()}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions"
              placeholderTextColor="#9E9E9E"
            />
          </View>
        </View>

        {/* Transaction Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
            <Text style={styles.summaryValue}>{transactions.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryValue}>
              {transactions.filter(t => 
                t.date.getMonth() === new Date().getMonth() && 
                t.date.getFullYear() === new Date().getFullYear()
              ).length}
            </Text>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubText}>Start using your account to see transactions here</Text>
            </View>
          ) : (
            <>
              {renderTransactionGroup("Today", todayTransactions)}
              {renderTransactionGroup("Yesterday", yesterdayTransactions)}
              {renderTransactionGroup("Earlier", olderTransactions)}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => {
            setActiveTab('home');
            router.push({ pathname: '/(tabs)/homepage', params: { uid } });
          }}
        >
          <Ionicons 
            name="home" 
            size={22} 
            color={activeTab === "home" ? "#FFBD00" : "#999"} 
          />
          <Text style={[styles.navLabel, { color: activeTab === "home" ? "#FFBD00" : "#8E8E93" }]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => {
            setActiveTab('payments');
            // Stay on current screen since we're already in history/payments view
          }}
        >
          <Ionicons 
            name="card-outline" 
            size={22} 
            color="#FFBD00"
          />
          <Text style={[styles.navLabel, { color: '#FFBD00' }]}>
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
          onPress={() => {
            setActiveTab('account');
            router.push({ pathname: '/(tabs)/profile', params: { uid } });
          }}
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
          onPress={() => {
            setActiveTab('more');
          }}
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  chartContainer: {
    height: 120,
    marginBottom: 20,
  },
  chartArea: {
    height: 80,
    position: 'relative',
    marginBottom: 10,
  },
  chartLine: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F6B800',
    borderRadius: 2,
    transform: [{ scaleY: 2 }],
  },
  chartDot1: {
    position: 'absolute',
    top: 20,
    left: '20%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F6B800',
  },
  chartDot2: {
    position: 'absolute',
    top: 10,
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F6B800',
  },
  chartDot3: {
    position: 'absolute',
    top: 30,
    left: '80%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F6B800',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  chartLabel: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  activeMonth: {
    color: '#F6B800',
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionsSection: {
    flex: 1,
    paddingBottom: 100,
  },
  transactionGroup: {
    marginBottom: 25,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  transactionRef: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingHorizontal: 40,
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

export default TransactionHistoryScreen;