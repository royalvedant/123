'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  UserPlus, 
  Search, 
  HelpCircle,
  RefreshCw,
  Home,
  ShieldAlert,
  Calendar
} from 'lucide-react';

interface TreeNode {
  id: string;
  fullName: string;
  createdAt: string;
  status: string;
  role: string;
  leftCount: number;
  rightCount: number;
  left?: TreeNode | null;
  right?: TreeNode | null;
}

interface TreeData {
  tree: TreeNode;
  parentUsername: string | null; // A CUST ID parent path
}

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function BinaryTreeVisualizer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Admin Management State
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    email: string;
    role: string;
    isAdmin: boolean;
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const targetUserId = searchParams.get('userId') || '';

  const fetchTreeData = async (userId: string) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('mlm_token');
      const url = userId ? `/api/user/tree?userId=${encodeURIComponent(userId)}` : '/api/user/tree';
      
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(url, { headers });
      let json: { error?: string } & Partial<TreeData> = {};
      const treeContentType = res.headers.get('content-type');
      if (treeContentType && treeContentType.includes('application/json')) {
        json = await res.json() as { error?: string } & Partial<TreeData>;
      }
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('mlm_token');
          router.push('/login');
          return;
        }
        throw new Error(json.error || `Failed to fetch tree structure (status: ${res.status})`);
      }
      
      setData(json as TreeData);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage || 'Error loading tree data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreeData(targetUserId);
  }, [targetUserId]);

  useEffect(() => {
    const token = localStorage.getItem('mlm_token');
    if (token) {
      const decoded = decodeJwt(token);
      setCurrentUser(decoded);
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    
    setResetLoading(true);
    setResetSuccess('');
    setResetError('');

    try {
      const token = localStorage.getItem('mlm_token');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: selectedNode.id,
          newPassword: newPassword,
        }),
      });

      let json: { error?: string } = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        json = await res.json() as { error?: string };
      }
      if (!res.ok) {
        throw new Error(json.error || `Reset failed (status: ${res.status})`);
      }

      setResetSuccess('Password updated successfully!');
      setNewPassword('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResetError(errorMessage || 'Server error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/tree?userId=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNavigate = (userId: string) => {
    router.push(`/dashboard/tree?userId=${encodeURIComponent(userId)}`);
  };

  const resetToMe = () => {
    setSearchQuery('');
    router.push('/dashboard/tree');
  };

  // Node Renderer Helper
  const renderNode = (node: TreeNode | null | undefined, parentId: string, position: 'LEFT' | 'RIGHT', parentIdStr: string) => {
    if (!node) {
      // Empty slot - show placeholder registration button
      return (
        <div style={styles.emptyNode}>
          <div style={styles.emptyText}>Empty Slot</div>
          <Link 
            href={`/register?sponsor=${parentIdStr}&position=${position}`}
            style={styles.placementBtn}
          >
            <UserPlus size={12} />
            <span>Place</span>
          </Link>
        </div>
      );
    }

    const isActive = node.status === 'active';
    const isHovered = hoveredNodeId === node.id;
    
    // Format joining date
    const joinDate = new Date(node.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div 
        style={{
          ...styles.nodeCard,
          border: isHovered ? '1px solid #2563eb' : '1px solid #e2e8f0',
          boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow)',
        }}
        onMouseEnter={() => setHoveredNodeId(node.id)}
        onMouseLeave={() => setHoveredNodeId(null)}
      >
        {isHovered ? (
          /* Hover state reveals counts */
          <div style={styles.hoverStats}>
            <div style={styles.hoverHeader}>Subtree Counts</div>
            <div style={styles.hoverRow}>
              <span>Left Leg:</span>
              <strong>{node.leftCount} members</strong>
            </div>
            <div style={styles.hoverRow}>
              <span>Right Leg:</span>
              <strong>{node.rightCount} members</strong>
            </div>
            <button 
              onClick={() => handleNavigate(node.id)} 
              style={styles.nodeNavigateBtn}
            >
              Focus Downlines →
            </button>
          </div>
        ) : (
          /* Default state displays Name, ID, Date, Avatar */
          <div style={styles.defaultCardContent}>
            <div style={styles.nodeHeader}>
              <div style={styles.nodeAvatar}>
                {node.fullName[0].toUpperCase()}
              </div>
              <div style={styles.nodeMeta}>
                <div style={styles.nodeName}>{node.fullName}</div>
                <div style={styles.nodeId}>{node.id}</div>
              </div>
            </div>
            
            <div style={styles.nodeDateRow}>
              <Calendar size={12} color="#64748b" style={{ marginRight: '4px' }} />
              <span>Joined {joinDate}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span className="badge badge-active" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                Active
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {currentUser && currentUser.isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                      setNewPassword('');
                      setResetSuccess('');
                      setResetError('');
                    }}
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Manage ⚙️
                  </button>
                )}
                <button 
                  onClick={() => handleNavigate(node.id)} 
                  style={styles.exploreTextLink}
                >
                  Explore
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Network Genealogy Tree</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Genealogical visual map. Hover on any node card to reveal their respective left and right leg counts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {data?.parentUsername && (
            <button 
              onClick={() => handleNavigate(data.parentUsername!)}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.875rem' }}
            >
              <ArrowLeft size={16} />
              <span>Go Up</span>
            </button>
          )}
          {targetUserId && (
            <button 
              onClick={resetToMe}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.875rem' }}
            >
              <Home size={16} />
              <span>Reset to Me</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Panel: Search */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search downline Customer ID (e.g. CUST100002)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%', marginBottom: 0 }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search ID</button>
        </form>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ShieldAlert size={20} color="#991b1b" style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 550 }}>
              {error.includes('Forbidden') 
                ? 'Forbidden: You can only view subtrees of users in your own downline hierarchy.' 
                : error}
            </span>
          </div>
          <button onClick={resetToMe} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
            Back to Me
          </button>
        </div>
      )}

      {loading && (
        <div style={styles.loadingWrapper}>
          <RefreshCw className="spin" size={32} color="#2563eb" />
          <p style={{ marginTop: '12px', color: '#64748b' }}>Refreshing downline genealogy map...</p>
        </div>
      )}

      {/* Hierarchical Tree Render */}
      {!loading && data && (
        <div style={styles.treeViewport}>
          <div style={styles.treeContainer}>
            
            {/* Level 0: Root */}
            <div style={styles.treeRow}>
              <div style={styles.treeCol}>
                <div style={styles.rootBox}>
                  {renderNode(data.tree, 'CUST100001', 'LEFT', '')}
                </div>
              </div>
            </div>

            {/* Connecting lines level 0 to level 1 */}
            <div style={styles.connectorRow}>
              <div style={styles.connectorLineLeft} />
              <div style={styles.connectorVertical} />
              <div style={styles.connectorLineRight} />
            </div>

            {/* Level 1: Left / Right Children */}
            <div style={styles.treeRow}>
              {/* Left Column */}
              <div style={{ ...styles.treeCol, borderRight: '1px dashed #e2e8f0' }}>
                <div style={styles.nodeWrapper}>
                  {renderNode(data.tree.left, data.tree.id, 'LEFT', data.tree.id)}
                </div>
              </div>
              
              {/* Right Column */}
              <div style={styles.treeCol}>
                <div style={styles.nodeWrapper}>
                  {renderNode(data.tree.right, data.tree.id, 'RIGHT', data.tree.id)}
                </div>
              </div>
            </div>

            {/* Connecting lines level 1 to level 2 */}
            <div style={styles.connectorRowDouble}>
              <div style={{ ...styles.connectorRow, width: '50%' }}>
                <div style={styles.connectorLineLeftShort} />
                <div style={styles.connectorVertical} />
                <div style={styles.connectorLineRightShort} />
              </div>
              <div style={{ ...styles.connectorRow, width: '50%' }}>
                <div style={styles.connectorLineLeftShort} />
                <div style={styles.connectorVertical} />
                <div style={styles.connectorLineRightShort} />
              </div>
            </div>

            {/* Level 2: Grandchildren (LL, LR, RL, RR) */}
            <div style={styles.treeRow}>
              {/* LL */}
              <div style={styles.treeColQuarter}>
                <div style={styles.nodeWrapper}>
                  {data.tree.left ? (
                    renderNode(data.tree.left.left, data.tree.left.id, 'LEFT', data.tree.left.id)
                  ) : (
                    <div style={styles.blockedNode}>Blocked</div>
                  )}
                </div>
              </div>
              {/* LR */}
              <div style={{ ...styles.treeColQuarter, borderRight: '1px dashed #e2e8f0' }}>
                <div style={styles.nodeWrapper}>
                  {data.tree.left ? (
                    renderNode(data.tree.left.right, data.tree.left.id, 'RIGHT', data.tree.left.id)
                  ) : (
                    <div style={styles.blockedNode}>Blocked</div>
                  )}
                </div>
              </div>
              {/* RL */}
              <div style={styles.treeColQuarter}>
                <div style={styles.nodeWrapper}>
                  {data.tree.right ? (
                    renderNode(data.tree.right.left, data.tree.right.id, 'LEFT', data.tree.right.id)
                  ) : (
                    <div style={styles.blockedNode}>Blocked</div>
                  )}
                </div>
              </div>
              {/* RR */}
              <div style={styles.treeColQuarter}>
                <div style={styles.nodeWrapper}>
                  {data.tree.right ? (
                    renderNode(data.tree.right.right, data.tree.right.id, 'RIGHT', data.tree.right.id)
                  ) : (
                    <div style={styles.blockedNode}>Blocked</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Legend and help panel */}
      {!loading && data && (
        <div className="card" style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={18} color="#64748b" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>Genealogy Map Tips:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#475569' }}>
            <span>• Hover over any partner's card to reveal their respective left/right count statistics.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#475569' }}>
            <span>• Empty slots render a placement link redirecting to register new members under that direct parent.</span>
          </div>
        </div>
      )}

      {/* Admin Management Modal */}
      {selectedNode && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Manage Member: {selectedNode.fullName}</h3>
              <button 
                onClick={() => setSelectedNode(null)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <p><strong>User ID:</strong> {selectedNode.id}</p>
              <p><strong>Joined:</strong> {new Date(selectedNode.createdAt).toLocaleDateString('en-US')}</p>
              <p><strong>Status:</strong> {selectedNode.status.toUpperCase()}</p>
              <p><strong>Subtree Left Count:</strong> {selectedNode.leftCount}</p>
              <p><strong>Subtree Right Count:</strong> {selectedNode.rightCount}</p>

              {resetSuccess && (
                <div className="alert alert-success" style={{ marginTop: '1rem', padding: '8px', fontSize: '0.8rem' }}>
                  {resetSuccess}
                </div>
              )}
              {resetError && (
                <div className="alert alert-danger" style={{ marginTop: '1rem', padding: '8px', fontSize: '0.8rem' }}>
                  {resetError}
                </div>
              )}

              <form onSubmit={handlePasswordReset} style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <label className="input-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Assign New Password</label>
                <input 
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  required
                  style={{ marginTop: '0.5rem', width: '100%' }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={resetLoading}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  {resetLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TreePage() {
  return (
    <Suspense fallback={<div>Loading Tree Page...</div>}>
      <BinaryTreeVisualizer />
    </Suspense>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
  },
  treeViewport: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '3rem 1.5rem',
    width: '100%',
    overflowX: 'auto',
    boxShadow: 'var(--shadow)',
  },
  treeContainer: {
    minWidth: '780px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  treeRow: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  treeCol: {
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
    padding: '0 1rem',
  },
  treeColQuarter: {
    width: '25%',
    display: 'flex',
    justifyContent: 'center',
    padding: '0 0.5rem',
  },
  rootBox: {
    display: 'flex',
    justifyContent: 'center',
    width: '200px',
  },
  nodeWrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  nodeCard: {
    width: '180px',
    height: '106px',
    backgroundColor: '#ffffff',
    padding: '12px',
    borderRadius: '12px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.15s ease',
    overflow: 'hidden',
  },
  defaultCardContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
  },
  nodeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  nodeAvatar: {
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
    flexShrink: 0,
  },
  nodeMeta: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  nodeName: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#0f172a',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  nodeId: {
    fontSize: '0.6875rem',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  nodeDateRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.6875rem',
    color: '#64748b',
    marginTop: '6px',
  },
  exploreTextLink: {
    fontSize: '0.6875rem',
    color: '#2563eb',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    padding: '2px 4px',
  },
  hoverStats: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  hoverHeader: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '4px',
    marginBottom: '2px',
  },
  hoverRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#475569',
  },
  nodeNavigateBtn: {
    alignSelf: 'flex-start',
    fontSize: '0.6875rem',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
    marginTop: '4px',
  },
  emptyNode: {
    width: '180px',
    height: '106px',
    border: '1.5px dashed #cbd5e1',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    gap: '8px',
  },
  emptyText: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: 500,
  },
  placementBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '0.6875rem',
    fontWeight: 600,
    borderRadius: '6px',
    textDecoration: 'none',
  },
  blockedNode: {
    width: '180px',
    height: '106px',
    borderRadius: '12px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontStyle: 'italic',
  },
  connectorRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: '24px',
    width: '100%',
  },
  connectorRowDouble: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: '24px',
    width: '100%',
  },
  connectorLineLeft: {
    position: 'absolute',
    left: '25%',
    right: '50%',
    height: '1px',
    borderTop: '2px solid #cbd5e1',
  },
  connectorLineRight: {
    position: 'absolute',
    left: '50%',
    right: '25%',
    height: '1px',
    borderTop: '2px solid #cbd5e1',
  },
  connectorLineLeftShort: {
    position: 'absolute',
    left: '25%',
    right: '50%',
    height: '1px',
    borderTop: '2px solid #cbd5e1',
  },
  connectorLineRightShort: {
    position: 'absolute',
    left: '50%',
    right: '25%',
    height: '1px',
    borderTop: '2px solid #cbd5e1',
  },
  connectorVertical: {
    width: '2px',
    height: '24px',
    backgroundColor: '#cbd5e1',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '400px',
    width: '100%',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '1rem',
  },
  modalTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.875rem',
    color: '#475569',
  },
};
