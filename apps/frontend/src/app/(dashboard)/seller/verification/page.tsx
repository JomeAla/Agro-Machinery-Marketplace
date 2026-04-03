'use client';

import { useState, useEffect, useRef } from 'react';
import { getProfile, updateCompany, checkAuth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const steps: Step[] = [
  { id: 1, title: 'Company Info', description: 'Business details', icon: '🏢' },
  { id: 2, title: 'CAC Document', description: 'Certificate of Incorporation', icon: '📄' },
  { id: 3, title: 'ID Verification', description: 'Director ID documents', icon: '🪪' },
  { id: 4, title: 'Review & Submit', description: 'Submit for review', icon: '✅' },
];

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export default function SellerVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [company, setCompany] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [documents, setDocuments] = useState<{
    cacCertificate: UploadedFile | null;
    certificateOfIncorporation: UploadedFile | null;
    directorsId: UploadedFile | null;
    businessLicense: UploadedFile | null;
  }>({
    cacCertificate: null,
    certificateOfIncorporation: null,
    directorsId: null,
    businessLicense: null,
  });

  const [form, setForm] = useState({
    name: '',
    cacNumber: '',
    cacDocument: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    website: '',
    taxIdentificationNumber: '',
    yearEstablished: '',
  });

  const fileInputRefs = {
    cacCertificate: useRef<HTMLInputElement>(null),
    certificateOfIncorporation: useRef<HTMLInputElement>(null),
    directorsId: useRef<HTMLInputElement>(null),
    businessLicense: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (company) {
      const progress = calculateProgress();
      if (progress >= 75 && currentStep < 4) setCurrentStep(4);
      else if (progress >= 50 && currentStep < 3) setCurrentStep(3);
      else if (progress >= 25 && currentStep < 2) setCurrentStep(2);
    }
  }, [documents, company]);

  async function loadData() {
    try {
      const profile = await getProfile();
      if (profile.company) {
        setCompany(profile.company);
        setForm({
          name: profile.company.name || '',
          cacNumber: profile.company.cacNumber || '',
          cacDocument: profile.company.cacDocument || '',
          address: profile.company.address || '',
          city: profile.company.city || '',
          state: profile.company.state || '',
          phone: profile.company.phone || '',
          email: profile.company.email || '',
          website: profile.company.website || '',
          taxIdentificationNumber: profile.company.taxIdentificationNumber || '',
          yearEstablished: profile.company.yearEstablished?.toString() || '',
        });
        
        if (profile.company.cacDocument) {
          setDocuments(prev => ({
            ...prev,
            cacCertificate: {
              name: 'CAC Certificate',
              size: 0,
              type: 'application/pdf',
              url: profile.company.cacDocument,
              uploadedAt: profile.company.updatedAt,
            }
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  }

  function calculateProgress(): number {
    let progress = 0;
    if (form.name && form.cacNumber) progress += 25;
    if (documents.cacCertificate || company?.cacDocument) progress += 25;
    if (documents.directorsId) progress += 25;
    if (documents.certificateOfIncorporation || documents.businessLicense) progress += 25;
    return Math.min(progress, 100);
  }

  async function handleFileUpload(field: keyof typeof documents, file: File) {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    setMessage(null);

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload PDF, JPG, or PNG.' });
      setUploading(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 10MB.' });
      setUploading(false);
      return;
    }

    try {
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }

      const url = URL.createObjectURL(file);
      setDocuments(prev => ({
        ...prev,
        [field]: {
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          uploadedAt: new Date().toISOString(),
        }
      }));
      
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function handleRemoveFile(field: keyof typeof documents) {
    setDocuments(prev => ({
      ...prev,
      [field]: null
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const updateData = {
        ...form,
        cacDocument: documents.cacCertificate?.url || form.cacDocument,
      };
      
      await updateCompany(updateData);
      setMessage({ type: 'success', text: 'Verification application submitted successfully!' });
      
      const profile = await getProfile();
      setCompany(profile.company);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit verification' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
    </div>
  );

  const isVerified = company?.isVerified;
  const progress = calculateProgress();

  const getStepStatus = (stepId: number) => {
    if (isVerified) return 'completed';
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Verification</h1>
        <p className="text-gray-500 font-medium">Complete all steps to get verified and build trust with buyers.</p>
      </div>

      {isVerified ? (
        <Card className="p-8 border-none shadow-xl rounded-3xl bg-green-50 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Verified Business</h2>
          <p className="text-green-700">Congratulations! Your business is verified. You now have a verified badge on all your products.</p>
        </Card>
      ) : (
        <>
          <Card className="p-6 mb-8 border-none shadow-lg rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-900">Verification Progress</span>
              <span className="font-bold text-green-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Started</span>
              <span>Complete</span>
            </div>
          </Card>

          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                    getStepStatus(step.id) === 'completed' 
                      ? 'bg-green-500 text-white' 
                      : getStepStatus(step.id) === 'active'
                      ? 'bg-green-100 text-green-600 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {getStepStatus(step.id) === 'completed' ? '✓' : step.icon}
                  </div>
                  <span className={`text-xs font-medium mt-2 ${getStepStatus(step.id) !== 'pending' ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.type === 'success' ? '✓' : '⚠'} {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {currentStep >= 1 && (
                  <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">🏢 Company Information</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Business Registered Name</label>
                        <Input 
                          value={form.name} 
                          onChange={e => setForm({...form, name: e.target.value})}
                          placeholder="e.g. Green Tractors Nigeria Ltd"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">CAC Number</label>
                        <Input 
                          value={form.cacNumber} 
                          onChange={e => setForm({...form, cacNumber: e.target.value})}
                          placeholder="RC-1234567"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tax ID (TIN)</label>
                        <Input 
                          value={form.taxIdentificationNumber} 
                          onChange={e => setForm({...form, taxIdentificationNumber: e.target.value})}
                          placeholder="123456789012"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                        <Input 
                          value={form.phone} 
                          onChange={e => setForm({...form, phone: e.target.value})}
                          placeholder="+2348000000000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                        <Input 
                          value={form.email} 
                          onChange={e => setForm({...form, email: e.target.value})}
                          placeholder="info@company.com"
                          type="email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
                        <Input 
                          value={form.website} 
                          onChange={e => setForm({...form, website: e.target.value})}
                          placeholder="https://company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Year Established</label>
                        <Input 
                          value={form.yearEstablished} 
                          onChange={e => setForm({...form, yearEstablished: e.target.value})}
                          placeholder="2020"
                          type="number"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Business Address</label>
                        <Input 
                          value={form.address} 
                          onChange={e => setForm({...form, address: e.target.value})}
                          placeholder="Unit 1, Farm Estate Street"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                        <Input 
                          value={form.city} 
                          onChange={e => setForm({...form, city: e.target.value})}
                          placeholder="Ikeja"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                        <Input 
                          value={form.state} 
                          onChange={e => setForm({...form, state: e.target.value})}
                          placeholder="Lagos"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {currentStep >= 2 && (
                  <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">📄 CAC Documents</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          CAC Certificate <span className="text-red-500">*</span>
                        </label>
                        {documents.cacCertificate ? (
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 text-xs">PDF</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{documents.cacCertificate.name}</p>
                                <p className="text-xs text-gray-500">Uploaded {new Date(documents.cacCertificate.uploadedAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveFile('cacCertificate')} className="text-red-500 hover:text-red-700">
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 transition-colors cursor-pointer">
                            <input 
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={e => handleFileUpload('cacCertificate', e.target.files?.[0]!)}
                              className="hidden"
                              ref={fileInputRefs.cacCertificate}
                            />
                            <label htmlFor="" className="cursor-pointer" onClick={() => fileInputRefs.cacCertificate.current?.click()}>
                              <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="text-sm text-gray-600">Click to upload CAC Certificate</span>
                              <span className="block text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 10MB)</span>
                            </label>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Certificate of Incorporation</label>
                        <FileUploadField 
                          file={documents.certificateOfIncorporation}
                          onUpload={(file) => handleFileUpload('certificateOfIncorporation', file)}
                          onRemove={() => handleRemoveFile('certificateOfIncorporation')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Business License</label>
                        <FileUploadField 
                          file={documents.businessLicense}
                          onUpload={(file) => handleFileUpload('businessLicense', file)}
                          onRemove={() => handleRemoveFile('businessLicense')}
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {currentStep >= 3 && (
                  <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">🪪 Director ID Verification</h3>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Director's ID (NIN, Voter Card, or Passport)</label>
                      <FileUploadField 
                        file={documents.directorsId}
                        onUpload={(file) => handleFileUpload('directorsId', file)}
                        onRemove={() => handleRemoveFile('directorsId')}
                      />
                    </div>
                  </Card>
                )}

                {currentStep >= 4 && (
                  <Card className="p-6 border-none shadow-xl shadow-gray-100 rounded-3xl bg-white">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">✅ Review & Submit</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h4 className="font-bold text-gray-900 mb-2">Company Details</h4>
                        <p className="text-sm text-gray-600">Name: {form.name}</p>
                        <p className="text-sm text-gray-600">CAC: {form.cacNumber}</p>
                        <p className="text-sm text-gray-600">Address: {form.address}, {form.city}, {form.state}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h4 className="font-bold text-gray-900 mb-2">Uploaded Documents</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {documents.cacCertificate && <li>✓ CAC Certificate</li>}
                          {documents.certificateOfIncorporation && <li>✓ Certificate of Incorporation</li>}
                          {documents.businessLicense && <li>✓ Business License</li>}
                          {documents.directorsId && <li>✓ Director's ID</li>}
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}

                <Button 
                  type="submit" 
                  className="w-full py-7 rounded-2xl bg-green-600 hover:bg-green-700 text-lg font-bold shadow-xl shadow-green-100"
                  disabled={submitting || uploading || progress < 50}
                >
                  {submitting ? 'Submitting...' : progress >= 75 ? 'Submit for Verification' : 'Complete more steps to submit'}
                </Button>
              </div>

              <div className="space-y-6">
                <Card className="p-6 border-none shadow-xl rounded-3xl bg-primary-900 text-white">
                  <p className="text-xs font-bold text-primary-300 uppercase mb-2">Status</p>
                  <Badge className={`rounded-xl border-none font-bold py-1 px-4 ${progress === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {progress === 100 ? 'Ready to Submit' : 'In Progress'}
                  </Badge>
                  <p className="text-xs text-primary-200 mt-4">
                    {progress < 50 
                      ? 'Please complete company details and CAC document to proceed.'
                      : progress < 75
                      ? 'Great progress! Please add more documents.'
                      : 'Almost done! Review and submit your application.'
                    }
                  </p>
                </Card>

                <Card className="p-6 border-none shadow-lg rounded-3xl bg-white">
                  <h4 className="font-bold text-gray-900 mb-4">📋 Required Documents</h4>
                  <ul className="space-y-3 text-sm">
                    <li className={`flex items-center gap-2 ${documents.cacCertificate ? 'text-green-600' : 'text-gray-500'}`}>
                      {documents.cacCertificate ? '✓' : '○'} CAC Certificate
                    </li>
                    <li className={`flex items-center gap-2 ${documents.directorsId ? 'text-green-600' : 'text-gray-500'}`}>
                      {documents.directorsId ? '✓' : '○'} Director ID
                    </li>
                    <li className="flex items-center gap-2 text-gray-500">
                      ○ Certificate of Incorporation (Optional)
                    </li>
                    <li className="flex items-center gap-2 text-gray-500">
                      ○ Business License (Optional)
                    </li>
                  </ul>
                </Card>

                <Card className="p-6 border-none shadow-lg rounded-3xl bg-white">
                  <h4 className="font-bold text-gray-900 mb-4">Why Verify?</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2">✓ Verified seller badge</li>
                    <li className="flex gap-2">✓ Priority in search results</li>
                    <li className="flex gap-2">✓ Access to high-value RFQs</li>
                    <li className="flex gap-2">✓ B2B Escrow protection</li>
                  </ul>
                </Card>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function FileUploadField({ 
  file, 
  onUpload, 
  onRemove 
}: { 
  file: UploadedFile | null; 
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (file) {
    return (
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 text-xs">{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">Uploaded {new Date(file.uploadedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700">Remove</button>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 transition-colors cursor-pointer">
      <input 
        type="file" 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])}
        className="hidden"
        ref={inputRef}
      />
      <label className="cursor-pointer" onClick={() => inputRef.current?.click()}>
        <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className="text-sm text-gray-600">Click to upload</span>
        <span className="block text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 10MB)</span>
      </label>
    </div>
  );
}
