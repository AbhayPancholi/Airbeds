import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { policeVerificationsAPI, tenantsAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Shield, Eye, Upload, FileImage, X, FileDown } from 'lucide-react';
import { format } from 'date-fns';

const initialFormState = {
  tenant_id: '',
  employer_details: '',
  local_address: '',
  emergency_contact: '',
  photograph: '',
  id_proof: ''
};

export default function PoliceVerification() {
  const [verifications, setVerifications] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef(null);
  const idProofInputRef = useRef(null);

  useEffect(() => {
    fetchVerifications();
    fetchTenants();
  }, [page]);

  const fetchVerifications = async () => {
    try {
      const response = await policeVerificationsAPI.get({ page, limit: 10 });
      setVerifications(response.data);
    } catch (error) {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (verification) => {
    try {
      const res = await policeVerificationsAPI.downloadDocument(verification.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `police_verification_${verification.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download police verification form');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (selectedVerification) {
        await policeVerificationsAPI.update(selectedVerification.id, formData);
        toast.success('Verification updated successfully');
      } else {
        await policeVerificationsAPI.create(formData);
        toast.success('Verification created successfully');
      }
      setDialogOpen(false);
      setSelectedVerification(null);
      setFormData(initialFormState);
      fetchVerifications();
    } catch (error) {
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Failed to save verification';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (verification) => {
    setSelectedVerification(verification);
    setFormData({
      tenant_id: verification.tenant_id,
      employer_details: verification.employer_details,
      local_address: verification.local_address,
      emergency_contact: verification.emergency_contact,
      photograph: verification.photograph || '',
      id_proof: verification.id_proof || ''
    });
    setDialogOpen(true);
  };

  const handleView = (verification) => {
    setSelectedVerification(verification);
    setViewDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await policeVerificationsAPI.delete(selectedVerification.id);
      toast.success('Verification deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedVerification(null);
      fetchVerifications();
    } catch (error) {
      toast.error('Failed to delete verification');
    }
  };

  const openDeleteDialog = (verification) => {
    setSelectedVerification(verification);
    setDeleteDialogOpen(true);
  };

  const removeFile = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="police-verification-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Police Verification</h1>
            <p className="text-slate-500 mt-1">Manage tenant police verification records</p>
          </div>
          <Button onClick={() => { setSelectedVerification(null); setFormData(initialFormState); setDialogOpen(true); }} data-testid="add-verification-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Verification
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification List ({verifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
              </div>
            ) : verifications.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No verifications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Employer Details</TableHead>
                      <TableHead>Emergency Contact</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifications.map((verification) => (
                      <TableRow key={verification.id} data-testid={`verification-row-${verification.id}`}>
                        <TableCell className="font-medium">{verification.tenant_name || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{verification.employer_details}</TableCell>
                        <TableCell>{verification.emergency_contact}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {verification.photograph && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">Photo</span>
                            )}
                            {verification.id_proof && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">ID</span>
                            )}
                            {!verification.photograph && !verification.id_proof && '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {verification.created_at ? format(new Date(verification.created_at), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(verification)} title="Download form">
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleView(verification)} title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(verification)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(verification)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
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
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={verifications.length < 10}>
            Next
          </Button>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedVerification ? 'Edit Verification' : 'Add New Verification'}</DialogTitle>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} data-testid="save-verification-btn">
                  {saving ? 'Saving...' : selectedVerification ? 'Update' : 'Create Verification'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verification Details</DialogTitle>
            </DialogHeader>
            {selectedVerification && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-500">Tenant</p><p className="font-medium">{selectedVerification.tenant_name}</p></div>
                  <div><p className="text-sm text-slate-500">Emergency Contact</p><p className="font-medium">{selectedVerification.emergency_contact}</p></div>
                </div>
                <div><p className="text-sm text-slate-500">Employer Details</p><p className="font-medium">{selectedVerification.employer_details}</p></div>
                <div><p className="text-sm text-slate-500">Local Address</p><p className="font-medium">{selectedVerification.local_address}</p></div>
                
                {/* Documents */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Photograph</p>
                    {selectedVerification.photograph ? (
                      <img src={selectedVerification.photograph} alt="Photograph" className="w-full h-48 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                        <p className="text-slate-400">No photograph</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-2">ID Proof</p>
                    {selectedVerification.id_proof ? (
                      selectedVerification.id_proof.startsWith('data:image') ? (
                        <img src={selectedVerification.id_proof} alt="ID Proof" className="w-full h-48 object-cover rounded-lg border" />
                      ) : (
                        <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                          <FileImage className="h-12 w-12 text-slate-400" />
                        </div>
                      )
                    ) : (
                      <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                        <p className="text-slate-400">No ID proof</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Verification</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">Are you sure you want to delete this verification record? This action cannot be undone.</p>
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
