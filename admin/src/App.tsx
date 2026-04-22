import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RewardsProvider } from "@/contexts/RewardsContext";
import AdminLayout from "@/components/layout/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import UsersPage from "@/pages/UsersPage";
import WastePostsPage from "@/pages/WastePostsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import WalletPage from "@/pages/WalletPage";
import RewardsPage from "@/pages/RewardsPage";
import RewardFormPage from "@/pages/RewardFormPage";
import CollectionPointsPage from "@/pages/CollectionPointsPage";
import EducationPage from "@/pages/EducationPage";
import AILogsPage from "@/pages/AILogsPage";
import SupportPage from "@/pages/SupportPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Đang xác thực...</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RewardsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/users" element={<UsersPage />} />
                      <Route path="/waste-posts" element={<WastePostsPage />} />
                      <Route path="/transactions" element={<TransactionsPage />} />
                      <Route path="/wallet" element={<WalletPage />} />
                      <Route path="/rewards" element={<RewardsPage />} />
                      <Route path="/rewards/new" element={<RewardFormPage />} />
                      <Route path="/rewards/:id/edit" element={<RewardFormPage />} />
                      <Route path="/collection-points" element={<CollectionPointsPage />} />
                      <Route path="/education" element={<EducationPage />} />
                      <Route path="/ai-logs" element={<AILogsPage />} />
                      <Route path="/support" element={<SupportPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RewardsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;