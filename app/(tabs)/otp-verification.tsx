import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from "../../FirebaseConfig";
import { signInWithPhoneNumber } from 'firebase/auth';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const OTPVerification = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { mobile, uid, email, name } = params;

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  // Timer for resend functionality
  useEffect(() => {
    let interval = null;
    if (otpSent && resendTimer > 0) {
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
  }, [otpSent, resendTimer]);

  // Send OTP to phone number
  const sendOTP = async () => {
    setLoading(true);
    try {
      if (!mobile) {
        Alert.alert("Error", "Phone number is required");
        return;
      }

      console.log("Sending OTP to:", mobile);
      
      // Note: In production, you'll need to configure reCAPTCHA for web
      // For development, this should work on mobile devices
      const confirmation = await signInWithPhoneNumber(auth, mobile.toString());
      
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendTimer(60);
      setCanResend(false);
      
      Alert.alert(
        "OTP Sent", 
        `A 6-digit verification code has been sent to ${mobile}. Please enter it below.`,
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error("Error sending OTP:", error);
      
      let errorMessage = "Failed to send OTP. Please try again.";
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number format. Please check and try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please wait before trying again.";
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = "SMS quota exceeded. Please try again later.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      // Handle paste scenario
      const pastedCode = value.slice(0, 6);
      const newOtp = [...otp];
      
      for (let i = 0; i < pastedCode.length && i < 6; i++) {
        newOtp[i] = pastedCode[i];
      }
      
      setOtp(newOtp);
      
      // Focus on the next empty field or the last field
      const nextIndex = Math.min(pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Handle single digit input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if digit entered
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle backspace
  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResult) {
        Alert.alert("Error", "Please request a new OTP code");
        return;
      }

      // Verify the OTP
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;
      
      console.log("OTP verified successfully for user:", user.uid);
      
      // Update user verification status in Firestore
      if (uid) {
        const userInfoCollectionRef = collection(db, "users", uid.toString(), "userInfo");
        const querySnapshot = await getDocs(userInfoCollectionRef);
        
        if (!querySnapshot.empty) {
          const firstDoc = querySnapshot.docs[0];
          const userDocRef = doc(db, "users", uid.toString(), "userInfo", firstDoc.id);
          
          await updateDoc(userDocRef, {
            isVerified: true,
            isActive: true,
            phoneVerified: true,
            phoneVerifiedAt: new Date(),
            lastLoginAt: new Date(),
          });
        }
      }
      
      // Navigate to success screen or main app
      Alert.alert(
        "Verification Successful",
        "Your phone number has been verified successfully!",
        [
          {
            text: "Continue",
            onPress: () => {
              router.push({
                pathname: "/otp-success",
                params: { email: email,
                  mobile: mobile,
                  uid: uid }
              });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error("Error verifying OTP:", error);
      
      let errorMessage = "Invalid verification code. Please try again.";
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "The verification code is incorrect. Please check and try again.";
      } else if (error.code === 'auth/code-expired') {
        errorMessage = "The verification code has expired. Please request a new one.";
      }
      
      Alert.alert("Verification Failed", errorMessage);
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    setConfirmationResult(null);
    setOtpSent(false);
    sendOTP();
  };

  // Send OTP when component mounts
  useEffect(() => {
    if (mobile && !otpSent) {
      sendOTP();
    }
  }, [mobile]);

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    const otpCode = otp.join('');
    if (otpCode.length === 6 && confirmationResult && !loading) {
      verifyOTP();
    }
  }, [otp, confirmationResult]);

  const handleGoBack = () => {
    Alert.alert(
      "Go Back?",
      "Are you sure you want to go back? You'll need to verify your phone number to activate your account.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Go Back", style: "destructive", onPress: () => router.back() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
            disabled={loading}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          
          {/* Phone illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.phoneIconContainer}>
              <Ionicons name="phone-portrait-outline" size={60} color="#F6B800" />
            </View>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </View>
            </View>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Phone Verification</Text>
          
          {/* Description */}
          <Text style={styles.description}>
            We've sent a 6-digit verification code to your phone number. Please enter the code below to verify your account and activate banking services.
          </Text>
          
          {/* Phone number display */}
          <View style={styles.phoneSection}>
            <Text style={styles.phoneLabel}>Phone Number</Text>
            <View style={styles.phoneContent}>
              <Ionicons name="call-outline" size={20} color="#888" style={styles.phoneIcon} />
              <Text style={styles.phoneText}>{mobile}</Text>
            </View>
          </View>
          
          {/* OTP Input Fields */}
          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>Enter Verification Code</Text>
            <View style={styles.otpInputContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                    loading ? styles.otpInputDisabled : null
                  ]}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  editable={!loading && otpSent}
                  selectTextOnFocus
                />
              ))}
            </View>
          </View>
          
          {/* Status indicator */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, otpSent ? styles.statusDotSuccess : styles.statusDotPending]} />
              <Text style={styles.statusText}>
                {otpSent ? "Verification code sent" : "Sending verification code..."}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <View style={styles.statusDotPending} />
              <Text style={styles.statusText}>Enter code to verify</Text>
            </View>
          </View>
          
          {/* Verify button */}
          <TouchableOpacity 
            style={[
              styles.verifyButton, 
              (!otpSent || loading) && styles.disabledButton,
              otp.join('').length === 6 && styles.activeButton
            ]} 
            onPress={verifyOTP}
            disabled={!otpSent || loading || otp.join('').length !== 6}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" style={styles.loader} />
                <Text style={styles.verifyButtonText}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.verifyButtonText}>Verify Code</Text>
            )}
          </TouchableOpacity>
          
          {/* Resend option */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={resendOTP}
                disabled={loading}
              >
                <Text style={[styles.resendButtonText, loading && styles.disabledText]}>
                  Resend Code
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimer}>
                Resend code in {resendTimer}s
              </Text>
            )}
          </View>
          
          {/* Help text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              <Ionicons name="information-circle-outline" size={14} color="#888" />
              {" "}If you don't receive the code, please check if your phone number is correct and try again. SMS may take a few minutes to arrive.
            </Text>
          </View>
          
          {/* Security note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#F6B800" />
            <Text style={styles.securityText}>
              This verification is required for your account security and to comply with banking regulations.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  phoneIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F6B800',
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
  },
  badge: {
    backgroundColor: '#F6B800',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#222222',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  phoneSection: {
    marginBottom: 30,
  },
  phoneLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  phoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 12,
  },
  phoneIcon: {
    marginRight: 12,
  },
  phoneText: {
    fontSize: 16,
    color: '#222222',
    fontWeight: '500',
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#222222',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    backgroundColor: '#FFFFFF',
  },
  otpInputFilled: {
    borderColor: '#F6B800',
    backgroundColor: '#FFF8E1',
  },
  otpInputDisabled: {
    opacity: 0.5,
  },
  statusContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusDotSuccess: {
    backgroundColor: '#26DE81',
  },
  statusDotPending: {
    backgroundColor: '#F6B800',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  verifyButton: {
    backgroundColor: '#E5E5E5',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  activeButton: {
    backgroundColor: '#F6B800',
    shadowColor: '#F6B800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: {
    marginRight: 8,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendButton: {
    paddingVertical: 10,
  },
  resendButtonText: {
    color: '#F6B800',
    fontWeight: '600',
    fontSize: 14,
  },
  resendTimer: {
    color: '#888',
    fontSize: 14,
  },
  disabledText: {
    opacity: 0.5,
  },
  helpContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default OTPVerification;