import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, AlertTriangle } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  description?: string;
}

interface BatchSelectionProps {
  selectedBatches: string[];
  onBatchesChange: (batches: string[]) => void;
  error?: string;
}

const BatchSelection: React.FC<BatchSelectionProps> = ({
  selectedBatches,
  onBatchesChange,
  error
}) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use fallback batches directly since database migration hasn't been applied yet
    setBatches([
      { id: 'neet', name: 'NEET', description: 'National Eligibility cum Entrance Test - Medical entrance preparation' },
      { id: 'jee', name: 'JEE', description: 'Joint Entrance Examination - Engineering entrance preparation' },
      { id: 'cet', name: 'CET', description: 'Common Entrance Test - State level entrance preparation' },
      { id: 'other', name: 'Other', description: 'Other specialized courses and general studies' }
    ]);
    setLoading(false);
  }, []);

  const handleBatchToggle = (batchName: string) => {
    if (selectedBatches.includes(batchName)) {
      onBatchesChange(selectedBatches.filter(name => name !== batchName));
    } else {
      onBatchesChange([...selectedBatches, batchName]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-base font-medium">Select Batches *</Label>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Select Batches *</Label>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Choose the batches you want to enroll in. You can select multiple batches.
      </p>
      
      <Card className={error ? 'border-red-500' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Available Batches ({batches.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {batches.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No batches available at the moment. Please contact the administrator.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className={`
                    flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedBatches.includes(batch.name) 
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                  `}
                  onClick={() => handleBatchToggle(batch.name)}
                >
                  <input
                    type="checkbox"
                    id={batch.id}
                    checked={selectedBatches.includes(batch.name)}
                    onChange={() => handleBatchToggle(batch.name)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={batch.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {batch.name}
                    </label>
                    {batch.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {batch.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedBatches.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Selected Batches ({selectedBatches.length}):
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedBatches.map((batchName) => {
                  const batch = batches.find(b => b.name === batchName);
                  return batch ? (
                    <span
                      key={batchName}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {batch.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {selectedBatches.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select at least one batch to continue with your registration.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BatchSelection;
