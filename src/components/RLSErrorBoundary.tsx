import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import RLSError from '@/components/RLSError';

/**
 * RLS Error Boundary component to detect and display RLS errors
 * Wrap components that make Supabase queries with this boundary
 */
interface RLSErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

const RLSErrorBoundary: React.FC<RLSErrorBoundaryProps> = ({ 
  children, 
  fallbackMessage = "Database policies prevent this action. Please run the RLS fix script in Supabase."
}) => {
  const [hasError, setHasError] = useState(false);
  
  // Simple check to test if RLS is causing issues
  useEffect(() => {
    const checkRLS = async () => {
      try {
        // Try a simple query to check RLS status
        const { data, error } = await supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true });
          
        if (error && (
          error.code === 'PGRST116' || 
          error.message.includes('policy') || 
          error.message.includes('permission')
        )) {
          setHasError(true);
        }
      } catch (err) {
        // Ignore other errors
        console.error('Error checking RLS status:', err);
      }
    };
    
    checkRLS();
  }, []);
  
  if (hasError) {
    return <RLSError message={fallbackMessage} />;
  }
  
  return <>{children}</>;
};

export default RLSErrorBoundary;
