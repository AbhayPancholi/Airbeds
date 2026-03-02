import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { tenantsAPI, ownersAPI, registrationLinksAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Users, Eye, Link2, Copy } from 'lucide-react';
import { format } from 'date-fns';
import OccupancyForm, { initialFormState, calculateAge, fileToBase64 } from '../components/OccupancyForm';

// Re-export for local use
const OWNER_NONE_VALUE = '__none__';

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
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);

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

  const handleInputChange = (name, value) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'dob') next.age = calculateAge(value);
      return next;
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = useCallback(async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, [fieldName]: base64 }));
    } catch {
      toast.error('Failed to read file');
    }
  }, []);

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await registrationLinksAPI.createLink();
      const path = res.data?.path || `/register/${res.data?.token}`;
      const url = `${window.location.origin}${path}`;
      setGeneratedLink({ path, url, token: res.data?.token });
      setLinkDialogOpen(true);
    } catch {
      toast.error('Failed to generate link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (!generatedLink?.url) return;
    navigator.clipboard.writeText(generatedLink.url).then(() => toast.success('Link copied to clipboard')).catch(() => toast.error('Could not copy'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        email: formData.email?.trim() || null,
        owner_id: formData.owner_id && formData.owner_id !== OWNER_NONE_VALUE ? formData.owner_id : null
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
      const msg = typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Failed to save tenant';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      society_name: tenant.society_name || '',
      building_name: tenant.building_name || '',
      flat_number: tenant.flat_number || '',
      selected_room: tenant.selected_room || '',
      occupancy_type: tenant.occupancy_type || '',
      salutation: tenant.salutation || '',
      tenant_name: tenant.tenant_name || '',
      gender: tenant.gender || '',
      dob: tenant.dob || '',
      age: tenant.age || calculateAge(tenant.dob) || '',
      email: tenant.email || '',
      contact_number: tenant.contact_number || '',
      whatsapp_number: tenant.whatsapp_number || '',
      pan_number: tenant.pan_number || '',
      aadhaar_number: tenant.aadhaar_number || '',
      residential_address: tenant.residential_address || '',
      pin_code: tenant.pin_code || '',
      state: tenant.state || '',
      country: tenant.country || 'India',
      institute_office_name: tenant.institute_office_name || '',
      employment_type: tenant.employment_type || '',
      occupancy_details: tenant.occupancy_details || '',
      alternate_contact_number: tenant.alternate_contact_number || '',
      office_address: tenant.office_address || '',
      office_pin_code: tenant.office_pin_code || '',
      office_state: tenant.office_state || '',
      office_country: tenant.office_country || 'India',
      passport_photo: tenant.passport_photo || '',
      aadhaar_front: tenant.aadhaar_front || '',
      aadhaar_back: tenant.aadhaar_back || '',
      pan_card_doc: tenant.pan_card_doc || '',
      office_institute_id_doc: tenant.office_institute_id_doc || '',
      owner_id: tenant.owner_id || ''
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

  const openAddDialog = () => {
    setSelectedTenant(null);
    setFormData({ ...initialFormState, country: 'India', office_country: 'India' });
    setDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="tenants-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Occupancy Details</h1>
            <p className="text-slate-500 mt-1">Manage tenant / occupant records</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openAddDialog} data-testid="add-tenant-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
            <Button variant="outline" onClick={handleGenerateLink} disabled={generatingLink}>
              <Link2 className="h-4 w-4 mr-2" />
              {generatingLink ? 'Generating...' : 'Generate registration link'}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, contact, Aadhaar, society, flat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
          </CardContent>
        </Card>

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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
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
                      <TableHead>Tenant ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id} data-testid={`tenant-row-${tenant.id}`}>
                        <TableCell><Badge variant="outline">{tenant.tenant_id || '-'}</Badge></TableCell>
                        <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                        <TableCell>{[tenant.society_name, tenant.building_name, tenant.flat_number].filter(Boolean).join(' / ') || '-'}</TableCell>
                        <TableCell>{tenant.contact_number}</TableCell>
                        <TableCell>{tenant.owner_name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(tenant)} data-testid={`view-tenant-${tenant.id}`}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(tenant)} data-testid={`edit-tenant-${tenant.id}`}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedTenant(tenant); setDeleteDialogOpen(true); }} className="text-red-600 hover:text-red-700" data-testid={`delete-tenant-${tenant.id}`}><Trash2 className="h-4 w-4" /></Button>
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

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={tenants.length < 10}>Next</Button>
        </div>

        {/* Add/Edit Dialog - Full form from CustomerRegistration1 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTenant ? 'Edit Occupancy Details' : 'Add Occupancy Details'}</DialogTitle>
              <DialogDescription className="sr-only">Form to add or edit tenant occupancy details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <OccupancyForm
                formData={formData}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                onFileChange={handleFileChange}
                selectedTenant={selectedTenant}
                showOwnerField
                owners={owners}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} data-testid="save-tenant-btn">
                  {saving ? 'Saving...' : selectedTenant ? 'Update' : 'Submit'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Generated registration link dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registration link generated</DialogTitle>
              <DialogDescription className="sr-only">Copy this link to share with the tenant. The link can only be used once.</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-slate-600">Share this link with the tenant. It can only be used once; after they submit the form, the link will expire.</p>
            <div className="flex gap-2">
              <Input readOnly value={generatedLink?.url || ''} className="bg-slate-50 font-mono text-sm" />
              <Button type="button" variant="outline" size="icon" onClick={copyLinkToClipboard} title="Copy link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setLinkDialogOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Occupancy Details</DialogTitle>
              <DialogDescription className="sr-only">View tenant occupancy details</DialogDescription>
            </DialogHeader>
            {selectedTenant && (
              <div className="space-y-4">
                <div><p className="text-sm text-slate-500">Tenant ID</p><p className="font-medium">{selectedTenant.tenant_id || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Property</p><p className="font-medium">{[selectedTenant.society_name, selectedTenant.building_name, selectedTenant.flat_number].filter(Boolean).join(' / ') || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Room</p><p className="font-medium">{selectedTenant.selected_room || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{selectedTenant.tenant_name}</p></div>
                <div><p className="text-sm text-slate-500">Gender / DOB / Age</p><p className="font-medium">{[selectedTenant.gender, selectedTenant.dob, selectedTenant.age].filter(Boolean).join(' • ') || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Contact</p><p className="font-medium">{selectedTenant.contact_number}</p></div>
                <div><p className="text-sm text-slate-500">WhatsApp</p><p className="font-medium">{selectedTenant.whatsapp_number || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{selectedTenant.email || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Aadhaar</p><p className="font-medium">{selectedTenant.aadhaar_number}</p></div>
                <div><p className="text-sm text-slate-500">PAN</p><p className="font-medium">{selectedTenant.pan_number || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Residential Address</p><p className="font-medium">{selectedTenant.residential_address || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Pin / State / Country</p><p className="font-medium">{[selectedTenant.pin_code, selectedTenant.state, selectedTenant.country].filter(Boolean).join(', ') || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Institute / Office</p><p className="font-medium">{selectedTenant.institute_office_name || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Employment Type</p><p className="font-medium">{selectedTenant.employment_type || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Owner</p><p className="font-medium">{selectedTenant.owner_name || '-'}</p></div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Tenant</DialogTitle>
              <DialogDescription className="sr-only">Confirm deletion of this tenant</DialogDescription>
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
