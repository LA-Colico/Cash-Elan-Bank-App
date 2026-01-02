import { View, Text, Image, TouchableOpacity, SafeAreaView, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function ELANHOME() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background and Logo Section */}
      <View style={styles.topSection}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.appName}>CASH ÉLAN</Text>
      </View>
      
      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome to Cash Élan 👋</Text>
        
        <Text style={styles.welcomeText}>
          We collect and protect your personal and device info
          to keep your account secure and the app running
          smoothly – just as it should. Learn how we handle your
          data in our <Text style={styles.linkText}>privacy statement</Text>.
        </Text>
        
        <Link
          href="/onboarding-one"
          asChild
        >
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8E8E8",
  },
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 10,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 1,
  },
  welcomeCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40, 
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1C1B20",
    marginBottom: 16,
    marginLeft:50,
  },
  welcomeText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
    marginBottom: 24,
  },
  linkText: {
    color: "#FDBA2D", 
    fontWeight: "500",
  },
  continueButton: {
    backgroundColor: "#FDBA2D", 
    borderRadius: 10, 
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});