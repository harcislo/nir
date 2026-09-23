import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthGate } from "../features/auth/AuthGate";
import { LoginPage } from "../pages/LoginPage";
import { MeasurementsPage } from "../pages/MeasurementsPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/measurements"
          element={
            <AuthGate>
              <MeasurementsPage />
            </AuthGate>
          }
        />
        <Route path="*" element={<Navigate to="/measurements" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

