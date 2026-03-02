import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { noticesAPI, tenantsAPI, noticeFormAPI } from '../services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Bell, Eye, Search, Link2, Copy } from 'lucide-react';
import MoveOutNoticeForm, { initialNoticeFormState, BANK_NONE_VALUE } from '../components/MoveOutNoticeForm';

const initialFormState = { ...initialNoticeFormState };

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
  const [searchCustomerId, setSearchCustomerId] = useState('');
  const [formSettings, setFormSettings] = useState(null);
  const [formSettingsLoading, setFormSettingsLoading] = useState(true);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringStartDay, setRecurringStartDay] = useState(1);
  const [recurringEndDay, setRecurringEndDay] = useState(5);
  const [openSpecialHours, setOpenSpecialHours] = useState(24);
  const [savingSettings, setSavingSettings] = useState(false);
  const [openingSpecial, setOpeningSpecial] = useState(false);

  useEffect(() => {
    fetchNotices();
    fetchTenants();
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await noticeFormAPI.getSettings();
        if (!cancelled) {
          setFormSettings(res.data);
          setRecurringEnabled(res.data?.recurring_enabled ?? false);
          setRecurringStartDay(res.data?.recurring_start_day ?? 1);
          setRecurringEndDay(res.data?.recurring_end_day ?? 5);
        }
      } catch {
        if (!cancelled) setFormSettings({});
      } finally {
        if (!cancelled) setFormSettingsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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

  const handleSearchByCustomerId = () => {
    const id = (searchCustomerId || '').trim();
    if (!id) {
      toast.error('Enter Customer ID (Tenant ID) to search');
      return;
    }
    const tenant = tenants.find(
      t => (t.tenant_id || '').toLowerCase() === id.toLowerCase()
    );
    if (!tenant) {
      toast.error('No tenant found with this Customer ID');
      return;
    }
    setFormData(prev => ({
      ...prev,
      tenant_id: tenant.id,
      society_name: tenant.society_name || prev.society_name,
      building_name: tenant.building_name || prev.building_name,
      flat_number: tenant.flat_number || prev.flat_number,
      selected_room: tenant.selected_room || prev.selected_room,
      occupancy_type: tenant.occupancy_type || prev.occupancy_type,
      salutation: tenant.salutation || prev.salutation,
      tenant_name: tenant.tenant_name || prev.tenant_name,
      email: tenant.email || prev.email,
      contact_number: tenant.contact_number || prev.contact_number,
    }));
    toast.success('Details filled from tenant record');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        email: formData.email?.trim() || null,
        tenant_id: formData.tenant_id || null,
        bank_name: formData.bank_name && formData.bank_name !== BANK_NONE_VALUE ? formData.bank_name : null,
      };
      if (selectedNotice) {
        await noticesAPI.update(selectedNotice.id, data);
        toast.success('Notice updated successfully');
      } else {
        await noticesAPI.create(data);
        toast.success('Move out notice created successfully');
      }
      setDialogOpen(false);
      setSelectedNotice(null);
      setFormData(initialFormState);
      setSearchCustomerId('');
      fetchNotices();
    } catch (error) {
      const msg = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : 'Failed to save notice';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (notice) => {
    setSelectedNotice(notice);
    setFormData({
      tenant_id: notice.tenant_id || '',
      society_name: notice.society_name || '',
      building_name: notice.building_name || '',
      flat_number: notice.flat_number || '',
      selected_room: notice.selected_room || '',
      occupancy_type: notice.occupancy_type || '',
      salutation: notice.salutation || '',
      tenant_name: notice.tenant_name || '',
      email: notice.email || '',
      contact_number: notice.contact_number || '',
      bank_name: notice.bank_name || '',
      beneficiary_name: notice.beneficiary_name || '',
      account_number: notice.account_number || '',
      ifsc_code: notice.ifsc_code || '',
      upi_id: notice.upi_id || '',
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

  const openAddDialog = () => {
    setSelectedNotice(null);
    setFormData(initialFormState);
    setSearchCustomerId('');
    setDialogOpen(true);
  };

  const noticeFormUrl = typeof window !== 'undefined' ? `${window.location.origin}/notice` : '';

  const copyNoticeFormLink = () => {
    if (!noticeFormUrl) return;
    navigator.clipboard.writeText(noticeFormUrl).then(() => toast.success('Link copied')).catch(() => toast.error('Could not copy'));
  };

  const handleSaveRecurring = async () => {
    setSavingSettings(true);
    try {
      const res = await noticeFormAPI.updateSettings({
        recurring_enabled: recurringEnabled,
        recurring_start_day: Math.min(28, Math.max(1, recurringStartDay)),
        recurring_end_day: Math.min(28, Math.max(1, recurringEndDay)),
      });
      setFormSettings(res.data);
      toast.success('Recurring schedule saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenSpecial = async () => {
    const hours = Math.min(24, Math.max(1, Number(openSpecialHours) || 24));
    setOpeningSpecial(true);
    try {
      const res = await noticeFormAPI.openSpecial(hours);
      setFormSettings(res.data);
      toast.success(`Form is now open for tenants for ${hours} hour(s)`);
    } catch (e) {
      const msg = e.response?.data?.detail || 'Failed to open form';
      toast.error(msg);
    } finally {
      setOpeningSpecial(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="notices-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Move Out Notice</h1>
            <p className="text-slate-500 mt-1">Track tenant move out notices</p>
          </div>
          <Button onClick={openAddDialog} data-testid="add-notice-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Notice
          </Button>
        </div>

        {/* Notice form (tenant-facing fixed link) availability */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Notice form (tenant link)
            </CardTitle>
            <p className="text-sm text-slate-500 font-normal">Control when the public move out notice form is open. You can always add notices from this page.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-center">
              <Input readOnly value={noticeFormUrl} className="bg-slate-50 font-mono text-sm" />
              <Button type="button" variant="outline" size="icon" onClick={copyNoticeFormLink} title="Copy link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {formSettingsLoading ? (
              <p className="text-sm text-slate-500">Loading settings...</p>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-4 p-3 bg-slate-50 rounded-lg">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={recurringEnabled} onChange={(e) => setRecurringEnabled(e.target.checked)} />
                    <span className="text-sm">Open form every month from day</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={1} max={28} value={recurringStartDay} onChange={(e) => setRecurringStartDay(Number(e.target.value) || 1)} className="w-16" />
                    <span className="text-sm">to</span>
                    <Input type="number" min={1} max={28} value={recurringEndDay} onChange={(e) => setRecurringEndDay(Number(e.target.value) || 5)} className="w-16" />
                  </div>
                  <Button type="button" size="sm" onClick={handleSaveRecurring} disabled={savingSettings}>
                    {savingSettings ? 'Saving...' : 'Save recurring'}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm">Open form for tenants now for</span>
                  <Select value={String(openSpecialHours)} onValueChange={(v) => setOpenSpecialHours(Number(v))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 6, 8, 12, 24].map(h => (
                        <SelectItem key={h} value={String(h)}>{h} {h === 1 ? 'hour' : 'hours'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="sm" variant="secondary" onClick={handleOpenSpecial} disabled={openingSpecial}>
                    {openingSpecial ? 'Opening...' : 'Open for tenants'}
                  </Button>
                </div>
                {formSettings?.special_window_ends_at && (
                  <p className="text-sm text-amber-700">
                    Form is open until {new Date(formSettings.special_window_ends_at).toLocaleString()} (one-time window).
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
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
                      <TableHead>Name</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notices.map((notice) => (
                      <TableRow key={notice.id} data-testid={`notice-row-${notice.id}`}>
                        <TableCell className="font-medium">{notice.tenant_name || '-'}</TableCell>
                        <TableCell>
                          {[notice.society_name, notice.building_name, notice.flat_number].filter(Boolean).join(' / ') || '-'}
                        </TableCell>
                        <TableCell>{notice.contact_number || '-'}</TableCell>
                        <TableCell>{notice.bank_name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(notice)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(notice)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedNotice(notice); setDeleteDialogOpen(true); }} className="text-red-600 hover:text-red-700">
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

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={notices.length < 10}>Next</Button>
        </div>

        {/* Add/Edit Dialog - Move Out Notice form */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedNotice ? 'Edit Move Out Notice' : 'Add Move Out Notice'}</DialogTitle>
              <DialogDescription className="sr-only">Move out notice form with property, identity and bank details</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter Customer ID (Tenant ID) to prefill"
                value={searchCustomerId}
                onChange={(e) => setSearchCustomerId(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleSearchByCustomerId}>
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <MoveOutNoticeForm
                formData={formData}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                bankNoneValue={BANK_NONE_VALUE}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} data-testid="save-notice-btn">
                  {saving ? 'Saving...' : selectedNotice ? 'Update' : 'Submit'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Move Out Notice Details</DialogTitle>
              <DialogDescription className="sr-only">View move out notice details</DialogDescription>
            </DialogHeader>
            {selectedNotice && (
              <div className="space-y-4">
                <div><p className="text-sm text-slate-500">Property</p><p className="font-medium">{[selectedNotice.society_name, selectedNotice.building_name, selectedNotice.flat_number].filter(Boolean).join(' / ') || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Room / Occupancy</p><p className="font-medium">{[selectedNotice.selected_room, selectedNotice.occupancy_type].filter(Boolean).join(' • ') || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{selectedNotice.salutation} {selectedNotice.tenant_name}</p></div>
                <div><p className="text-sm text-slate-500">Contact</p><p className="font-medium">{selectedNotice.contact_number}</p></div>
                <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{selectedNotice.email || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Bank</p><p className="font-medium">{selectedNotice.bank_name || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Beneficiary</p><p className="font-medium">{selectedNotice.beneficiary_name || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Account / IFSC</p><p className="font-medium">{[selectedNotice.account_number, selectedNotice.ifsc_code].filter(Boolean).join(' • ') || '-'}</p></div>
                <div><p className="text-sm text-slate-500">UPI ID</p><p className="font-medium">{selectedNotice.upi_id || '-'}</p></div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Notice</DialogTitle>
              <DialogDescription className="sr-only">Confirm deletion of this notice</DialogDescription>
            </DialogHeader>
            <p className="text-slate-600">Are you sure you want to delete this move out notice? This action cannot be undone.</p>
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
