import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from "expo-router";

const TransferFundsScreen = () => {
  const { uid } = useLocalSearchParams();

  interface UserData {
    name?: string;
    accountNumber?: string;
    deposit?: string;
    email?: string;
    mobile?: string;
    dateOfBirth?: Date;
    createdAt?: Date;
  }

  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('transfer');
  

  const tabs = ['All', 'Transfers', 'Bills Payment'];

  const recipients: any[] = [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.welcomeText}>Welcome Back!</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <View style={styles.notificationCircle}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsBar}>
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="qr-code-outline" size={32} color="#CDFF57" />
          <Text style={styles.actionText}>Scan QR</Text>
        </View>
        <Link href="/(tabs)/savings" style={{ alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="trending-up-outline" size={32} color="#CDFF57" />
            <Text style={styles.actionText}>Invest</Text>
          </View>
        </Link>
        <Link href="/(tabs)/paybills" style={{ alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={32} color="#CDFF57" />
            <Text style={styles.actionText}>Pay Bills</Text>
          </View>
        </Link>
        <Link href="/(tabs)/savings" style={{ alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="wallet-outline" size={32} color="#CDFF57" />
            <Text style={styles.actionText}>Savings</Text>
          </View>
        </Link>
      </View>

      <View style={styles.recipientsContainer}>
        <Text style={styles.recipientsTitle}>Saved recipients</Text>

        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="gray"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <ScrollView style={styles.recipientsList}>
          {recipients.length === 0 ? (
            <Text style={styles.emptyListText}>No saved recipients.</Text>
          ) : (
            recipients.map((recipient) => (
              <TouchableOpacity key={recipient.id} style={styles.recipientItem}>
                <Text style={styles.recipientName}>{recipient.name}</Text>
                <Text style={styles.recipientAccount}>{recipient.account}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.navButton, activeTab === "home" && styles.navButtonActive]}
            onPress={() => {
              setActiveTab("home");
              router.push({
                pathname: "/(tabs)/homepage",
                params: { uid },
              });
            }}
          >
            <Ionicons name="home" size={20} color={activeTab === "home" ? "#CDFF57" : "black"} />
            <Text style={[styles.navLabel, activeTab === "home" && styles.navLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, activeTab === "transfer" && styles.navButtonActive]}
            onPress={() => {
              setActiveTab("transfer");
              router.push({
                pathname: "/(tabs)/transferfund",
                params: { uid },
              });
            }}
          >
            <Ionicons name="swap-horizontal" size={20} color={activeTab === "transfer" ? "#CDFF57" : "black"} />
            <Text style={[styles.navLabel, activeTab === "transfer" && styles.navLabelActive]}>Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, activeTab === "history" && styles.navButtonActive]}
            onPress={() => {
              setActiveTab("history");
              router.push({
                pathname: "/(tabs)/history",
                params: { uid },
              });
            }}
          >
            <Ionicons name="document-text" size={20} color={activeTab === "history" ? "#CDFF57" : "black"} />
            <Text style={[styles.navLabel, activeTab === "history" && styles.navLabelActive]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, activeTab === "profile" && styles.navButtonActive]}
            onPress={() => {
              setActiveTab("profile");
              router.push({
                pathname: "/(tabs)/profile",
                params: { uid },
              });
            }}
          >
            <Ionicons name="person" size={20} color={activeTab === "profile" ? "#CDFF57" : "black"} />
            <Text style={[styles.navLabel, activeTab === "profile" && styles.navLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>

          </View>
        );
      };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  welcomeText: {
    color: '#CDFF57',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationButton: {
    padding: 8,
  },
  notificationCircle: {
    backgroundColor: '#CDFF57',
    borderRadius: 20,
    padding: 8,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  recipientsContainer: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    flex: 1,
  },
  recipientsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#444',
  },
  activeTab: {
    backgroundColor: '#CDFF57',
  },
  tabText: {
    color: '#B0B0B0',
  },
  activeTabText: {
    color: '#000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    color: '#B0B0B0',
  },
  recipientsList: {
    flex: 1,
  },
  recipientItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B0B0B0',
  },
  recipientAccount: {
    color: 'gray',
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#C6FF33",
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 3,
    borderColor: "#000",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },

  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 10,
  },

  navButtonActive: {
    backgroundColor: "#000",
  },

  navLabel: {
    fontSize: 11,
    marginTop: 3,
    color: "#000",
    fontWeight: "600",
    textAlign: 'center',
  },

  navLabelActive: {
    color: "#CDFF57",
  },

  navIconActive: {
    color: "#CDFF57",
  },

  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
    paddingHorizontal: 10,
  },

  actionText: { 
    color: "#CDFF57",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#B0B0B0',
  },
});

export default TransferFundsScreen; 
