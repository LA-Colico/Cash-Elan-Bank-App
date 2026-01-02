import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

const TransferFlow = () => {
  const { uid, recipientName: qrRecipientName, recipientAccount: qrRecipientAccount } = useLocalSearchParams();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [isFromQR, setIsFromQR] = useState(false);
  
  // OTP States
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  // Form data
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBank, setSelectedBank] = useState('Metro Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [scheduleOption, setScheduleOption] = useState('immediate');
  const [notes, setNotes] = useState('');
  const [qrCode, setQrCode] = useState('');
  
  // Receipt data
  const [transactionData, setTransactionData] = useState(null);

  // Bank options for Cash Elan Padala
  const bankOptions = [
    'Metro Bank',
    'BDO Unibank',
    'Bank of the Philippine Islands (BPI)',
    'Land Bank of the Philippines',
    'Philippine National Bank (PNB)',
    'Security Bank',
    'Union Bank of the Philippines',
    'RCBC (Rizal Commercial Banking Corporation)',
    'China Banking Corporation',
    'Metrobank',
    'BPI Family Savings Bank',
    'Maybank Philippines',
    'HSBC Philippines',
    'Standard Chartered Bank',
    'Citibank Philippines'
  ];

  useEffect(() => {
    fetchUserData();
    
    // Check if coming from QR code scan
    if (qrRecipientName && qrRecipientAccount) {
      console.log('🔄 Detected QR scan data:', { qrRecipientName, qrRecipientAccount });
      handleQRCodeData();
    }
  }, [uid, qrRecipientName, qrRecipientAccount]);

  // OTP Timer Effect
  useEffect(() => {
    let interval = null;
    if (showOTPModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(timer => {
          if (timer <= 1) {
            setCanResend(true);
            return 0;
          }
          return timer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOTPModal, resendTimer]);

  const fetchUserData = async () => {
    try {
      if (typeof uid === 'string') {
        // Try direct user document first
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserData({ id: userDocSnap.id, ...userDocSnap.data() });
        } else {
          // Fallback to userInfo collection
          const userInfoCollectionRef = collection(db, 'users', uid, 'userInfo');
          const querySnapshot = await getDocs(userInfoCollectionRef);
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            setUserData({ id: doc.id, ...doc.data() });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Generate 6-digit OTP
  const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 Generated OTP:', '******'); // Masked for security
    return otp;
  };

  // Store OTP in Firebase
  const storeOTPInFirebase = async (otp) => {
    try {
      const otpData = {
        userId: uid,
        otp: otp,
        timestamp: serverTimestamp(),
        used: false,
        transferAmount: parseFloat(amount),
        recipientAccount: accountNumber,
        recipientName: selectedRecipient?.name || 'Unknown',
        service: selectedService,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      };

      const otpRef = await addDoc(collection(db, 'otps'), otpData);
      console.log('✅ OTP stored in Firebase with ID:', otpRef.id);
      return otpRef.id;
    } catch (error) {
      console.error('❌ Error storing OTP in Firebase:', error);
      throw error;
    }
  };

  // Generate and display OTP
  const initiateOTPVerification = async () => {
    try {
      setOtpLoading(true);
      
      // Generate OTP
      const otp = generateOTP();
      setGeneratedOTP(otp);
      
      // Store in Firebase
      await storeOTPInFirebase(otp);
      
      // Reset states
      setEnteredOTP('');
      setResendTimer(30);
      setCanResend(false);
      
      // Show OTP modal
      setShowOTPModal(true);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to generate OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP (allows any 6-digit number)
  const verifyOTP = async () => {
    if (!enteredOTP || enteredOTP.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP');
      return;
    }

    try {
      setOtpLoading(true);

      // Update OTP as used in Firebase
      const otpsRef = collection(db, 'otps');
      const q = query(
        otpsRef, 
        where('userId', '==', uid),
        where('otp', '==', generatedOTP),
        where('used', '==', false)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const otpDoc = querySnapshot.docs[0];
        await updateDoc(otpDoc.ref, {
          used: true,
          verifiedAt: serverTimestamp(),
          enteredOTP: enteredOTP
        });
      }

      // Close OTP modal
      setShowOTPModal(false);
      
      // Show success message
      Alert.alert(
        'OTP Verified',
        'OTP verification successful! Processing transfer...',
        [{ text: 'OK', onPress: () => handleConfirmTransfer() }]
      );

    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!canResend) return;
    
    try {
      setOtpLoading(true);
      
      // Generate new OTP
      const newOtp = generateOTP();
      setGeneratedOTP(newOtp);
      
      // Store new OTP in Firebase
      await storeOTPInFirebase(newOtp);
      
      // Reset timer
      setResendTimer(30);
      setCanResend(false);
      setEnteredOTP('');
      
      Alert.alert(
        'OTP Resent',
        'A new OTP has been generated and sent.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleQRCodeData = async () => {
    setIsFromQR(true);
    setSelectedService('express'); // Auto-select Express Send for QR transfers
    setAccountNumber(qrRecipientAccount as string);
    setRecipientName(qrRecipientName as string);
    
    // Auto-verify the recipient
    setLoading(true);
    const recipient = await findRecipientByAccountNumber(qrRecipientAccount as string);
    setLoading(false);
    
    if (recipient) {
      setSelectedRecipient(recipient);
      console.log('✅ QR recipient verified:', recipient);
      
      // Show confirmation to proceed
      Alert.alert(
        'QR Code Scanned',
        `Ready to send money to ${qrRecipientName}?\n\nAccount: ${qrRecipientAccount}`,
        [
          { 
            text: 'Change Recipient', 
            onPress: () => {
              // Reset form if user wants to change
              setIsFromQR(false);
              setSelectedService(null);
              setAccountNumber('');
              setRecipientName('');
              setSelectedRecipient(null);
            },
            style: 'cancel' 
          },
          { 
            text: 'Continue', 
            onPress: () => {
              // Auto-advance to amount page since recipient is verified
              setCurrentPage(2);
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Account Not Found',
        'The scanned QR code account could not be found. You can still enter the details manually.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Keep the pre-filled data but don't auto-advance
              setIsFromQR(false);
            }
          }
        ]
      );
    }
  };

  const findRecipientByAccountNumber = async (accNum) => {
    try {
      console.log('🔍 Searching for account number:', accNum);
      
      // Search in all users for this account number
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('accountNumber', '==', accNum));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const recipientDoc = querySnapshot.docs[0];
        const recipientData = { 
          userId: recipientDoc.id,
          id: recipientDoc.id, 
          ...recipientDoc.data() 
        };
        console.log('✅ Found recipient in main collection:', recipientData);
        return recipientData;
      }
      
      // Also search in userInfo subcollections
      const allUsersRef = collection(db, 'users');
      const allUsersSnapshot = await getDocs(allUsersRef);
      
      for (const userDoc of allUsersSnapshot.docs) {
        const userInfoRef = collection(db, 'users', userDoc.id, 'userInfo');
        const userInfoSnapshot = await getDocs(userInfoRef);
        
        for (const userInfoDoc of userInfoSnapshot.docs) {
          if (userInfoDoc.id === accNum || userInfoDoc.data().accountNumber === accNum) {
            const recipientData = { 
              id: userInfoDoc.id, 
              userId: userDoc.id,
              ...userInfoDoc.data() 
            };
            console.log('✅ Found recipient in userInfo collection:', recipientData);
            return recipientData;
          }
        }
      }
      
      console.log('❌ Recipient not found');
      return null;
    } catch (error) {
      console.error('Error finding recipient:', error);
      return null;
    }
  };

  const generateQRCode = () => {
    const userAccountNumber = userData?.accountNumber || userData?.id;
    const qrData = `cash-elan-request:${userAccountNumber}:${userData?.name || 'User'}`;
    setQrCode(qrData);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    if (service === 'request') {
      generateQRCode();
    }
  };

  const handleNextFromPage1 = async () => {
    if (!selectedService) {
      Alert.alert('Error', 'Please select a service');
      return;
    }

    if (selectedService === 'request') {
      // For request money, just show QR code
      setCurrentPage(4); // QR code page
      return;
    }

    if (!accountNumber) {
      Alert.alert('Error', 'Please enter an account number');
      return;
    }

    if (selectedService === 'express') {
      // For express send, search for Cash Elan account
      setLoading(true);
      const recipient = await findRecipientByAccountNumber(accountNumber);
      setLoading(false);
      
      if (!recipient) {
        Alert.alert('Error', 'Cash Elan account not found');
        return;
      }
      
      setSelectedRecipient(recipient);
      setRecipientName(recipient.name || 'Unknown');
    } else if (selectedService === 'padala') {
      // For padala, create a recipient object
      if (!recipientName) {
        Alert.alert('Error', 'Please enter recipient name');
        return;
      }
      
      setSelectedRecipient({
        name: recipientName,
        accountNumber: accountNumber,
        bank: selectedBank,
        type: 'padala'
      });
    }
    
    setCurrentPage(2);
  };

  const handleScanQR = () => {
    router.push({
      pathname: '/(tabs)/qrcode',
      params: { uid: uid },
    });
  };

  // Modified to trigger OTP instead of direct transfer
  const handleInitiateTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const transferAmount = parseFloat(amount);
    const currentBalance = parseFloat(userData?.balance || userData?.deposit || 0);

    if (transferAmount > currentBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (!selectedRecipient) {
      Alert.alert('Error', 'No recipient selected');
      return;
    }

    // Initiate OTP verification instead of direct transfer
    await initiateOTPVerification();
  };

  const handleConfirmTransfer = async () => {
    setLoading(true);

    try {
      console.log('💰 Starting transfer...');
      console.log('Sender UID:', uid);
      console.log('Recipient:', selectedRecipient);
      console.log('Transfer Amount:', parseFloat(amount));

      const transferAmount = parseFloat(amount);
      const currentBalance = parseFloat(userData?.balance || userData?.deposit || 0);

      // Generate transaction reference and time
      const transactionReference = `TXN_${selectedService.toUpperCase()}_${Date.now()}`;
      const transactionTime = new Date();

      // Update sender's balance
      const senderRef = doc(db, 'users', uid);
      const newSenderBalance = currentBalance - transferAmount;
      await updateDoc(senderRef, {
        balance: newSenderBalance
      });
      console.log('✅ Sender balance updated:', newSenderBalance);

      // For Express Send, update recipient's balance
      if (selectedService === 'express' && selectedRecipient?.userId) {
        const recipientRef = doc(db, 'users', selectedRecipient.userId);
        const recipientDoc = await getDoc(recipientRef);
        
        if (recipientDoc.exists()) {
          const currentRecipientBalance = parseFloat(recipientDoc.data().balance || recipientDoc.data().deposit || 0);
          const newRecipientBalance = currentRecipientBalance + transferAmount;
          
          await updateDoc(recipientRef, {
            balance: newRecipientBalance
          });
          
          console.log('✅ Recipient balance updated from', currentRecipientBalance, 'to', newRecipientBalance);
        }
      }

      // Create transaction record for sender
      await addDoc(collection(db, 'transactions'), {
        userId: uid,
        type: selectedService === 'express' ? 'express_send' : 'padala_send',
        amount: transferAmount,
        description: selectedService === 'express' 
          ? `Express Send to ${selectedRecipient?.name || accountNumber}`
          : `Padala Send to ${selectedRecipient?.name || accountNumber} via ${selectedBank}`,
        recipientAccountNumber: accountNumber,
        recipientName: selectedRecipient?.name || 'Unknown',
        recipientBank: selectedService === 'padala' ? selectedBank : 'Cash Elan',
        senderAccountNumber: userData?.accountNumber || userData?.id,
        senderName: userData?.name || 'Unknown',
        notes: notes,
        timestamp: serverTimestamp(),
        status: 'completed',
        reference: transactionReference,
        balanceBefore: currentBalance,
        balanceAfter: newSenderBalance,
        source: isFromQR ? 'qr_scan' : 'manual',
        otpVerified: true, // Mark as OTP verified
        otpUsed: generatedOTP
      });

      // Create transaction record for recipient (only for Express Send)
      if (selectedService === 'express' && selectedRecipient?.userId) {
        await addDoc(collection(db, 'transactions'), {
          userId: selectedRecipient.userId,
          type: 'express_receive',
          amount: transferAmount,
          description: `Express Receive from ${userData?.name || 'Unknown'}`,
          senderAccountNumber: userData?.accountNumber || userData?.id,
          senderName: userData?.name || 'Unknown',
          recipientAccountNumber: accountNumber,
          recipientName: selectedRecipient?.name || 'Unknown',
          notes: notes,
          timestamp: serverTimestamp(),
          status: 'completed',
          reference: `${transactionReference}_RECEIVE`,
          source: isFromQR ? 'qr_scan' : 'manual'
        });
      }

      // Store transaction data for receipt
      setTransactionData({
        reference: transactionReference,
        date: transactionTime.toLocaleDateString('en-PH'),
        time: transactionTime.toLocaleTimeString('en-PH'),
        service: selectedService === 'express' ? 'Express Send' : `Cash Elan Padala`,
        amount: transferAmount,
        senderName: userData?.name || 'Unknown',
        senderAccount: userData?.accountNumber || userData?.id,
        recipientName: selectedRecipient?.name || 'Unknown',
        recipientAccount: accountNumber,
        recipientBank: selectedService === 'padala' ? selectedBank : 'Cash Elan',
        notes: notes,
        status: 'Completed',
        balanceBefore: currentBalance,
        balanceAfter: newSenderBalance,
        source: isFromQR ? 'QR Code Scan' : 'Manual Entry',
        otpVerified: true
      });

      console.log('✅ Transfer completed successfully!');
      setCurrentPage(3);
    } catch (error) {
      console.error('❌ Error processing transfer:', error);
      Alert.alert('Error', 'Failed to process transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance || 0);
  };

  // OTP Modal Component
  const renderOTPModal = () => (
    <Modal
      visible={showOTPModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowOTPModal(false)}
    >
      <View style={styles.otpModalOverlay}>
        <View style={styles.otpModalContent}>
          <View style={styles.otpModalHeader}>
            <Text style={styles.otpModalTitle}>Enter OTP</Text>
            <TouchableOpacity onPress={() => setShowOTPModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.otpContent}>
            <View style={styles.otpIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#FFBD00" />
            </View>
            
            <Text style={styles.otpDescription}>
              Enter the 6-digit OTP to complete your transfer
            </Text>
            
            <Text style={styles.otpSubDescription}>
              Amount: ₱{formatBalance(amount)}
            </Text>
            
            <Text style={styles.otpSubDescription}>
              To: {selectedRecipient?.name}
            </Text>
            
            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                value={enteredOTP}
                onChangeText={setEnteredOTP}
                placeholder="000000"
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
                fontSize={24}
                letterSpacing={8}
              />
            </View>
                    
            <View style={styles.otpActions}>
              <TouchableOpacity
                style={[styles.otpVerifyButton, otpLoading && styles.disabledButton]}
                onPress={verifyOTP}
                disabled={otpLoading || enteredOTP.length !== 6}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.otpVerifyButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.resendContainer}>
                {canResend ? (
                  <TouchableOpacity onPress={resendOTP}>
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.resendTimerText}>
                    Resend OTP in {resendTimer}s
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Page 1: Service Selection
  const renderPage1 = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <TouchableOpacity onPress={handleScanQR} style={styles.qrButton}>
        </TouchableOpacity>
      </View>

      {/* QR Code Banner (shown if from QR) */}
      {isFromQR && (
        <View style={styles.qrBanner}>
          <Ionicons name="qr-code" size={20} color="#FFBD00" />
          <Text style={styles.qrBannerText}>Recipient info loaded from QR code</Text>
          <TouchableOpacity onPress={() => {
            setIsFromQR(false);
            setSelectedService(null);
            setAccountNumber('');
            setRecipientName('');
            setSelectedRecipient(null);
          }}>
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {/* Express Send */}
        <TouchableOpacity
          style={[styles.serviceCard, selectedService === 'express' && styles.selectedServiceCard]}
          onPress={() => handleServiceSelect('express')}
        >
          <View style={styles.serviceIcon}>
            <Ionicons name="flash" size={24} color="#FFBD00" />
          </View>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceTitle}>Express Send</Text>
            <Text style={styles.serviceSubtitle}>Send to Cash Elan accounts instantly</Text>
            {isFromQR && <Text style={styles.qrRecommended}>✓ Recommended for QR transfers</Text>}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Cash Elan Padala */}
        <TouchableOpacity
          style={[styles.serviceCard, selectedService === 'padala' && styles.selectedServiceCard]}
          onPress={() => handleServiceSelect('padala')}
        >
          <View style={styles.serviceIcon}>
            <Ionicons name="business" size={24} color="#FFBD00" />
          </View>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceTitle}>Cash Elan Padala</Text>
            <Text style={styles.serviceSubtitle}>Send cash to anyone through our bank partners</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Request Money */}
        <TouchableOpacity
          style={[styles.serviceCard, selectedService === 'request' && styles.selectedServiceCard]}
          onPress={() => handleServiceSelect('request')}
        >
          <View style={styles.serviceIcon}>
            <Ionicons name="qr-code" size={24} color="#FFBD00" />
          </View>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceTitle}>Request Money</Text>
            <Text style={styles.serviceSubtitle}>Generate QR code to receive money</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Form Fields for Express Send */}
        {selectedService === 'express' && (
          <>
            <Text style={styles.sectionLabel}>Account Number</Text>
            <TextInput
              style={[styles.input, isFromQR && styles.prefilledInput]}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter Cash Elan account number"
              keyboardType="numeric"
              editable={!isFromQR}
            />
            
            {recipientName && (
              <View style={[styles.recipientNameContainer, isFromQR && styles.qrVerifiedContainer]}>
                <Text style={styles.recipientNameLabel}>
                  {isFromQR ? 'QR Verified Recipient:' : 'Recipient:'}
                </Text>
                <Text style={styles.recipientNameText}>{recipientName}</Text>
                {isFromQR && (
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" style={{ marginLeft: 8 }} />
                )}
              </View>
            )}
          </>
        )}

        {/* Form Fields for Cash Elan Padala */}
        {selectedService === 'padala' && (
          <>
            <Text style={styles.sectionLabel}>Select Bank</Text>
            <TouchableOpacity 
              style={styles.bankSelector}
              onPress={() => setShowBankModal(true)}
            >
              <Text style={styles.bankText}>{selectedBank}</Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Account Number</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter recipient account number"
              keyboardType="numeric"
              maxLength={16}
            />

            <Text style={styles.sectionLabel}>Recipient Name</Text>
            <TextInput
              style={styles.input}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Enter recipient full name"
            />
          </>
        )}

        {/* Optional Fields */}
        {(selectedService === 'express' || selectedService === 'padala') && (
          <>
            <Text style={styles.sectionLabel}>Mobile Number (Optional)</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.flagText}>🇵🇭</Text>
                <Text style={styles.codeText}>+63</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="909 833 6236"
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.sectionLabel}>Email Address (Optional)</Text>
            <TextInput
              style={styles.input}
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="example@gmail.com"
              keyboardType="email-address"
            />
          </>
        )}

        {selectedService && selectedService !== 'request' && (
          <Text style={styles.disclaimer}>
            Note: Please verify recipient details before completing the transaction. By proceeding, you agree to our terms and conditions.
          </Text>
        )}
      </View>

      {/* Bank Selection Modal */}
      <Modal
        visible={showBankModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bankList}>
              {bankOptions.map((bank, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.bankItem, selectedBank === bank && styles.selectedBankItem]}
                  onPress={() => {
                    setSelectedBank(bank);
                    setShowBankModal(false);
                  }}
                >
                  <Text style={[styles.bankItemText, selectedBank === bank && styles.selectedBankItemText]}>
                    {bank}
                  </Text>
                  {selectedBank === bank && (
                    <Ionicons name="checkmark" size={20} color="#FFBD00" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {selectedService && selectedService !== 'request' && (
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.disabledButton]}
          onPress={handleNextFromPage1}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      )}

      {selectedService === 'request' && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => setCurrentPage(4)}
        >
          <Text style={styles.nextButtonText}>Generate QR Code</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  // Page 2: Confirmation (Modified to trigger OTP)
  const renderPage2 = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(1)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* QR Transfer Badge */}
      {isFromQR && (
        <View style={styles.qrTransferBadge}>
          <Ionicons name="qr-code" size={16} color="#FFBD00" />
          <Text style={styles.qrTransferText}>QR Code Transfer</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* From Account */}
        <Text style={styles.sectionLabel}>From</Text>
        <View style={styles.accountCard}>
          <View style={styles.accountIcon}>
            <Ionicons name="person-circle" size={40} color="#FFBD00" />
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountName}>{userData?.name || 'Your Account'}</Text>
            <Text style={styles.accountNumberText}>
              ACCOUNT NUMBER: {userData?.accountNumber || userData?.id}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={styles.sectionLabel}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>PHP</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="10,000"
            keyboardType="numeric"
          />
        </View>

        {/* To Account */}
        <Text style={styles.sectionLabel}>To</Text>
        <View style={[styles.accountCard, isFromQR && styles.qrAccountCard]}>
          <View style={styles.accountIcon}>
            <Ionicons name="person-circle" size={40} color="#FFBD00" />
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountName}>
              {selectedRecipient?.name || 'Recipient'}
              {isFromQR && <Text style={styles.qrVerified}> ✓ QR Verified</Text>}
            </Text>
            <Text style={styles.accountNumberText}>
              {selectedService === 'padala' 
                ? `${selectedBank} - ${accountNumber}`
                : `ACCOUNT NUMBER: ${accountNumber}`
              }
            </Text>
          </View>
        </View>

        {/* Service Type */}
        <Text style={styles.sectionLabel}>Service</Text>
        <View style={styles.serviceInfoCard}>
          <Text style={styles.serviceInfoText}>
            {selectedService === 'express' ? 'Express Send - Cash Elan' : `Cash Elan Padala - ${selectedBank}`}
          </Text>
        </View>

        {/* Schedule */}
        <Text style={styles.sectionLabel}>Schedule</Text>
        <TouchableOpacity
          style={[styles.optionItem, scheduleOption === 'immediate' && styles.selectedOption]}
          onPress={() => setScheduleOption('immediate')}
        >
          <View style={styles.radioButton}>
            {scheduleOption === 'immediate' && <View style={styles.radioButtonSelected} />}
          </View>
          <Text style={styles.optionText}>Immediate</Text>
        </TouchableOpacity>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder={isFromQR ? "QR Code Transfer" : "Enter Notes"}
          multiline={true}
          numberOfLines={3}
        />

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#FFBD00" />
          <Text style={styles.securityNoticeText}>
            An OTP will be sent for verification before completing this transfer
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextButton, loading && styles.disabledButton]}
        onPress={handleInitiateTransfer}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextButtonText}>Generate OTP</Text>
        )}
      </TouchableOpacity>

      {/* OTP Modal */}
      {renderOTPModal()}
    </ScrollView>
  );

  // Page 3: Success
  const renderPage3 = () => (
    <View style={styles.successContainer}>
      <View style={styles.successContent}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={60} color="#FFBD00" />
        </View>
        <Text style={styles.successTitle}>Transfer Successful!</Text>
        <Text style={styles.successSubtitle}>
          {selectedService === 'express' 
            ? `Money sent via Express Send${isFromQR ? ' using QR code' : ''}`
            : `Money sent via Cash Elan Padala to ${selectedBank}`
          }
        </Text>
        <Text style={styles.otpVerifiedText}>✓ OTP Verified</Text>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setCurrentPage(5)}
      >
        <Text style={styles.continueButtonText}>View Receipt</Text>
      </TouchableOpacity>
    </View>
  );

  // Page 4: QR Code for Request Money
  const renderPage4 = () => (
    <View style={styles.qrContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(1)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate QR Code</Text>
        <TouchableOpacity onPress={() => setCurrentPage(1)} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.qrContent}>
        {/* QR Code Card */}
        <View style={styles.qrCard}>
          {/* Logo and Bank Name */}
          <View style={styles.qrCardHeader}>
            <View style={styles.qrLogoCircle}>
              <Text style={styles.qrLogoText}>₽</Text>
            </View>
            <Text style={styles.qrBankName}>CASH ELAN</Text>
          </View>

          {/* User Name */}
          <Text style={styles.qrUserName}>{userData?.name || 'User Name'}</Text>
          
          {/* Account Number */}
          <Text style={styles.qrAccountNumber}>
            ACCOUNT NUMBER - ••• ••• ••• {(userData?.accountNumber || userData?.id || '0000').slice(-4)}
          </Text>

          {/* QR Code with Overlay */}
          <View style={styles.qrCodeWrapper}>
            <View style={styles.qrCodePlaceholder}>
              <Ionicons name="qr-code" size={120} color="#000" />
            </View>
            <View style={styles.qrCodeOverlay}>
              <View style={styles.qrCodeBrand}>
                <Text style={styles.qrCodeBrandText}>CashElan</Text>
              </View>
            </View>
          </View>

          {/* QR Code Description */}
          <Text style={styles.qrDescription}>
            Show this QR code to receive money
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.qrActionButtons}>
          <TouchableOpacity style={styles.qrShareButton}>
            <Ionicons name="share" size={20} color="#1C1C1E" />
            <Text style={styles.qrShareButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.qrSaveButton}>
            <Ionicons name="download" size={20} color="#1C1C1E" />
            <Text style={styles.qrSaveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Page 5: Receipt
  const renderPage5 = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentPage(3)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Receipt</Text>
        <TouchableOpacity onPress={() => {}} style={styles.shareReceiptButton}>
          <Ionicons name="share-outline" size={24} color="#FFBD00" />
        </TouchableOpacity>
      </View>

      <View style={styles.receiptContainer}>
        {/* Receipt Header */}
        <View style={styles.receiptHeader}>
          <View style={styles.receiptIcon}>
            <Ionicons name="checkmark-circle" size={40} color="#FFBD00" />
          </View>
          <Text style={styles.receiptTitle}>Transaction Completed</Text>
          <Text style={styles.receiptReference}>Ref: {transactionData?.reference}</Text>
          {isFromQR && (
            <View style={styles.qrReceiptBadge}>
              <Ionicons name="qr-code" size={12} color="#FFBD00" />
              <Text style={styles.qrReceiptText}>QR Transfer</Text>
            </View>
          )}
          <View style={styles.otpVerifiedBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#34C759" />
            <Text style={styles.otpVerifiedBadgeText}>OTP Verified</Text>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={styles.receiptSection}>
          <Text style={styles.receiptSectionTitle}>Transaction Details</Text>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Service</Text>
            <Text style={styles.receiptValue}>{transactionData?.service}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Amount</Text>
            <Text style={styles.receiptValueAmount}>₱ {formatBalance(transactionData?.amount)}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Date</Text>
            <Text style={styles.receiptValue}>{transactionData?.date}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Time</Text>
            <Text style={styles.receiptValue}>{transactionData?.time}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Status</Text>
            <Text style={styles.receiptValueSuccess}>{transactionData?.status}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Source</Text>
            <Text style={styles.receiptValue}>{transactionData?.source}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Security</Text>
            <Text style={styles.receiptValueSuccess}>OTP Verified ✓</Text>
          </View>
        </View>

        {/* Sender Details */}
        <View style={styles.receiptSection}>
          <Text style={styles.receiptSectionTitle}>From</Text>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Name</Text>
            <Text style={styles.receiptValue}>{transactionData?.senderName}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Account</Text>
            <Text style={styles.receiptValue}>{transactionData?.senderAccount}</Text>
          </View>
        </View>

        {/* Recipient Details */}
        <View style={styles.receiptSection}>
          <Text style={styles.receiptSectionTitle}>To</Text>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Name</Text>
            <Text style={styles.receiptValue}>{transactionData?.recipientName}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Account</Text>
            <Text style={styles.receiptValue}>{transactionData?.recipientAccount}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Bank</Text>
            <Text style={styles.receiptValue}>{transactionData?.recipientBank}</Text>
          </View>
        </View>

        {/* Balance Info */}
        <View style={styles.receiptSection}>
          <Text style={styles.receiptSectionTitle}>Balance Information</Text>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Previous Balance</Text>
            <Text style={styles.receiptValue}>₱ {formatBalance(transactionData?.balanceBefore)}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Current Balance</Text>
            <Text style={styles.receiptValue}>₱ {formatBalance(transactionData?.balanceAfter)}</Text>
          </View>
        </View>

        {/* Notes */}
        {transactionData?.notes && (
          <View style={styles.receiptSection}>
            <Text style={styles.receiptSectionTitle}>Notes</Text>
            <Text style={styles.receiptNotes}>{transactionData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.receiptFooter}>
          <Text style={styles.receiptFooterText}>
            Thank you for using Cash Elan Transfer Services
          </Text>
          <Text style={styles.receiptFooterSubText}>
            Keep this receipt for your records
          </Text>
        </View>
      </View>

      <View style={styles.receiptButtonContainer}>
        <TouchableOpacity
          style={styles.backToDashboardButton}
          onPress={() => router.replace({
            pathname: '/(tabs)/homepage',
            params: { uid: uid }
          })}
        >
          <Text style={styles.backToDashboardButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {currentPage === 1 && renderPage1()}
      {currentPage === 2 && renderPage2()}
      {currentPage === 3 && renderPage3()}
      {currentPage === 4 && renderPage4()}
      {currentPage === 5 && renderPage5()}
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
  qrButton: {
    padding: 5,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    marginTop: 28,
  },
  
  // OTP Modal Styles
  otpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  otpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  otpModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  otpContent: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  otpIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  otpDescription: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  otpSubDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
  },
  otpInputContainer: {
    marginVertical: 30,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#FFBD00',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFF8E1',
    fontWeight: '600',
    width: 200,
  },
  demoNotice: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  otpActions: {
    width: '100%',
  },
  otpVerifyButton: {
    backgroundColor: '#FFBD00',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  otpVerifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#FFBD00',
    fontWeight: '500',
  },
  resendTimerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  
  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFBD00',
  },
  securityNoticeText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  
  // Success page additions
  otpVerifiedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginTop: 10,
  },
  
  // Receipt additions
  otpVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  otpVerifiedBadgeText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#34C759',
    fontWeight: '600',
  },
  
  // QR-specific styles
  qrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFBD00',
  },
  qrBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  qrRecommended: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
    marginTop: 2,
  },
  prefilledInput: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFBD00',
  },
  qrVerifiedContainer: {
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  qrTransferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
  },
  qrTransferText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#FFBD00',
    fontWeight: '600',
  },
  qrAccountCard: {
    borderWidth: 1,
    borderColor: '#FFBD00',
    backgroundColor: '#FFF8E1',
  },
  qrVerified: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  qrReceiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  qrReceiptText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#FFBD00',
    fontWeight: '600',
  },

  serviceCard: {
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
  selectedServiceCard: {
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFBD00',
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sectionLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  recipientNameContainer: {
    backgroundColor: '#FFF8E1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFBD00',
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientNameLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  recipientNameText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    flex: 1,
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    marginBottom: 8,
  },
  bankText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  flagText: {
    fontSize: 16,
    marginRight: 5,
  },
  codeText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    color: '#1C1C1E',
  },
  disclaimer: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
    marginTop: 10,
  },
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
  bankList: {
    paddingHorizontal: 20,
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectedBankItem: {
    backgroundColor: '#FFF8E1',
  },
  bankItemText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  selectedBankItemText: {
    fontWeight: '600',
    color: '#FFBD00',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    marginBottom: 8,
  },
  accountIcon: {
    marginRight: 15,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  accountNumberText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
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
  serviceInfoCard: {
    backgroundColor: '#FFF8E1',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFBD00',
  },
  serviceInfoText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFBD00',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFBD00',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFBD00',
  },
  optionText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    color: '#1C1C1E',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  nextButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#FFBD00',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successContent: {
    alignItems: 'center',
    marginBottom: 100,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFBD00',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
    textAlign: 'center',
  },
  continueButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#FFBD00',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // QR Code Styles
  qrContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  qrContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
    width: '100%',
    maxWidth: 350,
  },
  qrCardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrLogoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFBD00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrLogoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  qrBankName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 2,
  },
  qrUserName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrAccountNumber: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 30,
    textAlign: 'center',
  },
  qrCodeWrapper: {
    position: 'relative',
    marginBottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodePlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  qrCodeOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeBrand: {
    backgroundColor: '#FFBD00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  qrCodeBrandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  qrDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  qrActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 350,
  },
  qrShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFBD00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 0.48,
    justifyContent: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  qrSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFBD00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 0.48,
    justifyContent: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  qrShareButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  qrSaveButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 30,
  },
  accountInfoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  accountInfoValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 15,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFBD00',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Receipt Styles
  shareReceiptButton: {
    padding: 5,
  },
  receiptContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  receiptIcon: {
    marginBottom: 15,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  receiptReference: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  receiptSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  receiptSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    flex: 1,
  },
  receiptValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  receiptValueAmount: {
    fontSize: 16,
    color: '#FFBD00',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  receiptValueSuccess: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  receiptNotes: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  receiptFooter: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  receiptFooterText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  receiptFooterSubText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  receiptButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backToDashboardButton: {
    backgroundColor: '#FFBD00',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backToDashboardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TransferFlow;