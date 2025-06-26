// Centralized route configuration for EduGrowHub
export interface RouteConfig {
  path: string;
  allowedRoles?: string[];
  isProtected?: boolean;
}

// Helper functions for role-based navigation
export const getDashboardRoute = (role: string): string => {
  switch (role) {
    case 'superadmin': return '/admin/dashboard';
    case 'teacher': return '/teacher/dashboard';
    case 'student': return '/student/dashboard';
    case 'parent': return '/parent/dashboard';
    default: return '/home';
  }
};

export const getNavigationItems = (role: string | null) => {
  const baseItems = [
    { label: 'Home', path: '/home', icon: 'Home' },
  ];

  if (!role) {
    return [
      ...baseItems,
      { label: 'Features', path: '/features', icon: 'Star' },
      { label: 'About', path: '/about', icon: 'Info' },
      { label: 'Contact', path: '/contact', icon: 'Mail' },
      { label: 'AI Assistant', path: '/ai-assistant', icon: 'Bot' },
    ];
  }

  const roleSpecificItems = {
    superadmin: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
      { label: 'User Approvals', path: '/admin/approvals', icon: 'UserCheck' },
      { label: 'Exams', path: '/admin/exams', icon: 'BookOpen' },
      { label: 'Analytics', path: '/admin/analytics', icon: 'BarChart3' },
    ],
    teacher: [
      { label: 'Dashboard', path: '/teacher/dashboard', icon: 'LayoutDashboard' },
      { label: 'Student Insights', path: '/teacher/insights', icon: 'Users' },
      { label: 'Exams', path: '/admin/exams', icon: 'BookOpen' },
    ],
    student: [
      { label: 'Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard' },
      { label: 'Performance', path: '/student/performance', icon: 'TrendingUp' },
    ],
    parent: [
      { label: 'Dashboard', path: '/parent/dashboard', icon: 'LayoutDashboard' },
    ],
  };

  return [...baseItems, ...(roleSpecificItems[role as keyof typeof roleSpecificItems] || [])];
};

// Route validation helper
export const isRouteAllowed = (path: string, userRole: string | null): boolean => {
  // Public routes are always allowed
  const publicRoutes = ['/', '/home', '/about', '/features', '/contact', '/ai-assistant', '/ai-student-insights', '/login', '/forgot-password'];
  if (publicRoutes.includes(path) || path.startsWith('/register/') || path.startsWith('/auth/')) {
    return true;
  }

  // If no user role, only public routes are allowed
  if (!userRole) return false;

  // Role-based access control
  if (path.startsWith('/admin/')) {
    return userRole === 'superadmin' || (path === '/admin/exams' && userRole === 'teacher');
  }
  
  if (path.startsWith('/teacher/')) {
    return userRole === 'teacher';
  }
  
  if (path.startsWith('/student/')) {
    return userRole === 'student';
  }
  
  if (path.startsWith('/parent/')) {
    return userRole === 'parent';
  }

  return false;
};
