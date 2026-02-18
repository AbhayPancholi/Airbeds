import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ownersAPI, tenantsAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Home, Users, Eye } from 'lucide-react';

const initialFormState = {
  name: '',
  phone: '',
  email: '',
  property_address: '',
  flat_number: ''
};

export default function Owners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerTenants, setOwnerTenants] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, [search, page]);

  const fetchOwners = async () => {
    try {
      const response = await ownersAPI.get({ search, page, limit: 10 });
      setOwners(response.data);
    } catch (error) {
      toast.error('Failed to load owners');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerTenants = async (ownerId) => {
    try {
      const response = await tenantsAPI.get({ owner_id: ownerId });
      setOwnerTenants(response.data);
    } catch (error) {
      console.error('Failed to load tenants');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Clean data - convert empty strings to null for optional fields
      const cleanData = {
        ...formData,
        email: formData.email?.trim() || null
      };
      
      if (selectedOwner) {
        await ownersAPI.update(selectedOwner.id, cleanData);
        toast.success('Owner updated successfully');
      } else {
        await ownersAPI.create(cleanData);
        toast.success('Owner added successfully');
      }
      setDialogOpen(false);
      setSelectedOwner(null);
      setFormData(initialFormState);
      fetchOwners();
    } catch (error) {
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Failed to save owner';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (owner) => {
    setSelectedOwner(owner);
    setFormData({
      name: owner.name,
      phone: owner.phone,
      email: owner.email || '',
      property_address: owner.property_address,
      flat_number: owner.flat_number
    });
    setDialogOpen(true);
  };

  const handleView = async (owner) => {
    setSelectedOwner(owner);
    await fetchOwnerTenants(owner.id);
    setViewDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await ownersAPI.delete(selectedOwner.id);
      toast.success('Owner deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedOwner(null);
      fetchOwners();
    } catch (error) {
      toast.error('Failed to delete owner');
    }
  };

  const openDeleteDialog = (owner) => {
    setSelectedOwner(owner);
    setDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="owners-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Owners</h1>
            <p className="text-slate-500 mt-1">Manage property owners</p>
          </div>
          <Button onClick={() => { setSelectedOwner(null); setFormData(initialFormState); setDialogOpen(true); }} data-testid="add-owner-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, or flat number..."
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
              <Home className="h-5 w-5" />
              Owner List ({owners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
              </div>
            ) : owners.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No owners found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Flat Number</TableHead>
                      <TableHead>Property Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {owners.map((owner) => (
                      <TableRow key={owner.id} data-testid={`owner-row-${owner.id}`}>
                        <TableCell className="font-medium">{owner.name}</TableCell>
                        <TableCell>{owner.phone}</TableCell>
                        <TableCell>{owner.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{owner.flat_number}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{owner.property_address}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(owner)} data-testid={`view-owner-${owner.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(owner)} data-testid={`edit-owner-${owner.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(owner)} className="text-red-600 hover:text-red-700" data-testid={`delete-owner-${owner.id}`}>
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
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={owners.length < 10}>
            Next
          </Button>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedOwner ? 'Edit Owner' : 'Add New Owner'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Owner Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required data-testid="owner-name-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required data-testid="owner-phone-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flat_number">Flat Number *</Label>
                <Input id="flat_number" name="flat_number" value={formData.flat_number} onChange={handleInputChange} required data-testid="flat-number-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property_address">Property Address *</Label>
                <Input id="property_address" name="property_address" value={formData.property_address} onChange={handleInputChange} required data-testid="property-address-input" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} data-testid="save-owner-btn">
                  {saving ? 'Saving...' : selectedOwner ? 'Update' : 'Add Owner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog with Tenants */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Owner Details</DialogTitle>
            </DialogHeader>
            {selectedOwner && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{selectedOwner.name}</p></div>
                  <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium">{selectedOwner.phone}</p></div>
                  <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{selectedOwner.email || '-'}</p></div>
                  <div><p className="text-sm text-slate-500">Flat Number</p><p className="font-medium">{selectedOwner.flat_number}</p></div>
                </div>
                <div><p className="text-sm text-slate-500">Property Address</p><p className="font-medium">{selectedOwner.property_address}</p></div>
                
                {/* Tenants under this owner */}
                <div>
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4" /> Tenants ({ownerTenants.length})
                  </h4>
                  {ownerTenants.length === 0 ? (
                    <p className="text-sm text-slate-500">No tenants under this owner</p>
                  ) : (
                    <div className="space-y-2">
                      {ownerTenants.map((tenant) => (
                        <div key={tenant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium">{tenant.tenant_name}</p>
                            <p className="text-sm text-slate-500">Room {tenant.room_number}</p>
                          </div>
                          <Badge variant="outline">{tenant.contact_number}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Owner</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">Are you sure you want to delete <strong>{selectedOwner?.name}</strong>? This action cannot be undone.</p>
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
