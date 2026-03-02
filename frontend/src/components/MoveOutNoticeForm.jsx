import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export const BANKS = [
  'Allahabad Bank', 'Andhra Bank', 'Axis Bank', 'Bank of Bahrain and Kuwait', 'Bank of Baroda',
  'Bank of Baroda – Corporate Banking', 'Bank of Baroda – Retail Banking', 'Bank of India',
  'Bank of Maharashtra', 'Canara Bank', 'Central Bank of India', 'City Union Bank', 'Corporation Bank',
  'Deutsche Bank', 'Development Credit Bank', 'Dhanlaxmi Bank', 'Federal Bank', 'HDFC Bank',
  'ICICI Bank', 'IDBI Bank', 'Indian Bank', 'Indian Overseas Bank', 'IndusInd Bank', 'ING Vysya Bank',
  'Jammu and Kashmir Bank', 'Karnataka Bank Ltd', 'Karur Vysya Bank', 'Kotak Mahindra Bank',
  'Laxmi Vilas Bank', 'Oriental Bank of Commerce', 'Punjab & Sind Bank', 'Punjab National Bank',
  'Punjab National Bank – Corporate Banking', 'Punjab National Bank – Retail Banking',
  'Shamrao Vitthal Co-operative Bank', 'South Indian Bank', 'State Bank of Bikaner & Jaipur',
  'State Bank of Hyderabad', 'State Bank of India', 'State Bank of Mysore', 'State Bank of Patiala',
  'State Bank of Travancore', 'Syndicate Bank', 'Tamilnad Mercantile Bank Ltd.', 'UCO Bank',
  'Union Bank of India', 'United Bank of India', 'Vijaya Bank', 'Yes Bank Ltd',
];

export const SALUTATIONS = ['Mr', 'Mrs', 'Miss', 'Dr'];
export const BANK_NONE_VALUE = '__none__';

export const initialNoticeFormState = {
  tenant_id: '',
  society_name: '',
  building_name: '',
  flat_number: '',
  selected_room: '',
  occupancy_type: '',
  salutation: '',
  tenant_name: '',
  email: '',
  contact_number: '',
  bank_name: '',
  beneficiary_name: '',
  account_number: '',
  ifsc_code: '',
  upi_id: '',
};

function SectionTitle({ title }) {
  return (
    <h5 className="text-sm font-semibold border-b-2 border-slate-800 pb-1 mt-6 first:mt-0">
      {title}
    </h5>
  );
}

export default function MoveOutNoticeForm({
  formData,
  onInputChange,
  onSelectChange,
  bankNoneValue = BANK_NONE_VALUE,
}) {
  return (
    <div className="space-y-4">
      <SectionTitle title="Property Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="society_name">Society Name *</Label>
          <Input id="society_name" name="society_name" value={formData.society_name} onChange={onInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="building_name">Building Name *</Label>
          <Input id="building_name" name="building_name" value={formData.building_name} onChange={onInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="flat_number">Flat Number *</Label>
          <Input id="flat_number" name="flat_number" value={formData.flat_number} onChange={onInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="selected_room">Selected Room *</Label>
          <Input id="selected_room" name="selected_room" value={formData.selected_room} onChange={onInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupancy_type">Occupancy Type *</Label>
          <Input id="occupancy_type" name="occupancy_type" value={formData.occupancy_type} onChange={onInputChange} placeholder="e.g. Single, Sharing" required />
        </div>
      </div>

      <SectionTitle title="Identity Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salutation">Salutation *</Label>
          <Select value={formData.salutation} onValueChange={(v) => onSelectChange('salutation', v)} required>
            <SelectTrigger id="salutation"><SelectValue placeholder="Select Salutation" /></SelectTrigger>
            <SelectContent>
              {SALUTATIONS.map(s => <SelectItem key={s} value={s}>{s}.</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant_name">Full Name *</Label>
          <Input id="tenant_name" name="tenant_name" value={formData.tenant_name} onChange={onInputChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={onInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_number">Contact Number *</Label>
          <Input id="contact_number" name="contact_number" value={formData.contact_number} onChange={onInputChange} required />
        </div>
      </div>

      <SectionTitle title="Bank Account Details" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bank_name">Bank Name</Label>
          <Select value={formData.bank_name || bankNoneValue} onValueChange={(v) => onSelectChange('bank_name', v === bankNoneValue ? '' : v)}>
            <SelectTrigger id="bank_name"><SelectValue placeholder="Select Bank" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={bankNoneValue}>— None —</SelectItem>
              {BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="beneficiary_name">Beneficiary Name</Label>
          <Input id="beneficiary_name" name="beneficiary_name" value={formData.beneficiary_name} onChange={onInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_number">Account Number</Label>
          <Input id="account_number" name="account_number" value={formData.account_number} onChange={onInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ifsc_code">IFSC Code</Label>
          <Input id="ifsc_code" name="ifsc_code" value={formData.ifsc_code} onChange={onInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="upi_id">UPI ID</Label>
          <Input id="upi_id" name="upi_id" value={formData.upi_id} onChange={onInputChange} />
        </div>
      </div>
    </div>
  );
}
