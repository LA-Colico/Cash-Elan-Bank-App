import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

interface PaymentEntry {
  id: string;
  amountDue: number;
  dueDate: string;
  interestPay: string;
  status?: 'pending' | 'paid';
  paidDate?: string;
}

interface LoanData {
  id: string;
  loanAmount?: number;
  purpose?: string;
  tenureMonths?: number;
  emiAmount?: number;
  nextDueDate?: string;
  disbursementDate?: string;
  interestRate?: number;
  totalPayable?: number;
  totalPaid?: number;
  status?: 'active' | 'completed' | 'overdue' | 'pending';
  accountNumber?: string;
  balanceRemaining?: number;
  paymentPercentage?: number;
}

interface UserData {
  id?: string;
  name?: string;
  deposit?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
  accountNumber?: string;
}

const formatCurrency = (amount: number | string | undefined) => {
  if (amount === undefined || amount === null) return "₱ 0.00";
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(numAmount)) return "₱ 0.00";
  return `₱ ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numAmount)}`;
};

const LoanScreen = () => {
  const { uid } = useLocalSearchParams();
  const [activeOverdueLoans, setActiveOverdueLoans] = useState<LoanData[]>([]);
  const [pendingLoanApplications, setPendingLoanApplications] = useState<LoanData[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCombinedLoanAmount, setTotalCombinedLoanAmount] = useState<number>(0);
  const [totalCombinedBalanceRemaining, setTotalCombinedBalanceRemaining] = useState<number>(0);
  const [overallPaymentPercentage, setOverallPaymentPercentage] = useState<number>(0);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const userInfoCollectionRef = collection(db, `users/${userId}/userInfo`);
      const userInfoQuerySnapshot = await getDocs(userInfoCollectionRef);
      if (!userInfoQuerySnapshot.empty) {
        const userInfoDoc = userInfoQuerySnapshot.docs[0];
        setUserData({
          id: userInfoDoc.id,
          accountNumber: userInfoDoc.id,
          ...userInfoDoc.data() as UserData,
        });
      } else {
        setUserData({ name: 'User', accountNumber: 'N/A' });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError('Failed to load user information.');
    }
  }, []);

  const fetchLoanData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const loansCollectionRef = collection(db, `users/${userId}/loanApplications`);
      const querySnapshot = await getDocs(loansCollectionRef);

      let tempActiveOverdueLoans: LoanData[] = [];
      let tempPendingLoanApplications: LoanData[] = [];
      let currentCombinedLoanAmount = 0;
      let currentCombinedBalanceRemaining = 0;
      let currentTotalPaidAcrossAllLoans = 0;
      let currentTotalPayableAcrossAllLoans = 0;

      if (!querySnapshot.empty) {
        querySnapshot.docs.forEach((doc) => {
          const loan = { id: doc.id, ...doc.data() } as LoanData;
          if (loan.status === 'active' || loan.status === 'overdue') {
            if (loan.loanAmount) currentCombinedLoanAmount += loan.loanAmount;
            if (loan.balanceRemaining) currentCombinedBalanceRemaining += loan.balanceRemaining;
            if (loan.totalPaid) currentTotalPaidAcrossAllLoans += loan.totalPaid;
            if (loan.totalPayable) currentTotalPayableAcrossAllLoans += loan.totalPayable;
            tempActiveOverdueLoans.push(loan);
          } else if (loan.status === 'pending') {
            tempPendingLoanApplications.push(loan);
          }
        });
      }

      setActiveOverdueLoans(tempActiveOverdueLoans);
      setPendingLoanApplications(tempPendingLoanApplications);
      setTotalCombinedLoanAmount(currentCombinedLoanAmount);
      setTotalCombinedBalanceRemaining(currentCombinedBalanceRemaining);

      if (currentTotalPayableAcrossAllLoans > 0) {
        const percentage = (currentTotalPaidAcrossAllLoans / currentTotalPayableAcrossAllLoans) * 100;
        setOverallPaymentPercentage(parseFloat(percentage.toFixed(2)));
      } else {
        setOverallPaymentPercentage(0);
      }

    } catch (err) {
      console.error("Error fetching loan data:", err);
      setError('Failed to load loan details. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) {
      const userId = Array.isArray(uid) ? uid[0] : uid;
      fetchUserData(userId);
      fetchLoanData(userId);
    } else {
      setError('User ID not found. Please log in again.');
      setLoading(false);
    }
  }, [uid, fetchUserData, fetchLoanData]);

  const navigateToRequestLoan = useCallback(() => {
    router.push({ pathname: "/(tabs)/requestloan", params: { uid } });
  }, [uid]);

  const handlePayNow = useCallback((loan: { id: string }, payment: { id: string; amountDue: number; dueDate: string; interestPay: string }) => {
    if (!uid || !loan.id) {
      Alert.alert("Error", "User ID or Loan ID is missing. Cannot proceed with payment.");
      return;
    }
    router.push({
      pathname: "/(tabs)/paymentscreen",
      params: {
        uid,
        loanId: loan.id,
        amountDue: payment.amountDue.toString(),
        dueDate: payment.dueDate,
        interestPay: payment.interestPay,
      }
    });
  }, [uid, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F6B800" />
          <Text style={styles.loadingText}>Loading loan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.noLoanContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={40} color="#FF6B6B" />
          </View>
          <Text style={styles.noLoanTitle}>Something went wrong</Text>
          <Text style={styles.noLoanSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => fetchLoanData(uid as string)}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasActiveOrOverdueLoans = activeOverdueLoans.length > 0;
  const hasPendingLoans = pendingLoanApplications.length > 0;
  const hasAnyLoanData = hasActiveOrOverdueLoans || hasPendingLoans;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {!hasAnyLoanData ? (
        <View style={styles.noLoanContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={40} color="#F6B800" />
          </View>
          <Text style={styles.noLoanTitle}>No active loan</Text>
          <Text style={styles.noLoanSubtitle}>
            You currently have no active loan or pending applications. Apply for a new loan today to access the funding you need.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToRequestLoan}>
            <Text style={styles.primaryButtonText}>Apply for Loan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Hello, {userData?.name || "User"}! 👋</Text>
            <Text style={styles.subtitleText}>Manage your loans and payments</Text>
          </View>

          {hasActiveOrOverdueLoans && (
            <View style={styles.loanSummaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="wallet" size={24} color="#F6B800" />
                </View>
                <Text style={styles.summaryTitle}>Loan Summary</Text>
              </View>
              
              <View style={styles.summaryValue}>
                <Text style={styles.summaryLabel}>Total Loan Amount</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(totalCombinedLoanAmount)}</Text>
              </View>

              <View style={styles.summaryDetails}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryDetailLabel}>Balance Remaining</Text>
                  <Text style={styles.summaryDetailValue}>{formatCurrency(totalCombinedBalanceRemaining)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryDetailLabel}>Payment Progress</Text>
                  <Text style={styles.summaryDetailValue}>{overallPaymentPercentage || 0}%</Text>
                </View>
              </View>

              <View style={styles.summaryActions}>
                <TouchableOpacity style={styles.summaryActionButton}>
                  <Ionicons name="analytics-outline" size={16} color="#F6B800" />
                  <Text style={styles.summaryActionText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.summaryActionButton}>
                  <Ionicons name="calendar-outline" size={16} color="#F6B800" />
                  <Text style={styles.summaryActionText}>Payment Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {hasActiveOrOverdueLoans && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Loans</Text>
                <Text style={styles.sectionSubtitle}>Your current loan obligations</Text>
              </View>

              <View style={styles.loansGrid}>
                {activeOverdueLoans.map((loan) => (
                  <View key={`loan-${loan.id}`} style={styles.loanCard}>
                    <View style={styles.loanHeader}>
                      <View style={styles.loanIconContainer}>
                        <Ionicons name="card" size={24} color="#F6B800" />
                      </View>
                      <View style={styles.loanHeaderText}>
                        <Text style={styles.loanTitle}>{loan.purpose || 'Personal Loan'}</Text>
                        <View style={[
                          styles.statusBadge,
                          loan.status === 'overdue' ? styles.overdueBadge : styles.activeBadge
                        ]}>
                          <Text style={[
                            styles.statusText,
                            loan.status === 'overdue' ? styles.overdueText : styles.activeText
                          ]}>
                            {loan.status === 'overdue' ? 'Overdue' : 'Active'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.loanDetails}>
                      <View style={styles.loanDetailRow}>
                        <Text style={styles.loanDetailLabel}>Loan Amount</Text>
                        <Text style={styles.loanDetailValue}>{formatCurrency(loan.loanAmount)}</Text>
                      </View>
                      <View style={styles.loanDetailRow}>
                        <Text style={styles.loanDetailLabel}>Interest Rate</Text>
                        <Text style={styles.loanDetailValue}>
                          {loan.interestRate !== undefined && loan.interestRate !== null
                            ? `${(loan.interestRate * 100).toFixed(1)}%`
                            : 'N/A'}
                        </Text>
                      </View>
                      {loan.nextDueDate && (
                        <View style={styles.loanDetailRow}>
                          <Text style={styles.loanDetailLabel}>Next Due Date</Text>
                          <Text style={styles.loanDetailValue}>{loan.nextDueDate}</Text>
                        </View>
                      )}
                      {loan.emiAmount && (
                        <View style={styles.loanDetailRow}>
                          <Text style={styles.loanDetailLabel}>EMI Amount</Text>
                          <Text style={styles.loanDetailValue}>{formatCurrency(loan.emiAmount)}</Text>
                        </View>
                      )}
                    </View>

                    {loan.nextDueDate && (
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => {
                          if (loan.nextDueDate) {
                            handlePayNow(
                              { id: loan.id }, 
                              { 
                                id: 'nextPayment', 
                                amountDue: loan.emiAmount || 0, 
                                dueDate: loan.nextDueDate, 
                                interestPay: loan.interestRate?.toString() || '0' 
                              }
                            );
                          }
                        }}
                      >
                        <Text style={styles.payButtonText}>Pay Now</Text>
                        <Ionicons name="chevron-forward" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          {hasPendingLoans && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Applications</Text>
                <Text style={styles.sectionSubtitle}>Applications under review</Text>
              </View>

              <View style={styles.pendingGrid}>
                {pendingLoanApplications.map((loan) => (
                  <View key={`loan-pending-${loan.id}`} style={styles.pendingCard}>
                    <View style={styles.pendingHeader}>
                      <View style={styles.pendingIconContainer}>
                        <Ionicons name="time" size={20} color="#F6B800" />
                      </View>
                      <Text style={styles.pendingTitle}>Under Review</Text>
                    </View>
                    
                    <View style={styles.pendingDetails}>
                      <View style={styles.pendingDetailRow}>
                        <Text style={styles.pendingDetailLabel}>Purpose</Text>
                        <Text style={styles.pendingDetailValue}>{loan.purpose || 'N/A'}</Text>
                      </View>
                      <View style={styles.pendingDetailRow}>
                        <Text style={styles.pendingDetailLabel}>Amount</Text>
                        <Text style={styles.pendingDetailValue}>{formatCurrency(loan.loanAmount)}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.pendingSubtext}>
                      Your loan application is under review. We'll notify you within 1-3 business days.
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Educational Section */}
          <View style={styles.educationSection}>
            <View style={styles.educationHeader}>
              <Ionicons name="bulb" size={24} color="#F6B800" />
              <Text style={styles.educationTitle}>Need Another Loan?</Text>
            </View>
            <Text style={styles.educationDescription}>
              Apply for additional funding to meet your financial goals. Our competitive rates and flexible terms make borrowing simple.
            </Text>
            <TouchableOpacity style={styles.educationButton} onPress={navigateToRequestLoan}>
              <Text style={styles.educationButtonText}>Apply for New Loan</Text>
              <Ionicons name="chevron-forward" size={16} color="#F6B800" />
            </TouchableOpacity>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  noLoanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f8f9fa',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noLoanTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  noLoanSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#F6B800',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 200,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  loanSummaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  summaryValue: {
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  summaryDetails: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryDetailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F6B800',
  },
  summaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
  },
  summaryActionText: {
    fontSize: 14,
    color: '#F6B800',
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
  loansGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  loanCard: {
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
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loanIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loanHeaderText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#E8F5E8',
  },
  overdueBadge: {
    backgroundColor: '#FFE8E8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#4CAF50',
  },
  overdueText: {
    color: '#FF6B6B',
  },
  loanDetails: {
    marginBottom: 20,
  },
  loanDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loanDetailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  loanDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  payButton: {
    backgroundColor: '#F6B800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  pendingGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  pendingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F6B800',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  pendingDetails: {
    marginBottom: 12,
  },
  pendingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingDetailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  pendingDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  pendingSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
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
    color: '#F6B800',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default LoanScreen;