import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import MoveOutNoticeForm, { initialNoticeFormState } from '../components/MoveOutNoticeForm';
import { noticeFormAPI } from '../services/api';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function NoticeFormPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [step, setStep] = useState('customerId'); // 'customerId' | 'form'
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [customerIdError, setCustomerIdError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [linkedTenantId, setLinkedTenantId] = useState(null); // internal id for submit
  const [formData, setFormData] = useState(initialNoticeFormState);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      try {
        const res = await noticeFormAPI.getStatus();
        if (!cancelled) setStatus(res.data);
      } catch {
        if (!cancelled) setStatus({ open: false, message: 'Unable to load form status.' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStatus();
    return () => { cancelled = true; };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerIdContinue = async () => {
    const id = (customerIdInput || '').trim();
    if (!id) {
      setCustomerIdError('Please enter your Customer ID.');
      return;
    }
    setCustomerIdError('');
    setLookupLoading(true);
    try {
      const res = await noticeFormAPI.getTenantByCustomerId(id);
      const prefill = res.data;
      setLinkedTenantId(prefill.id);
      setFormData({
        ...initialNoticeFormState,
        society_name: prefill.society_name ?? '',
        building_name: prefill.building_name ?? '',
        flat_number: prefill.flat_number ?? '',
        selected_room: prefill.selected_room ?? '',
        occupancy_type: prefill.occupancy_type ?? '',
        salutation: prefill.salutation ?? '',
        tenant_name: prefill.tenant_name ?? '',
        email: prefill.email ?? '',
        contact_number: prefill.contact_number ?? '',
        bank_name: initialNoticeFormState.bank_name,
        beneficiary_name: initialNoticeFormState.beneficiary_name,
        account_number: initialNoticeFormState.account_number,
        ifsc_code: initialNoticeFormState.ifsc_code,
        upi_id: initialNoticeFormState.upi_id,
      });
      setStep('form');
    } catch (err) {
      if (err.response?.status === 404) {
        setCustomerIdError(err.response?.data?.detail || 'Customer ID not found. You must be a registered tenant to submit a move out notice.');
      } else if (err.response?.status === 403) {
        setStatus(prev => prev ? { ...prev, open: false, message: err.response?.data?.detail } : { open: false, message: err.response?.data?.detail });
        toast.error(err.response?.data?.detail || 'The form is currently closed.');
      } else {
        setCustomerIdError('Could not verify Customer ID. Please try again.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        tenant_id: linkedTenantId,
        email: formData.email?.trim() || null,
        bank_name: formData.bank_name && formData.bank_name !== '__none__' ? formData.bank_name : null,
      };
      await noticeFormAPI.submit(data);
      setSubmitted(true);
      toast.success('Your move out notice has been submitted successfully.');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 403) {
        setStatus(prev => prev ? { ...prev, open: false, message: detail || 'Form is currently closed.' } : { open: false, message: detail });
        toast.error(detail || 'The form is currently closed.');
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Submission failed.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800" />
              <p className="text-slate-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Thank you
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              Your move out notice has been submitted successfully. The property manager may contact you if needed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!status?.open) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Form closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              {status?.message || 'The move out notice form is currently closed.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 lg:py-6 lg:px-6">
      <div className="max-w-2xl mx-auto w-full lg:max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Move Out Notice</CardTitle>
            <p className="text-sm text-slate-500">Submit your move out notice. This form is only available during the open period set by the property manager.</p>
          </CardHeader>
          <CardContent>
            {step === 'customerId' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Enter your Customer ID (Tenant ID) to continue. You must be a registered tenant to submit a move out notice.</p>
                <div className="space-y-2">
                  <label htmlFor="customerId" className="text-sm font-medium text-slate-700">Customer ID *</label>
                  <input
                    id="customerId"
                    type="text"
                    value={customerIdInput}
                    onChange={(e) => { setCustomerIdInput(e.target.value); setCustomerIdError(''); }}
                    placeholder="e.g. AIR-43210"
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  {customerIdError && <p className="text-sm text-red-600">{customerIdError}</p>}
                </div>
                <Button type="button" onClick={handleCustomerIdContinue} disabled={lookupLoading}>
                  {lookupLoading ? 'Checking...' : 'Continue'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <MoveOutNoticeForm
                  formData={formData}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                />
                <div className="pt-6 flex justify-end gap-2 pb-2">
                  <Button type="button" variant="outline" onClick={() => { setStep('customerId'); setCustomerIdError(''); setLinkedTenantId(null); }}>
                    Back
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
