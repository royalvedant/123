'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  Copy, 
  Check, 
  ArrowRightLeft, 
  Users, 
  ArrowUpRight,
  RefreshCw,
  Layers,
  ChevronRight
} from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface DashboardData {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    walletBalance: number;
    leftCount: number;
    rightCount: number;
    matchedPairs: number;
    position: string;
    sponsorId: string | null;
    sponsorName: string | null;
  };
  referralLink: string;
  recentTransactions: Transaction[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Retrieve the token from localStorage
      const token = localStorage.getItem('mlm_token');
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/user/dashboard', { headers });
      
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Fetch dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw className="spin" size={32} color="#2563eb" />
        <p style={{ marginTop: '12px', color: '#64748b' }}>Loading dashboard details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center" style={{ padding: '3rem' }}>
        <h3>Error Loading Dashboard</h3>
        <p>Could not retrieve session data. Please try logging in again.</p>
        <Link href="/login" className="btn btn-primary mt-4">Go to Login</Link>
      </div>
    );
  }

  const { user, referralLink, recentTransactions } = data;

  return (
    <div>
      {/* Welcome Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Welcome, {user.fullName}</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            ID: <strong style={{ color: '#0f172a' }}>{user.id}</strong> | Sponsor: <strong style={{ color: '#0f172a' }}>{user.sponsorName || 'Root'} ({user.sponsorId || 'None'})</strong>
          </p>
        </div>
        <div>
          <span className="badge badge-active" style={{ fontSize: '0.8125rem', padding: '6px 14px' }}>
            Active Distributor
          </span>
        </div>
      </div>

      {/* Top Stats Grid (3 Cards) */}
      <div className="grid grid-3" style={{ marginBottom: '2.5rem' }}>
        {/* Card 1: Total Earnings / Wallet Balance */}
        <div className="card" style={styles.statCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Wallet Balance</span>
            <div style={styles.iconBox}><DollarSign size={18} color="#2563eb" /></div>
          </div>
          <div style={{ ...styles.cardValue, color: '#2563eb' }}>
            ₹{user.walletBalance.toFixed(2)}
          </div>
          <div style={styles.cardSub}>Total matching earnings</div>
          <div style={styles.cardFooter}>
            <Link href="/dashboard/ledger" style={styles.footerAction}>
              Request Withdrawal <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card 2: Left Team Count */}
        <div className="card" style={styles.statCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Left Team Count</span>
            <div style={{ ...styles.iconBox, backgroundColor: '#eff6ff' }}><Users size={18} color="#2563eb" /></div>
          </div>
          <div style={styles.cardValue}>
            {user.leftCount}
          </div>
          <div style={styles.cardSub}>Members in Left subtree</div>
          <div style={styles.cardFooter}>
            <Link href="/dashboard/tree" style={styles.footerAction}>
              View Downline Tree <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card 3: Right Team Count */}
        <div className="card" style={styles.statCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>Right Team Count</span>
            <div style={{ ...styles.iconBox, backgroundColor: '#eff6ff' }}><Users size={18} color="#2563eb" /></div>
          </div>
          <div style={styles.cardValue}>
            {user.rightCount}
          </div>
          <div style={styles.cardSub}>Members in Right subtree</div>
          <div style={styles.cardFooter}>
            <Link href="/dashboard/tree" style={styles.footerAction}>
              View Downline Tree <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Referral Link & Recent Transactions */}
      <div className="grid grid-2" style={{ alignItems: 'start', gap: '2rem' }}>
        
        {/* Referral Link Generator */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Your Referral Link</h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Copy and share your unique referral link to sponsor new members. They will be placed automatically down your tree branches.
          </p>

          <div style={styles.linkWrapper}>
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              style={styles.linkInput} 
            />
            <button 
              onClick={() => copyToClipboard(referralLink)} 
              style={copiedLink ? styles.copyBtnCopied : styles.copyBtn}
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          <div style={styles.legBadges}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Matched Pairs: </span>
            <span className="badge badge-active" style={{ marginLeft: '4px', fontSize: '0.75rem' }}>
              {user.matchedPairs} Pairs Matched
            </span>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: 0 }}>Recent Activity</h3>
            <Link href="/dashboard/ledger" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center' }}>
              View Ledger <ChevronRight size={14} />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div style={styles.emptyState}>
              <ArrowRightLeft size={32} color="#cbd5e1" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>No recent transaction payouts.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id}>
                      <td>
                        <span className={`badge ${
                          txn.type === 'PAIR_MATCHING_BONUS' 
                            ? 'badge-active' 
                            : txn.type === 'JOINING_FEE' 
                              ? 'badge-inactive' 
                              : 'badge-danger'
                        }`}>
                          {txn.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {txn.description}
                      </td>
                      <td style={{ 
                        fontWeight: 600, 
                        color: txn.type === 'WITHDRAWAL' ? '#991b1b' : '#166534' 
                      }}>
                        {txn.type === 'WITHDRAWAL' ? '-' : '+'}₹{Math.abs(txn.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
  },
  statCard: {
    padding: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  cardLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: '0.05em',
  },
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: '0.25rem',
  },
  cardSub: {
    fontSize: '0.8125rem',
    color: '#64748b',
    marginBottom: '1rem',
  },
  cardFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '0.75rem',
  },
  footerAction: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#2563eb',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  },
  linkWrapper: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#f8fafc',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  linkInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: '#475569',
    outline: 'none',
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  copyBtnCopied: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'default',
  },
  legBadges: {
    display: 'flex',
    alignItems: 'center',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem',
    textAlign: 'center',
  },
};
