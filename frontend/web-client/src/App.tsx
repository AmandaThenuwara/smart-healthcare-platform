import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import RoleDashboardPage from "./pages/common/RoleDashboardPage";
import DoctorAppointmentsPage from "./pages/doctor/DoctorAppointmentsPage";
import DoctorAvailabilityPage from "./pages/doctor/DoctorAvailabilityPage";
import DoctorDashboardPage from "./pages/doctor/DoctorDashboardPage";
import DoctorProfilePage from "./pages/doctor/DoctorProfilePage";
import DoctorTelemedicinePage from "./pages/doctor/DoctorTelemedicinePage";
import PatientAppointmentsPage from "./pages/patient/PatientAppointmentsPage";
import PatientDashboardPage from "./pages/patient/PatientDashboardPage";
import PatientDoctorsPage from "./pages/patient/PatientDoctorsPage";
import PatientNotificationsPage from "./pages/patient/PatientNotificationsPage";
import PatientPaymentsPage from "./pages/patient/PatientPaymentsPage";
import PatientProfilePage from "./pages/patient/PatientProfilePage";
import PatientReportsPage from "./pages/patient/PatientReportsPage";
import PatientSymptomCheckerPage from "./pages/patient/PatientSymptomCheckerPage";
import PatientTelemedicinePage from "./pages/patient/PatientTelemedicinePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<RoleDashboardPage />} />

            <Route element={<RoleProtectedRoute allowedRoles={["DOCTOR"]} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
              <Route path="/doctor/profile" element={<DoctorProfilePage />} />
              <Route path="/doctor/availability" element={<DoctorAvailabilityPage />} />
              <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
              <Route path="/doctor/telemedicine" element={<DoctorTelemedicinePage />} />
            </Route>

            <Route element={<RoleProtectedRoute allowedRoles={["PATIENT"]} />}>
              <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
              <Route path="/patient/doctors" element={<PatientDoctorsPage />} />
              <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
              <Route path="/patient/profile" element={<PatientProfilePage />} />
              <Route path="/patient/reports" element={<PatientReportsPage />} />
              <Route path="/patient/notifications" element={<PatientNotificationsPage />} />
              <Route path="/patient/payments" element={<PatientPaymentsPage />} />
              <Route path="/patient/telemedicine" element={<PatientTelemedicinePage />} />
              <Route path="/patient/symptom-checker" element={<PatientSymptomCheckerPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
