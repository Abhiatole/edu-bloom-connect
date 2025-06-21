import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ModernTeacherDashboard from '@/pages/enhanced/ModernTeacherDashboard';

// This component wraps the dashboard to catch and diagnose errors
const ModernTeacherDashboardWrapper = () => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const { toast } = useToast();
  
  // Error boundary implementation
  class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Dashboard error caught:', error, errorInfo);
      setHasError(true);
      setErrorInfo(error.message || 'Unknown error occurred');
      
      toast({
        title: "Dashboard Error",
        description: `Error: ${error.message}`,
        variant: "destructive"
      });
    }

    render() {
      if (this.state.hasError) {
        return (
          <Card className="border-red-300 bg-red-50 dark:bg-red-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-lg">
                <AlertTriangle className="h-5 w-5" />
                Dashboard Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                {this.state.error?.message || 'An unknown error occurred in the dashboard.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDashboard(false);
                    setTimeout(() => {
                      this.setState({ hasError: false, error: null });
                      setShowDashboard(true);
                    }, 100);
                  }}
                  className="text-xs"
                >
                  Try to Reload Dashboard
                </Button>
                <Button 
                  variant="default"
                  onClick={() => window.location.reload()}
                  className="text-xs"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      return this.props.children;
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-blue-300 bg-blue-50 dark:bg-blue-900/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Error-Protected Dashboard
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                This dashboard is protected by an error boundary that will catch and display any errors.
                If you see a 500 error in the browser console, try running the diagnostic tool below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showDashboard && (
        <ErrorBoundary>
          <ModernTeacherDashboard />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default ModernTeacherDashboardWrapper;
