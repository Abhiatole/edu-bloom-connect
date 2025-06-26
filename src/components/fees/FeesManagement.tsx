import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Plus, CreditCard } from 'lucide-react';
const FeesManagement = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStructure, setNewStructure] = useState({
    class_level: '',
    fee_type: '',
    amount: '',
    term: '',
    due_date: '',
    academic_year: '2024-2025',
    description: ''
  });
  const [newPayment, setNewPayment] = useState({
    student_id: '',
    structure_id: '',
    amount_paid: '',
    payment_method: 'Cash',
    status: 'PAID' as 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL',
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const [structuresResponse, paymentsResponse] = await Promise.all([
        supabase.from('fee_structures').select('*').order('class_level'),
        supabase.from('fee_payments').select('*').order('created_at', { ascending: false })
      ]);
      if (structuresResponse.error) throw structuresResponse.error;
      if (paymentsResponse.error) throw paymentsResponse.error;
      setFeeStructures(structuresResponse.data || []);
      setFeePayments(paymentsResponse.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load fee data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCreateStructure = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('fee_structures')
        .insert([{
          class_level: parseInt(newStructure.class_level),
          fee_type: newStructure.fee_type,
          amount: parseFloat(newStructure.amount),
          term: newStructure.term,
          due_date: newStructure.due_date,
          academic_year: newStructure.academic_year,
          description: newStructure.description
        }]);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Fee structure created successfully"
      });
      setNewStructure({
        class_level: '',
        fee_type: '',
        amount: '',
        term: '',
        due_date: '',
        academic_year: '2024-2025',
        description: ''
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create fee structure",
        variant: "destructive"
      });
    }
  };
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('fee_payments')
        .insert([{
          student_id: newPayment.student_id,
          structure_id: newPayment.structure_id,
          amount_paid: parseFloat(newPayment.amount_paid),
          payment_method: newPayment.payment_method,
          status: newPayment.status,
          transaction_id: newPayment.transaction_id,
          payment_date: newPayment.payment_date
        }]);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Payment recorded successfully"
      });
      setNewPayment({
        student_id: '',
        structure_id: '',
        amount_paid: '',
        payment_method: 'Cash',
        status: 'PAID',
        transaction_id: '',
        payment_date: new Date().toISOString().split('T')[0]
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive"
      });
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'PARTIAL': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  if (loading) {
    return <div className="flex justify-center p-8">Loading fee data...</div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fee Management</h2>
          <p className="text-gray-600">Manage fee structures and payments</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Fee Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Create Fee Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStructure} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class_level">Class Level</Label>
                  <Select value={newStructure.class_level} onValueChange={(value) => setNewStructure({...newStructure, class_level: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>Class {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fee_type">Fee Type</Label>
                  <Input
                    id="fee_type"
                    value={newStructure.fee_type}
                    onChange={(e) => setNewStructure({...newStructure, fee_type: e.target.value})}
                    placeholder="Tuition, Library, Lab..."
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newStructure.amount}
                    onChange={(e) => setNewStructure({...newStructure, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="term">Term</Label>
                  <Select value={newStructure.term} onValueChange={(value) => setNewStructure({...newStructure, term: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newStructure.due_date}
                  onChange={(e) => setNewStructure({...newStructure, due_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newStructure.description}
                  onChange={(e) => setNewStructure({...newStructure, description: e.target.value})}
                  placeholder="Optional description"
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Structure
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Record Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Record Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  value={newPayment.student_id}
                  onChange={(e) => setNewPayment({...newPayment, student_id: e.target.value})}
                  placeholder="Student UUID"
                  required
                />
              </div>
              <div>
                <Label htmlFor="structure_id">Fee Structure</Label>
                <Select value={newPayment.structure_id} onValueChange={(value) => setNewPayment({...newPayment, structure_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeStructures.map((structure) => (
                      <SelectItem key={structure.id} value={structure.id}>
                        Class {structure.class_level} - {structure.fee_type} (${structure.amount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount_paid">Amount Paid</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    value={newPayment.amount_paid}
                    onChange={(e) => setNewPayment({...newPayment, amount_paid: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select value={newPayment.payment_method} onValueChange={(value) => setNewPayment({...newPayment, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="transaction_id">Transaction ID</Label>
                <Input
                  id="transaction_id"
                  value={newPayment.transaction_id}
                  onChange={(e) => setNewPayment({...newPayment, transaction_id: e.target.value})}
                  placeholder="Optional transaction reference"
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      {/* Fee Structures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Structures</CardTitle>
          <CardDescription>Manage fee structures for different classes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Academic Year</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeStructures.map((structure) => (
                <TableRow key={structure.id}>
                  <TableCell>Class {structure.class_level}</TableCell>
                  <TableCell>{structure.fee_type}</TableCell>
                  <TableCell>${structure.amount}</TableCell>
                  <TableCell>{structure.term}</TableCell>
                  <TableCell>{new Date(structure.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>{structure.academic_year}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feePayments.slice(0, 10).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">{payment.student_id.substring(0, 8)}...</TableCell>
                  <TableCell>${payment.amount_paid}</TableCell>
                  <TableCell>{payment.payment_method}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-xs">{payment.transaction_id || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
export default FeesManagement;
