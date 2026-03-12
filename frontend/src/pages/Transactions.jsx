import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { paymentsAPI, expensesAPI, ownersAPI, tenantsAPI, companyAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CreditCard, Receipt, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const ALL_VALUE = '__all__';

const paymentInitial = {
  party_type: 'owner',
  party_id: '',
  transaction_type: 'credit',
  month: '',
  amount_paid: '',
  payment_date: '',
  notes: '',
  bank_account_id: '',
};

const expenseInitial = {
  expense_type: '',
  other_type_specify: '',
  amount: '',
  date: '',
  description: '',
  bank_account_id: '',
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
  'Other',
];

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

export default function Transactions() {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [owners, setOwners] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [pagePayments, setPagePayments] = useState(1);
  const [pageExpenses, setPageExpenses] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterPartyType, setFilterPartyType] = useState(ALL_VALUE);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [paymentForm, setPaymentForm] = useState(paymentInitial);
  const [expenseForm, setExpenseForm] = useState(expenseInitial);
  const [saving, setSaving] = useState(false);
  const [partyComboboxOpen, setPartyComboboxOpen] = useState(false);
  const [accountComboboxOpen, setAccountComboboxOpen] = useState(false);

  const monthOptions = getMonthOptions();

  useEffect(() => {
    fetchOwners();
    fetchTenants();
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [pagePayments, fromDate, toDate, filterPartyType]);

  useEffect(() => {
    fetchExpenses();
  }, [pageExpenses, fromDate, toDate]);

  const fetchOwners = async () => {
    try {
      const res = await ownersAPI.getAll();
      setOwners(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setOwners([]);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await tenantsAPI.getAll();
      setTenants(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setTenants([]);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await companyAPI.listAccounts();
      setAccounts(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setAccounts([]);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const params = { page: pagePayments, limit: 10 };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (filterPartyType && filterPartyType !== ALL_VALUE) params.party_type = filterPartyType;
      const res = await paymentsAPI.get(params);
      setPayments(res.data);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const params = { page: pageExpenses, limit: 10 };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await expensesAPI.get(params);
      setExpenses(res.data);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const getPartyDisplayName = (p) => p?.name ?? p?.tenant_name ?? 'Unknown';
  const getAccountLabel = (acc) =>
    [acc.bank_name, acc.account_number].filter(Boolean).join(' – ') || acc.id;

  const partyOptions =
    (paymentForm.party_type === 'owner' ? owners : tenants) ?? [];
  const selectedParty = partyOptions.find((p) => p.id === paymentForm.party_id);
  const selectedAccount = accounts.find((a) => a.id === (paymentForm.bank_account_id || expenseForm.bank_account_id));

  const handlePaymentInput = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentSelect = (name, value) => {
    if (name === 'party_type') {
      setPaymentForm((prev) => ({ ...prev, party_type: value, party_id: '' }));
    } else {
      setPaymentForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleExpenseInput = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExpenseSelect = (name, value) => {
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const savePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        party_type: paymentForm.party_type,
        party_id: paymentForm.party_id,
        transaction_type: paymentForm.transaction_type,
        month: paymentForm.month,
        amount_paid: parseFloat(paymentForm.amount_paid),
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes || null,
        bank_account_id: paymentForm.bank_account_id || null,
      };
      if (selectedPayment) {
        await paymentsAPI.update(selectedPayment.id, payload);
        toast.success('Payment updated successfully');
      } else {
        await paymentsAPI.create(payload);
        toast.success('Payment added successfully');
      }
      setPaymentDialogOpen(false);
      setSelectedPayment(null);
      setPaymentForm(paymentInitial);
      fetchPayments();
    } catch (error) {
      const msg =
        typeof error.response?.data?.detail === 'string'
          ? error.response.data.detail
          : 'Failed to save payment';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const saveExpense = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let expenseType = expenseForm.expense_type;
      if (expenseType === 'Other' && (expenseForm.other_type_specify || '').trim()) {
        expenseType = `Other - ${expenseForm.other_type_specify.trim()}`;
      }
      const payload = {
        expense_type: expenseType,
        amount: parseFloat(expenseForm.amount),
        date: expenseForm.date,
        description: expenseForm.description || null,
        bank_account_id: expenseForm.bank_account_id || null,
      };
      if (selectedExpense) {
        await expensesAPI.update(selectedExpense.id, payload);
        toast.success('Expense updated successfully');
      } else {
        await expensesAPI.create(payload);
        toast.success('Expense added successfully');
      }
      setExpenseDialogOpen(false);
      setSelectedExpense(null);
      setExpenseForm(expenseInitial);
      fetchExpenses();
    } catch (error) {
      const msg =
        typeof error.response?.data?.detail === 'string'
          ? error.response.data.detail
          : 'Failed to save expense';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setPaymentForm({
      party_type: payment.party_type || 'owner',
      party_id: payment.party_id || payment.owner_id || '',
      transaction_type: payment.transaction_type || 'credit',
      month: payment.month,
      amount_paid: payment.amount_paid.toString(),
      payment_date: payment.payment_date,
      notes: payment.notes || '',
      bank_account_id: payment.bank_account_id || '',
    });
    setPaymentDialogOpen(true);
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    let expenseType = expense.expense_type || '';
    let otherSpecify = '';
    if (expenseType.startsWith('Other - ')) {
      otherSpecify = expenseType.slice(8).trim();
      expenseType = 'Other';
    }
    setExpenseForm({
      expense_type: expenseType,
      other_type_specify: otherSpecify,
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description || '',
      bank_account_id: expense.bank_account_id || '',
    });
    setExpenseDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    try {
      await paymentsAPI.delete(selectedPayment.id);
      toast.success('Payment deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    try {
      await expensesAPI.delete(selectedExpense.id);
      toast.success('Expense deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterPartyType(ALL_VALUE);
  };

  const combinedTransactions = [
    ...payments.map((p) => ({
      kind: 'payment',
      date: p.payment_date,
      item: p,
    })),
    ...expenses.map((e) => ({
      kind: 'expense',
      date: e.date,
      item: e,
    })),
  ].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  return (
    <Layout>
      <div className="space-y-8" data-testid="transactions-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Transactions</h1>
            <p className="text-slate-500 mt-1">
              Manage all payments and expenses with linked bank accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setSelectedPayment(null);
                setPaymentForm(paymentInitial);
                setPaymentDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedExpense(null);
                setExpenseForm(expenseInitial);
                setExpenseDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-sm text-slate-500 mb-2 block">From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-slate-500 mb-2 block">To Date</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-slate-500 mb-2 block">Payment Party Type</Label>
                <Select value={filterPartyType} onValueChange={setFilterPartyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transactions ({combinedTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPayments && loadingExpenses ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
              </div>
            ) : combinedTransactions.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No transactions found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kind</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedTransactions.map((t) => {
                      if (t.kind === 'payment') {
                        const p = t.item;
                        const acc = accounts.find((a) => a.id === p.bank_account_id);
                        return (
                          <TableRow key={`pay-${p.id}`}>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Payment
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="font-medium">
                                {p.party_name || p.owner_name || '-'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {p.party_type === 'owner' ? 'Owner' : 'Tenant'} •{' '}
                                {p.transaction_type === 'credit' ? 'Credited' : 'Debited'}
                              </div>
                            </TableCell>
                            <TableCell>{acc ? getAccountLabel(acc) : '-'}</TableCell>
                            <TableCell
                              className={`font-semibold ${
                                p.transaction_type === 'credit'
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(p.amount_paid)}
                            </TableCell>
                            <TableCell>
                              {p.payment_date
                                ? format(new Date(p.payment_date), 'dd MMM yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditPayment(p)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedPayment(p);
                                    setSelectedExpense(null);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      const e = t.item;
                      const acc = accounts.find((a) => a.id === e.bank_account_id);
                      return (
                        <TableRow key={`exp-${e.id}`}>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Expense
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="font-medium">{e.expense_type}</div>
                            <div className="text-xs text-slate-500">
                              {e.description || '—'}
                            </div>
                          </TableCell>
                          <TableCell>{acc ? getAccountLabel(acc) : '-'}</TableCell>
                          <TableCell className="font-semibold text-red-600">
                            {formatCurrency(e.amount)}
                          </TableCell>
                          <TableCell>
                            {e.date ? format(new Date(e.date), 'dd MMM yyyy') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditExpense(e)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedExpense(e);
                                  setSelectedPayment(null);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedPayment ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={savePayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Party Type *</Label>
                  <Select
                    value={paymentForm.party_type}
                    onValueChange={(v) => handlePaymentSelect('party_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{paymentForm.party_type === 'owner' ? 'Owner' : 'Tenant'} *</Label>
                  <Popover
                    open={partyComboboxOpen}
                    onOpenChange={setPartyComboboxOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <span
                          className={cn(
                            !paymentForm.party_id && 'text-muted-foreground'
                          )}
                        >
                          {selectedParty
                            ? getPartyDisplayName(selectedParty)
                            : `Select ${paymentForm.party_type}`}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                    >
                      <Command>
                        <CommandInput
                          placeholder={`Search ${paymentForm.party_type}...`}
                        />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup>
                            {partyOptions.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={getPartyDisplayName(p)}
                                onSelect={() => {
                                  handlePaymentSelect('party_id', p.id);
                                  setPartyComboboxOpen(false);
                                }}
                              >
                                {getPartyDisplayName(p)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bank Account *</Label>
                <Select
                  value={paymentForm.bank_account_id}
                  onValueChange={(v) =>
                    setPaymentForm((prev) => ({ ...prev, bank_account_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {getAccountLabel(a)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Transaction Type *</Label>
                <Select
                  value={paymentForm.transaction_type}
                  onValueChange={(v) => handlePaymentSelect('transaction_type', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credited to Account</SelectItem>
                    <SelectItem value="debit">Debited from Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Month *</Label>
                  <Select
                    value={paymentForm.month}
                    onValueChange={(v) => handlePaymentSelect('month', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    name="amount_paid"
                    type="number"
                    value={paymentForm.amount_paid}
                    onChange={handlePaymentInput}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Input
                  name="payment_date"
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={handlePaymentInput}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handlePaymentInput}
                  placeholder="Any additional notes..."
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : selectedPayment ? 'Update' : 'Add Payment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Expense Dialog */}
        <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{selectedExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={saveExpense} className="space-y-4">
              <div className="space-y-2">
                <Label>Expense Type *</Label>
                <Select
                  value={expenseForm.expense_type}
                  onValueChange={(v) => handleExpenseSelect('expense_type', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {expenseForm.expense_type === 'Other' && (
                <div className="space-y-2">
                  <Label>Specify expense type</Label>
                  <Input
                    name="other_type_specify"
                    value={expenseForm.other_type_specify}
                    onChange={handleExpenseInput}
                    placeholder="e.g. Office supplies"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Bank Account *</Label>
                <Select
                  value={expenseForm.bank_account_id}
                  onValueChange={(v) =>
                    setExpenseForm((prev) => ({ ...prev, bank_account_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {getAccountLabel(a)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    name="amount"
                    type="number"
                    value={expenseForm.amount}
                    onChange={handleExpenseInput}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    name="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={handleExpenseInput}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  value={expenseForm.description}
                  onChange={handleExpenseInput}
                  placeholder="Expense description..."
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExpenseDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : selectedExpense ? 'Update' : 'Add Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Transaction</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  selectedPayment ? handleDeletePayment() : handleDeleteExpense()
                }
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

