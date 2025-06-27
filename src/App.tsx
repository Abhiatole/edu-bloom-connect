import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ModernLayout from "./components/enhanced/ModernLayout";

// Pages
import ModernHomePage from "./pages/enhanced/ModernHomePage";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import Features from "./pages/Features";
import Contact from "./pages/Contact";

// Registration Pages
import StudentRegister from "./pages/register/StudentRegister";
import TeacherRegister from "./pages/register/TeacherRegister";
import AdminRegister from "./pages/register/AdminRegister";
import EmailConfirmation from "./pages/EmailConfirmation";
import EmailConfirmationSuccess from "./pages/EmailConfirmationSuccess";
import RegistrationSuccess from "./pages/RegistrationSuccess";

// Debug/Test Components
import { RegistrationTest } from "./components/debug/RegistrationTest";
import { DirectSignUpTest } from "./components/debug/DirectSignUpTest";

// Enhanced Dashboards
import ModernSuperAdminDashboard from "./pages/enhanced/ModernSuperAdminDashboard";
import EnhancedTeacherDashboard from "./pages/enhanced/EnhancedTeacherDashboard";
import ModernStudentDashboard from "./pages/enhanced/ModernStudentDashboard";

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
import AIAssistantPage from "./pages/ai-assistant";
import AIStudentInsightsPage from "./pages/ai-student-insights";
import DatabaseTest from "./components/debug/DatabaseTest";
import DatabaseDebugger from "./components/debug/DatabaseDebugger";
import DirectRegistrationTest from "./components/debug/DirectRegistrationTest";

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
              {/* Public Routes */}
              <Route index element={<ModernHomePage />} />
              <Route path="home" element={<ModernHomePage />} />
              <Route path="about" element={<About />} />
              <Route path="features" element={<Features />} />
              <Route path="contact" element={<Contact />} />
              <Route path="ai-assistant" element={<AIAssistantPage />} />
              <Route path="ai-student-insights" element={<AIStudentInsightsPage />} />

              {/* Authentication Routes */}
              <Route path="login" element={<Login />} />
              <Route path="forgot-password" element={<ForgotPassword />} />

              {/* Registration Routes */}
              <Route path="register/student" element={<StudentRegister />} />
              <Route path="register/teacher" element={<TeacherRegister />} />
              <Route path="register/admin" element={<AdminRegister />} />
              <Route path="register/success" element={<RegistrationSuccess />} />
              <Route path="auth/confirm" element={<EmailConfirmation />} />
              <Route path="auth/success" element={<EmailConfirmationSuccess />} />
              <Route path="email-confirmed" element={<EmailConfirmationSuccess />} />

              {/* Debug Routes */}
              <Route path="debug/database" element={<DatabaseTest />} />
              <Route path="debug/database-test" element={<DatabaseDebugger />} />
              <Route path="debug/registration" element={<DirectRegistrationTest />} />
              <Route path="debug/registration-test" element={<RegistrationTest />} />
              <Route path="debug/signup-test" element={<DirectSignUpTest />} />

              {/* Admin Routes - Nested under /admin */}
              <Route path="admin">
                <Route 
                  path="dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                      <ModernSuperAdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="approvals" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                      <UserApprovals />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="exams" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin', 'teacher']}>
                      <ExamManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="analytics" 
                  element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                      <Analytics />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Teacher Routes - Nested under /teacher */}
              <Route path="teacher">
                <Route 
                  path="dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <EnhancedTeacherDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="insights" 
                  element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <StudentInsights />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Student Routes - Nested under /student */}
              <Route path="student">
                <Route 
                  path="dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <ModernStudentDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="performance" 
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Performance />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Parent Routes - Nested under /parent */}
              <Route path="parent">
                <Route 
                  path="dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['parent']}>
                      <ParentPortal />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
