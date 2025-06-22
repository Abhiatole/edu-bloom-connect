import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CSVUploaderProps {
  onFileSelect: (file: File) => void;
  onReset: () => void;
  isUploading: boolean;
  error?: string;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({
  onFileSelect,
  onReset,
  isUploading,
  error
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
      return;
    }
    
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset();
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              disabled={isUploading}
              onChange={handleFileChange}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected file: {selectedFile.name}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            {selectedFile && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isUploading}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVUploader;
