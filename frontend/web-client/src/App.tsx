import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import RoleDashboardPage from "./pages/common/RoleDashboardPage";
import DoctorAppointmentsPage from "./pages/doctor/DoctorAppointmentsPage";
import DoctorAvailabilityPage from "./pages/doctor/DoctorAvailabilityPage";
import DoctorDashboardPage from "./pages/doctor/DoctorDashboardPage";
import DoctorProfilePage from "./pages/doctor/DoctorProfilePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<RoleDashboardPage />} />

            <Route element={<RoleProtectedRoute allowedRoles={["DOCTOR"]} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
              <Route path="/doctor/profile" element={<DoctorProfilePage />} />
              <Route path="/doctor/availability" element={<DoctorAvailabilityPage />} />
              <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
