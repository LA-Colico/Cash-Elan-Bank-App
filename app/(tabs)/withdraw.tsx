import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';
import QRCode from 'react-native-qrcode-svg';

// User data interface
interface UserData {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  balance?: number;
  email?: string;
  mobile?: string;
  accountNumber?: string;
}

const WithdrawFlow = () => {
  const { uid } = useLocalSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedATM, setSelectedATM] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [serviceFee, setServiceFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const qrRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, [uid]);

  // Calculate service fee whenever withdraw amount changes
  useEffect(() => {
    if (withdrawAmount && parseFloat(withdrawAmount) > 0) {
      const amount = parseFloat(withdrawAmount);
      // Service fee calculation: ₱20 flat fee for partner stores, ₱15 for ATMs
      let fee = selectedOption === 'atm' ? 15 : 20;
      setServiceFee(fee);
      setTotalAmount(amount); // Total withdrawn is just the amount (fee is deducted from account)
    } else {
      setServiceFee(0);
      setTotalAmount(0);
    }
  }, [withdrawAmount, selectedOption]);

  const fetchUserData = async () => {
    if (typeof uid === "string") {
      try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserData({ id: userDocSnap.id, ...userDocSnap.data() } as UserData);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    }
  };

  const getDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userData?.name || "User";
  };

  const getMaskedAccountNumber = () => {
    if (userData?.accountNumber) {
      return `••• ••• ••• ${userData.accountNumber.slice(-4)}`;
    }
    return userData?.id ? `••• ••• ••• ${userData.id.slice(-4)}` : "••• ••• ••• ••••";
  };

  const getAvailableBalance = () => {
    return userData?.balance || 0;
  };

  const getQRData = () => {
    return JSON.stringify({
      type: 'CASH_ELAN_WITHDRAW',
      accountNumber: userData?.accountNumber || userData?.id,
      name: getDisplayName(),
      partner: selectedPartner?.name || selectedATM?.name,
      bank: 'CASH ELAN',
      withdrawAmount: withdrawAmount,
      serviceFee: serviceFee.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      timestamp: Date.now()
    });
  };

  // Recent partners data (mock data)
  const recentPartners = [
    { name: '7-Eleven', icon: 'storefront' },
    { name: 'SM Store', icon: 'storefront' },
    { name: 'Robinson Supermarket', icon: 'storefront' },
  ];

  // Partner stores for Cash Pickup
  const partnerStores = [
    { name: 'Robinson Supermarket', icon: 'storefront', color: '#FFBD00' },
    { name: '7-Eleven', icon: 'storefront', color: '#FFBD00' },
    { name: 'SM Store', icon: 'storefront', color: '#FFBD00' },
    { name: 'Puregold', icon: 'storefront', color: '#FFBD00' },
    { name: 'Ministop', icon: 'storefront', color: '#FFBD00' },
    { name: 'FamilyMart', icon: 'storefront', color: '#FFBD00' },
    { name: 'Cebuana Lhuillier', icon: 'storefront', color: '#FFBD00' },
    { name: 'M Lhuillier', icon: 'storefront', color: '#FFBD00' },
  ];

  // ATM Networks
  const atmNetworks = [
    { name: 'BancNet ATM', logo: '🏧', color: '#FFBD00', fullName: 'BancNet ATM Network' },
    { name: 'Megalink ATM', logo: '🏧', color: '#FFBD00', fullName: 'Megalink ATM Network' },
    { name: 'ExpressPay ATM', logo: '🏧', color: '#FFBD00', fullName: 'ExpressPay ATM Network' },
    { name: 'UnionBank ATM', logo: '🏧', color: '#FFBD00', fullName: 'UnionBank ATM' },
    { name: 'BPI ATM', logo: '🏧', color: '#FFBD00', fullName: 'BPI ATM Network' },
    { name: 'Security Bank ATM', logo: '🏧', color: '#FFBD00', fullName: 'Security Bank ATM' },
  ];

  // Handle option selection on first page
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    
    if (option === 'partner') {
      setCurrentPage(2); // Go to partner selection
    } else if (option === 'atm') {
      setCurrentPage(3); // Go to ATM selection
    }
  };

  // Handle partner store selection
  const handlePartnerSelect = (partner) => {
    setSelectedPartner(partner);
    setCurrentPage(4); // Go to amount input page
  };

  // Handle ATM selection
  const handleATMSelect = (atm) => {
    setSelectedATM(atm);
    setCurrentPage(6); // Go to ATM instructions
  };

  // Handle amount confirmation
  const handleAmountConfirm = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    if (parseFloat(withdrawAmount) < 50) {
      Alert.alert('Minimum Amount', 'Minimum withdrawal amount is ₱100.');
      return;
    }

    if (parseFloat(withdrawAmount) > 20000) {
      Alert.alert('Maximum Amount', 'Maximum withdrawal amount is ₱20,000 per transaction.');
      return;
    }

    const totalWithFee = parseFloat(withdrawAmount) + serviceFee;
    if (totalWithFee > getAvailableBalance()) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance for this withdrawal including fees.');
      return;
    }

    setCurrentPage(5); // Go to QR code page
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // Page 1: Main withdrawal options
  const renderMainPage = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Balance Display */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(getAvailableBalance())}</Text>
        </View>

        <Text style={styles.sectionTitle}>How to Cash Out</Text>

        {/* Partner Stores */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleOptionSelect('partner')}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#FFF8E1' }]}>
            <Ionicons name="storefront" size={24} color="#FFBD00" />
          </View>
          <View style={styles.optionDetails}>
            <Text style={styles.optionTitle}>Partner Stores</Text>
            <Text style={styles.optionSubtitle}>Cash pickup at convenience stores</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* ATM Networks */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleOptionSelect('atm')}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#FFF8E1' }]}>
            <Ionicons name="card" size={24} color="#FFBD00" />
          </View>
          <View style={styles.optionDetails}>
            <Text style={styles.optionTitle}>ATM Networks</Text>
            <Text style={styles.optionSubtitle}>Withdraw from partner ATMs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Recent Partners */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Withdrawals</Text>
          <Text style={styles.recentSubtitle}>
            Partners you've recently used for cash withdrawals will appear here.
          </Text>
          
          {recentPartners.length > 0 ? (
            <View style={styles.recentPartners}>
              {recentPartners.map((partner, index) => (
                <TouchableOpacity key={index} style={styles.recentPartnerItem}>
                  <View style={styles.recentPartnerIcon}>
                    <Ionicons name={partner.icon} size={16} color="#FFBD00" />
                  </View>
                  <Text style={styles.recentPartnerName}>{partner.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyRecent}>
              <Text style={styles.emptyRecentText}>No recent withdrawals</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  // Page 2: Partner store selection
  const renderPartnerSelection = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(1)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash Pickup</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Partner Stores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>ATM Networks</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bankSection}>
          <View style={styles.bankSectionHeader}>
            <Text style={styles.bankSectionTitle}>Cash Pickup Locations</Text>
            <Text style={styles.bankSectionSubtitle}>
              Present your QR code to collect cash at these partner stores.
            </Text>
          </View>

          {partnerStores.map((store, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bankItem}
              onPress={() => handlePartnerSelect(store)}
            >
              <View style={[styles.bankLogo, { backgroundColor: store.color + '20' }]}>
                <Ionicons name={store.icon} size={24} color={store.color} />
              </View>
              <Text style={styles.bankName}>{store.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Page 3: ATM selection
  const renderATMSelection = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(1)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ATM Withdrawal</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Partner Stores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>ATM Networks</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bankSection}>
          <View style={styles.bankSectionHeader}>
            <Text style={styles.bankSectionTitle}>Partner ATM Networks</Text>
            <Text style={styles.bankSectionSubtitle}>
              Use your Cash Elan card at these ATM networks.
            </Text>
          </View>

          {atmNetworks.map((atm, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bankItem}
              onPress={() => handleATMSelect(atm)}
            >
              <View style={[styles.bankLogo, { backgroundColor: atm.color + '20' }]}>
                <Text style={[styles.bankLogoText, { color: atm.color }]}>{atm.name.split(' ')[0]}</Text>
              </View>
              <Text style={styles.bankName}>{atm.fullName}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Page 4: Amount Input
  const renderAmountInput = () => (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(2)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdrawal Amount</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.amountSection}>
          <View style={styles.partnerHeader}>
            <View style={[styles.partnerLogo, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name={selectedPartner?.icon} size={32} color="#FFBD00" />
            </View>
            <Text style={styles.partnerTitle}>Cash pickup via {selectedPartner?.name}</Text>
          </View>

          {/* Balance reminder */}
          <View style={styles.balanceReminder}>
            <Text style={styles.balanceReminderText}>
              Available: {formatCurrency(getAvailableBalance())}
            </Text>
          </View>

          <View style={styles.amountInputContainer}>
            <Text style={styles.amountLabel}>Enter amount to withdraw</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                style={styles.amountInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="0.00"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                maxLength={8}
              />
            </View>

            <View style={styles.amountLimits}>
              <Text style={styles.limitText}>Min: ₱100 • Max: ₱20,000</Text>
            </View>
          </View>

          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
            <View style={styles.feeBreakdown}>
              <Text style={styles.feeTitle}>Transaction Summary</Text>
              
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Withdrawal Amount</Text>
                <Text style={styles.feeValue}>{formatCurrency(parseFloat(withdrawAmount))}</Text>
              </View>
              
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Service Fee</Text>
                <Text style={styles.feeValue}>{formatCurrency(serviceFee)}</Text>
              </View>
              
              <View style={styles.feeSeparator} />
              
              <View style={styles.feeRow}>
                <Text style={styles.totalLabel}>You'll Receive</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
              </View>

              <View style={styles.feeRow}>
                <Text style={styles.totalLabel}>Total Deducted</Text>
                <Text style={styles.deductedValue}>{formatCurrency(parseFloat(withdrawAmount) + serviceFee)}</Text>
              </View>

              <View style={styles.feeInfo}>
                <Ionicons name="information-circle" size={16} color="#8E8E93" />
                <Text style={styles.feeInfoText}>
                  Service fee: ₱{serviceFee} will be deducted from your account
                </Text>
              </View>
            </View>
          )}

          <View style={styles.quickAmounts}>
            <Text style={styles.quickAmountsTitle}>Quick amounts</Text>
            <View style={styles.quickAmountButtons}>
              {[500, 1000, 2000, 5000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAmountButton,
                    withdrawAmount === amount.toString() && styles.quickAmountButtonActive
                  ]}
                  onPress={() => setWithdrawAmount(amount.toString())}
                >
                  <Text style={[
                    styles.quickAmountText,
                    withdrawAmount === amount.toString() && styles.quickAmountTextActive
                  ]}>
                    ₱{amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!withdrawAmount || parseFloat(withdrawAmount) <= 0) && styles.continueButtonDisabled
          ]}
          onPress={handleAmountConfirm}
          disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
        >
          <Text style={[
            styles.continueButtonText,
            (!withdrawAmount || parseFloat(withdrawAmount) <= 0) && styles.continueButtonTextDisabled
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // Page 5: QR Code for cash pickup
  const renderQRCodePage = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(4)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdrawal QR Code</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.qrSection}>
          <View style={styles.qrHeader}>
            <View style={[styles.partnerLogo, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name={selectedPartner?.icon} size={32} color="#FFBD00" />
            </View>
            <Text style={styles.qrTitle}>Cash pickup via {selectedPartner?.name}</Text>
            <Text style={styles.qrSubtitle}>
              Withdraw {formatCurrency(parseFloat(withdrawAmount))} (₱{serviceFee} fee applies)
            </Text>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to withdraw cash:</Text>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1.</Text>
                <Text style={styles.instructionText}>
                  Go to any {selectedPartner?.name} store near you
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2.</Text>
                <Text style={styles.instructionText}>
                  Show this QR code to the cashier
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3.</Text>
                <Text style={styles.instructionText}>
                  Present a valid ID for verification
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>4.</Text>
                <Text style={styles.instructionText}>
                  Receive your cash: {formatCurrency(totalAmount)}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>5.</Text>
                <Text style={styles.instructionText}>
                  Keep the receipt for your records
                </Text>
              </View>
            </View>
          </View>

          {/* QR Code Card */}
          <View style={styles.qrCardContainer}>
            <View style={styles.qrCard} ref={qrRef}>
              <View style={styles.qrCardHeader}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>₽</Text>
                  </View>
                </View>
                <Text style={styles.qrBankName}>CASH ELAN</Text>
              </View>

              <Text style={styles.accountHolderName}>{getDisplayName()}</Text>
              <Text style={styles.accountDetails}>
                ACCOUNT NUMBER - {getMaskedAccountNumber()}
              </Text>

              <View style={styles.qrCodeContainer}>
                <View style={styles.qrMainCard}>
                  <QRCode
                    value={getQRData()}
                    size={180}
                    backgroundColor="white"
                    color="black"
                  />
                  <View style={styles.qrOverlay}>
                    <View style={styles.instaPay}>
                      <Text style={styles.instaPayText}>Cash</Text>
                      <Text style={styles.payText}>Elan</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.amountCard}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Withdraw Amount</Text>
                    <Text style={styles.amountValue}>{formatCurrency(parseFloat(withdrawAmount))}</Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Service Fee</Text>
                    <Text style={styles.amountValue}>{formatCurrency(serviceFee)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>You'll Receive</Text>
                    <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.qrFooter}>
                <Text style={styles.qrFooterText}>Show this QR code and valid ID to collect cash</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share" size={20} color="#1C1C1E" />
                <Text style={styles.buttonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton}>
                <Ionicons name="download" size={20} color="#1C1C1E" />
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Page 6: ATM instructions
  const renderATMInstructions = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(3)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ATM Withdrawal</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.atmInstructionsSection}>
          {/* Enhanced ATM Header */}
          <View style={styles.enhancedBankHeader}>
            <View style={styles.bankHeaderCard}>
              <View style={styles.bankHeaderTop}>
                <View style={[styles.enhancedBankLogo, { backgroundColor: selectedATM?.color + '15' }]}>
                  <Text style={[styles.enhancedBankLogoText, { color: selectedATM?.color }]}>
                    ATM
                  </Text>
                </View>
                <View style={styles.bankHeaderInfo}>
                  <Text style={styles.enhancedBankTitle}>{selectedATM?.fullName}</Text>
                  <Text style={styles.bankSubtitle}>Cash Withdrawal</Text>
                </View>
              </View>
              
              <View style={styles.transferInfoCard}>
                <View style={styles.transferInfoRow}>
                  <Text style={styles.transferInfoLabel}>Network</Text>
                  <Text style={styles.transferInfoValue}>{selectedATM?.name}</Text>
                </View>
                <View style={styles.transferInfoRow}>
                  <Text style={styles.transferInfoLabel}>Service Available</Text>
                  <Text style={styles.transferInfoValue}>24/7</Text>
                </View>
                <View style={styles.transferInfoRow}>
                  <Text style={styles.transferInfoLabel}>Withdrawal Fee</Text>
                  <Text style={styles.transferInfoValue}>₱15</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced Step-by-Step Instructions */}
          <View style={styles.enhancedInstructionsContainer}>
            <Text style={styles.enhancedInstructionsTitle}>How to Withdraw</Text>
            
            <View style={styles.enhancedInstructionsList}>
              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Find a Partner ATM</Text>
                  <Text style={styles.stepDescription}>
                    Locate any {selectedATM?.name} near you
                  </Text>
                  <View style={styles.stepTip}>
                    <Ionicons name="location" size={14} color="#FFBD00" />
                    <Text style={styles.stepTipText}>Use our ATM locator in the app</Text>
                  </View>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Insert Your Cash Elan Card</Text>
                  <Text style={styles.stepDescription}>
                    Insert your Cash Elan debit card into the ATM
                  </Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Enter Your PIN</Text>
                  <Text style={styles.stepDescription}>
                    Enter your 4-digit PIN number
                  </Text>
                  <View style={styles.stepWarning}>
                    <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
                    <Text style={styles.stepWarningText}>Never share your PIN with anyone</Text>
                  </View>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Select Withdrawal</Text>
                  <Text style={styles.stepDescription}>
                    Choose "Cash Withdrawal" from the menu options
                  </Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>5</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Enter Amount & Confirm</Text>
                  <Text style={styles.stepDescription}>
                    Enter your desired amount and confirm the transaction
                  </Text>
                  <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Daily Limit:</Text>
                      <Text style={styles.detailValue}>₱20,000</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fee per transaction:</Text>
                      <Text style={styles.detailValue}>₱15</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced Fee Information */}
          <View style={styles.enhancedFeeContainer}>
            <View style={styles.feeHeader}>
              <Ionicons name="card" size={20} color="#FFBD00" />
              <Text style={styles.feeHeaderText}>ATM Fees & Limits</Text>
            </View>
            <View style={styles.feeContent}>
              <View style={styles.feeItem}>
                <Text style={styles.feeItemLabel}>Withdrawal Fee</Text>
                <Text style={styles.feeItemValue}>₱15 per transaction</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeItemLabel}>Daily Limit</Text>
                <Text style={styles.feeItemValue}>₱20,000</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeItemLabel}>Service Hours</Text>
                <Text style={styles.feeItemValue}>24/7</Text>
              </View>
            </View>
            <Text style={styles.feeNote}>
              * Additional fees may apply depending on the ATM operator. Please check the ATM screen for current rates.
            </Text>
          </View>

          {/* Enhanced Action Buttons */}
          <View style={styles.enhancedActionButtons}>
            <TouchableOpacity style={styles.primaryActionButton}>
              <Ionicons name="location" size={20} color="#1C1C1E" />
              <Text style={styles.primaryActionButtonText}>Find ATM Locations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryActionButton}>
              <Ionicons name="help-circle" size={18} color="#FFBD00" />
              <Text style={styles.secondaryActionButtonText}>Get Help</Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <View style={styles.helpHeader}>
              <Ionicons name="help-circle" size={18} color="#8E8E93" />
              <Text style={styles.helpHeaderText}>Need Help?</Text>
            </View>
            <Text style={styles.helpDescription}>
              If you encounter any issues at the ATM or need assistance, contact our 24/7 customer support hotline.
            </Text>
            <TouchableOpacity style={styles.helpButton}>
              <Ionicons name="call" size={16} color="#FFBD00" />
              <Text style={styles.helpButtonText}>Call Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {currentPage === 1 && renderMainPage()}
      {currentPage === 2 && renderPartnerSelection()}
      {currentPage === 3 && renderATMSelection()}
      {currentPage === 4 && renderAmountInput()}
      {currentPage === 5 && renderQRCodePage()}
      {currentPage === 6 && renderATMInstructions()}
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FFBD00',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFBD00',
  },
  
  // Option cards (main page)
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionDetails: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  
  // Recent partners section
  recentSection: {
    marginTop: 30,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  recentSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 15,
  },
  recentPartners: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentPartnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  recentPartnerIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  recentPartnerName: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyRecentText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  
  // Tab container
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  
  // Bank sections
  bankSection: {
    marginBottom: 25,
  },
  bankSectionHeader: {
    marginBottom: 15,
  },
  bankSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  bankSectionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bankLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankLogoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bankName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },

  // Amount Input Section
  amountSection: {
    flex: 1,
  },
  partnerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  partnerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  partnerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  balanceReminder: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFBD00',
  },
  balanceReminderText: {
    fontSize: 14,
    color: '#1C1C1E',
    textAlign: 'center',
    fontWeight: '500',
  },
  amountInputContainer: {
    marginBottom: 30,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 15,
    textAlign: 'center',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    minWidth: 150,
    borderBottomWidth: 2,
    borderBottomColor: '#FFBD00',
    paddingVertical: 10,
  },
  amountLimits: {
    alignItems: 'center',
  },
  limitText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  feeBreakdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feeLabel: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  feeSeparator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  deductedValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  feeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  feeInfoText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6,
    flex: 1,
  },
  quickAmounts: {
    marginBottom: 20,
  },
  quickAmountsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAmountButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  quickAmountButtonActive: {
    backgroundColor: '#FFBD00',
    borderColor: '#FFBD00',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  quickAmountTextActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  continueButton: {
    backgroundColor: '#FFBD00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  continueButtonTextDisabled: {
    color: '#8E8E93',
  },
  
  // QR Code section
  qrSection: {
    alignItems: 'center',
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFBD00',
    marginRight: 8,
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },

  // QR Code Card
  qrCardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 30,
    width: '100%',
    maxWidth: 350,
  },
  qrCardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFBD00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  qrBankName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 2,
  },
  accountHolderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  accountDetails: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  qrMainCard: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  qrOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -12 }],
  },
  instaPay: {
    backgroundColor: '#FFBD00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
  },
  instaPayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  payText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  amountCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  qrFooter: {
    alignItems: 'center',
  },
  qrFooterText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 350,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#FFBD00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#FFBD00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
  },
  buttonText: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // ATM Instructions (Enhanced)
  atmInstructionsSection: {
    width: '100%',
  },
  
  // Enhanced Bank Header
  enhancedBankHeader: {
    marginBottom: 30,
  },
  bankHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  bankHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  enhancedBankLogo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  enhancedBankLogoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bankHeaderInfo: {
    flex: 1,
  },
  enhancedBankTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  bankSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  transferInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  transferInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transferInfoLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  transferInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  // Enhanced Instructions
  enhancedInstructionsContainer: {
    marginBottom: 30,
  },
  enhancedInstructionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  enhancedInstructionsList: {
    gap: 0,
  },
  enhancedInstructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  stepNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFBD00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 12,
  },
  stepTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFBD00',
  },
  stepTipText: {
    fontSize: 12,
    color: '#1C1C1E',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  stepWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  stepWarningText: {
    fontSize: 12,
    color: '#15803D',
    marginLeft: 6,
    fontWeight: '500',
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E5EA',
    marginLeft: 38,
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'right',
  },

  // Enhanced Fee Container
  enhancedFeeContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  feeHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  feeContent: {
    marginBottom: 16,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  feeItemLabel: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  feeItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFBD00',
  },
  feeNote: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Enhanced Action Buttons
  enhancedActionButtons: {
    gap: 12,
    marginBottom: 30,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFBD00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFBD00',
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFBD00',
    marginLeft: 6,
  },

  // Help Section
  helpSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 8,
  },
  helpDescription: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFBD00',
    alignSelf: 'flex-start',
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFBD00',
    marginLeft: 6,
  },
});

export default WithdrawFlow;