'use client';

import { useState, useEffect } from 'react';
import { 
  CircleDollarSign, 
  ArrowUpRight, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  RefreshCw,
  Clock
} from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [balance, setBalance] = useState(0.0);
  const [payoutAmount, setPayoutAmount] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mlm_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch ledger aggregates (transactions and payouts)
      const res = await fetch('/api/user/ledger', { headers });
      let json: { transactions?: Transaction[]; payouts?: Payout[] } = {};
      const ledgerContentType = res.headers.get('content-type');
      if (ledgerContentType && ledgerContentType.includes('application/json')) {
        json = await res.json() as { transactions?: Transaction[]; payouts?: Payout[] };
      }
      
      if (res.ok) {
        setTransactions(json.transactions || []);
        setPayouts(json.payouts || []);
      }

      // Fetch user details for current balance
      const userRes = await fetch('/api/user/dashboard', { headers });
      let userJson: { user?: { walletBalance: number } } = {};
      const userContentType = userRes.headers.get('content-type');
      if (userContentType && userContentType.includes('application/json')) {
        userJson = await userRes.json() as { user?: { walletBalance: number } };
      }
      if (userRes.ok && userJson.user) {
        setBalance(userJson.user.walletBalance);
      }
    } catch (e: unknown) {
      console.error('Error fetching ledger details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitLoading(true);

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid withdrawal amount');
      setSubmitLoading(false);
      return;
    }

    if (amount > balance) {
      setError('Insufficient wallet balance');
      setSubmitLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('mlm_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/user/payout-request', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount }),
      });
      
      let json: { error?: string } = {};
      const payoutContentType = res.headers.get('content-type');
      if (payoutContentType && payoutContentType.includes('application/json')) {
        json = await res.json() as { error?: string };
      }
      if (!res.ok) {
        throw new Error(json.error || `Withdrawal request failed (status: ${res.status})`);
      }

      setSuccess(`Withdrawal request for ₹${amount.toFixed(2)} submitted successfully!`);
      setPayoutAmount('');
      // Refresh ledger logs
      await fetchLedgerData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Payment network error');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw className="spin" size={32} color="#2563eb" />
        <p style={{ marginTop: '12px', color: '#64748b' }}>Loading ledger history...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Financial Ledger & Withdrawals</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Audit your matches, review pair income logs, and request wallet balance payouts.
          </p>
        </div>
      </div>

      <div style={styles.pageContent}>
        {/* Left Column: Ledger Records */}
        <div style={styles.recordsColumn}>
          {/* Transactions Card */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Transaction Statement</h3>
            
            {transactions.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No transaction history recorded yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => {
                      const date = new Date(txn.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });
                      return (
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
                          <td style={{ fontSize: '0.8125rem' }}>{txn.description}</td>
                          <td style={{ 
                            fontWeight: 600, 
                            color: txn.type === 'WITHDRAWAL' ? '#991b1b' : '#166534' 
                          }}>
                            {txn.type === 'WITHDRAWAL' ? '-' : '+'}₹{Math.abs(txn.amount).toFixed(2)}
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payout History Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Withdrawal Request Queue</h3>
            
            {payouts.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No withdrawal requests filed yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Requested Amount</th>
                      <th>Status</th>
                      <th>Filing Date</th>
                      <th>Approval Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => {
                      const reqDate = new Date(payout.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });
                      const procDate = payout.processedAt 
                        ? new Date(payout.processedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—';

                      let badgeStyle = 'badge-inactive';
                      if (payout.status === 'approved') badgeStyle = 'badge-active';
                      if (payout.status === 'rejected') badgeStyle = 'badge-danger';

                      return (
                        <tr key={payout.id}>
                          <td style={{ fontWeight: 600, color: payout.status === 'rejected' ? '#64748b' : '#0f172a' }}>
                            ₹{payout.amount.toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge ${badgeStyle}`}>
                              {payout.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{reqDate}</td>
                          <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{procDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Wallet & Request Form */}
        <div style={styles.payoutColumn}>
          {/* Wallet Balance Card */}
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--background-alt)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              Available Balance
            </span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#2563eb', margin: '0.25rem 0' }}>
              ₹{balance.toFixed(2)}
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Commissions are instantly credited to your wallet balance.
            </p>
          </div>

          {/* Request Form Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CircleDollarSign size={18} color="#2563eb" />
              File Payout Request
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Submit a request to transfer available wallet balance to your bank account.
            </p>

            {error && (
              <div style={styles.errorAlert}>
                <AlertCircle size={14} color="#991b1b" style={{ marginRight: '6px' }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={styles.successAlert}>
                <CheckCircle size={14} color="#166534" style={{ marginRight: '6px' }} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handlePayoutSubmit} style={styles.form}>
              <div className="input-group">
                <label className="input-label" htmlFor="amount">Withdrawal Amount (₹ INR)</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  className="input-field"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitLoading} style={styles.submitBtn}>
                {submitLoading ? <RefreshCw className="spin" size={16} style={{ marginRight: '6px' }} /> : null}
                {submitLoading ? 'Filing request...' : 'File Request'}
              </button>
            </form>

            <div style={styles.processAlert}>
              <Clock size={14} color="#92400e" style={{ marginRight: '6px', flexShrink: 0 }} />
              <span>Manual verification check (24h turnaround) applies for approval security.</span>
            </div>
          </div>
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
    marginBottom: '2.5rem',
  },
  pageContent: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  recordsColumn: {
    flex: '2 1 500px',
  },
  payoutColumn: {
    flex: '1 1 320px',
    position: 'sticky',
    top: '20px',
  },
  emptyState: {
    padding: '2.5rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.875rem',
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
  },
  successAlert: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  submitBtn: {
    width: '100%',
    padding: '0.75rem',
    fontWeight: 650,
  },
  processAlert: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    marginTop: '1.25rem',
    lineHeight: 1.4,
    fontWeight: 550,
  },
};
