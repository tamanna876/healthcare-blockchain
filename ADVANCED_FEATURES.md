# Healthcare Blockchain - Advanced Features Guide

## 🎯 Overview

यह document सभी advanced blockchain features को explain करता है जो healthcare system में implement किए गए हैं।

---

## 1. Smart Contracts Automation

### 1.1 Automated Donor Notifications

**Feature:** जब खून या अंग की जरूरत हो, तो automatically compatible donors को notify किया जाता है।

**Smart Contracts:**
- `EnhancedBloodDonation.sol` - Blood donation matching
- `EnhancedOrganDonation.sol` - Organ donation matching with geo-location

**कैसे काम करता है:**

```solidity
function createBloodRequest(...) returns (uint256) {
    // Automatically notifyMatchingDonors() call होती है
    notifyMatchingDonors(requestId, bloodGroup, location);
}
```

**API Endpoint:**
```
POST /api/donations/blood/request
Body: {
  "bloodGroup": "O+",
  "location": "Delhi",
  "urgencyLevel": 4
}
```

---

## 2. Cryptocurrency Tokens & Rewards

### 2.1 HealthToken (HRT)

**Token Details:**
- **Name:** Health Reward Token
- **Symbol:** HRT
- **Decimals:** 18
- **Standard:** ERC20

**Reward System:**

| Action | Reward |
|--------|--------|
| Blood Donation | 2 HRT |
| Organ Donation | 5 HRT |
| Patient Assistance | 3 HRT |

**Smart Contract:** `HealthToken.sol`

**API Endpoints:**

```javascript
// Get user balance
GET /api/tokens/balance/:address

// Reward blood donor
POST /api/tokens/reward/blood-donor
Body: { "donorAddress": "0x..." }

// Reward organ donor
POST /api/tokens/reward/organ-donor
Body: { "donorAddress": "0x..." }

// Transfer tokens
POST /api/tokens/transfer
Body: {
  "fromAddress": "0x...",
  "toAddress": "0x...",
  "amount": "10"
}

// Get all token holders
GET /api/tokens/holders
```

---

## 3. NFT based Certificates

### 3.1 Digital Health Certificates

**Certificate Types:**
- Doctor License
- Pharmacist License
- Nurse Certificate
- Medical Specialty Certification

**Features:**
- ✅ Multi-signature issuance
- ✅ Expiry date management
- ✅ Revocation capability
- ✅ IPFS storage for metadata

**Smart Contract:** `HealthCertificateNFT.sol`

**API Endpoints:**

```javascript
// Issue certificate
POST /api/certificates/issue
Body: {
  "recipientAddress": "0x...",
  "recipientName": "Dr. Sharma",
  "certificateType": "Doctor",
  "licenseNumber": "MED12345",
  "validityYears": 5,
  "issuedBy": "0x...",
  "ipfsHash": "QmXxxx..."
}

// Verify certificate
GET /api/certificates/verify/:certificateId

// Get user certificates
GET /api/certificates/user/:address

// Revoke certificate
POST /api/certificates/revoke/:certificateId
Body: {
  "revokedBy": "0xAdmin",
  "reason": "License suspended"
}
```

---

## 4. Multi-Signature Transactions

### 4.1 Multi-Sig Approval Process

**आवश्यकता:** Critical decisions के लिए कई authorities की approval जरूरी होती है।

**Workflows:**

#### Blood Donation:
```
Request Created → Doctor 1 Approves → Doctor 2 Approves → (Majority Reached) → Fulfilled
```

#### Organ Donation:
```
Request Created → Authority 1 Approves → Authority 2 Approves → Authority 3 Approves → Executed
```

**Smart Contracts:**
- `EnhancedBloodDonation.sol` - 2 out of n signatures
- `EnhancedOrganDonation.sol` - 3 out of 5 signatures

**API Endpoints:**

