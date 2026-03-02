import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { paymentsAPI, ownersAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CreditCard, Filter } from 'lucide-react';
import { format } from 'date-fns';

const initialFormState = {
  owner_id: '',
  month: '',
  amount_paid: '',
  payment_date: '',
  notes: ''
};

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy');
    options.push({ value, label });
  }
  return options;
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  const monthOptions = getMonthOptions();

  useEffect(() => {
    fetchPayments();
    fetchOwners();
  }, [page, filterMonth, filterOwner]);

  useEffect(() => {
    if (filterMonth) {
      fetchMonthlyTotal();
    }
  }, [filterMonth]);

  const fetchPayments = async () => {
    try {
      const params = { page, limit: 10 };
      if (filterMonth) params.month = filterMonth;
      if (filterOwner) params.owner_id = filterOwner;
      
      const response = await paymentsAPI.get(params);
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await ownersAPI.getAll();
      setOwners(response.data);
    } catch (error) {
      console.error('Failed to load owners');
    }
  };

  const fetchMonthlyTotal = async () => {
    try {
      const response = await paymentsAPI.getMonthlyTotal(filterMonth);
      setMonthlyTotal(response.data.total);
    } catch (error) {
      console.error('Failed to load monthly total');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        amount_paid: parseFloat(formData.amount_paid)
      };

      if (selectedPayment) {
        await paymentsAPI.update(selectedPayment.id, data);
        toast.success('Payment updated successfully');
      } else {
        await paymentsAPI.create(data);
        toast.success('Payment added successfully');
      }
      setDialogOpen(false);
      setSelectedPayment(null);
      setFormData(initialFormState);
      fetchPayments();
      if (filterMonth) fetchMonthlyTotal();
    } catch (error) {
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Failed to save payment';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      owner_id: payment.owner_id,
      month: payment.month,
      amount_paid: payment.amount_paid.toString(),
      payment_date: payment.payment_date,
      notes: payment.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await paymentsAPI.delete(selectedPayment.id);
      toast.success('Payment deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
      fetchPayments();
      if (filterMonth) fetchMonthlyTotal();
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };

  const openDeleteDialog = (payment) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const clearFilters = () => {
    setFilterMonth('');
    setFilterOwner('');
    setMonthlyTotal(0);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="payments-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Owner Payments</h1>
            <p className="text-slate-500 mt-1">Track payments to property owners</p>
          </div>
          <Button onClick={() => { setSelectedPayment(null); setFormData(initialFormState); setDialogOpen(true); }} data-testid="add-payment-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-sm text-slate-500 mb-2 block">Filter by Month</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger data-testid="filter-month-select">
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-sm text-slate-500 mb-2 block">Filter by Owner</Label>
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                  <SelectTrigger data-testid="filter-owner-select">
                    <SelectValue placeholder="All owners" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Total Card */}
        {filterMonth && (
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Monthly Total</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(monthlyTotal)}</p>
                </div>
                <CreditCard className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Records ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                        <TableCell className="font-medium">{payment.owner_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.month ? format(new Date(payment.month + '-01'), 'MMM yyyy') : '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-600">{formatCurrency(payment.amount_paid)}</TableCell>
                        <TableCell>
                          {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{payment.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(payment)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(payment)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={payments.length < 10}>
            Next
          </Button>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedPayment ? 'Edit Payment' : 'Add New Payment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="owner_id">Owner *</Label>
                <Select value={formData.owner_id} onValueChange={(value) => handleSelectChange('owner_id', value)}>
                  <SelectTrigger data-testid="owner-select">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>{owner.name} - {owner.flat_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Month *</Label>
                  <Select value={formData.month} onValueChange={(value) => handleSelectChange('month', value)}>
                    <SelectTrigger data-testid="month-select">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_paid">Amount *</Label>
                  <Input id="amount_paid" name="amount_paid" type="number" value={formData.amount_paid} onChange={handleInputChange} required data-testid="amount-input" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input id="payment_date" name="payment_date" type="date" value={formData.payment_date} onChange={handleInputChange} required data-testid="payment-date-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes..." data-testid="notes-input" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} data-testid="save-payment-btn">
                  {saving ? 'Saving...' : selectedPayment ? 'Update' : 'Add Payment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payment</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">Are you sure you want to delete this payment record? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
