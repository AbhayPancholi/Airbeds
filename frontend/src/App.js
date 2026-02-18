import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Owners from './pages/Owners';
import Agreements from './pages/Agreements';
import PoliceVerification from './pages/PoliceVerification';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Notices from './pages/Notices';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tenants" element={<PrivateRoute><Tenants /></PrivateRoute>} />
          <Route path="/owners" element={<PrivateRoute><Owners /></PrivateRoute>} />
          <Route path="/agreements" element={<PrivateRoute><Agreements /></PrivateRoute>} />
          <Route path="/police-verification" element={<PrivateRoute><PoliceVerification /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/notices" element={<PrivateRoute><Notices /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
