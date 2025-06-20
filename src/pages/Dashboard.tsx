
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    console.log('Dashboard component loaded, user profile:', userProfile);
  }, [userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (userProfile.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'TEACHER':
      return <Navigate to="/teacher/dashboard" replace />;
    case 'STUDENT':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Dashboard;
