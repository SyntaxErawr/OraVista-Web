import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

// ==========================================
// 1. IMPORT COMPONENTS & PATIENT PAGES
// ==========================================
import Navbar from "./components/navbar";
import PatientLanding from "./pages/patient/A_LandingPage";
import PatientLogin from "./pages/patient/B_LoginPage";
import PatientSignup from "./pages/patient/C_SignupPage";
import AboutPage from "./pages/patient/D_AboutusPage";
import ServicesPage from "./pages/patient/E_ServicesPage";
import PatientAppointments from "./pages/patient/F_AppointmentsPage";
import ContactPage from "./pages/patient/G_ContactPage";
import PatientBooking from "./pages/patient/H_BookingPage";
import PatientProfile from "./pages/patient/I_ProfilePage";
import PatientDashboard from "./pages/patient/J_DashboardPage";
import RecordsPage from "./pages/patient/K_RecordsPage"; 
import PatientSettings from "./pages/patient/L_SettingsPage"; 
// NEW: Imported the Billings Page
import PatientBillings from "./pages/patient/M_BillingsPage"; 

// ==========================================
// 2. IMPORT CLINIC PAGES (Common, Admin, Staff, Dentist)
// ==========================================
// Common
import ClinicLanding from "./pages/a_common/A_LandingPage";
import ClinicLogin from "./pages/a_common/B_LoginPage";

// Admin
import AdminDashboard from "./pages/b_admin/A_AdminDashboardPage";
import AdminPatients from "./pages/b_admin/B_AdminPatientListPage";
import AdminPatientProfile from "./pages/b_admin/H_AdminPatientProfilePage"; 
import AdminDentists from "./pages/b_admin/C_AdminDentistListPage";
import AdminAppointments from "./pages/b_admin/D_AdminAppointmentPage";
import AdminDiagnostics from "./pages/b_admin/E_AdminDiagnosticPage";
import AdminAccountCreation from "./pages/b_admin/F_AdminAccountCreationPage";
import AdminSettings from "./pages/b_admin/G_AdminSettingsPage";

// Staff
import StaffDashboard from "./pages/c_staff/A_StaffDashboardPage";
import StaffPatients from "./pages/c_staff/B_StaffPatientListPage";
import StaffDentists from "./pages/c_staff/C_StaffDentistListPage";
import StaffAppointments from "./pages/c_staff/D_StaffAppointmentPage";
import StaffSettings from "./pages/c_staff/E_StaffSettingsPage";
import StaffPatientProfile from "./pages/c_staff/F_StaffPatientProfilePage";
import StaffBooking from "./pages/c_staff/G_StaffBookingPage"; 
import StaffBillings from "./pages/c_staff/H_StaffBillingsPage";

// Dentist
import DentistAppointments from './pages/d_dentist/D_DentistAppointmentPage';
import DentistDashboard from "./pages/d_dentist/A_DentistDashboardPage";
import DentistPatients from "./pages/d_dentist/B_DentistPatientListPage";
import DentistProfile from "./pages/d_dentist/C_DentistProfilePage";
import DentistDiagnostics from "./pages/d_dentist/E_DentistDiagnosticPage";
import DentistSettings from "./pages/d_dentist/F_DentistSettingsPage";
import DentistPatientProfile from "./pages/d_dentist/G_DentistPatientProfilePage";
// NEW: Imported the Predictive Analytics Page
import DentistAnalyticsPage from "./pages/d_dentist/H_DentistAnalyticsPage";

