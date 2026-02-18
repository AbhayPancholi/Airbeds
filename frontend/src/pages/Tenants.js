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
import { tenantsAPI, ownersAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';

const initialFormState = {
  room_number: '',
  tenant_name: '',
  father_name: '',
  dob: '',
  gender: 'male',
  occupation: '',
  permanent_address: '',
  aadhaar_number: '',
  contact_number: '',
  email: '',
  joining_date: '',
  deposit_amount: '',
  monthly_rent: '',
  owner_id: ''
};

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTenants();
    fetchOwners();
  }, [search, page]);

  const fetchTenants = async () => {
    try {
      const response = await tenantsAPI.get({ search, page, limit: 10 });
      setTenants(response.data);
    } catch (error) {
      toast.error('Failed to load tenants');
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
        deposit_amount: parseFloat(formData.deposit_amount),
        monthly_rent: parseFloat(formData.monthly_rent)
      };

      if (selectedTenant) {
        await tenantsAPI.update(selectedTenant.id, data);
        toast.success('Tenant updated successfully');
      } else {
        await tenantsAPI.create(data);
        toast.success('Tenant added successfully');
      }
      setDialogOpen(false);
      setSelectedTenant(null);
      setFormData(initialFormState);
      fetchTenants();
    } catch (error) {
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Failed to save tenant';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      room_number: tenant.room_number,
      tenant_name: tenant.tenant_name,
      father_name: tenant.father_name,
      dob: tenant.dob,
      gender: tenant.gender,
      occupation: tenant.occupation,
      permanent_address: tenant.permanent_address,
      aadhaar_number: tenant.aadhaar_number,
      contact_number: tenant.contact_number,
      email: tenant.email || '',
      joining_date: tenant.joining_date,
      deposit_amount: tenant.deposit_amount.toString(),
      monthly_rent: tenant.monthly_rent.toString(),
      owner_id: tenant.owner_id
    });
    setDialogOpen(true);
  };

  const handleView = (tenant) => {
    setSelectedTenant(tenant);
    setViewDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await tenantsAPI.delete(selectedTenant.id);
      toast.success('Tenant deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
      fetchTenants();
    } catch (error) {
      toast.error('Failed to delete tenant');
    }
  };

  const openDeleteDialog = (tenant) => {
    setSelectedTenant(tenant);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="tenants-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tenants</h1>
            <p className="text-slate-500 mt-1">Manage your tenant records</p>
          </div>
          <Button onClick={() => { setSelectedTenant(null); setFormData(initialFormState); setDialogOpen(true); }} data-testid="add-tenant-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, room number, or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tenant List ({tenants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No tenants found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Monthly Rent</TableHead>
                      <TableHead>Joining Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id} data-testid={`tenant-row-${tenant.id}`}>
                        <TableCell>
                          <Badge variant="outline">{tenant.room_number}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                        <TableCell>{tenant.contact_number}</TableCell>
                        <TableCell>{tenant.owner_name || '-'}</TableCell>
                        <TableCell>{formatCurrency(tenant.monthly_rent)}</TableCell>
                        <TableCell>
                          {tenant.joining_date ? format(new Date(tenant.joining_date), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(tenant)} data-testid={`view-tenant-${tenant.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(tenant)} data-testid={`edit-tenant-${tenant.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(tenant)} className="text-red-600 hover:text-red-700" data-testid={`delete-tenant-${tenant.id}`}>
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
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={tenants.length < 10}>
            Next
          </Button>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room_number">Room Number *</Label>
                  <Input id="room_number" name="room_number" value={formData.room_number} onChange={handleInputChange} required data-testid="room-number-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant_name">Tenant Name *</Label>
                  <Input id="tenant_name" name="tenant_name" value={formData.tenant_name} onChange={handleInputChange} required data-testid="tenant-name-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="father_name">Father's Name *</Label>
                  <Input id="father_name" name="father_name" value={formData.father_name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                    <SelectTrigger data-testid="gender-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Input id="occupation" name="occupation" value={formData.occupation} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="permanent_address">Permanent Address *</Label>
                  <Input id="permanent_address" name="permanent_address" value={formData.permanent_address} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhaar_number">Aadhaar Number *</Label>
                  <Input id="aadhaar_number" name="aadhaar_number" value={formData.aadhaar_number} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_number">Contact Number *</Label>
                  <Input id="contact_number" name="contact_number" value={formData.contact_number} onChange={handleInputChange} required data-testid="contact-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joining_date">Joining Date *</Label>
                  <Input id="joining_date" name="joining_date" type="date" value={formData.joining_date} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit_amount">Deposit Amount *</Label>
                  <Input id="deposit_amount" name="deposit_amount" type="number" value={formData.deposit_amount} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_rent">Monthly Rent *</Label>
                  <Input id="monthly_rent" name="monthly_rent" type="number" value={formData.monthly_rent} onChange={handleInputChange} required data-testid="rent-input" />
                </div>
                <div className="space-y-2 md:col-span-2">
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} data-testid="save-tenant-btn">
                  {saving ? 'Saving...' : selectedTenant ? 'Update' : 'Add Tenant'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tenant Details</DialogTitle>
            </DialogHeader>
            {selectedTenant && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-500">Room Number</p><p className="font-medium">{selectedTenant.room_number}</p></div>
                  <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{selectedTenant.tenant_name}</p></div>
                  <div><p className="text-sm text-slate-500">Father's Name</p><p className="font-medium">{selectedTenant.father_name}</p></div>
                  <div><p className="text-sm text-slate-500">DOB</p><p className="font-medium">{selectedTenant.dob}</p></div>
                  <div><p className="text-sm text-slate-500">Gender</p><p className="font-medium capitalize">{selectedTenant.gender}</p></div>
                  <div><p className="text-sm text-slate-500">Occupation</p><p className="font-medium">{selectedTenant.occupation}</p></div>
                  <div><p className="text-sm text-slate-500">Contact</p><p className="font-medium">{selectedTenant.contact_number}</p></div>
                  <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{selectedTenant.email || '-'}</p></div>
                  <div><p className="text-sm text-slate-500">Aadhaar</p><p className="font-medium">{selectedTenant.aadhaar_number}</p></div>
                  <div><p className="text-sm text-slate-500">Owner</p><p className="font-medium">{selectedTenant.owner_name || '-'}</p></div>
                  <div><p className="text-sm text-slate-500">Monthly Rent</p><p className="font-medium">{formatCurrency(selectedTenant.monthly_rent)}</p></div>
                  <div><p className="text-sm text-slate-500">Deposit</p><p className="font-medium">{formatCurrency(selectedTenant.deposit_amount)}</p></div>
                </div>
                <div><p className="text-sm text-slate-500">Permanent Address</p><p className="font-medium">{selectedTenant.permanent_address}</p></div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Tenant</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">Are you sure you want to delete <strong>{selectedTenant?.tenant_name}</strong>? This action cannot be undone.</p>
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
