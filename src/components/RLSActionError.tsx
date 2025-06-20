import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * Simple inline alert for RLS errors
 * Use this for individual actions that may fail due to RLS
 */
interface RLSActionErrorProps {
  message?: string;
  showDownloadButton?: boolean;
}

const RLSActionError: React.FC<RLSActionErrorProps> = ({ 
  message = "Database policies prevent this action. Please run the RLS fix script in Supabase.",
  showDownloadButton = true
}) => {
  return (
    <Alert variant="destructive" className="my-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Action Failed</AlertTitle>
      <AlertDescription>
        <div className="mt-1">{message}</div>
        {showDownloadButton && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 bg-red-50 dark:bg-red-900/20 text-xs"
            onClick={() => window.open('/EMERGENCY_RLS_FIX.sql', '_blank')}
          >
            Download RLS Fix Script
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default RLSActionError;
