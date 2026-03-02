import { useCallback } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const SOCIETIES = ['Annexe', 'Cosmos', 'Daffodils', 'Grevillea', 'Heliconia', 'Iris', 'Jasminium', 'Laburnum Park', 'Roystonea', 'Sylvania', 'Trillium', 'Zinnia'];
const BUILDINGS = ['A', 'B', 'C', 'D', 'E'];
const FLAT_NUMBERS = ['101', '102', '103', '104', '105', '106', '107', '108', '109'];
const ROOM_TYPES = ['Master Bedroom with Tub', 'Master Bedroom', 'Front of Kitchen Bedroom', 'Non-attached', '0.5 Room', 'Hall'];
const OCCUPANCY_TYPES = [{ value: 'Single', label: 'Single Occupancy' }, { value: 'Sharing', label: 'Sharing Occupancy' }];
const SALUTATIONS = ['Mr', 'Mrs', 'Miss', 'Dr'];
const GENDERS = ['Male', 'Female'];
const EMPLOYMENT_TYPES = [{ value: 'Self-employed', label: 'Self-Employed' }, { value: 'Employed', label: 'Employed' }, { value: 'Student', label: 'Student' }];
const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada'];
const OWNER_NONE_VALUE = '__none__';

function sectionTitle(title) {
  return (
    <h5 className="text-sm font-semibold border-b-2 border-slate-800 pb-1 mt-6 first:mt-0">
      {title}
    </h5>
  );
}

export function tenantIdFromPhone(contactNumber) {
  if (!contactNumber || typeof contactNumber !== 'string') return '';
  const digits = contactNumber.replace(/\D/g, '');
  const last5 = digits.length >= 5 ? digits.slice(-5) : digits.padStart(5, '0').slice(0, 5);
  return last5 ? `AIR-${last5}` : '';
}

export function calculateAge(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 ? `${age} Years` : '';
}

