import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { agreementsAPI, tenantsAPI, ownersAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';

const initialFormState = {
  tenant_id: '',
  owner_id: '',
  start_date: '',
  end_date: '',
  rent_amount: '',
  deposit_amount: ''
};

export default function Agreements() {
  const [agreements, setAgreements] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAgreements();
    fetchTenants();
    fetchOwners();
  }, [page]);

  const fetchAgreements = async () => {
    try {
      const response = await agreementsAPI.get({ page, limit: 10 });
      setAgreements(response.data);
    } catch (error) {
      toast.error('Failed to load agreements');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await tenantsAPI.getAll();
      setTenants(response.data);
    } catch (error) {
      console.error('Failed to load tenants');
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
        rent_amount: parseFloat(formData.rent_amount),
        deposit_amount: parseFloat(formData.deposit_amount)
      };

      if (selectedAgreement) {
        await agreementsAPI.update(selectedAgreement.id, data);
        toast.success('Agreement updated successfully');
      } else {
        await agreementsAPI.create(data);
        toast.success('Agreement created successfully');
      }
      setDialogOpen(false);
      setSelectedAgreement(null);
      setFormData(initialFormState);
      fetchAgreements();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save agreement');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (agreement) => {
    setSelectedAgreement(agreement);
    setFormData({
      tenant_id: agreement.tenant_id,
      owner_id: agreement.owner_id,
      start_date: agreement.start_date,
      end_date: agreement.end_date,
      rent_amount: agreement.rent_amount.toString(),
      deposit_amount: agreement.deposit_amount.toString()
    });
    setDialogOpen(true);
  };

  const handleView = (agreement) => {
    setSelectedAgreement(agreement);
    setViewDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await agreementsAPI.delete(selectedAgreement.id);
      toast.success('Agreement deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAgreement(null);
      fetchAgreements();
    } catch (error) {
      toast.error('Failed to delete agreement');
    }
  };

  const openDeleteDialog = (agreement) => {
    setSelectedAgreement(agreement);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Expired</Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="agreements-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agreements</h1>
            <p className="text-slate-500 mt-1">Manage rental agreements</p>
          </div>
          <Button onClick={() => { setSelectedAgreement(null); setFormData(initialFormState); setDialogOpen(true); }} data-testid="add-agreement-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Agreement
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Agreement List ({agreements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
              </div>
            ) : agreements.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No agreements found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agreements.map((agreement) => (
                      <TableRow key={agreement.id} data-testid={`agreement-row-${agreement.id}`}>
                        <TableCell className="font-medium">{agreement.tenant_name || '-'}</TableCell>
                        <TableCell>{agreement.owner_name || '-'}</TableCell>
                        <TableCell>{agreement.start_date ? format(new Date(agreement.start_date), 'dd MMM yyyy') : '-'}</TableCell>
                        <TableCell>{agreement.end_date ? format(new Date(agreement.end_date), 'dd MMM yyyy') : '-'}</TableCell>
                        <TableCell>{formatCurrency(agreement.rent_amount)}</TableCell>
                        <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(agreement)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(agreement)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(agreement)} className="text-red-600 hover:text-red-700">
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
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={agreements.length < 10}>
            Next
          </Button>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedAgreement ? 'Edit Agreement' : 'Add New Agreement'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant_id">Tenant *</Label>
                <Select value={formData.tenant_id} onValueChange={(value) => handleSelectChange('tenant_id', value)}>
                  <SelectTrigger data-testid="tenant-select">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>{tenant.tenant_name} - Room {tenant.room_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleInputChange} required data-testid="start-date-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleInputChange} required data-testid="end-date-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent_amount">Rent Amount *</Label>
                  <Input id="rent_amount" name="rent_amount" type="number" value={formData.rent_amount} onChange={handleInputChange} required data-testid="rent-amount-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit_amount">Deposit Amount *</Label>
                  <Input id="deposit_amount" name="deposit_amount" type="number" value={formData.deposit_amount} onChange={handleInputChange} required data-testid="deposit-amount-input" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} data-testid="save-agreement-btn">
                  {saving ? 'Saving...' : selectedAgreement ? 'Update' : 'Create Agreement'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agreement Details</DialogTitle>
            </DialogHeader>
            {selectedAgreement && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-500">Tenant</p><p className="font-medium">{selectedAgreement.tenant_name}</p></div>
                  <div><p className="text-sm text-slate-500">Owner</p><p className="font-medium">{selectedAgreement.owner_name}</p></div>
                  <div><p className="text-sm text-slate-500">Start Date</p><p className="font-medium">{selectedAgreement.start_date ? format(new Date(selectedAgreement.start_date), 'dd MMM yyyy') : '-'}</p></div>
                  <div><p className="text-sm text-slate-500">End Date</p><p className="font-medium">{selectedAgreement.end_date ? format(new Date(selectedAgreement.end_date), 'dd MMM yyyy') : '-'}</p></div>
                  <div><p className="text-sm text-slate-500">Rent Amount</p><p className="font-medium">{formatCurrency(selectedAgreement.rent_amount)}</p></div>
                  <div><p className="text-sm text-slate-500">Deposit Amount</p><p className="font-medium">{formatCurrency(selectedAgreement.deposit_amount)}</p></div>
                  <div><p className="text-sm text-slate-500">Status</p>{getStatusBadge(selectedAgreement.status)}</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Agreement</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">Are you sure you want to delete this agreement? This action cannot be undone.</p>
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
