'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Role = 'BUYER' | 'SELLER';

interface RegisterFormData {
  email: string; password: string; confirmPassword: string;
  firstName: string; lastName: string; role: Role;
  phone: string; companyName: string; cacNumber: string;
}

interface Errors {
  email?: string; password?: string; confirmPassword?: string;
  firstName?: string; lastName?: string; role?: string;
  companyName?: string; general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '',
    role: 'BUYER', phone: '', companyName: '', cacNumber: '',
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
        email: formData.email, password: formData.password,
        firstName: formData.firstName, lastName: formData.lastName,
        role: formData.role, phone: formData.phone || undefined,
        companyName: formData.companyName || undefined, cacNumber: formData.cacNumber || undefined,
      };
      const response = await fetch('http://localhost:4000/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
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
        <h1 className="font-display text-3xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-[var(--text-secondary)] text-[15px]">Join Nigeria's leading agricultural marketplace</p>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm">{errors.general}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-3">I want to</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { role: 'BUYER' as Role, label: 'Buy Machinery', desc: 'Browse & purchase' },
              { role: 'SELLER' as Role, label: 'Sell Machinery', desc: 'List & sell products' },
            ].map(({ role, label, desc }) => (
              <button key={role} type="button" onClick={() => handleRoleChange(role)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  formData.role === role
                    ? 'border-accent/30 bg-accent/[0.06] shadow-[0_0_20px_rgba(0,230,118,0.05)]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                }`}>
                <div className="text-[14px] font-bold text-white">{label}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">First Name</label>
            <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} className={`input-field ${errors.firstName ? 'border-red-500/40 ring-2 ring-red-500/10' : ''}`} placeholder="John" />
            {errors.firstName && <p className="mt-2 text-sm text-red-400">{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Last Name</label>
            <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} className={`input-field ${errors.lastName ? 'border-red-500/40 ring-2 ring-red-500/10' : ''}`} placeholder="Doe" />
            {errors.lastName && <p className="mt-2 text-sm text-red-400">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Email Address</label>
          <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={`input-field ${errors.email ? 'border-red-500/40 ring-2 ring-red-500/10' : ''}`} placeholder="you@example.com" />
          {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Phone <span className="normal-case tracking-normal text-[var(--text-muted)]/60">(Optional)</span></label>
          <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+234 801 234 5678" />
        </div>

        {formData.role === 'SELLER' && (
          <>
            <div>
              <label htmlFor="companyName" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Company Name</label>
              <input id="companyName" name="companyName" type="text" value={formData.companyName} onChange={handleChange} className={`input-field ${errors.companyName ? 'border-red-500/40 ring-2 ring-red-500/10' : ''}`} placeholder="Doe Farms Ltd" />
              {errors.companyName && <p className="mt-2 text-sm text-red-400">{errors.companyName}</p>}
            </div>
            <div>
              <label htmlFor="cacNumber" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">CAC Number <span className="normal-case tracking-normal text-[var(--text-muted)]/60">(Optional)</span></label>
              <input id="cacNumber" name="cacNumber" type="text" value={formData.cacNumber} onChange={handleChange} className="input-field" placeholder="RC1234567" />
            </div>
          </>
        )}

        <div>
          <label htmlFor="password" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Password</label>
          <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className={`input-field ${errors.password ? 'border-red-500/40 ring-2 ring-red-500/10' : ''}`} placeholder="Min 8 characters" />
          {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Confirm Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className={`input-field ${errors.confirmPassword ? 'border-red-500/40 ring-2 ring-red-500/10' : ''}`} placeholder="Re-enter password" />
          {errors.confirmPassword && <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-4 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed">
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
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[14px] text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link href="/login" className="text-accent font-semibold hover:underline">Sign In</Link>
      </p>
    </div>
  );
}
