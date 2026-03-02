import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import OccupancyForm, { initialFormState, calculateAge, fileToBase64 } from '../components/OccupancyForm';
import { registrationLinksAPI } from '../services/api';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function Register() {
  const { token } = useParams();
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [formData, setFormData] = useState({ ...initialFormState, country: 'India', office_country: 'India' });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!token) {
        setValidating(false);
        setValid(false);
        return;
      }
      try {
        const res = await registrationLinksAPI.validateToken(token);
        if (!cancelled) {
          setValid(res.data?.valid === true);
          setValidating(false);
        }
      } catch (err) {
        if (!cancelled) {
          setValid(false);
          setValidating(false);
        }
      }
    }
    check();
    return () => { cancelled = true; };
  }, [token]);

  const handleInputChange = useCallback((name, value) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'dob') next.age = calculateAge(value);
      return next;
    });
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const data = {
        ...formData,
        email: formData.email?.trim() || null,
        owner_id: null,
      };
      await registrationLinksAPI.submitWithToken(token, data);
      setSubmitted(true);
      toast.success('Your occupancy details have been submitted successfully. This link has now expired.');
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 410 || (typeof detail === 'string' && detail.toLowerCase().includes('already been used'))) {
        setValid(false);
        toast.error('This link has already been used and has expired.');
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Submission failed. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800" />
              <p className="text-slate-600">Checking link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Link invalid or expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              This registration link is invalid or has already been used. Each link can only be used once.
              Please request a new link from the property manager.
            </p>
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
            <CardTitle className="text-green-800">Thank you</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              Your occupancy details have been submitted successfully. This link has now expired.
              The admin may contact you if any further information is needed.
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
            <CardTitle>Occupancy Details</CardTitle>
            <p className="text-sm text-slate-500">Please fill in your details. This form can only be submitted once with this link.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <OccupancyForm
                formData={formData}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                onFileChange={handleFileChange}
                showOwnerField={false}
              />
              <div className="pt-6 flex justify-end pb-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
