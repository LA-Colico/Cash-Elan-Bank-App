import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Switch
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ScheduledBill {
  id: string;
  provider: string;
  amount: string;
  frequency: string;
  nextPayment: string;
  isActive: boolean;
}

const ScheduleBillsScreen = () => {
  const router = useRouter();
  const { uid, accountNumber } = useLocalSearchParams();
  
  // Mock data for scheduled bills
  const [scheduledBills, setScheduledBills] = useState<ScheduledBill[]>([
    {
      id: '1',
      provider: 'Meralco',
      amount: '₱2,500.00',
      frequency: 'Monthly',
      nextPayment: 'Dec 15, 2024',
      isActive: true
    },
    {
      id: '2',
      provider: 'Manila Water',
      amount: '₱800.00',
      frequency: 'Monthly',
      nextPayment: 'Dec 20, 2024',
      isActive: false
    }
  ]);

  const toggleBillStatus = (id: string) => {
    setScheduledBills(bills => 
      bills.map(bill => 
        bill.id === id ? { ...bill, isActive: !bill.isActive } : bill
      )
    );
  };

  const handleAddSchedule = () => {
    // Navigate to add new schedule
    router.push({ pathname: './BillsPayment' as any, params: { uid, accountNumber } });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Bill Payments</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="calendar" size={24} color="#FFB800" />
          </View>
          <Text style={styles.infoText}>
            Set up automatic bill payments to never miss a due date. You can modify or cancel anytime.
          </Text>
        </View>

        {/* Scheduled Bills List */}
        <View style={styles.billsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Scheduled Bills</Text>
            <TouchableOpacity onPress={handleAddSchedule}>
              <Ionicons name="add-circle-outline" size={24} color="#FFB800" />
            </TouchableOpacity>
          </View>

          {scheduledBills.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No scheduled bills yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your first scheduled payment to get started
              </Text>
            </View>
          ) : (
            scheduledBills.map((bill) => (
              <View key={bill.id} style={styles.billItem}>
                <View style={styles.billInfo}>
                  <Text style={styles.billProvider}>{bill.provider}</Text>
                  <Text style={styles.billAmount}>{bill.amount}</Text>
                  <Text style={styles.billDetails}>
                    {bill.frequency} • Next: {bill.nextPayment}
                  </Text>
                </View>
                <Switch
                  value={bill.isActive}
                  onValueChange={() => toggleBillStatus(bill.id)}
                  trackColor={{ false: '#f0f0f0', true: '#FFB800' }}
                  thumbColor={bill.isActive ? '#fff' : '#fff'}
                />
              </View>
            ))
          )}
        </View>

        {/* Add New Schedule Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Schedule</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  billsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  billInfo: {
    flex: 1,
  },
  billProvider: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  billAmount: {
    color: '#FFB800',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  billDetails: {
    color: '#666',
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB800',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 32,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ScheduleBillsScreen;