import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Eye, FileDown, Home, Trash2, MoreHorizontal, ChevronsUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../components/ui/command';
import { ownerFlatsAPI } from '../services/api';
import { fileToBase64 } from '../components/OccupancyForm';

export default function OwnersRentedFlats() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(false);
  const [viewPdfName, setViewPdfName] = useState('');
  const [viewObjectUrl, setViewObjectUrl] = useState('');

  const ALL_VALUE = '__all__';
  const [groupByOwner, setGroupByOwner] = useState(true);
  const [ownerNameQuery, setOwnerNameQuery] = useState('');
  const [societyFilter, setSocietyFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [flatFilter, setFlatFilter] = useState('');

  // Upload in-flight protection (per flat + doc type)
  const [uploadingKey, setUploadingKey] = useState(null);

  const clearFilters = () => {
    setOwnerNameQuery('');
    setSocietyFilter('');
    setBuildingFilter('');
    setFlatFilter('');
  };

  const hasActiveFilters = Boolean(
    (ownerNameQuery || '').trim() ||
      societyFilter ||
      buildingFilter ||
      flatFilter
  );

  const reload = async () => {
    setLoading(true);
    try {
      const res = await ownerFlatsAPI.listOwnerFlats();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error('Failed to load rented flats');
    } finally {
      setLoading(false);
    }
  };

  const SearchableDropdown = ({
    label,
    value,
    onChange,
    options,
    placeholder,
    disabled,
  }) => {
    const [open, setOpen] = useState(false);
    const displayValue = value || placeholder;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            <span className={value ? '' : 'text-slate-500'}>{displayValue}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value={ALL_VALUE}
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  {`All ${label}`}
                </CommandItem>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                  >
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flatKey = (row) => `${row.owner_id}:${row.flat_index}`;

  const docKey = (row, documentType) => `${flatKey(row)}:${documentType}`;

  const handleUpload = async (row, file, documentType) => {
    if (!file) return;

    // Keep it reasonable to prevent huge uploads.
    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF size must be less than 10MB');
      return;
    }

    const key = docKey(row, documentType);
    setUploadingKey(key);
    try {
      const pdfBase64 = await fileToBase64(file);
      await ownerFlatsAPI.uploadDocument({
        owner_id: row.owner_id,
        flat_index: row.flat_index,
        document_type: documentType,
        pdf_base64: pdfBase64,
        file_name: file.name || null,
      });
      toast.success('PDF uploaded');
      await reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to upload PDF');
    } finally {
      setUploadingKey(null);
    }
  };

  const openPdfInNewTab = async (docId, fileName) => {
    setViewing(true);
    try {
      const res = await ownerFlatsAPI.downloadDocument(docId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      if (viewObjectUrl) window.URL.revokeObjectURL(viewObjectUrl);
      setViewObjectUrl(url);
      setViewPdfName(fileName || `owner_flat_${docId}.pdf`);
    } catch (e) {
      toast.error('Failed to load PDF');
    } finally {
      setViewing(false);
    }
  };

  const downloadPdf = async (docId, fileName) => {
    try {
      const res = await ownerFlatsAPI.downloadDocument(docId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `owner_flat_${docId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to download PDF');
    }
  };

  const handleDelete = async (docId) => {
    try {
      await ownerFlatsAPI.deleteDocument(docId);
      toast.success('PDF deleted');
      await reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to delete PDF');
    }
  };

  // Revoke object URL when dialog closes/unmounts
  useEffect(() => {
    return () => {
      if (viewObjectUrl) window.URL.revokeObjectURL(viewObjectUrl);
    };
  }, [viewObjectUrl]);

  const ownerFilteredRows = useMemo(() => {
    const q = (ownerNameQuery || '').trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.owner_name || '').toLowerCase().includes(q));
  }, [rows, ownerNameQuery]);

  const societyOptions = useMemo(() => {
    const set = new Set(ownerFilteredRows.map((r) => r.society).filter(Boolean));
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [ownerFilteredRows]);

  const buildingOptions = useMemo(() => {
    const base = societyFilter ? ownerFilteredRows.filter((r) => r.society === societyFilter) : ownerFilteredRows;
    const set = new Set(base.map((r) => r.building_no).filter(Boolean));
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [ownerFilteredRows, societyFilter]);

  const flatOptions = useMemo(() => {
    let base = ownerFilteredRows;
    if (societyFilter) base = base.filter((r) => r.society === societyFilter);
    if (buildingFilter) base = base.filter((r) => r.building_no === buildingFilter);
    const set = new Set(base.map((r) => r.flat_no).filter(Boolean));
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [ownerFilteredRows, societyFilter, buildingFilter]);

  useEffect(() => {
    // When society changes, building must be reset because available buildings depend on it.
    setBuildingFilter('');
    setFlatFilter('');
  }, [societyFilter]);

  useEffect(() => {
    // If building selected but not present in current options, clear it.
    if (!buildingFilter) return;
    if (!buildingOptions.includes(buildingFilter)) setBuildingFilter('');
  }, [buildingOptions, buildingFilter]);

  useEffect(() => {
    // If flat selected but not present in current options, clear it.
    if (!flatFilter) return;
    if (!flatOptions.includes(flatFilter)) setFlatFilter('');
  }, [flatOptions, flatFilter]);

  const filteredRows = useMemo(() => {
    let arr = ownerFilteredRows;
    if (societyFilter) arr = arr.filter((r) => r.society === societyFilter);
    if (buildingFilter) arr = arr.filter((r) => r.building_no === buildingFilter);
    if (flatFilter) arr = arr.filter((r) => r.flat_no === flatFilter);
    return arr;
  }, [ownerFilteredRows, societyFilter, buildingFilter, flatFilter]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const agreementUploaded = filteredRows.filter((r) => r.agreement_document_id).length;
    const policeUploaded = filteredRows.filter((r) => r.police_verification_document_id).length;
    return { total, agreementUploaded, policeUploaded };
  }, [filteredRows]);

  const groupsByOwner = useMemo(() => {
    const map = new Map();
    for (const r of filteredRows) {
      const key = r.owner_id || r.owner_name || 'unknown';
      if (!map.has(key)) {
        map.set(key, { owner_id: r.owner_id, owner_name: r.owner_name || '-', flats: [] });
      }
      map.get(key).flats.push(r);
    }
    // Sort owners and flats for stable UX.
    const out = Array.from(map.values()).sort((a, b) => String(a.owner_name).localeCompare(String(b.owner_name)));
    out.forEach((g) => g.flats.sort((a, b) => Number(a.flat_index) - Number(b.flat_index)));
    return out;
  }, [filteredRows]);

  const parseYMD = (value) => {
    if (!value || typeof value !== 'string') return null;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  };

  const monthsCompleted = (startStr, endStr) => {
    const start = parseYMD(startStr);
    if (!start) return '-';

    const now = new Date();
    const today = { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate() };

    const startUTC = Date.UTC(start.y, start.m - 1, start.d);

    let effectiveEnd = today;
    const end = parseYMD(endStr);
    if (end) {
      const endUTC = Date.UTC(end.y, end.m - 1, end.d);
      const todayUTC = Date.UTC(today.y, today.m - 1, today.d);
      effectiveEnd = endUTC < todayUTC ? end : today;
    }

    const endUTC = Date.UTC(effectiveEnd.y, effectiveEnd.m - 1, effectiveEnd.d);
    if (endUTC < startUTC) return '0 months';

    let months = (effectiveEnd.y - start.y) * 12 + (effectiveEnd.m - start.m);
    // Full months only.
    if (effectiveEnd.d < start.d) months -= 1;
    months = Math.max(0, months);
    return `${months} months`;
  };

  const totalAgreementMonths = (startStr, endStr) => {
    const start = parseYMD(startStr);
    if (!start) return '-';
    const end = parseYMD(endStr);
    if (!end) return '-';

    const startUTC = Date.UTC(start.y, start.m - 1, start.d);
    const endUTC = Date.UTC(end.y, end.m - 1, end.d);
    if (endUTC < startUTC) return '0 months';

    let months = (end.y - start.y) * 12 + (end.m - start.m);
    // Full months only.
    if (end.d < start.d) months -= 1;
    months = Math.max(0, months);
    return `${months} months`;
  };

  const monthsCompletedNumber = (startStr, endStr) => {
    const start = parseYMD(startStr);
    if (!start) return null;

    const now = new Date();
    const today = { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate() };

    const startUTC = Date.UTC(start.y, start.m - 1, start.d);

    let effectiveEnd = today;
    const end = parseYMD(endStr);
    if (end) {
      const endUTC = Date.UTC(end.y, end.m - 1, end.d);
      const todayUTC = Date.UTC(today.y, today.m - 1, today.d);
      effectiveEnd = endUTC < todayUTC ? end : today;
    }

    const endUTC = Date.UTC(effectiveEnd.y, effectiveEnd.m - 1, effectiveEnd.d);
    if (endUTC < startUTC) return 0;

    let months = (effectiveEnd.y - start.y) * 12 + (effectiveEnd.m - start.m);
    // Full months only.
    if (effectiveEnd.d < start.d) months -= 1;
    return Math.max(0, months);
  };

  const totalAgreementMonthsNumber = (startStr, endStr) => {
    const start = parseYMD(startStr);
    if (!start) return null;
    const end = parseYMD(endStr);
    if (!end) return null;

    const startUTC = Date.UTC(start.y, start.m - 1, start.d);
    const endUTC = Date.UTC(end.y, end.m - 1, end.d);
    if (endUTC < startUTC) return 0;

    let months = (end.y - start.y) * 12 + (end.m - start.m);
    // Full months only.
    if (end.d < start.d) months -= 1;
    return Math.max(0, months);
  };

  const remainingAgreementMonths = (startStr, endStr) => {
    const total = totalAgreementMonthsNumber(startStr, endStr);
    if (total == null) return '-';
    const completed = monthsCompletedNumber(startStr, endStr);
    if (completed == null) return '-';
    return `${Math.max(0, total - completed)} months`;
  };

  const renderAgreementCell = (row) => {
    const hasDoc = Boolean(row.agreement_document_id);
    const inputId = `upload-agreement-${flatKey(row)}`;
    const docId = row.agreement_document_id;
    const docName = row.agreement_document_file_name;
    const uploading = uploadingKey === docKey(row, 'agreement');

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={hasDoc ? 'text-sm text-green-700 font-medium' : 'text-sm text-slate-500'}>
            {hasDoc ? 'Uploaded' : 'Not uploaded'}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={uploading}
                aria-label="Agreement more options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {hasDoc && (
                <>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!viewing) openPdfInNewTab(docId, docName);
                    }}
                    disabled={viewing}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!viewing) downloadPdf(docId, docName);
                    }}
                    disabled={viewing}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={(e) => {
                      e.preventDefault();
                      handleDelete(docId);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                disabled={uploading}
                onSelect={(e) => {
                  e.preventDefault();
                  if (uploading) return;
                  const input = document.getElementById(inputId);
                  if (input) input.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                {hasDoc ? 'Replace' : 'Upload'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Input
          id={inputId}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target?.files?.[0];
            handleUpload(row, file, 'agreement');
            e.target.value = '';
          }}
        />

        {uploading && <span className="text-sm text-slate-500">Uploading...</span>}
      </div>
    );
  };

  const renderPoliceCell = (row) => {
    const hasDoc = Boolean(row.police_verification_document_id);
    const inputId = `upload-police-${flatKey(row)}`;
    const docId = row.police_verification_document_id;
    const docName = row.police_verification_document_file_name;
    const uploading = uploadingKey === docKey(row, 'police_verification');

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={hasDoc ? 'text-sm text-green-700 font-medium' : 'text-sm text-slate-500'}>
            {hasDoc ? 'Uploaded' : 'Not uploaded'}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={uploading}
                aria-label="Police more options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {hasDoc && (
                <>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!viewing) openPdfInNewTab(docId, docName);
                    }}
                    disabled={viewing}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!viewing) downloadPdf(docId, docName);
                    }}
                    disabled={viewing}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={(e) => {
                      e.preventDefault();
                      handleDelete(docId);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                disabled={uploading}
                onSelect={(e) => {
                  e.preventDefault();
                  if (uploading) return;
                  const input = document.getElementById(inputId);
                  if (input) input.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                {hasDoc ? 'Replace' : 'Upload'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Input
          id={inputId}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target?.files?.[0];
            handleUpload(row, file, 'police_verification');
            e.target.value = '';
          }}
        />

        {uploading && <span className="text-sm text-slate-500">Uploading...</span>}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="owners-rented-flats-page">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Home className="h-6 w-6" />
            Owner Rented Flats
          </h1>
          <p className="text-slate-500 mt-1">
            Agreements uploaded: {summary.agreementUploaded} / {summary.total} | Police verifications uploaded: {summary.policeUploaded} / {summary.total}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              Rented Flat List ({filteredRows.length})
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No owner flats found in the system.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <Label htmlFor="owner-search">Search by Owner Name</Label>
                    <Input
                      id="owner-search"
                      value={ownerNameQuery}
                      onChange={(e) => setOwnerNameQuery(e.target.value)}
                      placeholder="e.g. Vijay"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Society</Label>
                    <SearchableDropdown
                      label="societies"
                      value={societyFilter}
                      onChange={setSocietyFilter}
                      options={societyOptions}
                      placeholder="All societies"
                      disabled={societyOptions.length === 0}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Building</Label>
                    <SearchableDropdown
                      label="buildings"
                      value={buildingFilter}
                      onChange={setBuildingFilter}
                      options={buildingOptions}
                      placeholder="All buildings"
                      disabled={buildingOptions.length === 0}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Flat No.</Label>
                    <SearchableDropdown
                      label="flats"
                      value={flatFilter}
                      onChange={setFlatFilter}
                      options={flatOptions}
                      placeholder="All flats"
                      disabled={flatOptions.length === 0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      data-testid="clear-owner-flats-filters"
                    >
                      Clear Filters
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>View</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={groupByOwner ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGroupByOwner(true)}
                      >
                        By Owner
                      </Button>
                      <Button
                        variant={!groupByOwner ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGroupByOwner(false)}
                      >
                        Flat List
                      </Button>
                    </div>
                  </div>
                </div>

                {filteredRows.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No flats match your filters.</div>
                ) : groupByOwner ? (
                  <div className="space-y-4">
                    {groupsByOwner.map((g) => (
                      <div
                        key={g.owner_id || g.owner_name}
                        className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">Owner</p>
                            <p className="font-semibold text-slate-900">{g.owner_name}</p>
                          </div>
                          <p className="text-sm text-slate-500">{g.flats.length} flats</p>
                        </div>
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Society</TableHead>
                                  <TableHead>Building</TableHead>
                                  <TableHead>Flat No.</TableHead>
                                  <TableHead>Start Date</TableHead>
                                  <TableHead>End Date</TableHead>
                                  <TableHead>Total Months</TableHead>
                                  <TableHead>Months Completed</TableHead>
                                  <TableHead>Remaining Months</TableHead>
                                  <TableHead>Agreement PDF</TableHead>
                                  <TableHead>Police Verification PDF</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {g.flats.map((row) => (
                                  <TableRow key={flatKey(row)} data-testid={`owner-flat-row-${flatKey(row)}`}>
                                    <TableCell>{row.society || '-'}</TableCell>
                                    <TableCell>{row.building_no || '-'}</TableCell>
                                    <TableCell>{row.flat_no || '-'}</TableCell>
                                    <TableCell>{row.agreement_start_date || '-'}</TableCell>
                                    <TableCell>{row.agreement_end_date || '-'}</TableCell>
                                    <TableCell>{totalAgreementMonths(row.agreement_start_date, row.agreement_end_date)}</TableCell>
                                    <TableCell>{monthsCompleted(row.agreement_start_date, row.agreement_end_date)}</TableCell>
                                    <TableCell>{remainingAgreementMonths(row.agreement_start_date, row.agreement_end_date)}</TableCell>
                                    <TableCell>{renderAgreementCell(row)}</TableCell>
                                    <TableCell>{renderPoliceCell(row)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Owner</TableHead>
                          <TableHead>Society</TableHead>
                          <TableHead>Building</TableHead>
                          <TableHead>Flat No.</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Total Months</TableHead>
                          <TableHead>Months Completed</TableHead>
                          <TableHead>Remaining Months</TableHead>
                          <TableHead>Agreement PDF</TableHead>
                          <TableHead>Police Verification PDF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map((row) => (
                          <TableRow key={flatKey(row)} data-testid={`owner-flat-row-${flatKey(row)}`}>
                            <TableCell className="font-medium">{row.owner_name || '-'}</TableCell>
                            <TableCell>{row.society || '-'}</TableCell>
                            <TableCell>{row.building_no || '-'}</TableCell>
                            <TableCell>{row.flat_no || '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.agreement_start_date || '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.agreement_end_date || '-'}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{totalAgreementMonths(row.agreement_start_date, row.agreement_end_date)}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{monthsCompleted(row.agreement_start_date, row.agreement_end_date)}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{remainingAgreementMonths(row.agreement_start_date, row.agreement_end_date)}</TableCell>
                            <TableCell>{renderAgreementCell(row)}</TableCell>
                            <TableCell>{renderPoliceCell(row)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(viewObjectUrl)}
        onOpenChange={(open) => {
          if (!open && viewObjectUrl) {
            window.URL.revokeObjectURL(viewObjectUrl);
            setViewObjectUrl('');
            setViewPdfName('');
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewPdfName || 'PDF Preview'}</DialogTitle>
          </DialogHeader>
          {viewObjectUrl ? (
            <iframe
              title="Owner flat PDF"
              src={viewObjectUrl}
              className="w-full"
              style={{ height: '70vh', border: 'none' }}
            />
          ) : (
            <div className="py-12 text-center text-slate-500">Loading PDF...</div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

