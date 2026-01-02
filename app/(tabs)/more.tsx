import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

// TypeScript declaration for require statements
declare const require: {
  (path: string): any;
};

const MoreScreen = () => {
  const { uid } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("more");

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    switch(tab) {
      case "home":
        router.push({
          pathname: "/(tabs)/homepage",
          params: { uid: uid },
        });
        break;
      case "payments":
        router.push({
          pathname: "/(tabs)/history",
          params: { uid: uid },
        });
        break;
      case "account":
        router.push({
          pathname: "/(tabs)/profile",
          params: { uid: uid },
        });
        break;
      case "more":
        // Stay on current screen
        break;
    }
  };

  const handlePrivacyPress = () => {
    Alert.alert(
      "Privacy Policy",
      "Cash Elan Privacy Policy\n\nYour privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information when you use our banking services.\n\n• We collect information to provide and improve our services\n• Your data is encrypted and securely stored\n• We never sell your personal information to third parties\n• You have control over your privacy settings\n\nFor the complete privacy policy, visit our website or contact customer support.",
      [
        {
          text: "Contact Support",
          onPress: () => handleSupportPress(),
        },
        {
          text: "OK",
          style: "default",
        },
      ]
    );
  };

  const handleTermsPress = () => {
    Alert.alert(
      "Terms and Conditions",
      "Cash Elan Terms of Service\n\nBy using Cash Elan services, you agree to these terms:\n\n• You must be 18+ years old to use our services\n• You are responsible for keeping your account secure\n• We provide banking services subject to applicable laws\n• Service fees may apply to certain transactions\n• We may update these terms with proper notice\n\nFor complete terms and conditions, please visit our website or contact our support team.",
      [
        {
          text: "Contact Support",
          onPress: () => handleSupportPress(),
        },
        {
          text: "OK",
          style: "default",
        },
      ]
    );
  };

  const handleAboutPress = () => {
    Alert.alert(
      "About Cash Elan",
      "Cash Elan v1.0.0\n\nA secure and convenient digital banking solution for all your financial needs.\n\n🏦 Digital Banking Services\n💳 Virtual Debit Cards\n📱 Mobile Payments\n🔒 Bank-Level Security\n💰 Investment Options\n📊 Financial Analytics\n\n© 2024 Cash Elan. All rights reserved.\n\nBuilt with ❤️ for the Filipino community.",
      [
        {
          text: "Visit Website",
          onPress: () => {
            // In a real app, you would open the website
            Alert.alert("Website", "www.cashelan.com");
          },
        },
        {
          text: "OK",
          style: "default",
        },
      ]
    );
  };

  const handleSupportPress = () => {
    Alert.alert(
      "Customer Support",
      "Need help? We're here for you 24/7!\n\n📧 Email: support@cashelan.com\n📞 Phone: +63 (2) 8888-CASH (2274)\n💬 Live Chat: Available in app\n🕐 Hours: 24/7 Support\n\n🌟 Fast Response Times:\n• Live Chat: < 2 minutes\n• Email: < 4 hours\n• Phone: Immediate\n\nOur certified support agents are ready to help with account issues, transactions, and technical support.",
      [
        {
          text: "Call Now",
          onPress: () => {
            Alert.alert("Calling Support", "Dialing +63 (2) 8888-2274...");
          },
        },
        {
          text: "Send Email",
          onPress: () => {
            Alert.alert("Email Support", "Opening email to support@cashelan.com...");
          },
        },
        {
          text: "Live Chat",
          onPress: () => {
            Alert.alert("Live Chat", "Starting live chat session...");
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleSecurityPress = () => {
    Alert.alert(
      "Security & Safety",
      "Your security is our top priority 🔒\n\n🔐 Security Features:\n• 256-bit SSL encryption\n• Biometric authentication\n• Two-factor authentication (2FA)\n• Real-time fraud monitoring\n• Secure PIN protection\n\n🛡️ Safety Tips:\n• Never share your PIN or password\n• Always log out after use\n• Report suspicious activity immediately\n• Keep your app updated\n\n🚨 Report Security Issues:\nContact us immediately if you notice any unauthorized activity.",
      [
        {
          text: "Report Issue",
          style: "destructive",
          onPress: () => handleSupportPress(),
        },
        {
          text: "OK",
          style: "default",
        },
      ]
    );
  };

  const handleFeedbackPress = () => {
    Alert.alert(
      "Send Feedback",
      "We value your feedback! Help us improve Cash Elan.\n\n⭐ Rate the App\n💡 Suggest Features\n🐛 Report Bugs\n💬 General Feedback\n\nYour input helps us create a better banking experience for everyone.",
      [
        {
          text: "Rate App",
          onPress: () => {
            Alert.alert("Thank You!", "Redirecting to app store for rating...");
          },
        },
        {
          text: "Send Feedback",
          onPress: () => {
            Alert.alert("Feedback", "Opening feedback form...");
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 1,
      title: "Privacy Policy",
      subtitle: "How we protect your data",
      icon: "shield-checkmark",
      onPress: handlePrivacyPress,
      showChevron: true,
    },
    {
      id: 2,
      title: "Terms and Conditions",
      subtitle: "User agreement and policies",
      icon: "document-text",
      onPress: handleTermsPress,
      showChevron: true,
    },
    {
      id: 3,
      title: "Security & Safety",
      subtitle: "Keep your account secure",
      icon: "lock-closed",
      onPress: handleSecurityPress,
      showChevron: true,
    },
    {
      id: 4,
      title: "Customer Support",
      subtitle: "Get help and contact us",
      icon: "headset",
      onPress: handleSupportPress,
      showChevron: true,
    },
    {
      id: 5,
      title: "Send Feedback",
      subtitle: "Help us improve the app",
      icon: "chatbubble-ellipses",
      onPress: handleFeedbackPress,
      showChevron: true,
    },
    {
      id: 6,
      title: "About Cash Elan",
      subtitle: "App version and information",
      icon: "information-circle",
      onPress: handleAboutPress,
      showChevron: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: "/(tabs)/homepage",
            params: { uid: uid },
          })} 
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info Section */}
        <View style={styles.appInfoSection}>
          <View style={styles.appLogoContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Cash Élan</Text>
          <Text style={styles.appTagline}>Your Digital Banking Partner</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Legal & Support</Text>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={22} color="#FFBD00" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              {item.showChevron && (
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Cash Elan. All rights reserved.</Text>
          <Text style={styles.madeWithLove}>Made with ❤️ in the Philippines</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => handleNavigation("home")}
        >
          <Ionicons 
            name="home" 
            size={22} 
            color={activeTab === "home" ? "#FFBD00" : "#999"} 
          />
          <Text style={[styles.navLabel, { color: activeTab === "home" ? "#FFBD00" : "#8E8E93" }]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleNavigation("payments")}
        >
          <Ionicons 
            name="card-outline" 
            size={22} 
            color={activeTab === "payments" ? "#FFBD00" : "#999"} 
          />
          <Text style={[styles.navLabel, { color: activeTab === "payments" ? "#FFBD00" : "#8E8E93" }]}>
            Payments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.centralButton}
          onPress={() => router.push({
            pathname: "/(tabs)/qrcode",
            params: { uid: uid },
          })}
        >
          <View style={styles.centralButtonInner}>
            <Ionicons name="qr-code" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleNavigation("account")}
        >
          <Ionicons 
            name="person-outline" 
            size={22} 
            color={activeTab === "account" ? "#FFBD00" : "#999"} 
          />
          <Text style={[styles.navLabel, { color: activeTab === "account" ? "#FFBD00" : "#8E8E93" }]}>
            Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleNavigation("more")}
        >
          <Ionicons 
            name="ellipsis-horizontal" 
            size={22} 
            color="#FFBD00"
          />
          <Text style={[styles.navLabel, { color: '#FFBD00' }]}>
            More
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    flex: 1,
    paddingTop: 20,
  },
  appInfoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  appLogoContainer: {
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '400',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
    paddingBottom: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },
  versionSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  versionText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 4,
  },
  madeWithLove: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '400',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingHorizontal: 20,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 11,
    marginTop: 4,
    color: '#8E8E93',
    fontWeight: '500',
  },
  centralButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  centralButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFBD00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFBD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MoreScreen;