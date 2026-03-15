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
import { Plus, Search, Edit, Trash2, Home, Users, Eye, Building2, FileSignature, MapPin, IdCard, Image, PenLine } from 'lucide-react';
import { fileToBase64 } from '../components/OccupancyForm';

const emptyAddress = () => ({
  flat_no: '',
  building_no: '',
  society: '',
  block_sector: '',
  street_landmark: '',
  city: '',
  state: '',
  pin_code: '',
});

const emptyPoa = () => ({
  name: '',
  dob: '',
  occupation: '',
  address: emptyAddress(),
  phone: '',
  email: '',
});

const emptyAgreement = () => ({
  start_date: '',
  end_date: '',
  one_time_deposit: '',
  monthly_rent: '',
});

const emptyFlat = () => ({
  address: emptyAddress(),
  measurement_sqft: '',
  floor_no: '',
  bhk: '',
  car_parking: false,
  agreement_with_poa: emptyAgreement(),
});

const initialFormState = () => ({
  name: '',
  phone: '',
  email: '',
  dob: '',
  occupation: '',
  address: emptyAddress(),
  poa: emptyPoa(),
  flats: [emptyFlat()],
  pan_number: '',
  aadhaar_number: '',
  photo: '',
  sign: '',
  pan_card_doc: '',
  aadhaar_card_doc: '',
});

function SectionTitle({ icon: Icon, title }) {
  return (
    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b-2 border-slate-800 pb-1 mt-6 first:mt-0">
      {Icon && <Icon className="h-4 w-4" />}
      {title}
    </h4>
  );
}

