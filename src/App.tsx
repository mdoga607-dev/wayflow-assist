import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import AddShipment from "./pages/AddShipment";
import ScanShipments from "./pages/ScanShipments";
import BalanceManagement from "./pages/BalanceManagement";
import DelayedShipments from "./pages/DelayedShipments";
import DelegateShipments from "./pages/DelegateShipments";
import Reports from "./pages/Reports";
import Returns from "./pages/Returns";
import UserManagement from "./pages/UserManagement";
import ExportShipments from "./pages/ExportShipments";
import PaymentDocuments from "./pages/PaymentDocuments";
import Auth from "./pages/Auth";
import GuestOrders from "./pages/GuestOrders";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/guest" element={<GuestOrders />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/shipments" element={<Shipments />} />
                <Route path="/add-shipment" element={<AddShipment />} />
                <Route path="/scan" element={<ScanShipments />} />
                <Route path="/balance" element={<BalanceManagement />} />
                <Route path="/delayed-shipments" element={<DelayedShipments />} />
                <Route path="/delegate-shipments" element={<DelegateShipments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/export" element={<ExportShipments />} />
                <Route path="/payments" element={<PaymentDocuments />} />
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
