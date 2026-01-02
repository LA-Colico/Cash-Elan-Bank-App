import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from "../../FirebaseConfig";

const OTPSuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { email, mobile } = params;
  
  const handleContinue = () => {
    // Navigate to login screen
    router.push('/login');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success checkmark image */}
        <View style={styles.checkmarkContainer}>
          <Image 
            source={require('../../assets/images/success-checkmark.png')}
            style={styles.checkmarkImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Success message */}
        <Text style={styles.title}>Success!</Text>
        
        <Text style={styles.description}>
          Congratulations! you have been successfully authenticated.
        </Text>
        
        {/* Continue button */}
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  checkmarkImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  continueButton: {
    backgroundColor: '#F9B208',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default OTPSuccessScreen;