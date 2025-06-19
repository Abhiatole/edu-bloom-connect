import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import ParentPortal from "./components/parent/ParentPortal";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

// New Registration Pages
import StudentRegister from "./pages/register/StudentRegister";
import TeacherRegister from "./pages/register/TeacherRegister";
import EmailConfirmation from "./pages/EmailConfirmation";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import AuthTest from "./pages/AuthTest";

// New Admin Pages
import UserApprovals from "./pages/admin/UserApprovals";
import ExamManagement from "./pages/admin/ExamManagement";
import Analytics from "./pages/admin/Analytics";

// New Teacher Pages
import StudentInsights from "./pages/teacher/StudentInsights";

// New Student Pages
import Performance from "./pages/student/Performance";
import EmailTest from "./pages/EmailTest";
import TeacherFlowTest from "./pages/TeacherFlowTest";

// Import SuperAdminSetup component
import SuperAdminSetup from "./pages/SuperAdminSetup";
import QuickApprovalDashboard from "./pages/QuickApprovalDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="about" element={<About />} />
            <Route path="features" element={<Features />} />
            <Route path="contact" element={<Contact />} />
            <Route path="email-test" element={<EmailTest />} />
              {/* Registration Routes */}
            <Route path="register/student" element={<StudentRegister />} />            <Route path="register/teacher" element={<TeacherRegister />} />
            <Route path="register/success" element={<RegistrationSuccess />} />
            <Route path="auth/confirm" element={<EmailConfirmation />} />
            <Route path="auth/test" element={<AuthTest />} />
            
            {/* Protected Routes */}
            <Route 
              path="superadmin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="admin/approvals" 
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <UserApprovals />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="admin/exams" 
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <ExamManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="admin/analytics" 
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="teacher/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="teacher/insights" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <StudentInsights />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="student/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="student/performance" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Performance />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="parent/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentPortal />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="setup-admin" 
              element={<SuperAdminSetup />} 
            />

            <Route 
              path="teacher/flow-test" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherFlowTest />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="quick-approvals" 
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <QuickApprovalDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect based on role */}
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
