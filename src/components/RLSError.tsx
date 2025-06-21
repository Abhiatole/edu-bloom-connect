import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface RLSErrorProps {
  message?: string;
}

const RLSError: React.FC<RLSErrorProps> = ({ 
  message = "Database policies prevent this action. Please run the RLS fix script in Supabase."
}) => {
  const navigate = useNavigate();

  return (
    <Card className="border-red-300 bg-red-50 dark:bg-red-900/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-lg">
          <AlertTriangle className="h-5 w-5" />
          Action Failed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">          <Button 
            variant="outline" 
            onClick={() => window.open('/COMPREHENSIVE_RLS_FIX.sql', '_blank')}
            className="text-xs"
          >
            Download RLS Fix Script
          </Button>
          <Button 
            variant="default"
            onClick={() => navigate('/superadmin/database-diagnostics')}
            className="text-xs"
          >
            Go to Database Diagnostics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RLSError;
