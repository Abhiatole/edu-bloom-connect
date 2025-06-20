
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserApprovals from "./pages/admin/UserApprovals";
import ExamManagement from "./pages/admin/ExamManagement";
import QuickApprovalDashboard from "./pages/QuickApprovalDashboard";

// Teacher pages  
import TeacherDashboard from "./pages/teacher/Dashboard";
import TestMarksUpload from "./components/teacher/TestMarksUpload";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";

// Super Admin pages
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import UserManagement from "./components/superadmin/UserManagement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Dashboard route - redirects based on role */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Admin routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']} requireApproval={false}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/approvals" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']} requireApproval={false}>
                    <UserApprovals />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/exams" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']} requireApproval={false}>
                    <ExamManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/quick-approvals" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']} requireApproval={false}>
                    <QuickApprovalDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Teacher routes */}
              <Route 
                path="/teacher/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher/marks-upload" 
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TestMarksUpload />
                  </ProtectedRoute>
                } 
              />

              {/* Student routes */}
              <Route 
                path="/student/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Super Admin routes */}
              <Route 
                path="/superadmin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']} requireApproval={false}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/superadmin/user-management" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']} requireApproval={false}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