export const initialFormState = {
  society_name: '',
  building_name: '',
  flat_number: '',
  selected_room: '',
  occupancy_type: '',
  salutation: '',
  tenant_name: '',
  gender: '',
  dob: '',
  age: '',
  email: '',
  contact_number: '',
  whatsapp_number: '',
  pan_number: '',
  aadhaar_number: '',
  residential_address: '',
  pin_code: '',
  state: '',
  country: 'India',
  institute_office_name: '',
  employment_type: '',
  occupancy_details: '',
  alternate_contact_number: '',
  office_address: '',
  office_pin_code: '',
  office_state: '',
  office_country: 'India',
  passport_photo: '',
  aadhaar_front: '',
  aadhaar_back: '',
  pan_card_doc: '',
  office_institute_id_doc: '',
  owner_id: ''
};

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string' && result.startsWith('data:')) {
        resolve(result.split(',')[1]);
      } else resolve('');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function OccupancyForm({
  formData,
  onInputChange,
  onSelectChange,
  onFileChange,
  selectedTenant = null,
  showOwnerField = false,
  owners = [],
}) {
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    onInputChange(name, value);
  }, [onInputChange]);

  return (
    <div className="space-y-4">
      {sectionTitle('Property Possession Information')}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tenant ID</Label>
          <Input
            value={formData.contact_number ? tenantIdFromPhone(formData.contact_number) : (selectedTenant?.tenant_id || '') || '— Enter contact number —'}
            readOnly
            className="bg-slate-50"
            placeholder="AIR-xxxxx (from contact number)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="society_name">Society Name *</Label>
          <Select value={formData.society_name} onValueChange={(v) => onSelectChange('society_name', v)} required>
            <SelectTrigger id="society_name"><SelectValue placeholder="Select Society" /></SelectTrigger>
            <SelectContent>{SOCIETIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="building_name">Building Name *</Label>
          <Select value={formData.building_name} onValueChange={(v) => onSelectChange('building_name', v)} required>
            <SelectTrigger id="building_name"><SelectValue placeholder="Select Building" /></SelectTrigger>
            <SelectContent>{BUILDINGS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="flat_number">Flat Number *</Label>
          <Select value={formData.flat_number} onValueChange={(v) => onSelectChange('flat_number', v)} required>
            <SelectTrigger id="flat_number"><SelectValue placeholder="Select Flat" /></SelectTrigger>
            <SelectContent>{FLAT_NUMBERS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="selected_room">Selected Room *</Label>
          <Select value={formData.selected_room} onValueChange={(v) => onSelectChange('selected_room', v)} required>
            <SelectTrigger id="selected_room"><SelectValue placeholder="Select Room Type" /></SelectTrigger>
            <SelectContent>{ROOM_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupancy_type">Occupancy Type *</Label>
          <Select value={formData.occupancy_type} onValueChange={(v) => onSelectChange('occupancy_type', v)} required>
            <SelectTrigger id="occupancy_type"><SelectValue placeholder="Select Occupancy Type" /></SelectTrigger>
            <SelectContent>{OCCUPANCY_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {sectionTitle('Identity Information')}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salutation">Salutation *</Label>
          <Select value={formData.salutation} onValueChange={(v) => onSelectChange('salutation', v)} required>
            <SelectTrigger id="salutation"><SelectValue placeholder="Select Salutation" /></SelectTrigger>
            <SelectContent>{SALUTATIONS.map(s => <SelectItem key={s} value={s}>{s}.</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant_name">Full Name (as per Aadhaar) *</Label>
          <Input id="tenant_name" name="tenant_name" value={formData.tenant_name} onChange={handleInputChange} placeholder="Enter full name as on Aadhaar" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select value={formData.gender} onValueChange={(v) => onSelectChange('gender', v)} required>
            <SelectTrigger id="gender"><SelectValue placeholder="Select Gender" /></SelectTrigger>
            <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth *</Label>
          <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
        </div>
        <div className="space-y-2">
          <Label>Age (Auto-calculated)</Label>
          <Input value={formData.age} readOnly className="bg-slate-50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="example@email.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_number">Contact Number *</Label>
          <Input id="contact_number" name="contact_number" value={formData.contact_number} onChange={handleInputChange} placeholder="10-digit number" maxLength={10} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
          <Input id="whatsapp_number" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleInputChange} placeholder="10-digit WhatsApp" maxLength={10} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pan_number">PAN Number</Label>
          <Input id="pan_number" name="pan_number" value={formData.pan_number} onChange={handleInputChange} placeholder="ABCDE1234F" maxLength={10} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="aadhaar_number">Aadhaar Number *</Label>
          <Input id="aadhaar_number" name="aadhaar_number" value={formData.aadhaar_number} onChange={handleInputChange} placeholder="12-digit Aadhaar" maxLength={12} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="residential_address">Residential Address (as per Aadhaar) *</Label>
          <Input id="residential_address" name="residential_address" value={formData.residential_address} onChange={handleInputChange} placeholder="Full address as on Aadhaar" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pin_code">Pin Code *</Label>
          <Input id="pin_code" name="pin_code" value={formData.pin_code} onChange={handleInputChange} placeholder="6-digit PIN" maxLength={6} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select value={formData.state} onValueChange={(v) => onSelectChange('state', v)} required>
            <SelectTrigger id="state"><SelectValue placeholder="Select State" /></SelectTrigger>
            <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select value={formData.country} onValueChange={(v) => onSelectChange('country', v)} required>
            <SelectTrigger id="country"><SelectValue placeholder="Select Country" /></SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {sectionTitle('Institute / Office Details')}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="institute_office_name">Institute / Office Name</Label>
          <Input id="institute_office_name" name="institute_office_name" value={formData.institute_office_name} onChange={handleInputChange} placeholder="Institute or office name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employment_type">Occupancy Type (Employment)</Label>
          <Select value={formData.employment_type} onValueChange={(v) => onSelectChange('employment_type', v)}>
            <SelectTrigger id="employment_type"><SelectValue placeholder="Select Type" /></SelectTrigger>
            <SelectContent>{EMPLOYMENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupancy_details">Occupancy Details</Label>
          <Input id="occupancy_details" name="occupancy_details" value={formData.occupancy_details} onChange={handleInputChange} placeholder="Position or course" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alternate_contact_number">Alternate Contact Number</Label>
          <Input id="alternate_contact_number" name="alternate_contact_number" value={formData.alternate_contact_number} onChange={handleInputChange} placeholder="10-digit number" maxLength={10} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="office_address">Institute / Office Address</Label>
          <Input id="office_address" name="office_address" value={formData.office_address} onChange={handleInputChange} placeholder="Full address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="office_pin_code">Pin Code</Label>
          <Input id="office_pin_code" name="office_pin_code" value={formData.office_pin_code} onChange={handleInputChange} placeholder="6-digit PIN" maxLength={6} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="office_state">State</Label>
          <Select value={formData.office_state} onValueChange={(v) => onSelectChange('office_state', v)}>
            <SelectTrigger id="office_state"><SelectValue placeholder="Select State" /></SelectTrigger>
            <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="office_country">Country</Label>
          <Select value={formData.office_country} onValueChange={(v) => onSelectChange('office_country', v)}>
            <SelectTrigger id="office_country"><SelectValue placeholder="Select Country" /></SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {sectionTitle('Document Uploads')}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Passport Size Photograph</Label>
          <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => onFileChange(e, 'passport_photo')} />
        </div>
        <div className="space-y-2">
          <Label>Aadhaar Card (Front)</Label>
          <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => onFileChange(e, 'aadhaar_front')} />
        </div>
        <div className="space-y-2">
          <Label>Aadhaar Card (Back)</Label>
          <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => onFileChange(e, 'aadhaar_back')} />
        </div>
        <div className="space-y-2">
          <Label>PAN Card</Label>
          <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => onFileChange(e, 'pan_card_doc')} />
        </div>
        <div className="space-y-2">
          <Label>Office / Institute ID</Label>
          <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => onFileChange(e, 'office_institute_id_doc')} />
        </div>
      </div>

      {showOwnerField && (
        <div className="space-y-2">
          <Label htmlFor="owner_id">Owner (optional)</Label>
          <Select
            value={formData.owner_id || OWNER_NONE_VALUE}
            onValueChange={(v) => onSelectChange('owner_id', v === OWNER_NONE_VALUE ? '' : v)}
          >
            <SelectTrigger id="owner_id"><SelectValue placeholder="Select owner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={OWNER_NONE_VALUE}>— None —</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>{owner.name} {owner.flat_number ? `- ${owner.flat_number}` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
