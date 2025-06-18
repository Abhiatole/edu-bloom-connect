
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Download, DollarSign, Calendar, Plus, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FeesManagement = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const [newFee, setNewFee] = useState({
    class_name: '',
    semester: '',
    amount: '',
    due_date: '',
    description: ''
  });

  useEffect(() => {
    fetchFeesData();
  }, []);

  const fetchFeesData = async () => {
    try {
      const [feesResult, paymentsResult] = await Promise.all([
        supabase.from('fee_structures').select('*').order('created_at', { ascending: false }),
        supabase.from('fee_payments').select('*').order('created_at', { ascending: false })
      ]);

      if (feesResult.error) throw feesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setFeeStructures(feesResult.data || []);
      setPayments(paymentsResult.data || []);
    } catch (error) {
      console.error('Error fetching fees data:', error);
      toast({
        title: "Error",
        description: "Failed to load fees data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFeeStructure = async () => {
    try {
      const { error } = await supabase
        .from('fee_structures')
        .insert([{
          ...newFee,
          amount: parseFloat(newFee.amount),
          created_by: 'current-user-id' // In real app, get from auth
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee structure created successfully"
      });

      setShowCreateDialog(false);
      setNewFee({ class_name: '', semester: '', amount: '', due_date: '', description: '' });
      fetchFeesData();
    } catch (error) {
      console.error('Error creating fee structure:', error);
      toast({
        title: "Error",
        description: "Failed to create fee structure",
        variant: "destructive"
      });
    }
  };

  const processPayment = async (feeStructureId: string, amount: number) => {
    try {
      // Mock payment processing - in real app integrate with Razorpay/Stripe
      const mockPayment = {
        student_id: 'current-student-id', // In real app, get from auth
        fee_structure_id: feeStructureId,
        amount_paid: amount,
        payment_method: 'credit_card',
        payment_status: 'completed',
        transaction_id: `TXN_${Date.now()}`,
        payment_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('fee_payments')
        .insert([mockPayment]);

      if (error) throw error;

      toast({
        title: "Payment Successful",
        description: "Fee payment processed successfully"
      });

      fetchFeesData();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment",
        variant: "destructive"
      });
    }
  };

  const getPaymentStatus = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalCollected = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + (p.amount_paid || 0), 0);

  if (loading) {
    return <div className="flex justify-center p-8">Loading fees data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fees Management</h2>
          <p className="text-gray-600">Manage fee structures and track payments</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Fee Structure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Fee Structure</DialogTitle>
              <DialogDescription>Set up fees for a class and semester</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="class_name">Class Name</Label>
                <Input
                  id="class_name"
                  value={newFee.class_name}
                  onChange={(e) => setNewFee({ ...newFee, class_name: e.target.value })}
                  placeholder="e.g., Grade 10 Science"
                />
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select onValueChange={(value) => setNewFee({ ...newFee, semester: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fall">Fall 2024</SelectItem>
                    <SelectItem value="spring">Spring 2024</SelectItem>
                    <SelectItem value="summer">Summer 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newFee.amount}
                  onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                  placeholder="500.00"
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newFee.due_date}
                  onChange={(e) => setNewFee({ ...newFee, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newFee.description}
                  onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                  placeholder="Semester fees including tuition and materials"
                />
              </div>
              <Button onClick={createFeeStructure} className="w-full">
                Create Fee Structure
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalCollected.toLocaleString()}</p>
                <p className="text-sm text-gray-500">This semester</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.payment_status === 'pending').length}
                </p>
                <p className="text-sm text-gray-500">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fee Structures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{feeStructures.length}</p>
                <p className="text-sm text-gray-500">Active structures</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Structures</CardTitle>
            <CardDescription>Current semester fee structures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feeStructures.slice(0, 5).map((fee) => (
                <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{fee.class_name}</h4>
                    <p className="text-sm text-gray-500">{fee.semester} • Due: {new Date(fee.due_date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">{fee.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${fee.amount}</p>
                    <Button 
                      size="sm" 
                      onClick={() => processPayment(fee.id, fee.amount)}
                      className="mt-2"
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">${payment.amount_paid}</p>
                    <p className="text-sm text-gray-500">
                      {payment.transaction_id} • {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">{payment.payment_method}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPaymentStatus(payment.payment_status)}>
                      {payment.payment_status?.toUpperCase()}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeesManagement;
