import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, Timestamp, collection, addDoc } from "firebase/firestore";
import { auth, db } from "../../FirebaseConfig";
import { useRouter, Link } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";

// Set your desired initial balance here
const INITIAL_BALANCE = 100.00; 

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const router = useRouter();

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date) => {
    setDateOfBirth(date);
    hideDatePicker();
    // Clear date error when user selects a date
    if (errors.dateOfBirth) {
      setErrors(prev => ({ ...prev, dateOfBirth: null }));
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format phone number for Firebase (ensure it starts with +63)
  const formatPhoneForFirebase = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats and convert to +63 format
    if (cleaned.startsWith('639')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('09')) {
      return `+63${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
      return `+63${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('63')) {
      return `+${cleaned}`;
    }
    
    // If already has +63, return as is
    if (phone.startsWith('+63')) {
      return phone;
    }
    
    // Default: assume it needs +63 prefix
    return `+63${cleaned}`;
  };

  // Validate phone number format (Philippine: +639xxxxxxxxx)
  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Check various valid formats
    if (phone.startsWith('+639') && cleaned.length === 12) {
      return true;
    }
    if (phone.startsWith('639') && cleaned.length === 12) {
      return true;
    }
    if (phone.startsWith('09') && cleaned.length === 11) {
      return true;
    }
    if (phone.startsWith('9') && cleaned.length === 10) {
      return true;
    }
    return false;
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate age (must be at least 18 years old)
  const validateAge = (birthDate) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };

  // Validate name (minimum 2 characters, letters only)
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return name.trim().length >= 2 && nameRegex.test(name.trim());
  };

  // Validate password strength
  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumbers,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers
    };
  };

  // Real-time validation
  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'firstName':
        if (!validateName(value)) {
          newErrors.firstName = 'First name must be at least 2 letters';
        } else {
          delete newErrors.firstName;
        }
        break;
      case 'lastName':
        if (!validateName(value)) {
          newErrors.lastName = 'Last name must be at least 2 letters';
        } else {
          delete newErrors.lastName;
        }
        break;
      case 'email':
        if (!validateEmail(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'mobile':
        if (!validatePhoneNumber(value)) {
          newErrors.mobile = 'Enter a valid Philippine phone number';
        } else {
          delete newErrors.mobile;
        }
        break;
      case 'password':
        const passwordValidation = validatePassword(value);
        if (!passwordValidation.isValid) {
          newErrors.password = 'Password must be 8+ chars with uppercase, lowercase, and numbers';
        } else {
          delete newErrors.password;
        }
        break;
    }

    setErrors(newErrors);
  };

  const generateAccountNumber = () => {
    let accountNumber = '';
    
    // Generate exactly 12 digits
    for (let i = 0; i < 12; i++) {
      // For the first digit, ensure it's not 0 to avoid leading zero issues
      if (i === 0) {
        accountNumber += Math.floor(Math.random() * 9) + 1; // 1-9
      } else {
        accountNumber += Math.floor(Math.random() * 10); // 0-9
      }
    }
    
    return accountNumber;
  };

  // Generate card number (starts with 4562 for consistency)
  const generateCardNumber = () => {
    const prefix = "4562";
    let cardNumber = prefix;
    
    // Generate 12 more digits
    for (let i = 0; i < 12; i++) {
      cardNumber += Math.floor(Math.random() * 10).toString();
    }
    
    // Format as XXXX XXXX XXXX XXXX
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
  };

  // Calculate card expiry (5 years from now)
  const calculateCardExpiry = (createdAt) => {
    const expiryDate = new Date(createdAt);
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);
    
    const month = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
    const year = expiryDate.getFullYear().toString();
    
    return `${month}/${year}`;
  };

  const handleSignUp = async () => {
    setLoading(true);
    
    // Basic field validation
    if (!firstName || !lastName || !email || !mobile || !password || !dateOfBirth) {
      Alert.alert("Missing Information", "Please fill in all fields to continue.");
      setLoading(false);
      return;
    }

    // Comprehensive validation
    const validationErrors = {};
    
    if (!validateName(firstName)) {
      validationErrors.firstName = 'First name must be at least 2 letters';
    }
    if (!validateName(lastName)) {
      validationErrors.lastName = 'Last name must be at least 2 letters';
    }
    if (!validateEmail(email)) {
      validationErrors.email = 'Please enter a valid email address';
    }
    if (!validatePhoneNumber(mobile)) {
      validationErrors.mobile = 'Please enter a valid Philippine mobile number';
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      validationErrors.password = 'Password must meet security requirements';
    }
    
    if (!validateAge(dateOfBirth)) {
      validationErrors.dateOfBirth = 'You must be at least 18 years old';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Alert.alert("Validation Error", "Please correct the highlighted fields.");
      setLoading(false);
      return;
    }

    try {
      // Register user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate banking details
      const accountNumber = generateAccountNumber();
      const cardNumber = generateCardNumber();
      const createdAt = new Date();
      const cardExpiry = calculateCardExpiry(createdAt);
      const formattedMobile = formatPhoneForFirebase(mobile);

      // Store user details in Firestore - Updated structure with initial balance
      await setDoc(doc(db, "users", user.uid), {
        // Personal Information
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        mobile: formattedMobile, // Store formatted phone number
        dateOfBirth: Timestamp.fromDate(dateOfBirth),
        
        // Banking Information
        accountNumber,
        cardNumber,
        cardExpiry,
        balance: INITIAL_BALANCE,
        accountType: "savings",
        
        // Account Status
        isVerified: false,
        isActive: false,
        profileComplete: true,
        phoneVerified: false, // Add phone verification status
        
        // Timestamps
        createdAt: Timestamp.fromDate(createdAt),
        lastLoginAt: null,
        
        // Security Settings
        canTransfer: false,
        canWithdraw: false,
        dailyTransferLimit: 50000,
        monthlyTransferLimit: 500000,
      });

      // Create backward compatibility userInfo document
      await setDoc(doc(collection(db, "users", user.uid, "userInfo"), accountNumber), {
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        mobile: formattedMobile,
        dateOfBirth: dateOfBirth.toISOString(),
        deposit: INITIAL_BALANCE,
        balance: INITIAL_BALANCE,
        accountNumber,
        cardNumber,
        cardExpiry,
        isActive: false,
        isVerified: false,
        phoneVerified: false,
        otp: 0,
        createdAt: new Date().toISOString()
      });

      // Create welcome transaction record
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        accountNumber,
        type: 'deposit',
        amount: INITIAL_BALANCE,
        description: 'Welcome bonus - Initial account balance',
        timestamp: Timestamp.fromDate(new Date()),
        status: 'completed',
        reference: `WELCOME_${user.uid}_${Date.now()}`
      });

      // Navigate directly to OTP verification instead of email verification
      Alert.alert(
        "Account Created Successfully! 🎉", 
        `Welcome to Cash Elan! You've received PHP ${INITIAL_BALANCE.toLocaleString()} as a welcome bonus!\n\nNext, we'll verify your phone number to secure your account.`,
        [
          { 
            text: "Continue", 
            onPress: () => router.push({
              pathname: '/otp-verification',
              params: { 
                email: email,
                mobile: formattedMobile,
                uid: user.uid,
                name: `${firstName} ${lastName}`
              }
            })
          }
        ]
      );

    } catch (error) {
      console.error("Signup error:", error);
      
      // Handle specific Firebase Auth errors
      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please try signing in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Signup Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>
            {/* Back button */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the growing community using Cash Elan to manage their money.</Text>
            </View>
            
            {/* Welcome Bonus Banner */}
            <View style={styles.bonusBanner}>
              <View style={styles.bonusIconContainer}>
                <Ionicons name="gift" size={24} color="#F6B800" />
              </View>
              <View style={styles.bonusTextContainer}>
                <Text style={styles.bonusTitle}>Welcome Bonus!</Text>
                <Text style={styles.bonusAmount}>Get PHP {INITIAL_BALANCE.toLocaleString()} to start your banking journey</Text>
              </View>
            </View>
            
            {/* First Name field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={[styles.inputWrapper, errors.firstName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color={errors.firstName ? "#FF6B6B" : "#888"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#C7C7CD"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    validateField('firstName', text);
                  }}
                  editable={!loading}
                />
              </View>
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>
            
            {/* Last Name field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={[styles.inputWrapper, errors.lastName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color={errors.lastName ? "#FF6B6B" : "#888"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#C7C7CD"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    validateField('lastName', text);
                  }}
                  editable={!loading}
                />
              </View>
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>
            
            {/* Date of Birth field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity onPress={showDatePicker} disabled={loading}>
                <View style={[styles.inputWrapper, errors.dateOfBirth && styles.inputError]}>
                  <Ionicons name="calendar-outline" size={20} color={errors.dateOfBirth ? "#FF6B6B" : "#888"} style={styles.inputIcon} />
                  <Text style={dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                    {dateOfBirth ? formatDate(dateOfBirth) : "MM/DD/YYYY"}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={16} color="#888" style={styles.dateIcon} />
                </View>
              </TouchableOpacity>
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                maximumDate={new Date()}
              />
            </View>
            
            {/* Phone Number field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[styles.inputWrapper, errors.mobile && styles.inputError]}>
                <Ionicons name="call-outline" size={20} color={errors.mobile ? "#FF6B6B" : "#888"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+63 908 833 6235"
                  placeholderTextColor="#C7C7CD"
                  keyboardType="phone-pad"
                  value={mobile}
                  onChangeText={(text) => {
                    setMobile(text);
                    validateField('mobile', text);
                  }}
                  editable={!loading}
                />
              </View>
              {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
              <Text style={styles.helperText}>We'll send a verification code to this number</Text>
            </View>
            
            {/* Email field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={errors.email ? "#FF6B6B" : "#888"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="youremail@gmail.com"
                  placeholderTextColor="#C7C7CD"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    validateField('email', text);
                  }}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            
            {/* Password field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={errors.password ? "#FF6B6B" : "#888"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#C7C7CD"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    validateField('password', text);
                  }}
                  editable={!loading}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon} disabled={loading}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              <Text style={styles.helperText}>8+ characters with uppercase, lowercase, and numbers</Text>
            </View>

            {/* Terms and conditions */}
            <Text style={styles.termsText}>
              By creating an account, you agree to our{" "}
              <Text style={styles.linkText}>Terms of Service</Text> and{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>. Your account will be activated after phone verification.
            </Text>
            
            {/* Sign Up button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" style={styles.loadingSpinner} />
                  <Text style={styles.buttonText}>Creating Account...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.buttonText}>Create Account & Get PHP {INITIAL_BALANCE.toLocaleString()}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
            
            {/* Login link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text style={[styles.loginLink, loading && styles.linkDisabled]}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F6B800',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  bonusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#F6B800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bonusTextContainer: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 2,
  },
  bonusAmount: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: "#222222",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    height: 48,
  },
  inputError: {
    borderBottomColor: "#FF6B6B",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#222222",
    fontSize: 16,
  },
  dateText: {
    flex: 1,
    color: "#222222",
    fontSize: 16,
  },
  datePlaceholder: {
    flex: 1,
    color: "#C7C7CD",
    fontSize: 16,
  },
  dateIcon: {
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
  termsText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  linkText: {
    color: "#F6B800",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#F6B800",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    flexDirection: 'row',
    shadowColor: '#F6B800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#F6B800",
    fontWeight: "600",
    fontSize: 14,
  },
  linkDisabled: {
    opacity: 0.5,
  },
});