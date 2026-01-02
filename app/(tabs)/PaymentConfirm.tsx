// PaymentConfirm.tsx - Updated with transfer header style
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/FirebaseConfig";

const PaymentConfirm = () => {
  const router = useRouter();
  const { uid, accountNumber, amount, accNum, provider, fullName } = useLocalSearchParams();
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

  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof uid === "string") {
        try {
          const userDocRef = doc(db, "users", uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            const currentBalance = parseFloat(String(userData.balance || "0"));
            setUserBalance(currentBalance.toFixed(2));
            setUserData(userData);
          } else {
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

  const billAmount = parseFloat(amount as string);
  const convenienceFee = billAmount * 0.01;
  const totalAmount = billAmount + convenienceFee;

  const getUserDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userData?.name || fullName || "Account Holder";
  };

  const handlePay = async () => {
    if (typeof uid === "string") {
      setIsLoading(true);
      
      try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          const currentBalance = parseFloat(String(userData.balance || "0"));
          
          if (currentBalance < totalAmount) {
            Alert.alert("Error", "Insufficient funds in your account.");
            return;
          }

          const newBalance = currentBalance - totalAmount;
          const randomRef = `BILL-${Date.now()}`;

          await updateDoc(userDocRef, { 
            balance: newBalance 
          });

          await addDoc(collection(db, "transactions"), {
            userId: uid,
            type: "bills",
            amount: totalAmount,
            description: `Bill Payment - ${provider}`,
            provider: provider,
            billAccountNumber: accNum,
            billAmount: billAmount,
            convenienceFee: convenienceFee,
            fullName: fullName,
            accountNumber: accountNumber,
            timestamp: serverTimestamp(),
            status: "completed",
            reference: randomRef,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
          });

          router.push({
            pathname: "../PaymentSuccessful",
            params: { 
              uid: uid, 
              totalAmount: `₱${totalAmount.toFixed(2)}`, 
              accountNumber: accountNumber, 
              randomRef: randomRef,
              provider: provider
            },  
          });
        } else {
          const docRef = doc(db, "users", uid, "userInfo", accountNumber as string);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data() as UserData;
            const currentDeposit = parseFloat(String(userData.deposit || "0"));
            
            if (currentDeposit < totalAmount) {
              Alert.alert("Error", "Insufficient funds in your deposit.");
              return;
            }

            const newDeposit = currentDeposit - totalAmount;
            const randomRef = `BILL-${Date.now()}`;

            await updateDoc(docRef, { deposit: newDeposit.toFixed(2) });

            await addDoc(collection(db, "transactions"), {
              userId: uid,
              type: "bills",
              amount: totalAmount,
              description: `Bill Payment - ${provider}`,
              provider: provider,
              billAccountNumber: accNum,
              billAmount: billAmount,
              convenienceFee: convenienceFee,
              fullName: fullName,
              accountNumber: accountNumber,
              timestamp: serverTimestamp(),
              status: "completed",
              reference: randomRef,
              balanceBefore: currentDeposit,
              balanceAfter: newDeposit,
            });

            router.push({
              pathname: "../PaymentSuccessful",
              params: { 
                uid: uid, 
                totalAmount: `₱${totalAmount.toFixed(2)}`, 
                accountNumber: accountNumber, 
                randomRef: randomRef,
                provider: provider
              },  
            });
          } else {
            Alert.alert("Error", "No account found.");
          }
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        Alert.alert("Error", "Failed to process payment. Please try again.");
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
        <Text style={styles.headerTitle}>Pay Bills</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Provider Logo and Info */}
        <View style={styles.providerSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="settings" size={40} color="#FFB800" style={styles.logoIcon} />
          </View>
          <Text style={styles.providerName}>{provider || "Payment Service Provider"}</Text>
        </View>

        {/* Billing Details Card */}
        <View style={styles.billingDetailsCard}>
          <Text style={styles.cardTitle}>Billing Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Number</Text>
            <Text style={styles.detailValue}>{accNum}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Name</Text>
            <Text style={styles.detailValue}>{fullName || "N/A"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bill Amount</Text>
            <Text style={styles.detailValue}>₱{billAmount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Convenience Fee</Text>
            <Text style={styles.detailValue}>₱{convenienceFee.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₱{totalAmount.toFixed(2)}</Text>
          </View>
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
            <Ionicons name="checkmark-circle" size={24} color="#FFB800" />
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={[styles.continueButton, isLoading && styles.disabledButton]} 
          onPress={handlePay}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.continueButtonText}>Confirm Payment</Text>
          )}
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
    paddingHorizontal: 16,
  },
  providerSection: {
    alignItems: "center",
    marginVertical: 24,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF9E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoIcon: {
    color: "#FFB800",
  },
  providerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  billingDetailsCard: {
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
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    maxWidth: "60%",
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
  },
  totalValue: {
    fontSize: 18,
    color: "#FFB800",
    fontWeight: "bold",
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
    borderColor: "#FFB800",
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
    backgroundColor: "#FFB800",
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
    color: "#FFB800",
    fontWeight: "600",
  },
  continueButton: {
    backgroundColor: "#FFB800",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#FFB800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default PaymentConfirm;