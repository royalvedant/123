'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Network, Lock, User, AlertCircle, RefreshCw } from 'lucide-react';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store the token in localStorage for Bearer headers compatibility in fetch calls
      if (data.token) {
        localStorage.setItem('mlm_token', data.token);
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <Network size={28} color="#2563eb" />
          </div>
          <h1 style={styles.title}>Sign in to Aura</h1>
          <p style={styles.subtitle}>Enter your Customer ID / Email and password</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={16} color="#991b1b" style={{ marginRight: '8px', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="input-group">
            <label className="input-label" htmlFor="loginId">User ID / Email</label>
            <div style={styles.inputContainer}>
              <User size={16} color="#64748b" style={styles.inputIcon} />
              <input
                id="loginId"
                type="text"
                className="input-field"
                placeholder="CUST100001 or you@example.com"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
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

          <button type="submit" className="btn btn-primary" disabled={loading} style={styles.submitBtn}>
            {loading ? <RefreshCw className="spin" size={16} style={{ marginRight: '6px' }} /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>New to Aura?</span>
          <Link href="/register" style={styles.signupLink}>Create an account</Link>
        </div>
      </div>
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
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
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
  inputIcon: {
    position: 'absolute',
    left: '0.875rem',
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
  signupLink: {
    color: '#2563eb',
    fontWeight: 600,
  },
  helperBadge: {
    marginTop: '1.5rem',
    fontSize: '0.8125rem',
    color: '#64748b',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: '1px 4px',
    borderRadius: '4px',
    color: '#0f172a',
  },
};
