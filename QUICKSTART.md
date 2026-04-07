# ⚡ Quick Start Guide - Healthcare Blockchain

## 5-Minute Setup

### 1. Setup Environment

```bash
cp .env.example .env
# Edit .env with your blockchain RPC URL and private key
```

### 2. Start Backend

```bash
cd backend
npm install
npm start
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open in Browser

```
http://localhost:5173
```

---

## Common API Calls

### 1. Blood Donation Request (with Auto-Notify Donors)

```bash
curl -X POST http://localhost:5000/api/donations/blood/request \
  -H "Content-Type: application/json" \
  -d '{
    "bloodGroup": "O+",
    "location": "Delhi",
    "urgencyLevel": 4
  }'

# Response:
# {
#   "message": "Blood donation request created and donors notified",
#   "notificationsSent": 12,
#   "notifications": [...]
# }
```

### 2. Get Token Balance

```bash
curl http://localhost:5000/api/tokens/balance/0x742d35Cc6634C0532925a3b844Bc9e7595f42aE8

# Response:
# {
#   "address": "0x742d35...",
#   "balance": "5000000000000000000",
#   "formattedBalance": "5.0"
# }
```

### 3. Reward Blood Donor

```bash
curl -X POST http://localhost:5000/api/tokens/reward/blood-donor \
  -H "Content-Type: application/json" \
  -d '{"donorAddress": "0x742d35..."}'
```

### 4. Issue Doctor Certificate

```bash
curl -X POST http://localhost:5000/api/certificates/issue \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "0xDoctor123",
    "recipientName": "Dr. Sharma",
    "certificateType": "Doctor",
    "licenseNumber": "MED12345",
    "validityYears": 5,
    "issuedBy": "0xAdmin",
    "ipfsHash": "QmXxxx"
  }'
```

### 5. Create Multi-Sig Approval Request

```bash
curl -X POST http://localhost:5000/api/approvals/request \
  -H "Content-Type: application/json" \
  -d '{
    "transactionType": "organ-donation",
    "data": {"organ": "Heart", "bloodGroup": "A+"},
    "createdBy": "0xPatient123",
    "requiredApprovals": 2
  }'
```

### 6. Approve Request

```bash
curl -X POST http://localhost:5000/api/approvals/approve/0 \
  -H "Content-Type: application/json" \
  -d '{
    "signerAddress": "0xDoctor1",
    "signature": "0x..."
  }'
```

### 7. Encrypt Sensitive Data

```bash
curl -X POST http://localhost:5000/api/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "data": {"ssn": "123-45-6789", "medicalRecord": "..."},
    "key": "super-secret-key"
  }'
```

### 8. Subscribe to Notifications

```bash
curl -X POST http://localhost:5000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35...",
    "preferences": {
      "email": "user@example.com",
      "phone": "+91-9876543210",
      "bloodDonationAlerts": true,
      "organDonationAlerts": true,
      "emergencyAlerts": true
    }
  }'
```

---

## Multi-Node Setup (Docker)

```bash
# Start all 3 nodes + MongoDB + LoadBalancer
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend-node-1

# Stop all services
docker-compose down
```

---

## Key Features Demo

### ✅ Automated Donor Notifications

```
1. Patient needs blood → createBloodRequest()
2. System finds O+ donors → notifyMatchingDonors()
3. Donors automatically get SMS/Email
4. Donor responds → System processes
```

### ✅ Token Rewards

```
1. Blood Donor gives blood → rewardBloodDonor()
2. Donor receives 2 HRT tokens
3. Can transfer/use tokens
4. Check balance anytime
```

### ✅ Digital Certificates (NFT)

```
1. Issue certificate → POST /api/certificates/issue
2. Certificate is NFT (unique digital asset)
3. Can verify anywhere → GET /api/certificates/verify/:id
4. Can revoke if needed → POST /api/certificates/revoke/:id
```

### ✅ Multi-Signature Approval

```
1. Create approval request
2. Doctor 1 approves (signature)
3. Doctor 2 approves (signature)
4. If majority reached → Transaction proceeds
```

### ✅ Encrypted Data Storage

```
1. Sensitive data → POST /api/encrypt
2. Returns encrypted + auth tag
3. Store encrypted data safely
4. Later → POST /api/decrypt (get original)
```

### ✅ Auto-Notifications

```
1. Subscribe for alerts
2. System monitors events
3. Auto-notify via Email/SMS
4. Mark as read when done
```

---

## Database Schema

### Users
```javascript
{
  _id: "...",
  address: "0x...",
  name: "John",
  email: "john@example.com",
  phone: "+91...",
  role: "donor|doctor|patient|admin"
}
```

### Blood Requests
```javascript
{
  _id: "...",
  requester: "0x...",
  bloodGroup: "O+",
  location: "Delhi",
  urgencyLevel: 4,
  fulfilled: false,
  donors_notified: 12,
  created_at: "2026-04-07T10:00:00Z"
}
```

### Tokens
```javascript
{
  address: "0x...",
  balance: 5000000000000000000,  // in wei
  transactions: [...]
}
```

---

## Environment Variables You MUST Set

```bash
# Blockchain (required)
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x...
MEDICAL_RECORDS_ADDRESS=0x...

# Database
MONGODB_URI=mongodb://admin:pass@localhost:27017/healthcare

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` | Backend not running - `npm start` in backend/ |
| `MongoDB connection error` | Start MongoDB - `docker run -d -p 27017:27017 mongo` |
| `Contract not deployed` | Deploy contracts and update .env addresses |
| `Port already in use` | Kill process: `lsof -i :5000 \| grep LISTEN \| awk '{print $2}' \| xargs kill` |
| `Encryption key error` | Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

---

## Next Steps

1. **Read Full Docs:** `/ADVANCED_FEATURES.md`
2. **Deploy Guide:** `/DEPLOYMENT_GUIDE.md`
3. **Smart Contracts:** `/contracts/README.md`
4. **API Reference:** Check Swagger at `http://localhost:5000/api-docs`

---

## Support

- 📖 Documentation: `/ADVANCED_FEATURES.md`
- 🐛 Report Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📧 Email: support@healthblockchain.com

---

**Happy Coding! 🚀**
