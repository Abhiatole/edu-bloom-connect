
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, Calendar, Download } from 'lucide-react';

interface FeeInformationProps {
  studentId: string;
}

interface FeeRecord {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
}

export const FeeInformation: React.FC<FeeInformationProps> = ({ studentId }) => {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    // Mock fee data
    const mockFeeRecords: FeeRecord[] = [
      {
        id: '1',
        description: 'Tuition Fee - Term 1',
        amount: 5000,
        dueDate: '2024-03-15',
        status: 'paid',
        paymentDate: '2024-03-10'
      },
      {
        id: '2',
        description: 'Laboratory Fee',
        amount: 500,
        dueDate: '2024-04-15',
        status: 'paid',
        paymentDate: '2024-04-12'
      },
      {
        id: '3',
        description: 'Tuition Fee - Term 2',
        amount: 5000,
        dueDate: '2024-06-15',
        status: 'pending'
      },
      {
        id: '4',
        description: 'Activity Fee',
        amount: 300,
        dueDate: '2024-07-01',
        status: 'pending'
      }
    ];

    setFeeRecords(mockFeeRecords);
    
    const paid = mockFeeRecords
      .filter(record => record.status === 'paid')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const pending = mockFeeRecords
      .filter(record => record.status !== 'paid')
      .reduce((sum, record) => sum + record.amount, 0);

    setTotalPaid(paid);
    setTotalPending(pending);
  }, [studentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-green-600" />
          Fee Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fee Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Paid</p>
                <p className="text-xl font-bold text-green-800 dark:text-green-200">${totalPaid}</p>
              </div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending</p>
                <p className="text-xl font-bold text-yellow-800 dark:text-yellow-200">${totalPending}</p>
              </div>
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Fee Records */}
        <div className="space-y-3">
          <h4 className="font-medium">Recent Transactions</h4>
          {feeRecords.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <h5 className="font-medium">{record.description}</h5>
                <p className="text-sm text-muted-foreground">
                  Due: {new Date(record.dueDate).toLocaleDateString()}
                  {record.paymentDate && (
                    <span className="ml-2">
                      • Paid: {new Date(record.paymentDate).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-bold">${record.amount}</span>
                <Badge className={getStatusColor(record.status)}>
                  {record.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
          <Button className="flex-1">
            <CreditCard className="h-4 w-4 mr-2" />
            Make Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
