import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const OnboardingTwo = () => {
  const router = useRouter();

  const handleNext = () => {
    // Navigate to the next onboarding screen
    router.push('/onboarding-three');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Image at the top */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/security-illustration.png')} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      
      {/* Pagination dots below the image */}
      <View style={styles.paginationContainer}>
        <View style={styles.paginationDot} />
        <View style={[styles.paginationDot, styles.activeDot]} />
        <View style={styles.paginationDot} />
      </View>
      
      {/* Text content below the dots */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          The most Secure Platfrom for Customer
        </Text>
        
        <Text style={styles.description}>
          Built-in Fingerprint, face recognition and more, keeping you completely safe
        </Text>
      </View>
      
      {/* Next button at the bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    maxHeight: 350,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#FDBA2D',
  },
  contentContainer: {
    flex: 0.3,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1B20',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#78787C',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flex: 0.2,
    justifyContent: 'flex-end',
    paddingBottom: 35,
  },
  nextButton: {
    backgroundColor: '#FDBA2D',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OnboardingTwo;