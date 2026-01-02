# Cash Elan Bank App 🏦

A production-ready mobile banking application built with React Native, Expo, and Firebase, featuring real OTP delivery, secure transactions, and enterprise-grade security.

---

## 🌟 Features

### Core Banking
- ✅ User authentication with real OTP (SMS & Email)
- ✅ Money transfers between accounts
- ✅ Transaction history with filtering
- ✅ Balance management
- ✅ Virtual debit card
- ✅ Bill payments (electricity, water, internet, etc.)
- ✅ Mobile load top-up
- ✅ QR code payments

### Security
- 🔐 Server-side OTP generation and validation
- 🔐 Real SMS delivery via Twilio
- 🔐 Real email delivery via SendGrid
- 🔐 Rate limiting (prevents brute force)
- 🔐 Input sanitization (XSS/SQL injection protection)
- 🔐 Data encryption for sensitive fields
- 🔐 Atomic transactions (no double-spending)
- 🔐 Daily/monthly transfer limits
- 🔐 Comprehensive Firestore security rules

### Additional Features
- 📱 Loan applications
- 💰 Investment options
- 📊 Transaction analytics
- 🔔 Transaction notifications
- 📄 Transaction receipts
- 👤 Profile management

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Firebase account
- Twilio account (for SMS)
- SendGrid account (for Email)

### Installation

1. **Clone or navigate to the project:**
   ```bash
   cd "Cash Elan Bank App"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase Functions:**
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. **Configure environment variables:**
   ```bash
   # Copy example files
   cp .env.example .env
   cp functions/.env.example functions/.env

   # Edit .env files with your credentials
   ```

5. **Deploy Backend:**
   ```bash
   # Deploy Cloud Functions
   firebase deploy --only functions

   # Deploy Security Rules
   firebase deploy --only firestore:rules,firestore:indexes
   ```

6. **Run the app:**
   ```bash
   npm start
   ```

---

## 📖 Getting Started

This is a full-featured banking application with real OTP delivery and enterprise-grade security features. Follow the installation steps below to set up the project.

---

## 🏗️ Architecture

### Frontend (React Native + Expo)
- **Framework:** React Native 0.76.8
- **Runtime:** Expo 52
- **Language:** TypeScript 5.3.3
- **Navigation:** Expo Router
- **State:** React Hooks + AsyncStorage

### Backend (Firebase)
- **Functions:** Cloud Functions (Node.js 18)
- **Database:** Firestore
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage

### Third-Party Services
- **SMS:** Twilio
- **Email:** SendGrid
- **Analytics:** Firebase Analytics

---

## 📂 Project Structure

```
Cash Elan Bank App/
├── app/(tabs)/              # Mobile app screens (50+ screens)
├── components/              # Reusable UI components
├── utils/                   # Utility functions
│   └── cloudFunctions.ts   # Backend helper utilities
├── functions/               # Backend Cloud Functions
│   ├── src/
│   │   ├── auth/           # Authentication functions
│   │   ├── transactions/   # Transaction processing
│   │   ├── notifications/  # SMS & Email delivery
│   │   └── utils/          # Security utilities
│   └── package.json
├── assets/                  # Images, fonts, etc.
├── FirebaseConfig.ts        # Firebase initialization
├── firestore.rules          # Database security rules
├── firestore.indexes.json   # Query optimization
└── Documentation/           # Guides and documentation
```

---

## 🔧 Available Scripts

### Mobile App
```bash
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm test           # Run tests
```

### Backend Functions
```bash
cd functions
npm run build      # Build TypeScript
npm run deploy     # Deploy to Firebase
npm run serve      # Test locally
npm run logs       # View function logs
```

### Firebase
```bash
firebase deploy --only functions              # Deploy functions
firebase deploy --only firestore:rules        # Deploy security rules
firebase deploy --only firestore:indexes      # Deploy indexes
firebase functions:log                        # View logs
```

---

## 🔐 Security Features

### Authentication
- Email/password authentication
- OTP verification for sensitive operations
- Session management with timeout
- Rate limiting (5 OTP requests/hour)

### Data Protection
- AES encryption for sensitive data
- Input sanitization (XSS/SQL injection prevention)
- Timing-safe OTP validation (prevents timing attacks)
- Server-side validation for all operations

### Transaction Security
- Atomic transactions (no partial updates)
- Balance validation on server
- Daily transfer limit: PHP 50,000
- Monthly transfer limit: PHP 500,000
- OTP required for all transfers

### Database Security
- Firestore security rules enforced
- Users can only access their own data
- Critical fields cannot be modified from client
- All writes logged and auditable

---

## 💰 Cost Estimate

### Free Tier (Good for development + small scale)
- Firebase Functions: 125K invocations/month
- Firestore: 50K reads, 20K writes/day
- Firebase Auth: Unlimited
- SendGrid: 100 emails/day
- Twilio: $15 free credit

### Production (1,000 active users/month)
- Firebase: $0 (within free tier)
- SendGrid: $0 (100 emails/day FREE)
- Twilio SMS: ~$24/month
- **Total: ~$24/month**

---

## 🚀 Deployment

### Development
```bash
# Set up environment
cp .env.example .env
cp functions/.env.example functions/.env

# Edit with your credentials
# Then deploy
firebase deploy --only functions,firestore:rules,firestore:indexes
```

### Production
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions:
1. Set up Twilio account
2. Set up SendGrid account
3. Configure environment variables
4. Deploy Cloud Functions
5. Deploy security rules
6. Test thoroughly

---

## 🧪 Testing

### Test OTP Delivery
```bash
# Using Firebase Functions shell
cd functions
npm run serve

# In the shell:
sendOTP({
  userId: "test123",
  email: "your@email.com",
  phoneNumber: "+639171234567",
  operationType: "login",
  deliveryMethod: "email"
})
```

### Test Transfer
Test the transfer functionality through the mobile app after deployment.

---

## 📊 Features Roadmap

### ✅ Completed
- Server-side OTP system
- Real SMS/Email delivery
- Secure transaction processing
- Rate limiting
- Input validation & sanitization
- Data encryption
- Firestore security rules

### 🔄 Planned
- Biometric authentication
- Push notifications
- Transaction export (PDF/CSV)
- Card freeze/unfreeze
- Fraud detection algorithms
- Scheduled transfers
- Receipt generation

---

## 🤝 Contributing

This is a private banking application. For security reasons, contributions are limited to authorized developers only.

---

## 📄 License

Proprietary - Cash Elan Bank App
All rights reserved.

---

## 🙏 Acknowledgments

Built with:
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Firebase](https://firebase.google.com/)
- [Twilio](https://www.twilio.com/)
- [SendGrid](https://sendgrid.com/)

---

## 📞 Support

For issues or questions:
1. Check Firebase Console logs
2. Review function deployment logs
3. Open an issue on GitHub

---

## 👨‍💻 Developer

**Lanz Andrei Colico**
- GitHub: [@LA-Colico](https://github.com/LA-Colico)
- Project: [Cash Elan Bank App](https://github.com/LA-Colico/Cash-Elan-Bank-App)

---

**Version:** 1.0.0
**Last Updated:** January 2, 2026
