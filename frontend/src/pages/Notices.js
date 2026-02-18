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
import { noticesAPI, tenantsAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Bell, Eye } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const initialFormState = {
  tenant_id: '',
  notice_date: '',
  leaving_date: '',
  reason: ''
};

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotices();
    fetchTenants();
  }, [page]);

  const fetchNotices = async () => {
    try {
      const response = await noticesAPI.get({ page, limit: 10 });
      setNotices(response.data);
    } catch (error) {
      toast.error('Failed to load notices');
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
      if (selectedNotice) {
        await noticesAPI.update(selectedNotice.id, formData);
        toast.success('Notice updated successfully');
      } else {
        await noticesAPI.create(formData);
        toast.success('Notice created successfully');
      }
      setDialogOpen(false);
      setSelectedNotice(null);
      setFormData(initialFormState);
      fetchNotices();
    } catch (error) {
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Failed to save notice';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (notice) => {
    setSelectedNotice(notice);
    setFormData({
      tenant_id: notice.tenant_id,
      notice_date: notice.notice_date,
      leaving_date: notice.leaving_date,
      reason: notice.reason
    });
    setDialogOpen(true);
  };

  const handleView = (notice) => {
    setSelectedNotice(notice);
    setViewDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await noticesAPI.delete(selectedNotice.id);
      toast.success('Notice deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedNotice(null);
      fetchNotices();
    } catch (error) {
      toast.error('Failed to delete notice');
    }
  };

  const openDeleteDialog = (notice) => {
    setSelectedNotice(notice);
    setDeleteDialogOpen(true);
  };

  const getDaysRemaining = (leavingDate) => {
    const today = new Date();
    const leaving = new Date(leavingDate);
    const days = differenceInDays(leaving, today);
    
    if (days < 0) return { label: 'Left', variant: 'secondary' };
    if (days === 0) return { label: 'Today', variant: 'destructive' };
    if (days <= 7) return { label: `${days} days`, variant: 'destructive' };
    if (days <= 30) return { label: `${days} days`, variant: 'warning' };
    return { label: `${days} days`, variant: 'default' };
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="notices-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Notices</h1>
            <p className="text-slate-500 mt-1">Track tenant leave notices</p>
          </div>
          <Button onClick={() => { setSelectedNotice(null); setFormData(initialFormState); setDialogOpen(true); }} data-testid="add-notice-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Notice
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notice List ({notices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No notices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Notice Date</TableHead>
                      <TableHead>Leaving Date</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notices.map((notice) => {
                      const daysInfo = getDaysRemaining(notice.leaving_date);
                      return (
                        <TableRow key={notice.id} data-testid={`notice-row-${notice.id}`}>
                          <TableCell className="font-medium">{notice.tenant_name || '-'}</TableCell>
                          <TableCell>
                            {notice.notice_date ? format(new Date(notice.notice_date), 'dd MMM yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {notice.leaving_date ? format(new Date(notice.leaving_date), 'dd MMM yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                daysInfo.variant === 'destructive' ? 'bg-red-100 text-red-700' :
                                daysInfo.variant === 'warning' ? 'bg-amber-100 text-amber-700' :
                                daysInfo.variant === 'secondary' ? 'bg-slate-100 text-slate-700' :
                                'bg-emerald-100 text-emerald-700'
                              }
                            >
                              {daysInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{notice.reason}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleView(notice)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(notice)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(notice)} className="text-red-600 hover:text-red-700">
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

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={notices.length < 10}>
            Next
          </Button>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedNotice ? 'Edit Notice' : 'Add Leave Notice'}</DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notice_date">Notice Date *</Label>
                  <Input id="notice_date" name="notice_date" type="date" value={formData.notice_date} onChange={handleInputChange} required data-testid="notice-date-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaving_date">Leaving Date *</Label>
                  <Input id="leaving_date" name="leaving_date" type="date" value={formData.leaving_date} onChange={handleInputChange} required data-testid="leaving-date-input" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea id="reason" name="reason" value={formData.reason} onChange={handleInputChange} required placeholder="Reason for leaving..." data-testid="reason-input" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} data-testid="save-notice-btn">
                  {saving ? 'Saving...' : selectedNotice ? 'Update' : 'Add Notice'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Notice Details</DialogTitle>
            </DialogHeader>
            {selectedNotice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-500">Tenant</p><p className="font-medium">{selectedNotice.tenant_name}</p></div>
                  <div>
                    <p className="text-sm text-slate-500">Days Remaining</p>
                    <Badge 
                      className={
                        getDaysRemaining(selectedNotice.leaving_date).variant === 'destructive' ? 'bg-red-100 text-red-700' :
                        getDaysRemaining(selectedNotice.leaving_date).variant === 'warning' ? 'bg-amber-100 text-amber-700' :
                        getDaysRemaining(selectedNotice.leaving_date).variant === 'secondary' ? 'bg-slate-100 text-slate-700' :
                        'bg-emerald-100 text-emerald-700'
                      }
                    >
                      {getDaysRemaining(selectedNotice.leaving_date).label}
                    </Badge>
                  </div>
                  <div><p className="text-sm text-slate-500">Notice Date</p><p className="font-medium">{selectedNotice.notice_date ? format(new Date(selectedNotice.notice_date), 'dd MMM yyyy') : '-'}</p></div>
                  <div><p className="text-sm text-slate-500">Leaving Date</p><p className="font-medium">{selectedNotice.leaving_date ? format(new Date(selectedNotice.leaving_date), 'dd MMM yyyy') : '-'}</p></div>
                </div>
                <div><p className="text-sm text-slate-500">Reason</p><p className="font-medium">{selectedNotice.reason}</p></div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Notice</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">Are you sure you want to delete this notice? This action cannot be undone.</p>
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
