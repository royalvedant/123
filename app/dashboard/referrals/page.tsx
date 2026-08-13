'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Layers, DollarSign, Calendar, RefreshCw } from 'lucide-react';

interface Referral {
  id: string;
  fullName: string;
  email: string;
  status: string;
  position: string;
  createdAt: string;
  total_purchases: number;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mlm_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/user/referrals', { headers });
      if (res.ok) {
        const json = await res.json();
        setReferrals(json.referrals);
      }
    } catch (e) {
      console.error('Error fetching referrals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw className="spin" size={32} color="#2563eb" />
        <p style={{ marginTop: '12px', color: '#64748b' }}>Loading direct referrals list...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Direct Referrals</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            A complete log of network partners who registered directly using your referral link.
          </p>
        </div>
      </div>

      {/* Referrals Table Card */}
      <div className="card">
        {referrals.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Users size={32} color="#64748b" />
            </div>
            <h3>No direct referrals yet</h3>
            <p style={{ maxWidth: '400px', marginTop: '4px' }}>
              Your direct referrals will appear here once they register using your referral link.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Placement Leg</th>
                  <th>Status</th>
                  <th>Joining Fees Paid</th>
                  <th>Joining Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => {
                  const date = new Date(ref.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <tr key={ref.id}>
                      <td>
                        <div style={styles.userCell}>
                          <div style={styles.avatar}>
                            {ref.fullName[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={styles.username}>{ref.fullName}</div>
                            <div style={styles.email}>{ref.id} | {ref.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${ref.position === 'LEFT' ? 'badge-active' : 'badge-inactive'}`}>
                          {ref.position} Leg
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-active">
                          {ref.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        ₹{ref.total_purchases.toFixed(2)}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        {date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  header: {
    marginBottom: '2.5rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
    color: '#64748b',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.8125rem',
  },
  username: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#0f172a',
  },
  email: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
};
