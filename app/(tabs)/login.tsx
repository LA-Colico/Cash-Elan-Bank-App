import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from "react-native";
import { useRouter, Link } from "expo-router";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../FirebaseConfig";
import { collection, addDoc, serverTimestamp, updateDoc, query, where, getDocs } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailModalVisible, setResetEmailModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // OTP States
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [userCredential, setUserCredential] = useState(null);

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

  // Generate 6-digit OTP
  const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 Generated Login OTP:', '******'); // Masked for security
    return otp;
  };

  // Store OTP in Firebase
  const storeOTPInFirebase = async (otp, uid) => {
    try {
      const otpData = {
        userId: uid,
        otp: otp,
        timestamp: serverTimestamp(),
        used: false,
        type: 'login',
        userEmail: email,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      };

      const otpRef = await addDoc(collection(db, 'otps'), otpData);
      console.log('✅ Login OTP stored in Firebase with ID:', otpRef.id);
      return otpRef.id;
    } catch (error) {
      console.error('❌ Error storing login OTP in Firebase:', error);
      throw error;
    }
  };

  // Generate and display OTP
  const initiateOTPVerification = async (credential) => {
    try {
      setOtpLoading(true);
      
      // Generate OTP
      const otp = generateOTP();
      setGeneratedOTP(otp);
      
      // Store in Firebase
      await storeOTPInFirebase(otp, credential.user.uid);
      
      // Store user credential for later use
      setUserCredential(credential);
      
      // Reset states
      setEnteredOTP('');
      setResendTimer(30);
      setCanResend(false);
      
      // Show OTP modal
      setShowOTPModal(true);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to generate OTP. Please try again.');
      console.error('OTP generation error:', error);
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
        where('userId', '==', userCredential.user.uid),
        where('otp', '==', generatedOTP),
        where('used', '==', false),
        where('type', '==', 'login')
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
      
      // Show success and proceed to homepage
      Alert.alert(
        'Login Successful',
        'OTP verification successful! Welcome back.',
        [{ 
          text: 'Continue', 
          onPress: () => {
            router.push({
              pathname: "./homepage",
              params: { uid: userCredential.user.uid },
            });
          }
        }]
      );

    } catch (error) {
      console.error('Error verifying login OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!canResend || !userCredential) return;
    
    try {
      setOtpLoading(true);
      
      // Generate new OTP
      const newOtp = generateOTP();
      setGeneratedOTP(newOtp);
      
      // Store new OTP in Firebase
      await storeOTPInFirebase(newOtp, userCredential.user.uid);
      
      // Reset timer
      setResendTimer(30);
      setCanResend(false);
      setEnteredOTP('');
      
      Alert.alert(
        'OTP Resent',
        'A new OTP has been generated for login verification.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Authenticate the user
      const credential = await signInWithEmailAndPassword(auth, email, password);
      
      // Instead of immediately redirecting, initiate OTP verification
      await initiateOTPVerification(credential);
      
    } catch (error) {
      console.log("Login error:", error);
      
      let errorMessage = "An unknown error occurred.";
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email. Please sign up.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      }
      
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const openResetPasswordModal = () => {
    setResetEmail(email); // Pre-fill with the email from login field
    setResetEmailModalVisible(true);
  };
  
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    
    setIsResettingPassword(true);
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      Alert.alert(
        "Password Reset Email Sent",
        "Check your email for instructions to reset your password.",
        [{ text: "OK", onPress: () => setResetEmailModalVisible(false) }]
      );
    } catch (error) {
      console.log("Password reset error:", error);
      
      let errorMessage = "Failed to send password reset email.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // OTP Modal Component
  const renderOTPModal = () => (
    <Modal
      visible={showOTPModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        // Prevent closing modal without OTP verification
        Alert.alert(
          'Complete Verification',
          'Please complete OTP verification to continue.',
          [{ text: 'OK' }]
        );
      }}
    >
      <View style={styles.otpModalOverlay}>
        <View style={styles.otpModalContent}>
          <View style={styles.otpModalHeader}>
            <Text style={styles.otpModalTitle}>Verify Login</Text>
            <TouchableOpacity onPress={() => {
              Alert.alert(
                'Cancel Login',
                'Are you sure you want to cancel the login process?',
                [
                  { text: 'No', style: 'cancel' },
                  { 
                    text: 'Yes', 
                    onPress: () => {
                      setShowOTPModal(false);
                      setUserCredential(null);
                      setGeneratedOTP('');
                      setEnteredOTP('');
                    }
                  }
                ]
              );
            }}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.otpContent}>
            <View style={styles.otpIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#FFBD00" />
            </View>
            
            <Text style={styles.otpDescription}>
              Enter the 6-digit OTP to complete your login
            </Text>
            
            <Text style={styles.otpSubDescription}>
              Logging in as: {email}
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
                  <Text style={styles.otpVerifyButtonText}>Verify & Login</Text>
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          
          {/* Header */}
          <Text style={styles.title}>Sign In</Text>
          
          {/* Email field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="youremail@gmail.com"
                placeholderTextColor="#C7C7CD"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
          </View>
          
          {/* Password field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#C7C7CD"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Forgot Password link */}
          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={openResetPasswordModal}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color="#FFBD00" />
            <Text style={styles.securityNoticeText}>
              OTP verification required for secure login
            </Text>
          </View>
          
          {/* Login button */}
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
          
          {/* Sign up link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>I'm a new user. </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
          
          {/* Password Reset Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={resetEmailModalVisible}
            onRequestClose={() => setResetEmailModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Reset Password</Text>
                  <Text style={styles.modalDescription}>
                    Enter your email address, and we'll send you instructions to reset your password.
                  </Text>
                  
                  <View style={styles.modalInputContainer}>
                    <View style={styles.modalInputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="youremail@gmail.com"
                        placeholderTextColor="#C7C7CD"
                        keyboardType="email-address"
                        value={resetEmail}
                        onChangeText={setResetEmail}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity 
                      style={styles.modalCancelButton}
                      onPress={() => setResetEmailModalVisible(false)}
                    >
                      <Text style={styles.modalCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalResetButton, isResettingPassword && styles.disabledButton]}
                      onPress={handlePasswordReset}
                      disabled={isResettingPassword}
                    >
                      {isResettingPassword ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.modalResetButtonText}>Reset</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* OTP Modal */}
          {renderOTPModal()}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    color: "#000000",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#FFBD00",
    fontSize: 14,
    fontWeight: "500",
  },
  
  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFBD00',
  },
  securityNoticeText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  
  button: {
    backgroundColor: "#FFBD00",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  signupText: {
    color: "#000000",
    fontSize: 14,
  },
  signupLink: {
    color: "#FFBD00",
    fontWeight: "600",
    fontSize: 14,
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
  
  // Modal styles (existing)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 24,
    width: '90%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 46,
  },
  modalInput: {
    flex: 1,
    height: 46,
    color: "#000000",
    fontSize: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
  },
  modalCancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  modalResetButton: {
    flex: 1,
    height: 46,
    backgroundColor: '#FFBD00',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  modalResetButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});