```javascript
// Create approval request
POST /api/approvals/request
Body: {
  "transactionType": "organ-donation",
  "data": { "organ": "Heart", "bloodGroup": "A+" },
  "createdBy": "0xPatient",
  "requiredApprovals": 3
}

// Approve request
POST /api/approvals/approve/:requestId
Body: {
  "signerAddress": "0xDoctor1",
  "signature": "0x..."
}

// Get request status
GET /api/approvals/:requestId

// Get all pending approvals
GET /api/approvals?status=PENDING

// Reject request
POST /api/approvals/reject/:requestId
Body: {
  "rejectedBy": "0x...",
  "reason": "Insufficient information"
}
```

---

## 5. Privacy & Encryption

### 5.1 AES-256-GCM Encryption

**Features:**
- AES-256 symmetric encryption
- HMAC-SHA256 authentication
- Random IV generation
- Auth tag verification

**Protected Data:**
- Medical Records
- Prescription Details
- Genetic Information
- Personal Health Data

**Service:** `backend/services/encryption.js`

**API Endpoints:**

```javascript
// Encrypt data
POST /api/encrypt
Body: {
  "data": { "medicalHistory": {...} },
  "key": "your-encryption-key"
}

Response: {
  "iv": "hex-encoded-iv",
  "encryptedData": "encrypted-content",
  "authTag": "authentication-tag",
  "timestamp": 1234567890
}

// Decrypt data
POST /api/decrypt
Body: {
  "encryptedData": {
    "iv": "...",
    "encryptedData": "...",
    "authTag": "..."
  },
  "key": "your-encryption-key"
}
```

**Usage Example:**

```javascript
const encryptionService = require('./services/encryption');

// Encrypt
const sensitiveData = { ssn: "123-45-6789", medicalRecord: "..." };
const encrypted = encryptionService.encrypt(sensitiveData, masterKey);

// Store encrypted data
await database.save(encrypted);

// Later: Decrypt
const decrypted = encryptionService.decrypt(encrypted, masterKey);
```

---

## 6. Automated Notifications

### 6.1 Multi-Channel Notification System

**Channels:**
- 📧 Email
- 📱 SMS (via Twilio/AWS SNS)
- 🔔 In-app notifications

**Notification Types:**

| Type | Trigger | Priority |
|------|---------|----------|
| Blood Request | O+ blood needed | Normal/High |
| Organ Request | Heart urgently needed | High/Critical |
| Certificate Alert | License expiring in 30 days | Normal |
| Emergency Alert | Medical emergency | Critical |

**Service:** `backend/services/notifications.js`

**API Endpoints:**

```javascript
// Subscribe to notifications
POST /api/notifications/subscribe
Body: {
  "walletAddress": "0x...",
  "preferences": {
    "email": "user@example.com",
    "phone": "+91-9876543210",
    "bloodDonationAlerts": true,
    "organDonationAlerts": true,
    "emergencyAlerts": true,
    "certificateAlerts": true
  }
}

// Get user notifications
GET /api/notifications/user/:address?unreadOnly=true

// Mark as read
POST /api/notifications/:notificationId/read

// Create blood request (with auto-notify)
POST /api/donations/blood/request
Body: {
  "bloodGroup": "A+",
  "location": "Mumbai",
  "urgencyLevel": 5
}

// Create organ request (with auto-notify)
POST /api/donations/organ/request
Body: {
  "organ": "Kidney",
  "bloodGroup": "B+",
  "location": "Bangalore",
  "urgency": 9
}
```

---

## 7. Decentralization Setup

### 7.1 Multi-Node Architecture

**Topology:**

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Nginx Load Balancer (Port 80)      │
└──┬─────────────────┬────────────────┬───┘
   │                 │                │
   │                 │                │
