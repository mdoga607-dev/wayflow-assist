// src/App.tsx - الكود الكامل المصحح (انسخه كاملاً واستبدله)
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
import Returns from "./pages/Returns";
import PaymentDocuments from "./pages/PaymentDocuments";
import ShippersManagement from "./pages/ShippersManagement";
import DelegatesManagement from "./pages/DelegatesManagement";
import TrackShipment from "./pages/TrackShipment";
import Auth from "./pages/Auth";
import AddBalance from "./pages/balance/AddBalance";
import GuestOrders from "./pages/GuestOrders";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminUserManagement from "./pages/AdminUserManagement";
import TrackDelegates from "./pages/TrackDelegates";
import DelegateDetails from "./pages/DelegateDetails";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrintLabel from "@/components/ship/PrintLabel";
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
import ExportShipmentsPage from "./pages/ExportShipmentsPage";
import CollectionReportPage from "./pages/balance/CollectionReportPage";
import ProfilePage from "./pages/ProfilePage";
import AddStorePage from "./pages/stores/AddStorePage";
import AddShipperPage from "./pages/shippers/AddShipperPage";
import AddDelegatePage from "./pages/delegates/AddDelegatePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import ExcelUploadPage from "./pages/ExcelUploadPage";
import CourierShipmentsPage from "./pages/CourierShipmentsPage";
import CouriersShipments from "./components/ship/CouriersShipments";
import AddPickupRequestPage from "./pages/AddPickupRequestPage";
import ShipmentsManagementPage from "./pages/ShipmentsManagementPage";

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
              <Route path="/guest/orders" element={<GuestOrders />} />
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
                
                {/* ========== الشحنات ========== */}
                <Route path="shipments" element={<Shipments />} />
                <Route path="add-shipment" element={<AddShipment />} />
                <Route path="scan" element={<ScanShipments />} />
                <Route path="delayed-shipments" element={<DelayedShipments />} />
                <Route path="returns" element={<Returns />} />
                <Route path="print-shipments" element={<PrintShipmentsPage />} />
                <Route path="courier-shipments" element={<CouriersShipments />} />
                <Route path="couriers-shipments" element={<CourierShipmentsPage />} /> {/* ✅ التصحيح: استخدام المكون الصحيح */}
                <Route path="pickup-requests" element={<PickupRequestsPage />} />
                <Route path="check-shipments" element={<CheckShipmentsPage />} />
                <Route path="shipments-without-areas" element={<ShipmentsWithoutAreasPage />} />
                <Route path="print-labels" element={<PrintLabel />} />
                <Route path="excel-upload" element={<ExcelUploadPage />} />
                <Route path="pickup-requests/add" element={<AddPickupRequestPage />} />
                <Route path="shipments-management" element={<ShipmentsManagementPage />} />
                
                {/* ========== الحسابات ========== */}
                <Route path="balance" element={<BalanceManagement />} />
                <Route path="balance/add" element={<AddBalance />} />
                <Route path="balance/collection-report" element={<CollectionReportPage />} />
                
                {/* ========== الشيتات ========== */}
                <Route path="sheets" element={<SheetsPage />} />
                
                {/* ========== المناديب ========== */}
                <Route path="delegates" element={<DelegatesManagement />} />
                <Route path="delegates/add" element={<AddDelegatePage />} />
                <Route path="delegate/:id" element={<DelegateDetails />} />
                
                {/* ========== التجار ========== */}
                <Route path="shippers" element={<ShippersManagement />} />
                <Route path="shippers/add" element={<AddShipperPage />} />
                
                {/* ========== المتاجر ========== */}
                <Route path="stores" element={<StoresPage />} />
                <Route path="stores/add" element={<AddStorePage />} />
                <Route path="stores/dashboard" element={<StoresDashboardPage />} />
                <Route path="stores/timings" element={<BranchTimingsPage />} />
                
                {/* ========== الملف الشخصي ========== */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/edit" element={<EditProfilePage />} />
                
                {/* ========== الشكاوى ========== */}
                <Route path="complaints" element={<ComplaintsPage />} />
                <Route path="complaints/archive" element={<ComplaintsArchivePage />} />
                
                {/* ========== المناطق ========== */}
                <Route path="areas" element={<AreasPage />} />
                <Route path="areas/governorates" element={<GovernoratesPage />} />
                
                {/* ========== المهام ========== */}
                <Route path="tasks" element={<TasksPage />} />
                <Route path="tasks/add" element={<AddTaskPage />} />
                
                {/* ========== الجرد ========== */}
                <Route path="inventory" element={<InventoryPage />} />
                
                {/* ========== تتبع المناديب ========== */}
                <Route path="track-delegates" element={<TrackDelegates />} />
                
                {/* ========== التقارير ========== */}
                <Route path="reports" element={<PaymentReportPage />} />
                
                {/* ========== إدارة المستخدمين (للمدير العام فقط) ========== */}
                <Route path="admin-users" element={<AdminUserManagement />} />
                
                {/* ========== حملات الواتساب ========== */}
                <Route path="whatsapp/campaigns" element={<CampaignsPage />} />
                <Route path="whatsapp/my-campaigns" element={<MyCampaignsPage />} />
                <Route path="whatsapp/add-campaign" element={<AddCampaignPage />} />
                <Route path="whatsapp/bots" element={<BotsPage />} />
                <Route path="whatsapp/templates" element={<TemplatesPage />} />
                
                {/* ========== الإعدادات (للمدير العام فقط) ========== */}
                <Route path="settings/general" element={<GeneralSettingsPage />} />
                <Route path="settings/roles" element={<RolesManagementPage />} />
                
                {/* ========== المستندات المالية ========== */}
                <Route path="payments" element={<PaymentDocuments />} />
                
                {/* ========== تصدير الشحنات ========== */}
                <Route path="export-shipments" element={<ExportShipmentsPage />} />
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

              {/* ========== صفحة 404 ========== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;