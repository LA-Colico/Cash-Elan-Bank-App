import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView } from 'expo-camera';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';
import QRCode from 'react-native-qrcode-svg';

const { width: screenWidth } = Dimensions.get('window');

interface UserData {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  balance?: number;
  email?: string;
  mobile?: string;
  accountNumber?: string;
}

interface BarcodeScanningResult {
  type: string;
  data: string;
}

const QRCodeScreen = () => {
  const router = useRouter();
  const { uid } = useLocalSearchParams();
  
  const [currentView, setCurrentView] = useState<'menu' | 'generate' | 'scan'>('menu');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const qrRef = useRef<View>(null);

  useEffect(() => {
    fetchUserData();
  }, [uid]);

  const fetchUserData = async () => {
    if (typeof uid === "string") {
      try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserData({ id: userDocSnap.id, ...userDocSnap.data() } as UserData);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    }
  };

  const getDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userData?.name || "User";
  };

  const getMaskedAccountNumber = () => {
    if (userData?.accountNumber) {
      return `••• ••• ••• ${userData.accountNumber.slice(-4)}`;
    }
    return userData?.id ? `••• ••• ••• ${userData.id.slice(-4)}` : "••• ••• ••• ••••";
  };

  const getQRData = () => {
    return JSON.stringify({
      type: 'CASH_ELAN_ACCOUNT',
      accountNumber: userData?.accountNumber || userData?.id,
      name: getDisplayName(),
      bank: 'CASH ELAN'
    });
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  const handleScanPress = async () => {
    const hasPermissionResult = await requestCameraPermission();
    if (hasPermissionResult) {
      setCurrentView('scan');
      setScanned(false);
    } else {
      Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
    }
  };

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (!scanned) {
      setScanned(true);
      try {
        const qrData = JSON.parse(data);
        if (qrData.type === 'CASH_ELAN_ACCOUNT') {
          Alert.alert(
            'QR Code Scanned Successfully',
            `Account: ${qrData.name}\nAccount Number: ${qrData.accountNumber}`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
              { text: 'Proceed to Transfer', onPress: () => proceedToTransfer(qrData) }
            ]
          );
        } else {
          Alert.alert('Invalid QR Code', 'This QR code is not supported.', [
            { text: 'OK', onPress: () => setScanned(false) }
          ]);
        }
      } catch (error) {
        Alert.alert('Invalid QR Code', 'Unable to read QR code data.', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
      }
    }
  };

  const proceedToTransfer = (qrData: any) => {
    setCurrentView('menu');
    router.push({
      pathname: '/(tabs)/transfer',
      params: {
        uid: uid,
        recipientName: qrData.name,
        recipientAccount: qrData.accountNumber,
      },
    });
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      Alert.alert('Feature Coming Soon', 'Upload QR code from gallery will be available soon.');
    }
  };

  const shareQRCode = async () => {
    try {
      if (qrRef.current) {
        const uri = await captureRef(qrRef.current, {
          format: 'png',
          quality: 1,
        });
        
        Alert.alert('QR Code Captured', 'QR code sharing feature coming soon.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture QR code.');
    }
  };

  const saveQRCode = async () => {
    try {
      if (qrRef.current) {
        const uri = await captureRef(qrRef.current, {
          format: 'png',
          quality: 1,
        });
        
        if (Platform.OS === 'ios') {
          await MediaLibrary.saveToLibraryAsync(uri);
        } else {
          const permission = await MediaLibrary.requestPermissionsAsync();
          if (permission.granted) {
            await MediaLibrary.saveToLibraryAsync(uri);
          }
        }
        
        Alert.alert('Success', 'QR code saved to your photo library.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save QR code.');
    }
  };

  const renderMenu = () => (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.serviceCard} 
          onPress={() => setCurrentView('generate')}
        >
          <View style={styles.serviceIcon}>
            <Ionicons name="qr-code" size={24} color="#FFBD00" />
          </View>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceTitle}>Generate QR Code</Text>
            <Text style={styles.serviceSubtitle}>Create a QR code to securely share your account</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.serviceCard} 
          onPress={handleScanPress}
        >
          <View style={styles.serviceIcon}>
            <Ionicons name="scan" size={24} color="#FFBD00" />
          </View>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceTitle}>Scan QR Code</Text>
            <Text style={styles.serviceSubtitle}>Scan a QR code to transfer money instantly</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGenerateQR = () => (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate QR Code</Text>
        <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* QR Code Card */}
      <View style={styles.qrCardContainer}>
        <View style={styles.qrCard} ref={qrRef}>
          <View style={styles.qrHeader}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>₽</Text>
              </View>
            </View>
            <Text style={styles.bankName}>CASH ELAN</Text>
          </View>

          <Text style={styles.accountHolderName}>{getDisplayName()}</Text>
          <Text style={styles.accountDetails}>
            ACCOUNT NUMBER - {getMaskedAccountNumber()}
          </Text>

          <View style={styles.qrCodeContainer}>
            <QRCode
              value={getQRData()}
              size={180}
              backgroundColor="white"
              color="black"
            />
            <View style={styles.qrOverlay}>
              <View style={styles.instaPay}>
                <Text style={styles.instaPayText}>Cash</Text>
                <Text style={styles.payText}>Elan</Text>
              </View>
            </View>
          </View>

          <View style={styles.qrFooter}>
            <Text style={styles.qrFooterText}>Show this QR code to receive money</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={shareQRCode}>
            <Ionicons name="share" size={20} color="#1C1C1E" />
            <Text style={styles.buttonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={saveQRCode}>
            <Ionicons name="download" size={20} color="#1C1C1E" />
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderScanQR = () => (
    <View style={styles.scanContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.scanHeader}>
        <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.scanBackButton}>
          <Ionicons name="chevron-back" size={24} color="#FFBD00" />
        </TouchableOpacity>
        <Text style={styles.scanHeaderTitle}>Scan QR Code</Text>
        <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.scanCloseButton}>
          <Ionicons name="close" size={24} color="#FFBD00" />
        </TouchableOpacity>
      </View>

      <Text style={styles.scanInstructions}>
        Point the camera to the QR Code to scan
      </Text>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {hasPermission && (
          <CameraView
            style={styles.camera}
            facing="back"
            flash={flashOn ? 'on' : 'off'}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                
                {/* Scan Line Animation */}
                <View style={styles.scanLine} />
              </View>
              
              <Text style={styles.scanHint}>
                Align QR code within the frame
              </Text>
            </View>
          </CameraView>
        )}
      </View>

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={pickImageFromGallery}>
        <View style={styles.uploadIconContainer}>
          <Ionicons name="image" size={20} color="#1C1C1E" />
        </View>
        <Text style={styles.uploadText}>Upload from gallery</Text>
      </TouchableOpacity>

      {/* Flash Toggle */}
      <TouchableOpacity 
        style={[styles.flashButton, flashOn && styles.flashButtonActive]} 
        onPress={() => setFlashOn(!flashOn)}
      >
        <Ionicons 
          name={flashOn ? "flash" : "flash-off"} 
          size={24} 
          color={flashOn ? "#1C1C1E" : "#FFBD00"} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {currentView === 'menu' && renderMenu()}
      {currentView === 'generate' && renderGenerateQR()}
      {currentView === 'scan' && renderScanQR()}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  
  optionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
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

  // QR Generation
  qrCardContainer: {
    paddingHorizontal: 20,
    flex: 1,
    marginTop: 20,
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 30,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFBD00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 2,
  },
  accountHolderName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  accountDetails: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 30,
    letterSpacing: 1,
    textAlign: 'center',
  },
  qrCodeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  qrOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instaPay: {
    backgroundColor: '#FFBD00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
  },
  instaPayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  payText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  qrFooter: {
    alignItems: 'center',
  },
  qrFooterText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#FFBD00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#FFBD00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
  },
  buttonText: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Scanner
  scanContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 189, 0, 0.3)',
  },
  scanBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFBD00',
    flex: 1,
    textAlign: 'center',
  },
  scanCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanInstructions: {
    color: '#FFBD00',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 24,
    fontWeight: '500',
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFBD00',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#FFBD00',
    opacity: 0.8,
  },
  scanHint: {
    color: '#FFBD00',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 40,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#FFBD00',
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  uploadText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  flashButton: {
    position: 'absolute',
    top: 100,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButtonActive: {
    backgroundColor: '#FFBD00',
  },
});

export default QRCodeScreen;