import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

interface DropdownOption {
  label: string;
  value: string;
}

const RequestLoanScreen = () => {
  const { uid, accountNumber } = useLocalSearchParams();
  const router = useRouter();

  // Form states
  const [loanAmount, setLoanAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loanDuration, setLoanDuration] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPurposeDropdown, setShowPurposeDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState(false);
  
  // Add state for user account number
  const [userAccountNumber, setUserAccountNumber] = useState('');

  // Fetch user account number if not provided
  useEffect(() => {
    const fetchUserAccountNumber = async () => {
      if (accountNumber) {
        setUserAccountNumber(accountNumber as string);
      } else if (uid) {
        try {
          // Fetch the user's account number from Firebase
          const userInfoCollectionRef = collection(db, "users", uid as string, "userInfo");
          const querySnapshot = await getDocs(userInfoCollectionRef);
          
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            setUserAccountNumber(firstDoc.id); // Document ID is the account number
          } else {
            console.log("No user info documents found");
            Alert.alert("Error", "Unable to find your account information. Please try again.");
          }
        } catch (error) {
          console.error("Error fetching user account number:", error);
          Alert.alert("Error", "Unable to fetch account information. Please try again.");
        }
      }
    };

    fetchUserAccountNumber();
  }, [uid, accountNumber]);

  // Dropdown options (same as before)
  const purposeOptions: DropdownOption[] = [
    { label: 'Personal Loan', value: 'Personal Loan' },
    { label: 'Home Improvement', value: 'Home Improvement' },
    { label: 'Education', value: 'Education' },
    { label: 'Medical Emergency', value: 'Medical Emergency' },
    { label: 'Business', value: 'Business' },
    { label: 'Car Purchase', value: 'Car Purchase' },
    { label: 'Debt Consolidation', value: 'Debt Consolidation' },
    { label: 'Other', value: 'Other' },
  ];

  const durationOptions: DropdownOption[] = [
    { label: '3 months', value: '3' },
    { label: '6 months', value: '6' },
    { label: '12 months', value: '12' },
    { label: '18 months', value: '18' },
    { label: '24 months', value: '24' },
    { label: '36 months', value: '36' },
    { label: '48 months', value: '48' },
  ];

  const employmentOptions: DropdownOption[] = [
    { label: 'Full-time Employee', value: 'Full-time Employee' },
    { label: 'Part-time Employee', value: 'Part-time Employee' },
    { label: 'Self-employed', value: 'Self-employed' },
    { label: 'Freelancer', value: 'Freelancer' },
    { label: 'Business Owner', value: 'Business Owner' },
    { label: 'Student', value: 'Student' },
    { label: 'Retired', value: 'Retired' },
    { label: 'Unemployed', value: 'Unemployed' },
  ];

  const calculateEMI = (amount: number, tenure: number, interestRate: number = 0.05) => {
    if (interestRate === 0) return amount / tenure;
    const r = interestRate / 12;
    const n = tenure;
    const p = amount;
    return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const handleSubmitRequest = async () => {
    setLoading(true);

    // Validation
    if (!loanAmount || !purpose || !loanDuration || !employmentStatus || !annualIncome) {
      Alert.alert("Error", "Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (!agreeToTerms) {
      Alert.alert("Error", "Please agree to the Terms & Conditions and Privacy Policy.");
      setLoading(false);
      return;
    }

    // Check if we have a valid account number
    if (!userAccountNumber) {
      Alert.alert("Error", "Unable to find your account information. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const amount = parseFloat(loanAmount);
      const tenure = parseInt(loanDuration, 10);
      const interestRate = 0.05; // 5% annual interest rate
      const emiAmount = calculateEMI(amount, tenure, interestRate);
      const totalPayable = emiAmount * tenure;

      // Store loan application in Firebase - make sure all fields have valid values
      const loanApplicationData = {
        loanAmount: amount,
        purpose: purpose,
        tenureMonths: tenure,
        annualIncome: parseFloat(annualIncome),
        employmentStatus: employmentStatus,
        emiAmount: emiAmount,
        interestRate: interestRate,
        totalPayable: totalPayable,
        status: 'pending',
        accountNumber: userAccountNumber, // Use the fetched account number
        applicationDate: new Date().toISOString(),
        disbursementDate: null,
        nextDueDate: null,
        balanceRemaining: amount,
        totalPaid: 0,
        paymentPercentage: 0,
      };

      console.log("Submitting loan application data:", loanApplicationData);

      const loanApplicationsRef = collection(db, 'users', uid as string, 'loanApplications');
      await addDoc(loanApplicationsRef, loanApplicationData);

      // Move to confirmation page
      setCurrentPage(2);
    } catch (error) {
      console.error('Error submitting loan application:', error);
      Alert.alert('Error', 'Failed to submit loan application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push({
      pathname: '/(tabs)/loanscreen',
      params: { uid },
    });
  };

  const DropdownModal = ({ 
    visible, 
    onClose, 
    options, 
    onSelect, 
    title 
  }: {
    visible: boolean;
    onClose: () => void;
    options: DropdownOption[];
    onSelect: (value: string) => void;
    title: string;
  }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.optionsList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (currentPage === 2) {
    // Confirmation Page (same as before)
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage(1)}>
              <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loan Application</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.confirmationContainer}>
            <View style={styles.clockIconContainer}>
              <View style={styles.clockIcon}>
                <Ionicons name="time-outline" size={40} color="#1C1C1E" />
              </View>
            </View>

            <Text style={styles.confirmationTitle}>Thanks for applying!</Text>
            <Text style={styles.confirmationSubtitle}>
              Your loan application is currently under review.{'\n'}
              We'll notify you of our decision within 2-3{'\n'}
              business days. Check back here for updates.
            </Text>

            <TouchableOpacity style={styles.dashboardButton} onPress={handleBackToDashboard}>
              <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Application Form Page (rest of the component remains the same)
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Application</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Show account number for verification */}
          {userAccountNumber && (
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Account Number:</Text>
              <Text style={styles.accountNumber}>{userAccountNumber}</Text>
            </View>
          )}

          {/* Loan Amount */}
          <Text style={styles.sectionLabel}>Loan Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>PHP</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter loan amount"
              placeholderTextColor="#8E8E93"
              value={loanAmount}
              onChangeText={setLoanAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Purpose */}
          <Text style={styles.sectionLabel}>Purpose</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowPurposeDropdown(true)}
          >
            <Text style={[styles.dropdownText, !purpose && styles.placeholderText]}>
              {purpose || 'Select your purpose'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          {/* Loan Duration */}
          <Text style={styles.sectionLabel}>Loan Duration</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDurationDropdown(true)}
          >
            <Text style={[styles.dropdownText, !loanDuration && styles.placeholderText]}>
              {loanDuration ? durationOptions.find(opt => opt.value === loanDuration)?.label : 'Select loan term'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          {/* Employment Status */}
          <Text style={styles.sectionLabel}>Employment Status</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowEmploymentDropdown(true)}
          >
            <Text style={[styles.dropdownText, !employmentStatus && styles.placeholderText]}>
              {employmentStatus || 'Select your employment status'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          {/* Annual Income */}
          <Text style={styles.sectionLabel}>Annual Income</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>PHP</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter annual income"
              placeholderTextColor="#8E8E93"
              value={annualIncome}
              onChangeText={setAnnualIncome}
              keyboardType="numeric"
            />
          </View>

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
              {agreeToTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxText}>
              Yes, I agree to the{' '}
              <Text style={styles.linkText}>Terms & Conditions</Text>
              {' '}and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Modals */}
        <DropdownModal
          visible={showPurposeDropdown}
          onClose={() => setShowPurposeDropdown(false)}
          options={purposeOptions}
          onSelect={setPurpose}
          title="Select Purpose"
        />

        <DropdownModal
          visible={showDurationDropdown}
          onClose={() => setShowDurationDropdown(false)}
          options={durationOptions}
          onSelect={setLoanDuration}
          title="Select Loan Duration"
        />

        <DropdownModal
          visible={showEmploymentDropdown}
          onClose={() => setShowEmploymentDropdown(false)}
          options={employmentOptions}
          onSelect={setEmploymentStatus}
          title="Select Employment Status"
        />

        {/* Submit Button with adjusted width */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmitRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 120,
    marginTop: 20,
  },
  // Add styles for account info display
  accountInfo: {
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  accountNumber: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1C1C1E',
  },
  dropdownButton: {
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 30,
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#8E8E93',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFBD00',
    borderColor: '#FFBD00',
  },
  checkboxText: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: '#FFBD00',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  optionText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  // Fixed submit button with adjusted width
  submitButton: {
    backgroundColor: '#FFBD00',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    maxWidth: '70%',
    alignSelf: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Confirmation page styles
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  clockIconContainer: {
    marginBottom: 40,
  },
  clockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  dashboardButton: {
    backgroundColor: '#FFBD00',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    maxWidth: '70%',
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default RequestLoanScreen;