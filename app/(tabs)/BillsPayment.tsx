import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BillsPayment = () => {
  const router = useRouter();
  const { provider, uid, accountNumber } = useLocalSearchParams();
  const [accNum, setAccountNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");

  const handleContinue = () => {
    // Validate required fields
    if (!accNum || !fullName || !amount) {
      Alert.alert("Missing Fields", "Please fill in Account Number, Full Name, and Amount.");
      return;
    }

    // Validate amount is a valid number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0.");
      return;
    }

    // Validate minimum amount (e.g., 1 peso)
    if (numericAmount < 1) {
      Alert.alert("Invalid Amount", "Minimum amount is ₱1.00.");
      return;
    }

    console.log('📋 Bill payment form data:', {
      provider,
      accNum,
      fullName,
      amount: numericAmount,
      uid,
      accountNumber
    });

    router.push({
      pathname: "../PaymentConfirm",
      params: {
        uid: uid,
        accountNumber: accountNumber,
        amount: numericAmount.toString(),
        accNum: accNum,
        provider: provider || "Payment Service Provider",
        fullName: fullName
      },
    });
  };

  const formatAmountInput = (text: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts[1];
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatAmountInput(text);
    setAmount(formatted);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        {/* Header - Updated to match transfer.tsx */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Bills</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Provider Info - Centered */}
        <View style={styles.providerInfoContainer}>
          <Text style={styles.providerName}>{provider || "Payment Service Provider"}</Text>
          <Text style={styles.postingPeriod}>Posting period: within 24 hours</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={styles.currencyLabel}>PHP</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          <View style={styles.amountDivider} />
          <Text style={styles.serviceFee}>
            Service fee: ₱{amount ? (parseFloat(amount) * 0.01).toFixed(2) : "0.00"} (1% of bill amount)
          </Text>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>
              Customer Account Number (CAN) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Account Number"
              placeholderTextColor="#999"
              value={accNum}
              onChangeText={setAccountNumber}
              keyboardType="default"
              maxLength={20}
            />
            
            <Text style={styles.inputLabel}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Full Name"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              maxLength={50}
            />

            <Text style={styles.inputLabel}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={50}
            />
          </View>

          {/* Total Amount Display */}
          {amount && (
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>
                ₱{(parseFloat(amount) + (parseFloat(amount) * 0.01)).toFixed(2)}
              </Text>
            </View>
          )}

          {/* Continue Button */}
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              (!accNum || !fullName || !amount) && styles.disabledButton
            ]} 
            onPress={handleContinue}
            disabled={!accNum || !fullName || !amount}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  safeArea: {
    flex: 1,
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
  providerInfoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
  },
  postingPeriod: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  amountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  amountInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "right",
    minWidth: 150,
  },
  amountDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 4,
  },
  serviceFee: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  required: {
    color: "#FF6B6B",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    color: "#000",
    backgroundColor: "#fff",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFB800",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFB800",
  },
  continueButton: {
    backgroundColor: "#FFB800",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#FFB800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default BillsPayment;