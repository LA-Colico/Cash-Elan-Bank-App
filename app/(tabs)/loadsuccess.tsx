import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LoadSuccessful = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { 
    totalAmount, 
    randomRef, 
    accountNumber, 
    provider, 
    uid, 
    mobileNumber, 
    loadProduct 
  } = params;

  // State for Date & Time
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    // Generate Current Date & Time
    const now = new Date();
    const formattedDate = now.toLocaleString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    setDateTime(formattedDate);
  }, []);

  const handleContinue = () => {
    // Navigate back to Homepage
    if (uid) {
      router.push({ 
        pathname: "/(tabs)/homepage", 
        params: { uid } 
      });
    } else {
      // Fallback navigation if uid is not available
      router.push("/(tabs)/homepage");
    }
  };

  const handleBackToHome = () => {
    // Navigate back to Homepage
    if (uid) {
      router.push({ 
        pathname: "/(tabs)/homepage", 
        params: { uid } 
      });
    } else {
      // Fallback navigation if uid is not available
      router.push("/(tabs)/homepage");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header - Added to match transfer.tsx */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Load Success</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>
        </View>

        {/* Success Text */}
        <Text style={styles.successTitle}>Load Sent Successfully!</Text>
        <Text style={styles.successSubtitle}>
          Your {provider || 'mobile'} load has been sent.{'\n'}Transaction completed successfully.
        </Text>

        {/* Transaction Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Transaction Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time:</Text>
            <Text style={styles.detailValue}>{dateTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference:</Text>
            <Text style={styles.detailValue}>{randomRef}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValueAmount}>{totalAmount}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider:</Text>
            <Text style={styles.detailValue}>{provider}</Text>
          </View>

          {mobileNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile Number:</Text>
              <Text style={styles.detailValue}>{mobileNumber}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{loadProduct}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From Account:</Text>
            <Text style={styles.detailValue}>{accountNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>CashElan Account</Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  // Added header styles to match transfer.tsx
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8B319",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#F8B319",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
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
    maxWidth: "60%",
    textAlign: "right",
    flex: 1,
  },
  detailValueAmount: {
    fontSize: 16,
    color: "#F8B319",
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
  },
  continueButton: {
    backgroundColor: "#F8B319",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#F8B319",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoadSuccessful;