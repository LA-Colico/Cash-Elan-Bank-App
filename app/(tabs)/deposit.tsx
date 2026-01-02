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
// @ts-ignore - QRCode library doesn't have proper TypeScript definitions
import QRCode from 'react-native-qrcode-svg';

// TypeScript declaration for require statements
declare const require: {
  (path: string): any;
};

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

// Partner interface
interface Partner {
  name: string;
  logoImage: any;
  color?: string;
}

// Bank interface
interface Bank {
  name: string;
  logoImage: any;
  color: string;
  fullName: string;
}

const DepositFlow = () => {
  const { uid } = useLocalSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [serviceFee, setServiceFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const qrRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, [uid]);

  // Calculate service fee whenever deposit amount changes
  useEffect(() => {
    if (depositAmount && parseFloat(depositAmount) > 0) {
      const amount = parseFloat(depositAmount);
      // Service fee calculation: 1% of deposit amount with minimum ₱15 and maximum ₱50
      let fee = Math.max(15, Math.min(50, amount * 0.01));
      setServiceFee(fee);
      setTotalAmount(amount + fee);
    } else {
      setServiceFee(0);
      setTotalAmount(0);
    }
  }, [depositAmount]);

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

  const getQRData = () => {
    return JSON.stringify({
      type: 'CASH_ELAN_DEPOSIT',
      accountNumber: userData?.accountNumber || userData?.id,
      name: getDisplayName(),
      partner: selectedPartner?.name,
      bank: 'CASH ELAN',
      depositAmount: depositAmount,
      serviceFee: serviceFee.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      timestamp: Date.now()
    });
  };

  // Recent partners data (with image paths)
  const recentPartners = [
    { name: '7-Eleven', logoImage: require('../../assets/images/7eleven.png') },
    { name: 'SM Store', logoImage: require('../../assets/images/sm-store.png') },
    { name: 'Robinson Supermarket', logoImage: require('../../assets/images/robinsons.png') },
  ];

  // Partner stores for Over-the-Counter (updated with image paths)
  const partnerStores = [
    { name: 'Robinson Supermarket', logoImage: require('../../assets/images/robinsons.png'), color: '#FFBD00' },
    { name: '7-Eleven', logoImage: require('../../assets/images/7eleven.png'), color: '#FFBD00' },
    { name: 'SM Store', logoImage: require('../../assets/images/sm-store.png'), color: '#FFBD00' },
    { name: 'Puregold', logoImage: require('../../assets/images/puregold.jpg'), color: '#FFBD00' },
    { name: 'Ministop', logoImage: require('../../assets/images/ministop.jpg'), color: '#FFBD00' },
    { name: 'FamilyMart', logoImage: require('../../assets/images/familymart.png'), color: '#FFBD00' },
  ];

  // Local banks data (updated with image paths)
  const localBanks = [
    { name: 'BPI', logoImage: require('../../assets/images/bpi.png'), color: '#FFBD00', fullName: 'Bank of the Philippine Islands' },
    { name: 'UnionBank', logoImage: require('../../assets/images/unionbank.jpg'), color: '#FFBD00', fullName: 'Union Bank of the Philippines' },
    { name: 'AUB', logoImage: require('../../assets/images/aub.png'), color: '#FFBD00', fullName: 'Asia United Bank' },
    { name: 'BDO', logoImage: require('../../assets/images/bdo.png'), color: '#FFBD00', fullName: 'Banco de Oro' },
    { name: 'ChinaBank', logoImage: require('../../assets/images/chinabank.jpg'), color: '#FFBD00', fullName: 'China Banking Corporation' },
    { name: 'LandBank', logoImage: require('../../assets/images/landbank.png'), color: '#FFBD00', fullName: 'Land Bank of the Philippines' },
    { name: 'Metrobank', logoImage: require('../../assets/images/metrobank.png'), color: '#FFBD00', fullName: 'Metropolitan Bank & Trust Company' },
    { name: 'Security Bank', logoImage: require('../../assets/images/securitybank.png'), color: '#FFBD00', fullName: 'Security Bank Corporation' },
  ];

  // Handle option selection on first page
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    
    if (option === 'counter') {
      setCurrentPage(2); // Go to partner selection
    } else if (option === 'local') {
      setCurrentPage(3); // Go to local banks selection
    } else if (option === 'global') {
      Alert.alert('Coming Soon', 'Global Banks and Partners feature will be available soon.');
    }
  };

  // Handle partner store selection
  const handlePartnerSelect = (partner: Partner) => {
    setSelectedPartner(partner);
    setCurrentPage(4); // Go to amount input page
  };

  // Handle bank selection
  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setCurrentPage(6); // Go to bank instructions (now page 6)
  };

  // Handle amount confirmation
  const handleAmountConfirm = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deposit amount.');
      return;
    }

    if (parseFloat(depositAmount) < 100) {
      Alert.alert('Minimum Amount', 'Minimum deposit amount is ₱100.');
      return;
    }

    if (parseFloat(depositAmount) > 50000) {
      Alert.alert('Maximum Amount', 'Maximum deposit amount is ₱50,000 per transaction.');
      return;
    }

    setCurrentPage(5); // Go to QR code page
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // Page 1: Main deposit options
  const renderMainPage = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>How to Cash In</Text>

        {/* Over-the-Counter */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleOptionSelect('counter')}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#FFF8E1' }]}>
            <Ionicons name="storefront" size={24} color="#FFBD00" />
          </View>
          <View style={styles.optionDetails}>
            <Text style={styles.optionTitle}>Over - the - Counter</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Local Banks */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleOptionSelect('local')}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#FFF8E1' }]}>
            <Ionicons name="business" size={24} color="#FFBD00" />
          </View>
          <View style={styles.optionDetails}>
            <Text style={styles.optionTitle}>Local Banks</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Global Banks and Partners */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleOptionSelect('global')}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#FFF8E1' }]}>
            <Ionicons name="card" size={24} color="#FFBD00" />
          </View>
          <View style={styles.optionDetails}>
            <Text style={styles.optionTitle}>Global Banks and Partners</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Recent Partners */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Partners</Text>
          <Text style={styles.recentSubtitle}>
            Cash in partners that you've recently viewed or cashed in with will appear here.
          </Text>
          
          {recentPartners.length > 0 ? (
            <View style={styles.recentPartners}>
              {recentPartners.map((partner, index) => (
                <TouchableOpacity key={index} style={styles.recentPartnerItem}>
                  <View style={styles.recentPartnerIcon}>
                    <Image
                      source={partner.logoImage}
                      style={styles.recentPartnerImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.recentPartnerName}>{partner.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyRecent}>
              <Text style={styles.emptyRecentText}>No recent partners</Text>
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
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Over-the-Counter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Local Banks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Global Partners</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bankSection}>
          <View style={styles.bankSectionHeader}>
            <Text style={styles.bankSectionTitle}>Partner Stores</Text>
            <Text style={styles.bankSectionSubtitle}>
              Link your accounts for quicker transactions.
            </Text>
          </View>

          {partnerStores.map((store, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bankItem}
              onPress={() => handlePartnerSelect(store)}
            >
              <View style={styles.bankLogo}>
                <Image
                  source={store.logoImage}
                  style={styles.bankLogoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.bankName}>{store.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Page 3: Local banks selection
  const renderBankSelection = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(1)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Over-the-Counter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Local Banks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Global Partners</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bankSection}>
          <View style={styles.bankSectionHeader}>
            <Text style={styles.bankSectionTitle}>Recommended Banks</Text>
            <Text style={styles.bankSectionSubtitle}>
              Link your accounts for quicker transactions.
            </Text>
          </View>

          {localBanks.slice(0, 2).map((bank, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bankItem}
              onPress={() => handleBankSelect(bank)}
            >
              <View style={styles.bankLogo}>
                <Image
                  source={bank.logoImage}
                  style={styles.bankLogoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.bankName}>{bank.fullName}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bankSection}>
          <View style={styles.bankSectionHeader}>
            <Text style={styles.bankSectionTitle}>Partner Banks</Text>
            <Text style={styles.bankSectionSubtitle}>
              Cash in through our partner banks' websites or apps.
            </Text>
          </View>

          {localBanks.slice(2).map((bank, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bankItem}
              onPress={() => handleBankSelect(bank)}
            >
              <View style={styles.bankLogo}>
                <Image
                  source={bank.logoImage}
                  style={styles.bankLogoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.bankName}>{bank.fullName}</Text>
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
        <Text style={styles.headerTitle}>Deposit Amount</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.amountSection}>
          <View style={styles.partnerHeader}>
            <View style={styles.partnerLogo}>
              <Image
                source={selectedPartner?.logoImage}
                style={styles.partnerLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.partnerTitle}>Cash in via {selectedPartner?.name}</Text>
          </View>

          <View style={styles.amountInputContainer}>
            <Text style={styles.amountLabel}>Enter amount to deposit</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                style={styles.amountInput}
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="0.00"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                maxLength={8}
              />
            </View>

            <View style={styles.amountLimits}>
              <Text style={styles.limitText}>Min: ₱100 • Max: ₱50,000</Text>
            </View>
          </View>

          {depositAmount && parseFloat(depositAmount) > 0 && (
            <View style={styles.feeBreakdown}>
              <Text style={styles.feeTitle}>Transaction Summary</Text>
              
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Deposit Amount</Text>
                <Text style={styles.feeValue}>{formatCurrency(parseFloat(depositAmount))}</Text>
              </View>
              
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Service Fee</Text>
                <Text style={styles.feeValue}>{formatCurrency(serviceFee)}</Text>
              </View>
              
              <View style={styles.feeSeparator} />
              
              <View style={styles.feeRow}>
                <Text style={styles.totalLabel}>Total Amount to Pay</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
              </View>

              <View style={styles.feeInfo}>
                <Ionicons name="information-circle" size={16} color="#8E8E93" />
                <Text style={styles.feeInfoText}>
                  Service fee: 1% of deposit amount (min ₱15, max ₱50)
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
                    depositAmount === amount.toString() && styles.quickAmountButtonActive
                  ]}
                  onPress={() => setDepositAmount(amount.toString())}
                >
                  <Text style={[
                    styles.quickAmountText,
                    depositAmount === amount.toString() && styles.quickAmountTextActive
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
            (!depositAmount || parseFloat(depositAmount) <= 0) && styles.continueButtonDisabled
          ]}
          onPress={handleAmountConfirm}
          disabled={!depositAmount || parseFloat(depositAmount) <= 0}
        >
          <Text style={[
            styles.continueButtonText,
            (!depositAmount || parseFloat(depositAmount) <= 0) && styles.continueButtonTextDisabled
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // Page 5: QR Code for over-the-counter
  const renderQRCodePage = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(4)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit QR Code</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.qrSection}>
          <View style={styles.qrHeader}>
            <View style={styles.partnerLogo}>
              <Image
                source={selectedPartner?.logoImage}
                style={styles.partnerLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.qrTitle}>Cash in via {selectedPartner?.name}</Text>
            <Text style={styles.qrSubtitle}>
              Deposit {formatCurrency(parseFloat(depositAmount))} + {formatCurrency(serviceFee)} fee
            </Text>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to cash in:</Text>
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
                  Pay the total amount: {formatCurrency(totalAmount)}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>4.</Text>
                <Text style={styles.instructionText}>
                  Keep the receipt for your records
                </Text>
              </View>
            </View>
          </View>

          {/* Professional QR Code Card */}
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
                    <Text style={styles.amountLabelQR}>Amount</Text>
                    <Text style={styles.amountValueQR}>{formatCurrency(parseFloat(depositAmount))}</Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabelQR}>Service Fee  </Text>
                    <Text style={styles.amountValueQR}>{formatCurrency(serviceFee)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabelQR}>Total</Text>
                    <Text style={styles.totalValueQR}>{formatCurrency(totalAmount)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.qrFooter}>
                <Text style={styles.qrFooterText}>Show this QR code to complete your deposit</Text>
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

  // Page 6: Bank instructions
  const renderBankInstructions = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(3)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.bankInstructionsSection}>
          {/* Enhanced Bank Header */}
          <View style={styles.enhancedBankHeader}>
            <View style={styles.bankHeaderCard}>
              <View style={styles.bankHeaderTop}>
                <View style={styles.enhancedBankLogo}>
                  <Image
                    source={selectedBank?.logoImage}
                    style={styles.enhancedBankLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.bankHeaderInfo}>
                  <Text style={styles.enhancedBankTitle}>{selectedBank?.fullName}</Text>
                  <Text style={styles.bankSubtitle}>InstaPay Transfer</Text>
                </View>
              </View>
              
              <View style={styles.transferInfoCard}>
                <View style={styles.transferInfoRow}>
                  <Text style={styles.transferInfoLabel}>Transfer Method</Text>
                  <Text style={styles.transferInfoValue}>InstaPay</Text>
                </View>
                <View style={styles.transferInfoRow}>
                  <Text style={styles.transferInfoLabel}>Processing Time</Text>
                  <Text style={styles.transferInfoValue}>Instant</Text>
                </View>
                <View style={styles.transferInfoRow}>
                  <Text style={styles.transferInfoLabel}>Service Available</Text>
                  <Text style={styles.transferInfoValue}>24/7</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced Step-by-Step Instructions */}
          <View style={styles.enhancedInstructionsContainer}>
            <Text style={styles.enhancedInstructionsTitle}>Step-by-Step Guide</Text>
            
            <View style={styles.enhancedInstructionsList}>
              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Access {selectedBank?.name}</Text>
                  <Text style={styles.stepDescription}>
                    Log in to your {selectedBank?.name} mobile app or visit their website
                  </Text>
                  <View style={styles.stepTip}>
                    <Ionicons name="bulb" size={14} color="#FFBD00" />
                    <Text style={styles.stepTipText}>Make sure you have your login credentials ready</Text>
                  </View>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Navigate to Fund Transfer</Text>
                  <Text style={styles.stepDescription}>
                    Look for "Fund Transfer" or "Send Money" then select "InstaPay"
                  </Text>
                  <View style={styles.stepHighlight}>
                    <Text style={styles.stepHighlightText}>💡 Usually found in the main menu</Text>
                  </View>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Select Source Account</Text>
                  <Text style={styles.stepDescription}>
                    Choose which {selectedBank?.name} account you want to transfer funds from
                  </Text>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Enter Transfer Details</Text>
                  <Text style={styles.stepDescription}>
                    Select "Cash Elan" as the receiving bank and enter your account number
                  </Text>
                  <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Receiving Bank:</Text>
                      <Text style={styles.detailValue}>Cash Elan</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Account Number:</Text>
                      <Text style={styles.detailValue}>XXXX XXXX XXXX</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.enhancedInstructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>5</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Review and Confirm</Text>
                  <Text style={styles.stepDescription}>
                    Double-check all details, then confirm your transfer
                  </Text>
                  <View style={styles.stepWarning}>
                    <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
                    <Text style={styles.stepWarningText}>Always verify details before confirming</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced Fee Information */}
          <View style={styles.enhancedFeeContainer}>
            <View style={styles.feeHeader}>
              <Ionicons name="card" size={20} color="#FFBD00" />
              <Text style={styles.feeHeaderText}>Transfer Fees & Limits</Text>
            </View>
            <View style={styles.feeContent}>
              <View style={styles.feeItem}>
                <Text style={styles.feeItemLabel}>InstaPay Fee</Text>
                <Text style={styles.feeItemValue}>Varies by bank</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeItemLabel}>Transfer Limit</Text>
                <Text style={styles.feeItemValue}>₱50,000 per transaction</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeItemLabel}>Processing Time</Text>
                <Text style={styles.feeItemValue}>Instant (24/7)</Text>
              </View>
            </View>
            <Text style={styles.feeNote}>
              * Fees and limits may vary. Please check with {selectedBank?.name} for the most current rates and terms.
            </Text>
          </View>

          {/* Enhanced Action Buttons */}
          <View style={styles.enhancedActionButtons}>
            <TouchableOpacity style={styles.primaryActionButton}>
              <Ionicons name="phone-portrait" size={20} color="#1C1C1E" />
              <Text style={styles.primaryActionButtonText}>Open {selectedBank?.name} App</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryActionButton}>
              <Ionicons name="globe" size={18} color="#FFBD00" />
              <Text style={styles.secondaryActionButtonText}>Visit Website</Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <View style={styles.helpHeader}>
              <Ionicons name="help-circle" size={18} color="#8E8E93" />
              <Text style={styles.helpHeaderText}>Need Help?</Text>
            </View>
            <Text style={styles.helpDescription}>
              If you encounter any issues during the transfer process, you can contact {selectedBank?.name} customer support or reach out to our help center.
            </Text>
            <TouchableOpacity style={styles.helpButton}>
              <Ionicons name="chatbubbles" size={16} color="#FFBD00" />
              <Text style={styles.helpButtonText}>Contact Support</Text>
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
      {currentPage === 3 && renderBankSelection()}
      {currentPage === 4 && renderAmountInput()}
      {currentPage === 5 && renderQRCodePage()}
      {currentPage === 6 && renderBankInstructions()}
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    overflow: 'hidden',
  },
  recentPartnerImage: {
    width: 20,
    height: 20,
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
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bankLogoImage: {
    width: 45,
    height: 45,
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
    marginBottom: 30,
  },
  partnerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  partnerLogoImage: {
    width: 70,
    height: 70,
  },
  partnerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
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
    color: '#FFBD00',
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

  // Professional QR Code Card
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
  amountLabelQR: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  amountValueQR: {
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
  totalLabelQR: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  totalValueQR: {
    fontSize: 18,
    color: '#FFBD00',
    fontWeight: '700',
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
  
  // Enhanced Bank instructions
  bankInstructionsSection: {
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
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedBankLogoImage: {
    width: 60,
    height: 60,
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
  stepHighlight: {
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  stepHighlightText: {
    fontSize: 12,
    color: '#0EA5E9',
    fontWeight: '500',
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

export default DepositFlow;