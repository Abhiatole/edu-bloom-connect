import React from 'react';
import { Navigate } from 'react-router-dom';
const ExamManagement = () => {
  // Redirect to the enhanced teacher dashboard
  return <Navigate to="/teacher/dashboard" replace />;
};
export default ExamManagement;
