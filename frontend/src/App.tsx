import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { VerificationPage } from "./pages/VerificationPage";
import { IssuerDashboard } from "./pages/IssuerDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify" element={<VerificationPage />} />
              <Route path="/verify/:certificateId" element={<VerificationPage />} />
              <Route path="/issuer" element={<IssuerDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </WalletProvider>
    </BrowserRouter>
  );
};

export default App;