┌──▼───┐          ┌──▼───┐         ┌──▼───┐
│Node 1│          │Node 2│         │Node 3│
│:5000 │          │:5001 │         │:5002 │
└──┬───┘          └──┬───┘         └──┬───┘
   │                 │                │
   └─────────────────┼────────────────┘
                     │
              ┌──────▼──────┐
              │   MongoDB   │
              └─────────────┘
```

### 7.2 Docker Compose Setup

**File:** `docker-compose.yml`

**Components:**
- **3 Backend Nodes** - Round-robin, weighted load balancing
- **MongoDB** - Distributed data store
- **Nginx** - Load balancer with caching
- **Frontend** - Static serving

**Start All Services:**

```bash
docker-compose up -d

# Node 1: http://localhost:5000
# Node 2: http://localhost:5001
# Node 3: http://localhost:5002
# Nginx: http://localhost:80
# Frontend: http://localhost:3000
```

**Node Synchronization:**

```
Node 1 ←→ Node 2 ←→ Node 3
```

Each node syncs with others through peer announcements.

---

## 8. Complete Workflow Examples

### 8.1 Blood Donation Workflow

```
1. Donor Registration
   POST /api/donations/register
   
2. Patient needs blood
   POST /api/donations/blood/request
   
3. Donors receive notification (automatic)
   GET /api/notifications/user/:address
   
4. Multi-sig approval
   POST /api/approvals/request
   POST /api/approvals/approve/:requestId (by 2 doctors)
   
5. Donor rewarded
   POST /api/tokens/reward/blood-donor
```

### 8.2 Doctor License Verification

```
1. Issue Certificate (Multi-sig)
   POST /api/certificates/issue
   
2. Doctor can share certificate
   GET /api/certificates/user/0xDoctor
   
3. Verify anywhere
   GET /api/certificates/verify/certId
   
4. Can be revoked if needed
   POST /api/certificates/revoke/certId
```

### 8.3 Sensitive Data Protection

```
1. Medical Record created
   data = { symptoms, diagnosis, prescription }
   
2. Encrypt before storing
   POST /api/encrypt
   
3. Store encrypted data in blockchain
   
4. On retrieval, decrypt
   POST /api/decrypt
```

---

## 9. Environment Variables

**Create `.env` file:**

```bash
# Basic
PORT=5000
NODE_ENV=production

# Blockchain
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=0x...
MEDICAL_RECORDS_ADDRESS=0x...
BLOOD_DONATION_ADDRESS=0x...
ORGAN_DONATION_ADDRESS=0x...

# Database
MONGODB_URI=mongodb://admin:password@mongodb:27017/healthcare

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=noreply@healthblockchain.com

# Frontend
FRONTEND_URL=http://localhost:3000

# IPFS
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
```

---

## 10. Deployment Checklist

- [ ] Smart Contracts deployed to testnet
- [ ] Environment variables configured
- [ ] Docker images built
- [ ] Multi-node setup tested
- [ ] Load balancer validated
- [ ] Encryption keys generated and secured
- [ ] Database backups configured
- [ ] Monitoring alerts setup
- [ ] SSL certificates installed
- [ ] Production hardening applied

---

## 11. Security Best Practices

✅ **Do's:**
- Always encrypt sensitive data
- Use multi-signature for critical operations
- Implement rate limiting
- Validate all inputs
- Keep private keys in secure vaults
- Regular security audits
- Monitor and log all transactions

❌ **Don'ts:**
- Never hardcode private keys
- Don't store plain text passwords
- Avoid single points of failure
- Don't skip input validation
- Avoid public key exposure
- Never skip security updates

---

## 12. Support & Documentation

- **Smart Contract Docs:** `/contracts/README.md`
- **API Documentation:** Swagger/OpenAPI spec
- **Frontend Guide:** `/frontend/README.md`
- **Deployment Guide:** `/DEPLOYMENT.md`

---

**Version:** 2.0 (Advanced Features)  
**Last Updated:** April 2026  
**Maintained By:** Healthcare Blockchain Team