function AddressFields({ data, onChange }) {
  const setAddr = (key, value) => {
    onChange({ ...data, [key]: value });
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label>Flat / House No</Label>
        <Input value={data.flat_no} onChange={(e) => setAddr('flat_no', e.target.value)} placeholder="Flat / House No" />
      </div>
      <div className="space-y-1">
        <Label>Building Name / No</Label>
        <Input value={data.building_no} onChange={(e) => setAddr('building_no', e.target.value)} placeholder="Building Name / No" />
      </div>
      <div className="space-y-1">
        <Label>Society / Complex</Label>
        <Input value={data.society} onChange={(e) => setAddr('society', e.target.value)} placeholder="Society / Complex Name" />
      </div>
      <div className="space-y-1">
        <Label>Block / Sector</Label>
        <Input value={data.block_sector} onChange={(e) => setAddr('block_sector', e.target.value)} placeholder="Block / Sector" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label>Street / Road / Landmark</Label>
        <Input value={data.street_landmark} onChange={(e) => setAddr('street_landmark', e.target.value)} placeholder="Street, Road or Landmark" />
      </div>
      <div className="space-y-1">
        <Label>City</Label>
        <Input value={data.city} onChange={(e) => setAddr('city', e.target.value)} placeholder="City / Town" />
      </div>
      <div className="space-y-1">
        <Label>State</Label>
        <Input value={data.state} onChange={(e) => setAddr('state', e.target.value)} placeholder="State" />
      </div>
      <div className="space-y-1">
        <Label>Pin Code</Label>
        <Input value={data.pin_code} onChange={(e) => setAddr('pin_code', e.target.value)} placeholder="Pin Code" />
      </div>
    </div>
  );
}

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setOwnerAddress = (addr) => setFormData((prev) => ({ ...prev, address: addr }));
  const setPoa = (poa) => setFormData((prev) => ({ ...prev, poa }));
  const setPoaAddress = (addr) => setFormData((prev) => ({ ...prev, poa: { ...prev.poa, address: addr } }));
  const setFlats = (flats) => setFormData((prev) => ({ ...prev, flats }));

  const updateFlat = (index, updated) => {
    setFormData((prev) => {
      const next = [...(prev.flats || [emptyFlat()])];
      next[index] = typeof updated === 'function' ? updated(next[index]) : updated;
      return { ...prev, flats: next };
    });
  };

  const addFlat = () => {
    setFormData((prev) => ({ ...prev, flats: [...(prev.flats || []), emptyFlat()] }));
  };

  const removeFlat = (index) => {
    if ((formData.flats?.length || 0) <= 1) return;
    setFormData((prev) => ({
      ...prev,
      flats: prev.flats.filter((_, i) => i !== index),
    }));
  };

  const toImageSrc = (v) => (!v ? '' : v.startsWith('data:') ? v : `data:image/jpeg;base64,${v}`);

  const handleFileChange = async (e, field) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setFormData((prev) => ({ ...prev, [field]: base64 }));
    } catch {
      toast.error('Failed to read file');
    }
    e.target.value = '';
  };

  const buildPayload = () => {
    const clean = (v) => (v === '' || v == null ? undefined : v);
    const num = (v) => {
      if (v === '' || v == null) return undefined;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    };
    const addressPayload = (addr) => {
      if (!addr) return undefined;
      const a = { flat_no: addr.flat_no || '', building_no: addr.building_no || '', society: addr.society || '', block_sector: addr.block_sector || '', street_landmark: addr.street_landmark || '', city: addr.city || '', state: addr.state || '', pin_code: addr.pin_code || '' };
      return Object.values(a).every((x) => !x) ? undefined : a;
    };
    const poaPayload = () => {
      const p = formData.poa || emptyPoa();
      if (!p.name && !p.phone && !p.dob && !p.occupation && !p.email) return undefined;
      return {
        name: p.name || '',
        dob: clean(p.dob),
        occupation: p.occupation || '',
        address: addressPayload(p.address),
        phone: p.phone || '',
        email: clean(p.email) || undefined,
      };
    };
    const flatsPayload = () => {
      const list = formData.flats?.length ? formData.flats : [emptyFlat()];
      return list.map((f) => ({
        address: addressPayload(f.address),
        measurement_sqft: num(f.measurement_sqft),
        floor_no: clean(f.floor_no),
        bhk: f.bhk || '',
        car_parking: Boolean(f.car_parking),
        agreement_with_poa: (() => {
          const a = f.agreement_with_poa || emptyAgreement();
          if (!a.start_date && !a.end_date && a.one_time_deposit === '' && a.monthly_rent === '') return undefined;
          return {
            start_date: clean(a.start_date),
            end_date: clean(a.end_date),
            one_time_deposit: num(a.one_time_deposit),
            monthly_rent: num(a.monthly_rent),
          };
        })(),
      }));
    };

    return {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: clean(formData.email?.trim()),
      dob: clean(formData.dob),
      occupation: clean(formData.occupation),
      address: addressPayload(formData.address),
      poa: poaPayload(),
      flats: flatsPayload(),
      pan_number: clean(formData.pan_number?.trim()),
      aadhaar_number: clean(formData.aadhaar_number?.trim()),
      photo: clean(formData.photo),
      sign: clean(formData.sign),
      pan_card_doc: clean(formData.pan_card_doc),
      aadhaar_card_doc: clean(formData.aadhaar_card_doc),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
      if (selectedOwner) {
        await ownersAPI.update(selectedOwner.id, payload);
        toast.success('Owner updated successfully');
      } else {
        await ownersAPI.create(payload);
        toast.success('Owner added successfully');
      }
      setDialogOpen(false);
      setSelectedOwner(null);
      setFormData(initialFormState());
      fetchOwners();
    } catch (error) {
      const errMsg = typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Failed to save owner';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (owner) => {
    setSelectedOwner(owner);
    const addr = owner.address || emptyAddress();
    const poa = owner.poa || emptyPoa();
    const poaAddr = (poa && poa.address) ? poa.address : emptyAddress();
    const flats = Array.isArray(owner.flats) && owner.flats.length > 0
      ? owner.flats.map((f) => ({
          address: { ...emptyAddress(), ...(f.address || {}) },
          measurement_sqft: f.measurement_sqft ?? '',
          floor_no: f.floor_no ?? '',
          bhk: f.bhk ?? '',
          car_parking: Boolean(f.car_parking),
          agreement_with_poa: f.agreement_with_poa
            ? {
                start_date: f.agreement_with_poa.start_date ?? '',
                end_date: f.agreement_with_poa.end_date ?? '',
                one_time_deposit: f.agreement_with_poa.one_time_deposit ?? '',
                monthly_rent: f.agreement_with_poa.monthly_rent ?? '',
              }
            : emptyAgreement(),
        }))
      : [emptyFlat()];
    setFormData({
      name: owner.name || '',
      phone: owner.phone || '',
      email: owner.email || '',
      dob: owner.dob || '',
      occupation: owner.occupation || '',
      address: (() => {
        const addr = typeof owner.address === 'object' && owner.address ? owner.address : {};
        return { ...emptyAddress(), ...addr };
      })(),
      poa: {
        name: poa.name || '',
        dob: poa.dob || '',
        occupation: poa.occupation || '',
        address: typeof poaAddr === 'object' ? { ...emptyAddress(), ...poaAddr } : emptyAddress(),
        phone: poa.phone || '',
        email: poa.email || '',
      },
      flats,
      pan_number: owner.pan_number ?? '',
      aadhaar_number: owner.aadhaar_number ?? '',
      photo: owner.photo ?? '',
      sign: owner.sign ?? '',
      pan_card_doc: owner.pan_card_doc ?? '',
      aadhaar_card_doc: owner.aadhaar_card_doc ?? '',
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

  const openAddDialog = () => {
    setSelectedOwner(null);
    setFormData(initialFormState());
    setDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="owners-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Owners</h1>
            <p className="text-slate-500 mt-1">Manage property owners</p>
          </div>
          <Button onClick={openAddDialog} data-testid="add-owner-btn">
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Button>
        </div>

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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
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
                      <TableHead>Owner Name</TableHead>
                      <TableHead>Mobile Number</TableHead>
                      <TableHead>Rented Flat No.</TableHead>
                      <TableHead>Building Name</TableHead>
                      <TableHead>Society Name</TableHead>
                      <TableHead>Total Flats</TableHead>
                      <TableHead>POA Name</TableHead>
                      <TableHead>Tenant Count</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {owners.map((owner) => {
                      const firstFlat = owner.flats?.[0];
                      const addr = firstFlat?.address;
                      const totalFlats = (owner.flats || []).length;
                      return (
                      <TableRow key={owner.id} data-testid={`owner-row-${owner.id}`}>
                        <TableCell className="font-medium">{owner.name}</TableCell>
                        <TableCell>{owner.phone || '-'}</TableCell>
                        <TableCell>{addr?.flat_no || owner.flat_number || '-'}</TableCell>
                        <TableCell>{addr?.building_no || '-'}</TableCell>
                        <TableCell>{addr?.society || '-'}</TableCell>
                        <TableCell>{totalFlats > 0 ? totalFlats : '-'}</TableCell>
                        <TableCell>{owner.poa?.name?.trim() ? owner.poa.name : '-'}</TableCell>
                        <TableCell>{owner.tenant_count != null ? owner.tenant_count : '-'}</TableCell>
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
                    ); })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={owners.length < 10}>
            Next
          </Button>
        </div>

        {/* Add/Edit Dialog - Full owner form */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedOwner ? 'Edit Owner' : 'Add New Owner'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="overflow-y-auto pr-2 space-y-1">
                {/* Owner details */}
                <SectionTitle icon={Building2} title="Owner details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required data-testid="owner-name-input" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input id="occupation" name="occupation" value={formData.occupation} onChange={handleInputChange} />
                  </div>
                </div>

                <SectionTitle icon={MapPin} title="Owner address" />
                <AddressFields data={formData.address} onChange={setOwnerAddress} />

                <SectionTitle title="Owner contact" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required data-testid="owner-phone-input" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>

                {/* Identity / Documents */}
                <SectionTitle icon={IdCard} title="PAN, Aadhaar & uploads" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="pan_number">PAN Number</Label>
                    <Input id="pan_number" name="pan_number" value={formData.pan_number} onChange={handleInputChange} placeholder="e.g. ABCDE1234F" maxLength={10} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                    <Input id="aadhaar_number" name="aadhaar_number" value={formData.aadhaar_number} onChange={handleInputChange} placeholder="12-digit Aadhaar" maxLength={12} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1">
                    <Label>PAN card (PDF)</Label>
                    <Input type="file" accept=".pdf,application/pdf" onChange={(e) => handleFileChange(e, 'pan_card_doc')} className="cursor-pointer" />
                    {formData.pan_card_doc && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-green-600">PDF uploaded</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => setFormData((prev) => ({ ...prev, pan_card_doc: '' }))}>Remove</Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Aadhaar card (PDF)</Label>
                    <Input type="file" accept=".pdf,application/pdf" onChange={(e) => handleFileChange(e, 'aadhaar_card_doc')} className="cursor-pointer" />
                    {formData.aadhaar_card_doc && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-green-600">PDF uploaded</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => setFormData((prev) => ({ ...prev, aadhaar_card_doc: '' }))}>Remove</Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2"><Image className="h-4 w-4" /> Photo</Label>
                    <Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => handleFileChange(e, 'photo')} className="cursor-pointer" />
                    {formData.photo && (
                      <div className="mt-2 flex items-start gap-2">
                        <img src={toImageSrc(formData.photo)} alt="Owner" className="h-24 w-24 object-cover rounded border" />
                        <Button type="button" variant="outline" size="sm" onClick={() => setFormData((prev) => ({ ...prev, photo: '' }))}>Remove</Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2"><PenLine className="h-4 w-4" /> Signature</Label>
                    <Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => handleFileChange(e, 'sign')} className="cursor-pointer" />
                    {formData.sign && (
                      <div className="mt-2 flex items-start gap-2">
                        <img src={toImageSrc(formData.sign)} alt="Signature" className="h-16 w-32 object-contain rounded border bg-white" />
                        <Button type="button" variant="outline" size="sm" onClick={() => setFormData((prev) => ({ ...prev, sign: '' }))}>Remove</Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* POA */}
                <SectionTitle icon={FileSignature} title="Power of Attorney (P.O.A)" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>POA Name</Label>
                    <Input value={formData.poa?.name ?? ''} onChange={(e) => setPoa({ ...formData.poa, name: e.target.value })} placeholder="Name" />
                  </div>
                  <div className="space-y-1">
                    <Label>POA DOB</Label>
                    <Input type="date" value={formData.poa?.dob ?? ''} onChange={(e) => setPoa({ ...formData.poa, dob: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>POA Occupation</Label>
                    <Input value={formData.poa?.occupation ?? ''} onChange={(e) => setPoa({ ...formData.poa, occupation: e.target.value })} placeholder="Occupation" />
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-slate-600">POA Address</Label>
                  <div className="mt-1">
                    <AddressFields data={formData.poa?.address ?? emptyAddress()} onChange={setPoaAddress} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1">
                    <Label>POA Phone</Label>
                    <Input value={formData.poa?.phone ?? ''} onChange={(e) => setPoa({ ...formData.poa, phone: e.target.value })} placeholder="Phone" />
                  </div>
                  <div className="space-y-1">
                    <Label>POA Email</Label>
                    <Input type="email" value={formData.poa?.email ?? ''} onChange={(e) => setPoa({ ...formData.poa, email: e.target.value })} placeholder="Email" />
                  </div>
                </div>

                {/* Flats (repeatable) */}
                <SectionTitle icon={Home} title="Flats (rented by owner)" />
                {(formData.flats || []).map((flat, idx) => (
                  <Card key={idx} className="mt-3">
                    <CardHeader className="py-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Flat {idx + 1}</CardTitle>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => removeFlat(idx)} disabled={(formData.flats?.length || 0) <= 1}>
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-slate-600">Flat address</Label>
                        <div className="mt-1">
                          <AddressFields data={flat.address ?? emptyAddress()} onChange={(addr) => updateFlat(idx, (f) => ({ ...f, address: addr }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label>Area (sq. ft.)</Label>
                          <Input type="number" min="0" step="1" value={flat.measurement_sqft ?? ''} onChange={(e) => updateFlat(idx, (f) => ({ ...f, measurement_sqft: e.target.value }))} placeholder="Sq. ft." />
                        </div>
                        <div className="space-y-1">
                          <Label>Floor no</Label>
                          <Input value={flat.floor_no ?? ''} onChange={(e) => updateFlat(idx, (f) => ({ ...f, floor_no: e.target.value }))} placeholder="Floor" />
                        </div>
                        <div className="space-y-1">
                          <Label>Size (BHK)</Label>
                          <Input value={flat.bhk ?? ''} onChange={(e) => updateFlat(idx, (f) => ({ ...f, bhk: e.target.value }))} placeholder="e.g. 2 BHK" />
                        </div>
                        <div className="space-y-1 flex flex-col justify-end">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={Boolean(flat.car_parking)} onChange={(e) => updateFlat(idx, (f) => ({ ...f, car_parking: e.target.checked }))} className="rounded" />
                            <span className="text-sm">Car parking</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-600">Agreement with POA (this flat)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
                          <div className="space-y-1">
                            <Label>Start date</Label>
                            <Input type="date" value={flat.agreement_with_poa?.start_date ?? ''} onChange={(e) => updateFlat(idx, (f) => ({ ...f, agreement_with_poa: { ...(f.agreement_with_poa || emptyAgreement()), start_date: e.target.value } }))} />
                          </div>
                          <div className="space-y-1">
                            <Label>End date</Label>
                            <Input type="date" value={flat.agreement_with_poa?.end_date ?? ''} onChange={(e) => updateFlat(idx, (f) => ({ ...f, agreement_with_poa: { ...(f.agreement_with_poa || emptyAgreement()), end_date: e.target.value } }))} />
                          </div>
                          <div className="space-y-1">
                            <Label>One-time deposit</Label>
                            <Input type="number" min="0" step="1" value={flat.agreement_with_poa?.one_time_deposit ?? ''} onChange={(e) => updateFlat(idx, (f) => ({ ...f, agreement_with_poa: { ...(f.agreement_with_poa || emptyAgreement()), one_time_deposit: e.target.value } }))} placeholder="Amount" />
                          </div>
                          <div className="space-y-1">
                            <Label>Monthly rent</Label>
                            <Input type="number" min="0" step="1" value={flat.agreement_with_poa?.monthly_rent ?? ''} onChange={(e) => updateFlat(idx, (f) => ({ ...f, agreement_with_poa: { ...(f.agreement_with_poa || emptyAgreement()), monthly_rent: e.target.value } }))} placeholder="Rent" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" className="mt-3" onClick={addFlat}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add another flat
                </Button>
              </div>
              <DialogFooter className="mt-4 shrink-0 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} data-testid="save-owner-btn">
                  {saving ? 'Saving...' : selectedOwner ? 'Update' : 'Add Owner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Owner Details</DialogTitle>
            </DialogHeader>
            {selectedOwner && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{selectedOwner.name}</p></div>
                  <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium">{selectedOwner.phone}</p></div>
                  <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{selectedOwner.email || '-'}</p></div>
                  {selectedOwner.dob && <div><p className="text-sm text-slate-500">DOB</p><p className="font-medium">{selectedOwner.dob}</p></div>}
                  {selectedOwner.occupation && <div><p className="text-sm text-slate-500">Occupation</p><p className="font-medium">{selectedOwner.occupation}</p></div>}
                </div>
                {selectedOwner.address && (selectedOwner.address.flat_no || selectedOwner.address.state) && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Owner address</p>
                    <p className="font-medium">{[selectedOwner.address.flat_no, selectedOwner.address.building_no, selectedOwner.address.society, selectedOwner.address.block_sector, selectedOwner.address.street_landmark, selectedOwner.address.city, selectedOwner.address.state, selectedOwner.address.pin_code].filter(Boolean).join(', ') || '-'}</p>
                  </div>
                )}
                <div><p className="text-sm text-slate-500">Flat Number</p><p className="font-medium">{selectedOwner.flat_number || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Property Address</p><p className="font-medium">{selectedOwner.property_address || '-'}</p></div>

                {(selectedOwner.pan_number || selectedOwner.aadhaar_number || selectedOwner.photo || selectedOwner.sign || selectedOwner.pan_card_doc || selectedOwner.aadhaar_card_doc) && (
                  <div>
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-2"><IdCard className="h-4 w-4" /> PAN, Aadhaar & uploads</h4>
                    <div className="grid grid-cols-2 gap-4 pl-2">
                      {selectedOwner.pan_number && <div><p className="text-sm text-slate-500">PAN</p><p className="font-medium">{selectedOwner.pan_number}</p></div>}
                      {selectedOwner.aadhaar_number && <div><p className="text-sm text-slate-500">Aadhaar</p><p className="font-medium">{selectedOwner.aadhaar_number}</p></div>}
                    </div>
                    <div className="flex flex-wrap gap-4 pl-2 mt-2">
                      {selectedOwner.pan_card_doc && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">PAN card (PDF)</p>
                          <a href={selectedOwner.pan_card_doc.startsWith('data:') ? selectedOwner.pan_card_doc : `data:application/pdf;base64,${selectedOwner.pan_card_doc}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View PDF</a>
                        </div>
                      )}
                      {selectedOwner.aadhaar_card_doc && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Aadhaar card (PDF)</p>
                          <a href={selectedOwner.aadhaar_card_doc.startsWith('data:') ? selectedOwner.aadhaar_card_doc : `data:application/pdf;base64,${selectedOwner.aadhaar_card_doc}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View PDF</a>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 pl-2 mt-3">
                      {selectedOwner.photo && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Photo</p>
                          <img src={selectedOwner.photo.startsWith('data:') ? selectedOwner.photo : `data:image/jpeg;base64,${selectedOwner.photo}`} alt="Owner" className="h-24 w-24 object-cover rounded border" />
                        </div>
                      )}
                      {selectedOwner.sign && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Signature</p>
                          <img src={selectedOwner.sign.startsWith('data:') ? selectedOwner.sign : `data:image/jpeg;base64,${selectedOwner.sign}`} alt="Signature" className="h-16 w-32 object-contain rounded border bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedOwner.poa && (selectedOwner.poa.name || selectedOwner.poa.phone) && (
                  <>
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2"><FileSignature className="h-4 w-4" /> P.O.A</h4>
                    <div className="grid grid-cols-2 gap-4 pl-2">
                      {selectedOwner.poa.name && <div><p className="text-sm text-slate-500">Name</p><p className="font-medium">{selectedOwner.poa.name}</p></div>}
                      {selectedOwner.poa.dob && <div><p className="text-sm text-slate-500">DOB</p><p className="font-medium">{selectedOwner.poa.dob}</p></div>}
                      {selectedOwner.poa.occupation && <div><p className="text-sm text-slate-500">Occupation</p><p className="font-medium">{selectedOwner.poa.occupation}</p></div>}
                      {selectedOwner.poa.phone && <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium">{selectedOwner.poa.phone}</p></div>}
                      {selectedOwner.poa.email && <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{selectedOwner.poa.email}</p></div>}
                    </div>
                    {selectedOwner.poa.address && (selectedOwner.poa.address.flat_no || selectedOwner.poa.address.state) && (
                      <div className="pl-2"><p className="text-sm text-slate-500">Address</p><p className="font-medium">{[selectedOwner.poa.address.flat_no, selectedOwner.poa.address.building_no, selectedOwner.poa.address.society, selectedOwner.poa.address.block_sector, selectedOwner.poa.address.street_landmark, selectedOwner.poa.address.city, selectedOwner.poa.address.state, selectedOwner.poa.address.pin_code].filter(Boolean).join(', ') || '-'}</p></div>
                    )}
                  </>
                )}

                {selectedOwner.flats && selectedOwner.flats.length > 0 && (
                  <>
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2"><Home className="h-4 w-4" /> Flats</h4>
                    <div className="space-y-3 pl-2">
                      {selectedOwner.flats.map((flat, i) => (
                        <Card key={i}>
                          <CardContent className="p-3">
                            <p className="font-medium">Flat {i + 1}</p>
                            {flat.address && <p className="text-sm text-slate-600">Address: {[flat.address.flat_no, flat.address.building_no, flat.address.society, flat.address.block_sector, flat.address.street_landmark, flat.address.city, flat.address.state, flat.address.pin_code].filter(Boolean).join(', ') || '-'}</p>}
                            <div className="flex flex-wrap gap-2 mt-1 text-sm">
                              {flat.measurement_sqft != null && <Badge variant="outline">{flat.measurement_sqft} sq.ft</Badge>}
                              {flat.floor_no && <Badge variant="outline">Floor {flat.floor_no}</Badge>}
                              {flat.bhk && <Badge variant="outline">{flat.bhk}</Badge>}
                              {flat.car_parking && <Badge variant="outline">Car parking</Badge>}
                            </div>
                            {flat.agreement_with_poa && (flat.agreement_with_poa.start_date || flat.agreement_with_poa.monthly_rent != null) && (
                              <p className="text-sm text-slate-500 mt-2">Agreement: {flat.agreement_with_poa.start_date || ''} – {flat.agreement_with_poa.end_date || ''} | Deposit: {flat.agreement_with_poa.one_time_deposit ?? '-'} | Rent: {flat.agreement_with_poa.monthly_rent ?? '-'}/mo</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                <div>
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-3"><Users className="h-4 w-4" /> Tenants ({ownerTenants.length})</h4>
                  {ownerTenants.length === 0 ? (
                    <p className="text-sm text-slate-500">No tenants under this owner</p>
                  ) : (
                    <div className="space-y-2">
                      {ownerTenants.map((tenant) => (
                        <div key={tenant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium">{tenant.tenant_name}</p>
                            <p className="text-sm text-slate-500">{tenant.flat_number}</p>
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
