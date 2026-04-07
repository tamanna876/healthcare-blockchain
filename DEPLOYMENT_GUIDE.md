# 🚀 Healthcare Blockchain - Complete Deployment Guide

## Prerequisites

```bash
# Node.js 18+
node --version

# Docker & Docker Compose
docker --version
docker-compose --version

# Git
git --version
```

---

## Step 1: Clone & Setup

```bash
# Clone repository
git clone <your-repo-url>
cd healthcare-blockchain-main

# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

---

## Step 2: Deploy Smart Contracts

### Option A: Using Hardhat (Local Network)

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### Option B: Manual Deployment

```bash
# Using Remix IDE - https://remix.ethereum.org
# 1. Copy contract code
# 2. Compile
# 3. Deploy with your wallet
# 4. Copy contract addresses to .env
```

**Contracts to Deploy:**
1. `HealthToken.sol` - ERC20 token
2. `HealthCertificateNFT.sol` - NFT certificates
3. `EnhancedBloodDonation.sol` - Blood system
4. `EnhancedOrganDonation.sol` - Organ system
5. `MedicineVerification.sol` - Medicine tracking

---

## Step 3: Backend Setup (Single Node)

```bash
cd backend

# Install dependencies
npm install

# Start MongoDB
# Option 1: Local
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo:6.0

# Option 2: Using Docker Compose (see Step 4)

# Initialize database
npm run db:seed

# Start backend
npm start
# OR for development with auto-reload
npm run dev
```

---

## Step 4: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

---

## Step 5: Multi-Node Decentralized Deployment

### Using Docker Compose

```bash
# Ensure .env is configured with all required addresses

# Build images
docker-compose build

# Start all services
docker-compose up -d

# Services will be available at:
# - Backend Node 1: http://localhost:5000
# - Backend Node 2: http://localhost:5001
# - Backend Node 3: http://localhost:5002
# - Nginx Load Balancer: http://localhost:80
# - Frontend: http://localhost:3000

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Multi-Node Setup

```bash
# Terminal 1: Start Node 1
export NODE_NAME=node-1
export PORT=5000
npm start

# Terminal 2: Start Node 2
export NODE_NAME=node-2
export PORT=5001
export PRIVATE_KEY=0x... (different key)
npm start

# Terminal 3: Start Node 3
export NODE_NAME=node-3
export PORT=5002
export PRIVATE_KEY=0x... (different key)
npm start

# Terminal 4: Start Nginx (if installed)
nginx -c /path/to/nginx.conf

# Terminal 5: Start Frontend
cd frontend && npm run dev
```

---

## Step 6: Verify Setup

```bash
# Check backend health
curl http://localhost:5000/health

# Check all nodes (if multi-node)
curl http://localhost:5000/health
curl http://localhost:5001/health
curl http://localhost:5002/health

# List token holders
curl http://localhost:5000/api/tokens/holders

# Test encryption
curl -X POST http://localhost:5000/api/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data": {"test": "data"}, "key": "secret-key"}'
```

---

## Step 7: Database Migrations

```bash
# Create indexes
npm run db:index

# Backup database
npm run db:backup

# Restore database
npm run db:restore backup-name

# Seed test data
npm run db:seed
```

---

## Step 8: Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## Step 9: Production Deployment

### AWS EC2 Deployment

```bash
# 1. SSH into instance
ssh -i key.pem ec2-user@your-instance-ip

# 2. Install dependencies
sudo yum update -y
sudo yum install nodejs npm docker -y
sudo systemctl start docker

# 3. Clone repo
git clone <repo-url>
cd healthcare-blockchain-main

# 4. Setup environment
cp .env.example .env
# Edit .env with production values

# 5. Start with Docker
docker-compose up -d

# 6. Setup SSL
sudo apt-get install certbot
sudo certbot certonly -d yourdomain.com

# 7. Update nginx.conf with SSL
# Uncomment HTTPS section in nginx.conf
```

### Google Cloud Run Deployment

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/healthcare-backend

# Deploy
gcloud run deploy healthcare-backend \
  --image gcr.io/PROJECT-ID/healthcare-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars RPC_URL=...,PRIVATE_KEY=...,etc
```

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add MongoDB addon
heroku addons:create mongolab

# Set environment variables
heroku config:set RPC_URL=...
heroku config:set PRIVATE_KEY=...

# Deploy
git push heroku main
```

---

## Step 10: Monitoring & Maintenance

### Health Checks

```bash
#!/bin/bash
while true; do
  for port in 5000 5001 5002; do
    status=$(curl -s http://localhost:$port/health | jq .status)
    echo "Port $port: $status"
  done
  sleep 60
done
```

### Log Monitoring

```bash
# Backend logs
tail -f backend/logs/app.log

# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend-node-1
```

### Database Maintenance

```bash
# Backup every day at 2 AM
0 2 * * * /path/to/backup.sh

# Cleanup old notifications (every week)
0 0 * * 0 /path/to/cleanup-notifications.sh
```

---

## Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -i :5000

# Kill process
kill -9 <PID>

# Check error logs
npm run dev (sees logs directly)
```

### Database connection error
```bash
# Verify MongoDB is running
docker ps | grep mongo

# Check connection string in .env
echo $MONGODB_URI

# Test connection
mongo "mongodb://admin:password@localhost:27017/healthcare?authSource=admin"
```

### Blockchain contract not found
```bash
# Verify contract addresses in .env
cat .env | grep _ADDRESS

# Check deployment status
npx hardhat run scripts/check-contracts.js --network sepolia
```

### Load balancer not routing properly
```bash
# Test individual nodes
curl http://localhost:5000/health
curl http://localhost:5001/health
curl http://localhost:5002/health

# Test load balancer
curl http://localhost:80/health

# Check nginx config
nginx -t
```

---

## Performance Tuning

### Database Optimization

```javascript
// Create indexes
db.Users.createIndex({ email: 1 });
db.BloodRequests.createIndex({ urgencyLevel: -1 });
db.Notifications.createIndex({ recipient: 1, read: 1 });
```

### Caching Strategy

```javascript
// Enable Redis caching
const redis = new Redis(process.env.REDIS_URL);
app.use(cacheMiddleware(redis));
```

### Load Balancing Weights

```nginx
upstream backend_nodes {
    server backend-node-1:5000 weight=3;  # Handles 50% requests
    server backend-node-2:5000 weight=2;  # Handles 33% requests
    server backend-node-3:5000 weight=1;  # Handles 17% requests
}
```

---

## Security Hardening

```bash
# 1. Update all packages
npm audit fix

# 2. Generate SSL certificates
certbot certonly -d yourdomain.com

# 3. Setup firewall
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# 4. Rotate encryption keys
npm run rotate-encryption-keys

# 5. Setup backup vault
aws s3 mb s3://your-backup-bucket
aws s3api put-bucket-versioning --bucket your-backup-bucket --versioning-configuration Status=Enabled
```

---

## Scaling for Production

```yaml
# kubernetes-deployment.yaml (for high traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: healthcare-backend
spec:
  replicas: 5
  selector:
    matchLabels:
      app: healthcare-backend
  template:
    metadata:
      labels:
        app: healthcare-backend
    spec:
      containers:
      - name: backend
        image: healthcare-backend:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

---

## Support Resources

- **Documentation:** `/ADVANCED_FEATURES.md`
- **API Docs:** `http://localhost:5000/api-docs`
- **Smart Contracts:** `/contracts/README.md`
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

---

**Last Updated:** April 2026  
**Version:** 2.0
