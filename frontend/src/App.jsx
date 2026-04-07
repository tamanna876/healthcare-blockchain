import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import ProtectedLayout from './components/layout/ProtectedLayout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Spinner from './components/ui/Spinner.jsx'
import { canAccessInnovation } from './constants/innovationAccess.js'

// Route-based code splitting: each page loads as a separate chunk.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const MedicalRecords = lazy(() => import('./pages/MedicalRecords.jsx'))
const BloodDonation = lazy(() => import('./pages/BloodDonation.jsx'))
const OrganDonation = lazy(() => import('./pages/OrganDonation.jsx'))
const MedicineVerification = lazy(() => import('./pages/MedicineVerification.jsx'))
const ClinicalTrials = lazy(() => import('./pages/ClinicalTrials.jsx'))
const PatientPortal = lazy(() => import('./pages/PatientPortal.jsx'))
const DoctorCenter = lazy(() => import('./pages/DoctorCenter.jsx'))
const PharmacyCenter = lazy(() => import('./pages/PharmacyCenter.jsx'))
const DigitalHealthWallet = lazy(() => import('./pages/DigitalHealthWallet.jsx'))
const HealthGoals = lazy(() => import('./pages/HealthGoals.jsx'))
const FamilyAccess = lazy(() => import('./pages/FamilyAccess.jsx'))
const HealthEducationHub = lazy(() => import('./pages/HealthEducationHub.jsx'))
const InnovationHub = lazy(() => import('./pages/InnovationHub.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

function InnovationRouteGuard() {
  const { role, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (!canAccessInnovation(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <InnovationHub />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/medical-records" element={<MedicalRecords />} />
              <Route path="/blood-donation" element={<BloodDonation />} />
              <Route path="/organ-donation" element={<OrganDonation />} />
              <Route path="/medicine-verification" element={<MedicineVerification />} />
              <Route path="/clinical-trials" element={<ClinicalTrials />} />
              <Route path="/patient-portal" element={<PatientPortal />} />
              <Route path="/doctor-center" element={<DoctorCenter />} />
              <Route path="/pharmacy-center" element={<PharmacyCenter />} />
              <Route path="/digital-wallet" element={<DigitalHealthWallet />} />
              <Route path="/health-goals" element={<HealthGoals />} />
              <Route path="/family-access" element={<FamilyAccess />} />
              <Route path="/health-education" element={<HealthEducationHub />} />
              <Route path="/innovation-hub" element={<InnovationRouteGuard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Route>

            <Route path="*" element={<NotFound />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: '16px',
              background: '#0A3D6B',
              color: '#fff',
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
