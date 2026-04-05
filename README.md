# Healthcare Trust

Healthcare Trust is a full-stack healthcare platform that combines a React frontend, an Express and MongoDB backend, Ethereum smart contracts, and IPFS-backed record storage. The project is built as an academic major-project style system, but it is structured like a production-ready demo with role-based access, modular services, and automated tests.

## What It Includes

- Blockchain-linked medical records
- Patient appointments and scheduling
- Prescription and refill workflows
- Blood and organ donor registries
- Medicine verification
- Clinical trial management
- Family access controls
- Health education support programs
- Women health reminders
- AI assistant and emergency SOS experiences

## Roles

- Patient
- Doctor
- Pharmacy
- Hospital
- Admin

## Architecture

```text
React + Vite frontend
        |
        v
Express API
        |
        v
MongoDB
        |
        +--> IPFS for file-backed medical records
        |
        +--> Hardhat / Solidity contracts on Ethereum-compatible networks
```

## Tech Stack

- Frontend: React 19, Vite, React Router, Tailwind CSS, Recharts
- Backend: Node.js, Express 5, Mongoose, JWT, bcryptjs, multer
- Blockchain: Hardhat, Solidity, ethers.js
- Storage: MongoDB, IPFS
- Testing: Vitest, Jest, Supertest

## Repository Layout

```text
backend/     Express API, models, routes, tests
contracts/   Solidity contracts
frontend/    React app
scripts/     Hardhat deployment scripts
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- Optional: a local Ethereum JSON-RPC node such as Hardhat

## Environment Variables

Backend configuration lives in `backend/.env`.

Required backend values:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PRIVATE_KEY`
- `RPC_URL`
- `MEDICAL_RECORDS_ADDRESS`
- `BLOOD_DONATION_ADDRESS`
- `ORGAN_DONATION_ADDRESS`
- `MEDICINE_VERIFICATION_ADDRESS`
- `IPFS_HOST`
- `IPFS_PORT`
- `IPFS_PROTOCOL`
- `FRONTEND_URL`

Frontend configuration lives in `frontend/.env`.

Required frontend values:

- `VITE_API_URL`

## Setup

### 1. Install dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start MongoDB

Point `MONGODB_URI` to a running MongoDB instance. The backend will not boot cleanly without database access.

### 3. Start a local blockchain node

```bash
npm run contracts:node
```

### 4. Compile and deploy contracts

```bash
npm run contracts:compile
npm run contracts:deploy
```

Update the deployed contract addresses in `backend/.env` after deployment.

### 5. Start the backend

```bash
npm run backend:dev
```

### 6. Start the frontend

```bash
npm run frontend:dev
```

## Handy Root Scripts

- `npm run contracts:compile`
- `npm run contracts:node`
- `npm run contracts:deploy`
- `npm run backend:dev`
- `npm run backend:start`
- `npm run backend:test`
- `npm run frontend:dev`
- `npm run frontend:build`
- `npm run frontend:test`
- `npm test`

## Default Local URLs

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/health`

## Backend API Surface

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/profile`
- Records: `/api/records/upload`, `/api/records`, `/api/records/:patient`
- Appointments: `/api/appointments`
- Donors: `/api/donors/blood`, `/api/donors/organ`
- Medicines: `/api/medicines`, `/api/medicines/verify/:medicineId`
- Trials: `/api/trials`
- Prescriptions: `/api/prescriptions`
- Education: `/api/education/support-programs`, `/api/education/women-reminders`, `/api/education/analytics`

## Smart Contracts

- `MedicalRecords.sol`
- `BloodDonation.sol`
- `OrganDonation.sol`
- `MedicineVerification.sol`

## Current Notes

- Medical records follow an IPFS plus blockchain flow.
- Appointments, donors, medicines, trials, prescriptions, and education modules are backed by backend APIs.
- Route-based lazy loading is enabled in the frontend.
- JWT authentication and backend role-based authorization are implemented.
- The backend seeds initial education data on startup.

## Testing

Frontend:

```bash
npm run frontend:test
```

Backend:

```bash
npm run backend:test
```

All configured tests:

```bash
npm test
```

## Security Notes

- Do not commit real secrets to `backend/.env`.
- Replace demo keys and contract addresses before any shared deployment.
- Use a strong JWT secret outside local development.
- Restrict CORS and harden validation rules for hosted environments.

## Disclaimer

This project is intended for academic demonstration and system design presentation. It is not certified clinical software and should not be used as a source of medical advice.

Deployment note: this repository may receive no-op commits to trigger hosting redeploys.
