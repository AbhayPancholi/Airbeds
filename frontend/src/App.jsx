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
import Transactions from './pages/Transactions';
import CompanyDetails from './pages/CompanyDetails';
import Notices from './pages/Notices';
import NoticeForm from './pages/NoticeForm';
import Register from './pages/Register';
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
          {/* Tenant-scoped flows */}
          <Route path="/tenants/agreements" element={<PrivateRoute><Agreements /></PrivateRoute>} />
          <Route path="/tenants/police-verification" element={<PrivateRoute><PoliceVerification /></PrivateRoute>} />
          <Route path="/tenants/notices" element={<PrivateRoute><Notices /></PrivateRoute>} />
          {/* Backwards compatibility redirects */}
          <Route path="/agreements" element={<Navigate to="/tenants/agreements" replace />} />
          <Route path="/police-verification" element={<Navigate to="/tenants/police-verification" replace />} />
          <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
          {/* Legacy routes redirect to transactions */}
          <Route path="/payments" element={<Navigate to="/transactions" replace />} />
          <Route path="/expenses" element={<Navigate to="/transactions" replace />} />
          <Route path="/profile/bank-investments" element={<PrivateRoute><CompanyDetails /></PrivateRoute>} />
          <Route path="/company" element={<Navigate to="/profile/bank-investments" replace />} />
          <Route path="/notices" element={<Navigate to="/tenants/notices" replace />} />
          <Route path="/register/:token" element={<Register />} />
          <Route path="/notice" element={<NoticeForm />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
