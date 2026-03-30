'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SupportPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-[80vh] py-20 px-5 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="tag-pill mb-4">
          <span className="tag-pill-dot" />
          Help Center
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">Support</h1>
        <p className="text-lg text-[var(--text-secondary)] mb-14 max-w-lg">Need help? Reach out to our team and we'll get back to you.</p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z', title: 'Call Us', value: '+234 906 525 7784', desc: 'Mon-Fri, 9am-5pm WAT' },
            { icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75', title: 'Email Us', value: 'support@agromarket.com', desc: 'Response within 24 hours' },
            { icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', title: 'Visit Us', value: '132 Ovwian Main Road', desc: 'Opposite the primary school, Delta State' },
          ].map((card) => (
            <div key={card.title} className="card-glass p-6">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-semibold mb-1">{card.title}</h3>
              <p className="text-white font-semibold text-[15px] mb-1">{card.value}</p>
              <p className="text-[12px] text-[var(--text-muted)]">{card.desc}</p>
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="card-glass p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Message Sent!</h2>
            <p className="text-[var(--text-secondary)] mb-8">We'll get back to you within 24 hours.</p>
            <Link href="/" className="btn-primary">Back to Home</Link>
          </div>
        ) : (
          <div className="card-glass p-8 sm:p-10">
            <h2 className="text-xl font-bold text-white mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Subject</label>
                <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="input-field" placeholder="How can we help?" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[var(--text-muted)] mb-2">Message</label>
                <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="input-field resize-none" placeholder="Describe your issue or question..." />
              </div>
              <button type="submit" className="btn-primary">
                Send Message
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
