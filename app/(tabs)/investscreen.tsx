import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

// Define the UserData interface
interface UserData {
  id?: string;
  name?: string;
  deposit?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
}

const InvestScreen = () => {
  const { uid } = useLocalSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserInfoDocuments = async () => {
      if (typeof uid === "string") {
        const userInfoCollectionRef = collection(db, "users", uid, "userInfo");

        try {
          const querySnapshot = await getDocs(userInfoCollectionRef);
          const documents = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          if (documents.length > 0) {
            setUserData(documents[0] as UserData);
          } else {
            console.log("No user info documents found.");
          }
        } catch (error) {
          console.error("Error fetching user info documents: ", error);
        }
      }
    };

    fetchUserInfoDocuments();
  }, [uid]);

  const formatBalance = (balance: string | undefined) => {
    if (!balance) return "0.00";
    const number = parseFloat(balance);
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investments</Text>
        <TouchableOpacity style={styles.notificationButton}>

        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Hello, {userData?.name || "User"}! 👋</Text>
          <Text style={styles.subtitleText}>Let's grow your wealth together</Text>
        </View>

        {/* Portfolio Overview Card */}
        <View style={styles.portfolioCard}>
          <View style={styles.portfolioHeader}>
            <View style={styles.portfolioIconContainer}>
              <Ionicons name="trending-up" size={24} color="#FFBD00" />
            </View>
            <Text style={styles.portfolioTitle}>Investment Portfolio</Text>
          </View>
          
          <View style={styles.portfolioValue}>
            <Text style={styles.portfolioLabel}>Total Value</Text>
            <Text style={styles.portfolioAmount}>₱ 0.00</Text>
            <Text style={styles.portfolioGrowth}>+0.00% this month</Text>
          </View>

          <View style={styles.portfolioActions}>
            <TouchableOpacity style={styles.portfolioActionButton}>
              <Ionicons name="eye-outline" size={16} color="#FFBD00" />
              <Text style={styles.portfolioActionText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.portfolioActionButton}>
              <Ionicons name="bar-chart-outline" size={16} color="#FFBD00" />
              <Text style={styles.portfolioActionText}>Performance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Investment Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Options</Text>
          <Text style={styles.sectionSubtitle}>Choose from our curated investment products</Text>
        </View>

        {/* Investment Cards Grid */}
        <View style={styles.investmentGrid}>
          {/* Fixed Deposits */}
          <TouchableOpacity style={styles.investmentCard}>
            <View style={styles.investmentIconContainer}>
              <Ionicons name="shield-checkmark" size={28} color="#34C759" />
            </View>
            <Text style={styles.investmentTitle}>Fixed Deposits</Text>
            <Text style={styles.investmentDescription}>Guaranteed returns with capital protection</Text>
            <View style={styles.investmentDetails}>
              <Text style={styles.investmentRate}>4.5% p.a.</Text>
              <Text style={styles.investmentRisk}>Low Risk</Text>
            </View>
            <View style={styles.investmentFooter}>
              <Text style={styles.investmentMinimum}>Min: ₱10,000</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          </TouchableOpacity>

          {/* Mutual Funds */}
          <TouchableOpacity style={styles.investmentCard}>
            <View style={styles.investmentIconContainer}>
              <Ionicons name="pie-chart" size={28} color="#007AFF" />
            </View>
            <Text style={styles.investmentTitle}>Mutual Funds</Text>
            <Text style={styles.investmentDescription}>Diversified portfolio managed by experts</Text>
            <View style={styles.investmentDetails}>
              <Text style={styles.investmentRate}>8-12% p.a.</Text>
              <Text style={styles.investmentRisk}>Medium Risk</Text>
            </View>
            <View style={styles.investmentFooter}>
              <Text style={styles.investmentMinimum}>Min: ₱5,000</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          </TouchableOpacity>

          {/* Stocks */}
          <TouchableOpacity style={styles.investmentCard}>
            <View style={styles.investmentIconContainer}>
              <Ionicons name="trending-up" size={28} color="#FF3B30" />
            </View>
            <Text style={styles.investmentTitle}>Stocks</Text>
            <Text style={styles.investmentDescription}>Direct equity investment in companies</Text>
            <View style={styles.investmentDetails}>
              <Text style={styles.investmentRate}>Variable</Text>
              <Text style={styles.investmentRisk}>High Risk</Text>
            </View>
            <View style={styles.investmentFooter}>
              <Text style={styles.investmentMinimum}>Min: ₱1,000</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          </TouchableOpacity>

          {/* High-Yield Savings */}
          <TouchableOpacity style={styles.investmentCard}>
            <View style={styles.investmentIconContainer}>
              <Ionicons name="wallet" size={28} color="#FFBD00" />
            </View>
            <Text style={styles.investmentTitle}>High-Yield Savings</Text>
            <Text style={styles.investmentDescription}>Enhanced savings with better interest rates</Text>
            <View style={styles.investmentDetails}>
              <Text style={styles.investmentRate}>3.0% p.a.</Text>
              <Text style={styles.investmentRisk}>No Risk</Text>
            </View>
            <View style={styles.investmentFooter}>
              <Text style={styles.investmentMinimum}>Min: ₱1,000</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Educational Section */}
        <View style={styles.educationSection}>
          <View style={styles.educationHeader}>
            <Ionicons name="bulb" size={24} color="#FFBD00" />
            <Text style={styles.educationTitle}>Learn & Invest</Text>
          </View>
          <Text style={styles.educationDescription}>
            New to investing? Access our educational resources and start your investment journey with confidence.
          </Text>
          <TouchableOpacity style={styles.educationButton}>
            <Text style={styles.educationButtonText}>Explore Learning Center</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFBD00" />
          </TouchableOpacity>
        </View>

        {/* Risk Disclaimer */}
        <View style={styles.disclaimerSection}>
          <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
          <Text style={styles.disclaimerText}>
            Investments are subject to market risks. Please read all scheme-related documents carefully before investing.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  portfolioCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  portfolioIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  portfolioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  portfolioValue: {
    alignItems: 'center',
    marginBottom: 24,
  },
  portfolioLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  portfolioAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  portfolioGrowth: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  portfolioActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  portfolioActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
  },
  portfolioActionText: {
    fontSize: 14,
    color: '#FFBD00',
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  investmentGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  investmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  investmentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  investmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  investmentDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  investmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  investmentRate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFBD00',
  },
  investmentRisk: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  investmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  investmentMinimum: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  educationSection: {
    marginHorizontal: 20,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 20,
    marginTop: 32,
    marginBottom: 24,
  },
  educationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  educationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 12,
  },
  educationDescription: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 16,
  },
  educationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  educationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFBD00',
  },
  disclaimerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default InvestScreen;