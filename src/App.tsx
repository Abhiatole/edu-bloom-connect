import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ModernLayout from "./components/enhanced/ModernLayout";

// Pages
import ModernHomePage from "./pages/enhanced/ModernHomePage";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import DeploymentDebug from "./pages/DeploymentDebug";
import DatabaseFix from "./pages/DatabaseFix";
import FixExamResultsTable from "./pages/FixExamResultsTable";
import WebDiagnosticsPage from "./pages/diagnostics/WebDiagnosticsPage";

// Enhanced Dashboards
import ModernSuperAdminDashboard from "./pages/enhanced/ModernSuperAdminDashboard";
import ModernTeacherDashboard from "./pages/enhanced/ModernTeacherDashboard";
import ModernStudentDashboard from "./pages/enhanced/ModernStudentDashboard";

// Registration Pages
import StudentRegister from "./pages/register/StudentRegister";
import TeacherRegister from "./pages/register/TeacherRegister";
import AdminRegister from "./pages/register/AdminRegister";
import EmailConfirmation from "./pages/EmailConfirmation";
import EmailConfirmationSuccess from "./pages/EmailConfirmationSuccess";
import RegistrationSuccess from "./pages/RegistrationSuccess";

// Admin Pages
import Analytics from "./pages/admin/Analytics";
import UserApprovals from "./pages/admin/UserApprovals";
import ExamManagement from "./pages/admin/ExamManagement";

// Teacher Pages
import StudentInsights from "./pages/teacher/StudentInsights";

// Student Pages
import Performance from "./pages/student/Performance";

// Other Components
import ParentPortal from "./components/parent/ParentPortal";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import AuthTest from "./pages/AuthTest";
import EmailTest from "./pages/EmailTest";
import TeacherFlowTest from "./pages/TeacherFlowTest";
import SuperAdminSetup from "./pages/SuperAdminSetup";
import QuickApprovalDashboard from "./pages/QuickApprovalDashboard";
import ProfileDiagnostics from "./pages/ProfileDiagnostics";
import DatabaseDiagnostics from "./pages/superadmin/DatabaseDiagnostics";
import AIAssistantPage from "./pages/ai-assistant";
import AIStudentInsightsPage from "./pages/ai-student-insights";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ModernLayout />}>
              <Route index element={<ModernHomePage />} />
              <Route path="login" element={<Login />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="about" element={<About />} />
              <Route path="features" element={<Features />} />              <Route path="contact" element={<Contact />} />              <Route path="email-test" element={<EmailTest />} />              <Route path="debug" element={<DeploymentDebug />} />
              <Route path="database-fix" element={<DatabaseFix />} />
              <Route path="fix-exam-results" element={<FixExamResultsTable />} />
              <Route path="ai-assistant" element={<AIAssistantPage />} />
              <Route path="ai-student-insights" element={<AIStudentInsightsPage />} />
              
              {/* Registration Routes */}
              <Route path="register/student" element={<StudentRegister />} />
              <Route path="register/teacher" element={<TeacherRegister />} />
              <Route path="register/admin" element={<AdminRegister />} />              <Route path="register/success" element={<RegistrationSuccess />} />
              <Route path="auth/confirm" element={<EmailConfirmation />} />
              <Route path="auth/success" element={<EmailConfirmationSuccess />} />
              <Route path="email-confirmed" element={<EmailConfirmationSuccess />} />
              <Route path="profile-diagnostics" element={<ProfileDiagnostics />} />
              <Route path="auth/test" element={<AuthTest />} />
              
              {/* Protected Routes */}
              <Route 
                path="superadmin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <ModernSuperAdminDashboard />
                  </ProtectedRoute>
                } 
              />              <Route 
                path="admin/approvals" 
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <UserApprovals />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="superadmin/database-diagnostics" 
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <DatabaseDiagnostics />
                  </ProtectedRoute>
                } 
              />              <Route 
                path="admin/exams" 
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'teacher']}>
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
                    <ModernTeacherDashboard />
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
                    <ModernStudentDashboard />
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
              
              <Route 
                path="debug" 
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'teacher', 'student', 'parent']}>
                    <DeploymentDebug />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="superadmin/database-diagnostics" 
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <DatabaseDiagnostics />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="diagnostics/web" 
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'teacher']}>
                    <WebDiagnosticsPage />
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
