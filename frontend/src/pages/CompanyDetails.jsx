import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { companyAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Edit, Building2, Wallet, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

const accountFormInitial = {
  bank_name: '',
  account_name: '',
  account_number: '',
  ifsc_code: '',
  branch: '',
  account_type: '',
  is_active: true,
};

const ALL_ACCOUNTS_VALUE = '__all__'; // Select cannot use empty string as item value

const investmentFormInitial = {
  bank_account_id: '',
  amount: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
};

export default function CompanyDetails() {
  const [accounts, setAccounts] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingInvestments, setLoadingInvestments] = useState(true);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountForm, setAccountForm] = useState(accountFormInitial);
  const [savingAccount, setSavingAccount] = useState(false);
  const [investmentForm, setInvestmentForm] = useState(investmentFormInitial);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [investmentFilterAccountId, setInvestmentFilterAccountId] = useState(ALL_ACCOUNTS_VALUE);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchInvestments();
  }, [investmentFilterAccountId]);

  const fetchAccounts = async () => {
    try {
      const res = await companyAPI.listAccounts();
      setAccounts(res.data);
    } catch (err) {
      toast.error('Failed to load bank accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchInvestments = async () => {
    setLoadingInvestments(true);
    try {
      const params =
        investmentFilterAccountId && investmentFilterAccountId !== ALL_ACCOUNTS_VALUE
          ? { bank_account_id: investmentFilterAccountId }
          : {};
      const res = await companyAPI.listInvestments(params);
      setInvestments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load investments');
    } finally {
      setLoadingInvestments(false);
    }
  };

  const handleAccountInput = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'is_active' ? e.target.checked : value;
    setAccountForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const openAddAccount = () => {
    setSelectedAccount(null);
    setAccountForm(accountFormInitial);
    setAccountDialogOpen(true);
  };

  const openEditAccount = (account) => {
    setSelectedAccount(account);
    setAccountForm({
      bank_name: account.bank_name,
      account_name: account.account_name,
      account_number: account.account_number,
      ifsc_code: account.ifsc_code,
      branch: account.branch,
      account_type: account.account_type || '',
      is_active: account.is_active ?? true,
    });
    setAccountDialogOpen(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const payload = {
        bank_name: accountForm.bank_name.trim(),
        account_name: accountForm.account_name.trim(),
        account_number: accountForm.account_number.trim(),
        ifsc_code: accountForm.ifsc_code.trim(),
        branch: accountForm.branch.trim(),
        account_type: accountForm.account_type || null,
        is_active: accountForm.is_active,
      };
      if (selectedAccount) {
        await companyAPI.updateAccount(selectedAccount.id, payload);
        toast.success('Bank account updated');
      } else {
        await companyAPI.createAccount(payload);
        toast.success('Bank account added');
      }
      setAccountDialogOpen(false);
      fetchAccounts();
      fetchInvestments();
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Failed to save bank account';
      toast.error(typeof msg === 'string' ? msg : 'Failed to save bank account');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleInvestmentInput = (e) => {
    const { name, value } = e.target;
    setInvestmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInvestmentSelect = (name, value) => {
    setInvestmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInvestment = async (e) => {
    e.preventDefault();
    if (!investmentForm.bank_account_id) {
      toast.error('Please select a bank account');
      return;
    }
    const amount = parseFloat(investmentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSavingInvestment(true);
    try {
      await companyAPI.addInvestment({
        bank_account_id: investmentForm.bank_account_id,
        amount,
        date: investmentForm.date,
        description: investmentForm.description.trim() || null,
      });
      toast.success('Investment added');
      setInvestmentForm({ ...investmentFormInitial, bank_account_id: investmentForm.bank_account_id });
      fetchAccounts();
      fetchInvestments();
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Failed to add investment';
      toast.error(typeof msg === 'string' ? msg : 'Failed to add investment');
    } finally {
      setSavingInvestment(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const getAccountLabel = (acc) =>
    [acc.bank_name, acc.account_number].filter(Boolean).join(' – ') || acc.id;

  return (
    <Layout>
      <div className="space-y-8" data-testid="company-details-page">
        <div>
          <p className="text-sm text-slate-500 mb-1">Profile</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bank & Investments</h1>
          <p className="text-slate-500 mt-1">Bank accounts and investment amounts</p>
        </div>

        {/* Section 1: Company Bank Account Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Account Details
              </CardTitle>
              <Button onClick={openAddAccount} data-testid="add-bank-account-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Bank Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAccounts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No bank accounts added yet. Add one to start recording investments.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bank</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>IFSC</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Current Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((acc) => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-medium">{acc.bank_name}</TableCell>
                        <TableCell>{acc.account_name}</TableCell>
                        <TableCell>{acc.account_number}</TableCell>
                        <TableCell>{acc.ifsc_code}</TableCell>
                        <TableCell>{acc.branch}</TableCell>
                        <TableCell>{acc.account_type || '–'}</TableCell>
                        <TableCell className="text-right font-semibold text-green-700">
                          {formatCurrency(acc.current_balance)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={acc.is_active ? 'default' : 'secondary'}>
                            {acc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditAccount(acc)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Add Investment Amount */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Add Investment Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddInvestment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Bank Account *</Label>
                <Select
                  value={investmentForm.bank_account_id}
                  onValueChange={(v) => handleInvestmentSelect('bank_account_id', v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter((a) => a.is_active).map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {getAccountLabel(acc)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  name="amount"
                  value={investmentForm.amount}
                  onChange={handleInvestmentInput}
                  placeholder="0"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  name="date"
                  value={investmentForm.date}
                  onChange={handleInvestmentInput}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="invisible">Add</Label>
                <Button type="submit" disabled={savingInvestment || accounts.length === 0}>
                  {savingInvestment ? 'Adding...' : 'Add Investment'}
                </Button>
              </div>
            </form>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                name="description"
                value={investmentForm.description}
                onChange={handleInvestmentInput}
                placeholder="e.g. Initial capital, top-up"
                rows={2}
              />
            </div>

            {/* Investments list */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h4 className="font-semibold text-slate-800">Investment History</h4>
                <Select value={investmentFilterAccountId} onValueChange={setInvestmentFilterAccountId}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_ACCOUNTS_VALUE}>All accounts</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {getAccountLabel(acc)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {loadingInvestments ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
                </div>
              ) : investments.length === 0 ? (
                <p className="text-slate-500 py-4">No investments yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Added on</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investments.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : '–'}</TableCell>
                          <TableCell className="font-semibold text-green-700">{formatCurrency(inv.amount)}</TableCell>
                          <TableCell>{inv.description || '–'}</TableCell>
                          <TableCell className="text-slate-500">
                            {inv.created_at ? format(new Date(inv.created_at), 'dd MMM yyyy') : '–'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Bank Account Dialog */}
        <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedAccount ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  <Input
                    name="bank_name"
                    value={accountForm.bank_name}
                    onChange={handleAccountInput}
                    placeholder="e.g. HDFC Bank"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Name *</Label>
                  <Input
                    name="account_name"
                    value={accountForm.account_name}
                    onChange={handleAccountInput}
                    placeholder="Company / account holder name"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Input
                    name="account_number"
                    value={accountForm.account_number}
                    onChange={handleAccountInput}
                    placeholder="Account number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code *</Label>
                  <Input
                    name="ifsc_code"
                    value={accountForm.ifsc_code}
                    onChange={handleAccountInput}
                    placeholder="e.g. HDFC0001234"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Branch *</Label>
                <Input
                  name="branch"
                  value={accountForm.branch}
                  onChange={handleAccountInput}
                  placeholder="Branch name"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={accountForm.is_active}
                  onChange={handleAccountInput}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="is_active" className="font-normal cursor-pointer">Active</Label>
              </div>
              <div className="space-y-2">
                <Label>Account Type (optional)</Label>
                <Input
                  name="account_type"
                  value={accountForm.account_type}
                  onChange={handleAccountInput}
                  placeholder="e.g. Current, Savings"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingAccount}>
                  {savingAccount ? 'Saving...' : selectedAccount ? 'Update' : 'Add Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
