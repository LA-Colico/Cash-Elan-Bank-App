import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView,
  ScrollView,
  Image,
  StatusBar
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/FirebaseConfig";

const LoadConfirm = () => {
  const router = useRouter();
  const { 
    uid, 
    accountNumber, 
    mobileNumber, 
    notes, 
    provider, 
    providerId, 
    loadProduct, 
    amount 
  } = useLocalSearchParams();
  
  const [userBalance, setUserBalance] = useState("0.00");
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  interface UserData {
    balance?: number;
    deposit?: number;
    name?: string;
    firstName?: string;
    lastName?: string;
  }

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

  useEffect(() => {
    // Fetch user balance when component mounts
    const fetchUserData = async () => {
      if (typeof uid === "string") {
        try {
          // Try to get user data from main users collection (consistent with transfer system)
          const userDocRef = doc(db, "users", uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            const currentBalance = parseFloat(String(userData.balance || "0"));
            setUserBalance(currentBalance.toFixed(2));
            setUserData(userData);
          } else {
            // Fallback: try the nested userInfo structure
            const docRef = doc(db, "users", uid, "userInfo", accountNumber as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const userData = docSnap.data() as UserData;
              const currentDeposit = parseFloat(String(userData.deposit || "0"));
              setUserBalance(currentDeposit.toFixed(2));
              setUserData(userData);
            }
          }
        } catch (error) {
          console.error("Error fetching user balance:", error);
        }
      }
    };

    fetchUserData();
  }, [uid, accountNumber]);

  const loadAmount = parseFloat(amount as string);
  const convenienceFee = loadAmount * 0.01; // 1% convenience fee
  const totalAmount = loadAmount + convenienceFee;

  const getUserDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userData?.name || "Account Holder";
  };

  const handlePurchase = async () => {
    if (typeof uid === "string") {
      setIsLoading(true);
      
      try {
        // Use the main users collection (consistent with transfer system)
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          const currentBalance = parseFloat(String(userData.balance || "0"));
          
          // Check if the balance is sufficient
          if (currentBalance < totalAmount) {
            Alert.alert("Error", "Insufficient funds in your account.");
            return;
          }

          // Calculate the new balance
          const newBalance = currentBalance - totalAmount;
          const randomRef = `LOAD-${Date.now()}`;

          // Update the balance in Firestore (main users collection)
          await updateDoc(userDocRef, { 
            balance: newBalance 
          });

          // Add the transaction to the main transactions collection (consistent with transfer system)
          await addDoc(collection(db, "transactions"), {
            userId: uid,
            type: "load",
            amount: totalAmount,
            description: `Mobile Load - ${provider}`,
            provider: provider,
            mobileNumber: mobileNumber,
            loadProduct: loadProduct,
            loadAmount: loadAmount,
            convenienceFee: convenienceFee,
            accountNumber: accountNumber,
            notes: notes,
            timestamp: serverTimestamp(),
            status: "completed",
            reference: randomRef,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
          });

          console.log("✅ Load purchase processed successfully!");

          // Navigate to the success screen
          router.push({
            pathname: "../loadsuccess",
            params: { 
              uid: uid, 
              totalAmount: `₱${totalAmount.toFixed(2)}`, 
              accountNumber: accountNumber, 
              randomRef: randomRef,
              provider: provider,
              mobileNumber: mobileNumber,
              loadProduct: loadProduct
            },  
          });
        } else {
          // Fallback: try the nested userInfo structure
          const docRef = doc(db, "users", uid, "userInfo", accountNumber as string);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data() as UserData;
            const currentDeposit = parseFloat(String(userData.deposit || "0"));
            
            // Check if the deposit is sufficient
            if (currentDeposit < totalAmount) {
              Alert.alert("Error", "Insufficient funds in your deposit.");
              return;
            }

            // Calculate the new deposit
            const newDeposit = currentDeposit - totalAmount;
            const randomRef = `LOAD-${Date.now()}`;

            // Update the deposit in Firestore
            await updateDoc(docRef, { deposit: newDeposit.toFixed(2) });

            // Also add to main transactions collection for consistency
            await addDoc(collection(db, "transactions"), {
              userId: uid,
              type: "load",
              amount: totalAmount,
              description: `Mobile Load - ${provider}`,
              provider: provider,
              mobileNumber: mobileNumber,
              loadProduct: loadProduct,
              loadAmount: loadAmount,
              convenienceFee: convenienceFee,
              accountNumber: accountNumber,
              notes: notes,
              timestamp: serverTimestamp(),
              status: "completed",
              reference: randomRef,
              balanceBefore: currentDeposit,
              balanceAfter: newDeposit,
            });

            console.log("✅ Load purchase processed successfully (legacy structure)!");

            // Navigate to the success screen
            router.push({
              pathname: "../loadsuccess",
              params: { 
                uid: uid, 
                totalAmount: `₱${totalAmount.toFixed(2)}`, 
                accountNumber: accountNumber, 
                randomRef: randomRef,
                provider: provider,
                mobileNumber: mobileNumber,
                loadProduct: loadProduct
              },  
            });
          } else {
            Alert.alert("Error", "No account found.");
          }
        }
      } catch (error) {
        console.error("❌ Error processing load purchase:", error);
        Alert.alert("Error", "Failed to process load purchase. Please try again.");
      } finally {
        setIsLoading(false);
      }
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
        <Text style={styles.headerTitle}>Confirm Load Purchase</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Provider Section */}
        <View style={styles.providerSection}>
          <Image source={getProviderLogo(providerId as string)} style={styles.providerLogo} />
          <Text style={styles.providerName}>{provider}</Text>
        </View>

        {/* Load Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Load Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile Number</Text>
            <Text style={styles.detailValue}>{mobileNumber || "N/A"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{loadProduct}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Load Amount</Text>
            <Text style={styles.detailValue}>₱{loadAmount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Convenience Fee</Text>
            <Text style={styles.detailValue}>₱{convenienceFee.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₱{totalAmount.toFixed(2)}</Text>
          </View>

          {notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}
        </View>

        {/* Payment Source Section */}
        <View style={styles.paymentSourceSection}>
          <Text style={styles.paymentSourceTitle}>FROM</Text>
          
          <View style={styles.accountCard}>
            <View style={styles.accountInfo}>
              <View style={styles.accountIcon}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{getUserDisplayName()}</Text>
                <Text style={styles.accountNumber}>ACCOUNT - {accountNumber}</Text>
                <Text style={styles.accountBalance}>Available: ₱{userBalance}</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#F8B319" />
          </View>
        </View>

        {/* Purchase Button */}
        <TouchableOpacity 
          style={[styles.purchaseButton, isLoading && styles.disabledButton]} 
          onPress={handlePurchase}
          disabled={isLoading}
        >
          <Text style={styles.purchaseButtonText}>
            {isLoading ? "Processing..." : "Confirm Purchase"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  providerSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 16,
  },
  providerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: 8,
    paddingTop: 12,
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    color: "#F8B319",
    fontWeight: "bold",
    flex: 2,
    textAlign: "right",
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  notesLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  paymentSourceSection: {
    marginBottom: 24,
  },
  paymentSourceTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#999",
    marginBottom: 12,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F8B319",
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8B319",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  accountBalance: {
    fontSize: 14,
    color: "#F8B319",
    fontWeight: "600",
  },
  purchaseButton: {
    backgroundColor: "#F8B319",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#F8B319",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoadConfirm;