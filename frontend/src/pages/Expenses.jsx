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
import { expensesAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Receipt } from 'lucide-react';
import { format } from 'date-fns';

const initialFormState = {
  expense_type: '',
  other_type_specify: '',
  amount: '',
  date: '',
  description: ''
};

const expenseTypes = [
  'Maintenance',
  'Repairs',
  'Utilities',
  'Cleaning',
  'Security',
  'Insurance',
  'Taxes',
  'Marketing',
  'Legal',
  'Other'
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [page, fromDate, toDate]);

  useEffect(() => {
    if (fromDate || toDate) {
      fetchMonthlyTotal();
    }
  }, [fromDate, toDate]);

  const fetchExpenses = async () => {
    try {
      const params = { page, limit: 10 };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      
      const response = await expensesAPI.get(params);
      setExpenses(response.data);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTotal = async () => {
    try {
      const response = await expensesAPI.getMonthlyTotal({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
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
      let expenseType = formData.expense_type;
      if (expenseType === 'Other' && (formData.other_type_specify || '').trim()) {
        expenseType = `Other - ${formData.other_type_specify.trim()}`;
      }
      const data = {
        expense_type: expenseType,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description || null
      };

      if (selectedExpense) {
        await expensesAPI.update(selectedExpense.id, data);
        toast.success('Expense updated successfully');
      } else {
        await expensesAPI.create(data);
        toast.success('Expense added successfully');
      }
      setDialogOpen(false);
      setSelectedExpense(null);
      setFormData(initialFormState);
      fetchExpenses();
      if (fromDate || toDate) fetchMonthlyTotal();
    } catch (error) {
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Failed to save expense';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    let expenseType = expense.expense_type || '';
    let otherSpecify = '';
    if (expenseType.startsWith('Other - ')) {
      otherSpecify = expenseType.slice(8).trim();
      expenseType = 'Other';
    }
    setFormData({
      expense_type: expenseType,
      other_type_specify: otherSpecify,
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await expensesAPI.delete(selectedExpense.id);
      toast.success('Expense deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
      fetchExpenses();
      if (fromDate || toDate) fetchMonthlyTotal();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const openDeleteDialog = (expense) => {
    setSelectedExpense(expense);
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
    setFromDate('');
    setToDate('');
    setMonthlyTotal(0);
  };

  const getExpenseTypeBadge = (type) => {
    const colors = {
      'Maintenance': 'bg-blue-100 text-blue-700',
      'Repairs': 'bg-orange-100 text-orange-700',
      'Utilities': 'bg-yellow-100 text-yellow-700',
      'Cleaning': 'bg-green-100 text-green-700',
      'Security': 'bg-purple-100 text-purple-700',
      'Insurance': 'bg-indigo-100 text-indigo-700',
      'Taxes': 'bg-red-100 text-red-700',
      'Marketing': 'bg-pink-100 text-pink-700',
      'Legal': 'bg-slate-100 text-slate-700',
      'Other': 'bg-gray-100 text-gray-700'
    };
    const baseType = type && type.startsWith('Other - ') ? 'Other' : type;
    return colors[baseType] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="expenses-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expenses</h1>
            <p className="text-slate-500 mt-1">Track property-related expenses</p>
          </div>
          <Button onClick={() => { setSelectedExpense(null); setFormData(initialFormState); setDialogOpen(true); }} data-testid="add-expense-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-sm text-slate-500 mb-2 block">From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  data-testid="filter-from-date"
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-slate-500 mb-2 block">To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  data-testid="filter-to-date"
                />
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Total Card */}
        {(fromDate || toDate) && (
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Expenses (Selected Period)</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(monthlyTotal)}</p>
                </div>
                <Receipt className="h-10 w-10 text-red-200" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Expense Records ({expenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No expenses found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id} data-testid={`expense-row-${expense.id}`}>
                        <TableCell>
                          <Badge className={getExpenseTypeBadge(expense.expense_type)}>
                            {expense.expense_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>
                          {expense.date ? format(new Date(expense.date), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{expense.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(expense)} className="text-red-600 hover:text-red-700">
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
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={expenses.length < 10}>
            Next
          </Button>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense_type">Expense Type *</Label>
                <Select value={formData.expense_type} onValueChange={(value) => handleSelectChange('expense_type', value)}>
                  <SelectTrigger data-testid="expense-type-select">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.expense_type === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="other_type_specify">Specify expense type</Label>
                  <Input
                    id="other_type_specify"
                    name="other_type_specify"
                    value={formData.other_type_specify}
                    onChange={handleInputChange}
                    placeholder="e.g. Office supplies, Miscellaneous"
                    data-testid="other-type-input"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange} required data-testid="amount-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required data-testid="date-input" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Expense description..." data-testid="description-input" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} data-testid="save-expense-btn">
                  {saving ? 'Saving...' : selectedExpense ? 'Update' : 'Add Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Expense</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">Are you sure you want to delete this expense record? This action cannot be undone.</p>
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
