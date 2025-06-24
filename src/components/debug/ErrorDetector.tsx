import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bug } from 'lucide-react';

/**
 * A component that captures and displays JavaScript errors in the browser
 * This can be temporarily added to a page for debugging
 */
const ErrorDetector = () => {
  const [errors, setErrors] = useState<Array<{message: string, stack?: string}>>([]);
  const [isCollecting, setIsCollecting] = useState(true);

  useEffect(() => {
    // Original error handler
    const originalOnError = window.onerror;
    
    // Setup error capturing
    window.onerror = (message, source, lineno, colno, error) => {
      if (isCollecting) {
        setErrors(prev => [
          ...prev, 
          { 
            message: String(message),
            stack: error?.stack
          }
        ]);
      }
      
      // Call original handler if it exists
      if (typeof originalOnError === 'function') {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Setup promise rejection handling
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isCollecting) {
        setErrors(prev => [
          ...prev, 
          { 
            message: `Promise Rejection: ${event.reason?.message || String(event.reason)}`,
            stack: event.reason?.stack
          }
        ]);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup
    return () => {
      window.onerror = originalOnError;
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [isCollecting]);

  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-red-600" />
          JavaScript Error Detector
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto"
            onClick={() => setIsCollecting(!isCollecting)}
          >
            {isCollecting ? 'Pause' : 'Resume'} Collection
          </Button>
          {errors.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setErrors([])}
            >
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <div className="text-center p-4 text-green-600">
            No JavaScript errors detected yet
          </div>
        ) : (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <Alert variant="destructive" key={index}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error {index + 1}</AlertTitle>
                <AlertDescription>
                  <div className="font-medium">{error.message}</div>
                  {error.stack && (
                    <pre className="text-xs mt-2 bg-red-100 dark:bg-red-900/50 p-2 rounded overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorDetector;
