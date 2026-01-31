// src/App.tsx
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
import AddBalance from "./pages/balance/AddBalance";
import CollectionReport from "./pages/balance/CollectionReport";
import GuestOrders from "./pages/GuestOrders";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminUserManagement from "./pages/AdminUserManagement";
import TrackDelegates from "./pages/TrackDelegates";
import DelegateDetails from "./pages/DelegateDetails";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import PrintLabel from "@/components/ship/PrintLabel";
import DelegateDashboard from "./pages/DelegateDashboard";
import CouriersShipments from "./components/ship/CouriersShipments";
import SheetsPage from "./pages/SheetsPage";
import GuestLanding from "./pages/GuestLanding";
import ShipperPage from "./pages/ShipperPage";
import CourierDashboard from "./pages/CourierDashboard";

// الصفحات الجديدة
import PickupRequestsPage from "./pages/PickupRequestsPage";
import CheckShipmentsPage from "./pages/CheckShipmentsPage";
import ShipmentsWithoutAreasPage from "./pages/ShipmentsWithoutAreasPage";
import PrintShipmentsPage from "./pages/PrintShipmentsPage";
import PaymentReportPage from "./pages/PaymentReportPage";
import ComplaintsPage from "./pages/complaints/ComplaintsPage";
import ComplaintsArchivePage from "./pages/complaints/ArchivePage";
import GovernoratesPage from "./pages/areas/GovernoratesPage";
import AreasPage from "./pages/areas/AreasPage";
import TasksPage from "./pages/tasks/TasksPage";
import AddTaskPage from "./pages/tasks/AddTaskPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import StoresPage from "./pages/stores/StoresPage";
import StoresDashboardPage from "./pages/stores/DashboardPage";
import BranchTimingsPage from "./pages/stores/TimingsPage";
import CampaignsPage from "./pages/whatsapp/CampaignsPage";
import MyCampaignsPage from "./pages/whatsapp/MyCampaignsPage";
import AddCampaignPage from "./pages/whatsapp/AddCampaignPage";
import BotsPage from "./pages/whatsapp/BotsPage";
import TemplatesPage from "./pages/whatsapp/TemplatesPage";
import GeneralSettingsPage from "./pages/settings/GeneralSettings";
import RolesManagementPage from "./pages/settings/RolesManagement";

// إنشاء نسخة من QueryClient
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
              {/* ========== المسارات العامة (غير محمية) ========== */}
              <Route path="/" element={<GuestLanding />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/guest" element={<GuestOrders />} />
              <Route path="/track/:trackingNumber" element={<TrackShipment />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* ========== المسارات المحمية (تتطلب تسجيل دخول) ========== */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* الشحنات */}
                <Route path="shipments" element={<Shipments />} />
                <Route path="add-shipment" element={<AddShipment />} />
                <Route path="scan" element={<ScanShipments />} />
                <Route path="delayed-shipments" element={<DelayedShipments />} />
                <Route path="delegate-shipments" element={<DelegateShipments />} />
                <Route path="returns" element={<Returns />} />
                <Route path="courier-shipments" element={<CouriersShipments />} />
                <Route path="pickup-requests" element={<PickupRequestsPage />} />
                <Route path="check-shipments" element={<CheckShipmentsPage />} />
                <Route path="shipments-without-areas" element={<ShipmentsWithoutAreasPage />} />
                <Route path="print-shipments" element={<PrintShipmentsPage />} />
                
                {/* الحسابات - هيكل متداخل صحيح */}
                <Route path="balance">
                  <Route index element={<BalanceManagement />} />
                  <Route 
                    path="add" 
                    element={
                      <ProtectedRoute allowedRoles={['head_manager', 'manager']}>
                        <AddBalance />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="collection-report" 
                    element={
                      <ProtectedRoute allowedRoles={['head_manager', 'manager']}>
                        <CollectionReport />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="payment-report" 
                    element={
                      <ProtectedRoute allowedRoles={['head_manager', 'manager']}>
                        <PaymentReportPage />
                      </ProtectedRoute>
                    } 
                  />
                </Route>
                
                {/* المستندات المالية */}
                <Route path="payments" element={<PaymentDocuments />} />
                
                {/* التجار والمناديب */}
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
                
                {/* إدارة المستخدمين */}
                <Route 
                  path="admin-users" 
                  element={
                    <ProtectedRoute allowedRoles={['head_manager']}>
                      <AdminUserManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* الشيتات */}
                <Route 
                  path="sheets" 
                  element={
                    <ProtectedRoute allowedRoles={['head_manager', 'manager']}>
                      <SheetsPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* الشكاوى */}
                <Route path="complaints">
                  <Route index element={<ComplaintsPage />} />
                  <Route path="archive" element={<ComplaintsArchivePage />} />
                </Route>
                
                {/* المناطق */}
                <Route path="areas">
                  <Route index element={<AreasPage />} />
                  <Route path="governorates" element={<GovernoratesPage />} />
                </Route>
                
                {/* المهام */}
                <Route path="tasks">
                  <Route index element={<TasksPage />} />
                  <Route path="add" element={<AddTaskPage />} />
                </Route>
                
                {/* الجرد */}
                <Route path="inventory" element={<InventoryPage />} />
                
                {/* المتاجر */}
                <Route path="stores">
                  <Route index element={<StoresPage />} />
                  <Route path="dashboard" element={<StoresDashboardPage />} />
                  <Route path="timings" element={<BranchTimingsPage />} />
                </Route>
                
                {/* الواتساب */}
                <Route path="whatsapp">
                  <Route path="campaigns" element={<CampaignsPage />} />
                  <Route path="my-campaigns" element={<MyCampaignsPage />} />
                  <Route path="add-campaign" element={<AddCampaignPage />} />
                  <Route path="bots" element={<BotsPage />} />
                  <Route path="templates" element={<TemplatesPage />} />
                </Route>
                
                {/* الإعدادات */}
                <Route path="settings">
                  <Route path="general" element={<GeneralSettingsPage />} />
                  <Route path="roles" element={<RolesManagementPage />} />
                </Route>
                
                {/* باقي المسارات الأساسية */}
                <Route path="profile" element={<Profile />} />
                <Route path="reports" element={<Reports />} />
                <Route path="export" element={<ExportShipments />} />
                <Route path="track-delegates" element={<TrackDelegates />} />
                <Route path="print-labels" element={<PrintLabel />} />
                <Route path="delegate-dashboard" element={<DelegateDashboard />} />
              </Route>

              {/* ========== لوحة التاجر (مسار منفصل) ========== */}
              <Route 
                path="/shipper-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['shipper']}>
                    <ShipperPage />
                  </ProtectedRoute>
                } 
              />

              {/* ========== لوحة المندوب (مسار منفصل) ========== */}
              <Route 
                path="/courier-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['courier']}>
                    <CourierDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* صفحة 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;