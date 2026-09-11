// Nina Purple — Ambassador application pipeline
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import Privacy from '@/pages/Privacy';
import Experiences from '@/pages/Experiences';
import Terms from '@/pages/Terms';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import BBPRewards from '@/pages/BBPRewards';
import CookieConsent from '@/components/CookieConsent';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ninaIcon } from '@/lib/images';

// Page imports
import Landing from '@/pages/Landing';
import Onboarding from '@/pages/Onboarding';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Connections from '@/pages/Connections';
import Messages from '@/pages/Messages';
import Events from '@/pages/Events';
import Community from '@/pages/Community';
import Profile from '@/pages/Profile';
import ProfilePreview from '@/components/profile/ProfilePreview';
import MembershipAndAccess from '@/pages/MembershipAndAccess';
import CompatibilityProfile from '@/pages/CompatibilityProfile';
import BBPWallet from '@/pages/BBPWallet';
import Relationship from '@/pages/Relationship';
import Admin from '@/pages/Admin';
import AdminDashboard from '@/pages/AdminDashboard';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PrivilegedRoute from '@/components/PrivilegedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import { StaffSessionProvider } from '@/lib/StaffSessionContext';
import TrustSafety from '@/pages/TrustSafety';
import Rewards from '@/pages/Rewards';
import Operations from '@/pages/Operations';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0B0510]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border border-[rgba(245,168,0,0.2)] animate-ping absolute inset-0" />
          <img
            src={ninaIcon}
            alt="Nina"
            className="w-16 h-16 object-contain relative z-10"
          />
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public landing */}
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/experiences" element={<Experiences />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/bbp-rewards" element={<BBPRewards />} />

      {/* App routes with shared layout */}
      <Route element={<AppLayout />}>
        <Route path="/home" element={<Navigate to="/profile" replace />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/events" element={<Events />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/preview" element={<ProfilePreview />} />
        <Route path="/membership" element={<MembershipAndAccess />} />
        <Route path="/compatibility-profile" element={<CompatibilityProfile />} />
        <Route path="/wallet" element={<BBPWallet />} />
        <Route path="/relationship" element={<Relationship />} />
        <Route element={<PrivilegedRoute context="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/members" element={<Admin />} />
        </Route>
        <Route element={<PrivilegedRoute context="trust_safety" />}>
          <Route path="/trust-safety" element={<TrustSafety />} />
        </Route>
        <Route element={<PrivilegedRoute context="rewards_finance" />}>
          <Route path="/rewards" element={<Rewards />} />
        </Route>
        <Route element={<PrivilegedRoute context="engineering_operations" />}>
          <Route path="/operations" element={<Operations />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <ThemeProvider>
            <Router>
              <ScrollToTop />
              <StaffSessionProvider>
                <AuthenticatedApp />
              </StaffSessionProvider>
              <CookieConsent />
              <WhatsAppFloat />
            </Router>
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;