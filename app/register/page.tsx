'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Network, Lock, User, Mail, Link2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [position, setPosition] = useState('LEFT');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefill fields from query parameters
  useEffect(() => {
    const sponsorParam = searchParams.get('sponsor');
    const positionParam = searchParams.get('position');

    if (sponsorParam) setSponsorId(sponsorParam);
    if (positionParam && (positionParam.toUpperCase() === 'LEFT' || positionParam.toUpperCase() === 'RIGHT')) {
      setPosition(positionParam.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        fullName,
        email,
        password,
        sponsorId,
        position,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(`Account created! Assigned ID is ${data.userId}. Redirecting...`);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Network error');
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.logoWrapper}>
          <Network size={28} color="#2563eb" />
        </div>
        <h1 style={styles.title}>Join the network</h1>
        <p style={styles.subtitle}>Register account and pay ₹1,000 joining fee</p>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={16} color="#991b1b" style={{ marginRight: '8px', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem' }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={styles.successAlert}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 550 }}>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div className="input-group">
          <label className="input-label" htmlFor="fullName">Full Name</label>
          <div style={styles.inputContainer}>
            <User size={16} color="#64748b" style={styles.inputIcon} />
            <input
              id="fullName"
              type="text"
              className="input-field"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%' }}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="email">Email Address</label>
          <div style={styles.inputContainer}>
            <Mail size={16} color="#64748b" style={styles.inputIcon} />
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%' }}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="password">Password</label>
          <div style={styles.inputContainer}>
            <Lock size={16} color="#64748b" style={styles.inputIcon} />
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%' }}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="sponsorId">Sponsor/Referral ID</label>
          <div style={styles.inputContainer}>
            <Link2 size={16} color="#64748b" style={styles.inputIcon} />
            <input
              id="sponsorId"
              type="text"
              className="input-field"
              placeholder="Sponsor ID (e.g. CUST100001)"
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%' }}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="position">Preferred Position</label>
          <div style={styles.selectContainer}>
            <Layers size={16} color="#64748b" style={styles.inputIcon} />
            <select
              id="position"
              className="input-field"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%', appearance: 'none', cursor: 'pointer' }}
              required
            >
              <option value="LEFT">Left Leg</option>
              <option value="RIGHT">Right Leg</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={styles.submitBtn}>
          {loading ? <RefreshCw className="spin" size={16} style={{ marginRight: '6px' }} /> : null}
          {loading ? 'Registering...' : 'Register & Pay ₹1,000'}
        </button>
      </form>

      <div style={styles.footer}>
        <span style={styles.footerText}>Already registered?</span>
        <Link href="/login" style={styles.loginLink}>Sign in</Link>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <div style={styles.container}>
      <Suspense fallback={<div>Loading form...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '2rem 1rem',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  logoWrapper: {
    width: '56px',
    height: '56px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem auto',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.4,
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    padding: '0.75rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  successAlert: {
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    color: '#166534',
    padding: '0.75rem',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '1.25rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  selectContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.875rem',
    zIndex: 1,
    pointerEvents: 'none',
  },
  submitBtn: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.9375rem',
    fontWeight: 650,
    marginTop: '0.5rem',
  },
  footer: {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '4px',
    fontSize: '0.8125rem',
  },
  footerText: {
    color: '#64748b',
  },
  loginLink: {
    color: '#2563eb',
    fontWeight: 600,
  },
};
