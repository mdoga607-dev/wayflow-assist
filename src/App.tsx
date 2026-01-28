import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import AddShipment from "./pages/AddShipment";
import ScanShipments from "./pages/ScanShipments";
import BalanceManagement from "./pages/BalanceManagement";
import DelayedShipments from "./pages/DelayedShipments";
import DelegateShipments from "./pages/DelegateShipments";
import Reports from "./pages/Reports";
import Returns from "./pages/Returns";
import ExportShipments from "./pages/ExportShipments";
import PaymentDocuments from "./pages/PaymentDocuments";
import ShippersManagement from "./pages/ShippersManagement";
import DelegatesManagement from "./pages/DelegatesManagement";
import TrackShipment from "./pages/TrackShipment";
import Auth from "./pages/Auth";
import GuestOrders from "./pages/GuestOrders";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminUserManagement from "./pages/AdminUserManagement";
import TrackDelegates from "./pages/TrackDelegates";
import DelegateDetails from "./pages/DelegateDetails";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import PrintLabel from "./pages/PrintLabel";
import DelegateDashboard from "./pages/DelegateDashboard";
// إنشاء نسخة من QueryClient
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}> {/* تم التصحيح هنا من QueryClient إلى queryClient */}
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* المسارات العامة */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/guest" element={<GuestOrders />} />
              <Route path="/track/:trackingNumber" element={<TrackShipment />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* المسارات المحمية */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                <Route path="shipments" element={<Shipments />} />
                <Route path="add-shipment" element={<AddShipment />} />
                <Route path="scan" element={<ScanShipments />} />
                <Route path="delayed-shipments" element={<DelayedShipments />} />
                <Route path="delegate-shipments" element={<DelegateShipments />} />
                <Route path="returns" element={<Returns />} />
                
                <Route path="balance" element={<BalanceManagement />} />
                <Route path="payments" element={<PaymentDocuments />} />
                
                <Route 
                  path="shippers" 
                  element={
                    <ProtectedRoute allowedRoles={['head_manager', 'manager']}>
                      <ShippersManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route path="delegates" element={<DelegatesManagement />} />
                <Route path="delegate/:id" element={<DelegateDetails />} />
                
                <Route 
                  path="admin-users" 
                  element={
                    <ProtectedRoute allowedRoles={['head_manager']}>
                      <AdminUserManagement />
                    </ProtectedRoute>
                  } 
                />

                <Route path="profile" element={<Profile />} /> 
                <Route path="reports" element={<Reports />} />
                <Route path="export" element={<ExportShipments />} />
                <Route path="track-delegates" element={<TrackDelegates />} />
                <Route path="print-label" element={<PrintLabel />} />
                <Route path="delegate-dashboard" element={<DelegateDashboard />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;