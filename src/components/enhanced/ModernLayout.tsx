import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { GraduationCap, LogOut, User, Bell, Home, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';
const ModernLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail');
  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userProfile');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    });
    navigate('/');
  };
  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      default: return 'User';
    }
  };
  const getDashboardLink = (role: string | null) => {
    switch (role) {
      case 'superadmin': return '/admin/dashboard';
      case 'teacher': return '/teacher/dashboard';
      case 'student': return '/student/dashboard';
      case 'parent': return '/parent/dashboard';
      default: return '/home';
    }
  };
  // Don't show layout on auth pages
  if (location.pathname === '/login' || location.pathname === '/forgot-password' || 
      location.pathname.startsWith('/register') || location.pathname === '/auth/confirm') {
    return <Outlet />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 dark:from-background dark:to-muted/10">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand Logo - Clickable */}
            <Link to="/home" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Siddhivinayak Science Academy
                </h1>
                <p className="text-xs text-muted-foreground">Learning Excellence</p>
              </div>
            </Link>
            {/* Desktop Navigation */}            <div className="hidden md:flex items-center space-x-6">
              {!userRole && (
                <>
                  <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                  <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                  <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                  <Link to="/ai-assistant" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    AI Assistant
                  </Link>
                </>
              )}
            </div>
            
            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              
              {userRole ? (
                <div className="flex items-center space-x-3">
                  <Link to="/home">
                    <Button variant="ghost" size="sm">
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                  
                  <Link to={getDashboardLink(userRole)}>
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{getRoleDisplayName(userRole)}</span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="truncate max-w-32">{userEmail}</span>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Bell className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register/student">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t bg-background/95 backdrop-blur">
              <div className="flex flex-col space-y-4">
                {!userRole && (
                  <>
                    <Link 
                      to="/features" 
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Features
                    </Link>
                    <Link 
                      to="/about" 
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      About
                    </Link>
                    <Link 
                      to="/contact" 
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Contact
                    </Link>
                    <Link 
                      to="/ai-assistant" 
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      AI Assistant
                    </Link>
                    <div className="px-4 pt-2 border-t">
                      <div className="flex flex-col space-y-2">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            Login
                          </Button>
                        </Link>
                        <Link to="/register/student" onClick={() => setMobileMenuOpen(false)}>
                          <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            Register
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
                {userRole && (
                  <>
                    <Link to="/home" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Home className="h-4 w-4 mr-2" />
                        Home
                      </Button>
                    </Link>
                    <Link to={getDashboardLink(userRole)} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        Dashboard
                      </Button>
                    </Link>
                    <div className="px-4 py-2 border-t">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
                        <User className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{getRoleDisplayName(userRole)}</span>
                          <span className="text-xs truncate">{userEmail}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleLogout} className="w-full justify-start">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="min-h-[calc(100vh-200px)]">
          <Outlet />
        </div>
      </main>
      {/* Floating Admin Access Button - Only show on home page */}
      {location.pathname === '/' && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link to="/register/admin">
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full px-4 py-2"
              title="Admin Registration"
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
export default ModernLayout;
