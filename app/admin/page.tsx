'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  CircleCheck, 
  Clock, 
  Search, 
  Edit2, 
  Check, 
  X, 
  RefreshCw,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalCommissions: number;
  pendingPayoutsAmount: number;
  approvedPayoutsAmount: number;
}

interface Purchase {
  id: string;
  amount: number;
  createdAt: string;
  username: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  createdAt: string;
  username: string;
  email: string;
  user_current_balance: number;
}

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  walletBalance: number;
  leftCount: number;
  rightCount: number;
  matchedPairs: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<PayoutRequest[]>([]);
  const [userList, setUserList] = useState<UserRecord[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [payoutActionLoading, setPayoutActionLoading] = useState<string | null>(null);
  
  // Edit User State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editLeftCount, setEditLeftCount] = useState('');
  const [editRightCount, setEditRightCount] = useState('');
  const [editMatchedPairs, setEditMatchedPairs] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('mlm_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/stats', { headers });
      if (res.ok) {
        const json = await res.json();
        setStats(json.stats);
        setRecentPurchases(json.recentPurchases);
        setPendingPayouts(json.pendingPayouts);
      } else if (res.status === 403) {
        window.location.href = '/dashboard';
        return;
      }
    } catch (e) {
      console.error('Error fetching admin statistics:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDirectory = async (query = '') => {
    try {
      const token = localStorage.getItem('mlm_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const url = query ? `/api/admin/users?q=${encodeURIComponent(query)}` : '/api/admin/users';
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        setUserList(json.users);
      } else if (res.status === 403) {
        window.location.href = '/dashboard';
        return;
      }
    } catch (e) {
      console.error('Error fetching user directory:', e);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchUserDirectory();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUserDirectory(searchQuery);
  };

  const handlePayoutAction = async (payoutId: string, action: 'approve' | 'reject') => {
    try {
      setPayoutActionLoading(payoutId);
      const token = localStorage.getItem('mlm_token');
      
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ payoutId, action }),
      });
      
      let json: { error?: string } = {};
      const payoutContentType = res.headers.get('content-type');
      if (payoutContentType && payoutContentType.includes('application/json')) {
        json = await res.json() as { error?: string };
      }
      if (!res.ok) {
        throw new Error(json.error || `Action failed (status: ${res.status})`);
      }
      
      // Refresh admin logs
      await fetchAdminData();
      await fetchUserDirectory(searchQuery);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      alert(errorMessage || 'Error occurred');
    } finally {
      setPayoutActionLoading(null);
    }
  };

  const startEditing = (user: UserRecord) => {
    setEditingUser(user);
    setEditBalance(user.walletBalance.toString());
    setEditLeftCount(user.leftCount.toString());
    setEditRightCount(user.rightCount.toString());
    setEditMatchedPairs(user.matchedPairs.toString());
    setEditStatus(user.status);
    setEditPassword('');
    setEditSuccess('');
    setEditError('');
  };

  const cancelEditing = () => {
    setEditingUser(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setEditLoading(true);
    setEditSuccess('');
    setEditError('');

    try {
      const token = localStorage.getItem('mlm_token');
      
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: editingUser.id,
          walletBalance: parseFloat(editBalance),
          leftCount: parseInt(editLeftCount, 10),
          rightCount: parseInt(editRightCount, 10),
          matchedPairs: parseInt(editMatchedPairs, 10),
          status: editStatus,
          newPassword: editPassword,
        }),
      });

      let json: { error?: string } = {};
      const editContentType = res.headers.get('content-type');
      if (editContentType && editContentType.includes('application/json')) {
        json = await res.json() as { error?: string };
      }
      if (!res.ok) {
        throw new Error(json.error || `Failed to update user values (status: ${res.status})`);
      }

      setEditSuccess('User metrics updated successfully!');
      
      // Refresh stats and listings
      await fetchAdminData();
      await fetchUserDirectory(searchQuery);
      
      setTimeout(() => {
        setEditingUser(null);
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setEditError(errorMessage || 'Server error');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw className="spin" size={32} color="#2563eb" />
        <p style={{ marginTop: '12px', color: '#64748b' }}>Loading administrative dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Administration Control Panel</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Monitor system-wide metrics, approve pending payouts, and manage distributor counts.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-3" style={{ marginBottom: '2.5rem' }}>
          {/* Sales Volume */}
          <div className="card">
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Total Sales Revenue</span>
              <div style={styles.kpiIconWrapper}><TrendingUp size={18} color="#2563eb" /></div>
            </div>
            <div style={styles.kpiValue}>₹{stats.totalSales.toFixed(2)}</div>
            <div style={styles.kpiSubText}>Joining fees paid</div>
          </div>

          {/* Allocated Commissions */}
          <div className="card">
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Total Commissions</span>
              <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#f0fdf4' }}><DollarSign size={18} color="#166534" /></div>
            </div>
            <div style={styles.kpiValue}>₹{stats.totalCommissions.toFixed(2)}</div>
            <div style={styles.kpiSubText}>Pair matching payouts</div>
          </div>

          {/* Members Breakdown */}
          <div className="card">
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Global Users</span>
              <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#fef3c7' }}><Users size={18} color="#b45309" /></div>
            </div>
            <div style={styles.kpiValue}>{stats.totalUsers}</div>
            <div style={styles.kpiSubText}>
              <strong style={{ color: '#166534' }}>{stats.activeUsers}</strong> active partners
            </div>
          </div>

          {/* Pending Payout Amount */}
          <div className="card">
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Pending Withdrawals</span>
              <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#fee2e2' }}><Clock size={18} color="#991b1b" /></div>
            </div>
            <div style={styles.kpiValue}>₹{stats.pendingPayoutsAmount.toFixed(2)}</div>
            <div style={styles.kpiSubText}>Funds requested for approval</div>
          </div>

          {/* Approved Payout Amount */}
          <div className="card">
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Approved Payouts</span>
              <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#f0fdf4' }}><CircleCheck size={18} color="#166534" /></div>
            </div>
            <div style={styles.kpiValue}>₹{stats.approvedPayoutsAmount.toFixed(2)}</div>
            <div style={styles.kpiSubText}>Completed withdrawals</div>
          </div>
        </div>
      )}

      {/* Main Section layout */}
      <div style={styles.mainGrid}>
        
        {/* Left/Middle Column: User Search & Payout Approvals */}
        <div style={styles.leftColumn}>
          {/* Payout Approval Manager Card */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={18} color="#92400e" />
              Payout Request Approvals
            </h3>

            {pendingPayouts.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No pending payout requests. Queue empty.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Distributor</th>
                      <th>Requested Payout</th>
                      <th>Distributor Wallet</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayouts.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 650, color: '#0f172a' }}>{req.username}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.email}</div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#b45309' }}>
                          ₹{req.amount.toFixed(2)}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          ₹{req.user_current_balance.toFixed(2)} current
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handlePayoutAction(req.id, 'approve')} 
                              disabled={payoutActionLoading !== null}
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: '#166534' }}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handlePayoutAction(req.id, 'reject')} 
                              disabled={payoutActionLoading !== null}
                              className="btn btn-danger"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Directory Table Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 0 }}>Distributor Directory</h3>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search User ID / Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2rem', fontSize: '0.75rem', paddingTop: '4px', paddingBottom: '4px', width: '200px', marginBottom: 0 }}
                  />
                </div>
                <button type="submit" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  Search
                </button>
              </form>
            </div>

            {userList.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No user records found matching search filters.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Distributor</th>
                      <th>Status</th>
                      <th>Wallet Balance</th>
                      <th>Left Count</th>
                      <th>Right Count</th>
                      <th>Pairs</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 650, color: '#0f172a' }}>{user.fullName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{user.id}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${user.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{user.walletBalance.toFixed(2)}
                        </td>
                        <td style={{ fontSize: '0.8125rem', fontWeight: 650 }}>{user.leftCount}</td>
                        <td style={{ fontSize: '0.8125rem', fontWeight: 650 }}>{user.rightCount}</td>
                        <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{user.matchedPairs}</td>
                        <td>
                          <button 
                            onClick={() => startEditing(user)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: User Metrics Editor Panel */}
        {editingUser && (
          <div style={styles.editorColumn}>
            <div className="card" style={styles.editorCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Edit2 size={16} color="#2563eb" />
                  Edit Partner Metrics
                </h3>
                <button onClick={cancelEditing} style={styles.closeBtn}><X size={16} /></button>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{editingUser.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{editingUser.id}</div>
              </div>

              {editError && (
                <div style={styles.errorAlert}>
                  <AlertCircle size={14} color="#991b1b" style={{ marginRight: '6px' }} />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div style={styles.successAlert}>
                  <Check className="spin" size={14} color="#166534" style={{ marginRight: '6px' }} />
                  <span>{editSuccess}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} style={styles.form}>
                {/* Status Toggle */}
                <div className="input-group">
                  <label className="input-label">Account Status</label>
                  <select 
                    className="input-field"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="active">Active Partner</option>
                    <option value="inactive">Inactive Partner</option>
                  </select>
                </div>

                {/* Balance */}
                <div className="input-group">
                  <label className="input-label">Wallet Balance (₹ INR)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-field"
                    value={editBalance} 
                    onChange={(e) => setEditBalance(e.target.value)} 
                    required 
                  />
                </div>

                {/* Left Count */}
                <div className="input-group">
                  <label className="input-label">Left count</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={editLeftCount} 
                    onChange={(e) => setEditLeftCount(e.target.value)} 
                    required 
                  />
                </div>

                {/* Right Count */}
                <div className="input-group">
                  <label className="input-label">Right count</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={editRightCount} 
                    onChange={(e) => setEditRightCount(e.target.value)} 
                    required 
                  />
                </div>

                {/* Matched Pairs */}
                <div className="input-group">
                  <label className="input-label">Matched Pairs</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={editMatchedPairs} 
                    onChange={(e) => setEditMatchedPairs(e.target.value)} 
                    required 
                  />
                </div>

                {/* Reset Password */}
                <div className="input-group">
                  <label className="input-label">Reset Password (leave blank to keep current)</label>
                  <input 
                    type="password" 
                    className="input-field"
                    placeholder="Enter new password"
                    value={editPassword} 
                    onChange={(e) => setEditPassword(e.target.value)} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                  <button type="button" onClick={cancelEditing} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={editLoading} style={{ flex: 2 }}>
                    {editLoading ? <RefreshCw className="spin" size={14} style={{ marginRight: '6px' }} /> : null}
                    Save Metrics
                  </button>
                </div>
              </form>
            </div>
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
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  kpiLabel: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  kpiIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    marginBottom: '0.25rem',
  },
  kpiSubText: {
    fontSize: '0.8125rem',
    color: '#64748b',
  },
  mainGrid: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  leftColumn: {
    flex: '2 1 600px',
  },
  editorColumn: {
    flex: '1 1 320px',
    position: 'sticky',
    top: '20px',
  },
  editorCard: {
    backgroundColor: '#ffffff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
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
  emptyState: {
    padding: '2.5rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.875rem',
  },
};
