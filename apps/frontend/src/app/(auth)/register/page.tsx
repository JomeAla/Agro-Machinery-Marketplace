'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Role = 'BUYER' | 'SELLER';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone: string;
  companyName: string;
  cacNumber: string;
}

interface Errors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  companyName?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'BUYER',
    phone: '',
    companyName: '',
    cacNumber: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'At least 8 characters required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (formData.role === 'SELLER' && !formData.companyName) newErrors.companyName = 'Company name is required for sellers';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        phone: formData.phone || undefined,
        companyName: formData.companyName || undefined,
        cacNumber: formData.cacNumber || undefined,
      };

      const response = await fetch('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/');
      router.refresh();
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'An error occurred during registration' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof Errors]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleRoleChange = (role: Role) => {
    setFormData((prev) => ({ ...prev, role }));
    if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-charcoal mb-2">Create your account</h1>
        <p className="text-slate/60 text-[15px]">Join Nigeria's leading agricultural marketplace</p>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role Selection */}
        <div>
          <label className="block text-[12px] uppercase tracking-[0.15em] font-semibold text-slate/60 mb-3">I want to</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { role: 'BUYER' as Role, label: 'Buy Machinery', desc: 'Browse & purchase equipment', icon: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z' },
              { role: 'SELLER' as Role, label: 'Sell Machinery', desc: 'List & sell your products', icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z' },
            ].map(({ role, label, desc, icon }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`p-4 rounded-2xl border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] text-left ${
                  formData.role === role
                    ? 'border-forest/30 bg-forest/[0.04] ring-2 ring-forest/10'
                    : 'border-charcoal/[0.08] bg-white/[0.5] hover:border-charcoal/[0.15]'
                }`}
              >
                <svg className={`w-5 h-5 mb-2 transition-colors ${formData.role === role ? 'text-forest' : 'text-slate/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <div className="text-[14px] font-bold text-charcoal">{label}</div>
                <div className="text-[11px] text-slate/50 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-[12px] uppercase tracking-[0.15em] font-semibold text-slate/60 mb-2">First Name</label>
            <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} className={`input-field ${errors.firstName ? 'border-red-400 ring-2 ring-red-100' : ''}`} placeholder="John" />
            {errors.firstName && <p className="mt-2 text-sm text-red-500">{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-[12px] uppercase tracking-[0.15em] font-semibold text-slate/60 mb-2">Last Name</label>
            <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} className={`input-field ${errors.lastName ? 'border-red-400 ring-2 ring-red-100' : ''}`} placeholder="Doe" />
            {errors.lastName && <p className="mt-2 text-sm text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-[12px] uppercase tracking-[0.15em] font-semibold text-slate/60 mb-2">Email Address</label>
          <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={`input-field ${errors.email ? 'border-red-400 ring-2 ring-red-100' : ''}`} placeholder="you@example.com" />
          {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-[12px] uppercase tracking-[0.15em] font-semibold text-slate/60 mb-2">Phone Number <span className="normal-case tracking-normal text-slate/40">(Optional)</span></label>
          <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+234 801 234 5678" />
        </div>

        {/* Seller fields */}
        {formData.role === 'SELLER' && (
          <>
            <div>
              <label htmlFor="companyName" className="block text-[12px] uppercase tracking-[0.15em] font-semibold text-slate/60 mb-2">Company Name</label>
              <input id="companyName" name="companyName" type="text" value={formData.companyName} onChange={handleChange} className={`input-field ${errors.companyName ? 'border-red-400 ring-2 ring-red-100' : ''}`} placeholder="Doe Farms Ltd" />
              {errors.companyName && <p className="mt-2 text-sm text-red-500">{errors.companyName}</p>}
            </div>
            <div>
              <label htmlFor="cacNumber" className="block text-[12px] uppercase tracking-[0.15em] font-semibold text-slate/60 mb-2">CAC Number <span className="normal-case tracking-normal text-slate/40">(Optional)</span></label>
              <input id="cacNumber" name="cacNumber" type="text" value={formData.cacNumber} onChange={handleChange} className="input-field" placeholder="RC1234567" />
            </div>
          </>
        )}

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-[12px] uppercase tracking-[0.15em] font-semibold text-slate/60 mb-2">Password</label>
          <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className={`input-field ${errors.password ? 'border-red-400 ring-2 ring-red-100' : ''}`} placeholder="Min 8 characters" />
          {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-[12px] uppercase tracking-[0.15em] font-semibold text-slate/60 mb-2">Confirm Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className={`input-field ${errors.confirmPassword ? 'border-red-400 ring-2 ring-red-100' : ''}`} placeholder="Re-enter password" />
          {errors.confirmPassword && <p className="mt-2 text-sm text-red-500">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center py-4 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating Account...
            </span>
          ) : (
            <>
              Create Account
              <span className="w-6 h-6 rounded-full bg-white/[0.15] flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[14px] text-slate/60">
        Already have an account?{' '}
        <Link href="/login" className="text-forest font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