// ==========================================
// CONDITIONAL NAVBAR (For Patients Only)
// ==========================================
function ConditionalNavbar({ isLoggedIn }) {
  const location = useLocation();
  // Only show the standard navbar on public patient pages
  const showNavbarPaths = ["/", "/about", "/services", "/contact"];

  if (!showNavbarPaths.includes(location.pathname)) {
    return null;
  }
  return <Navbar isLoggedIn={isLoggedIn} />;
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
  // Unified Auth State
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isLoggedIn = !!user;

  // Listen for login/logout changes across tabs
  useEffect(() => {
    const checkLogin = () => {
      const savedUser = localStorage.getItem("user");
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  return (
    <Router>
      <ConditionalNavbar isLoggedIn={isLoggedIn} />
      <Routes>
        
        {/* =========================================
            PATIENT ROUTES
            ========================================= */}
        {/* Public Patient Routes */}
        <Route path="/" element={<PatientLanding />} />
        <Route path="/login" element={<PatientLogin />} />
        <Route path="/signup" element={<PatientSignup />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Protected Patient Routes */}
        <Route path="/dashboard" element={isLoggedIn ? <PatientDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/appointments" element={isLoggedIn ? <PatientAppointments /> : <Navigate to="/login" replace />} />
        <Route path="/booking" element={isLoggedIn ? <PatientBooking /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={isLoggedIn ? <PatientProfile /> : <Navigate to="/login" replace />} />
        <Route path="/records" element={isLoggedIn ? <RecordsPage /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={isLoggedIn ? <PatientSettings /> : <Navigate to="/login" replace />} />
        {/* NEW: Added the route for Patient Billings */}
        <Route path="/billings" element={isLoggedIn ? <PatientBillings /> : <Navigate to="/login" replace />} />


        {/* =========================================
            CLINIC ROUTES (Admin / Staff / Dentist)
            ========================================= */}
        {/* Public Clinic Routes */}
        <Route path="/management" element={<ClinicLanding />} />
        <Route path="/clinic" element={<ClinicLanding />} />
        <Route path="/clinic/login" element={<ClinicLogin />} />

        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/admin/patients" element={user?.role === 'admin' ? <AdminPatients /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/admin/patient-profile/:id" element={user?.role === 'admin' ? <AdminPatientProfile /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/admin/dentists" element={user?.role === 'admin' ? <AdminDentists /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/admin/booking" element={user?.role === 'admin' ? <StaffBooking /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/admin/appointments" element={user?.role === 'admin' ? <AdminAppointments /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/admin/diagnostics" element={user?.role === 'admin' ? <AdminDiagnostics /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/admin/create-account" element={user?.role === 'admin' ? <AdminAccountCreation /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/admin/settings" element={user?.role === 'admin' ? <AdminSettings /> : <Navigate to="/clinic/login" replace />} />

        {/* Protected Staff Routes */}
        <Route path="/staff/dashboard" element={user?.role === 'staff' ? <StaffDashboard /> : <Navigate to="/clinic/login" replace />} />
        <Route style={{ cursor: 'pointer' }} path="/staff/patients" element={user?.role === 'staff' ? <StaffPatients /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/staff/patient-profile/:id" element={user?.role === 'staff' ? <StaffPatientProfile /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/staff/dentists" element={user?.role === 'staff' ? <StaffDentists /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/staff/appointments" element={user?.role === 'staff' ? <StaffAppointments /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/staff/booking" element={user?.role === 'staff' ? <StaffBooking /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/staff/billings" element={user?.role === 'staff' ? <StaffBillings /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/staff/settings" element={user?.role === 'staff' ? <StaffSettings /> : <Navigate to="/clinic/login" replace />} />

        {/* Protected Dentist Routes */}
        <Route path="/dentist/appointments" element={user?.role === 'dentist' ? <DentistAppointments /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/dentist/booking" element={user?.role === 'dentist' ? <StaffBooking /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/dentist/dashboard" element={user?.role === 'dentist' ? <DentistDashboard /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/dentist/patients" element={user?.role === 'dentist' ? <DentistPatients /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/dentist/patient-profile/:id" element={user?.role === 'dentist' ? <DentistPatientProfile /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/dentist/profile" element={user?.role === 'dentist' ? <DentistProfile /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/dentist/diagnostics" element={user?.role === 'dentist' ? <DentistDiagnostics /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/dentist/analytics" element={user?.role === 'dentist' ? <DentistAnalyticsPage /> : <Navigate to="/clinic/login" replace />} />
        <Route path="/dentist/settings" element={user?.role === 'dentist' ? <DentistSettings /> : <Navigate to="/clinic/login" replace />} />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
