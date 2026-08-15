'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Network, 
  LayoutDashboard, 
  Binary, 
  Users, 
  ShoppingBag, 
  CircleDollarSign, 
  ShieldCheck, 
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  user: {
    username: string;
    email: string;
    role: string;
    isAdmin: boolean;
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Binary Tree', href: '/dashboard/tree', icon: Binary },
    { name: 'Direct Referrals', href: '/dashboard/referrals', icon: Users },
    { name: 'Ledger & Payouts', href: '/dashboard/ledger', icon: CircleDollarSign },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Logo */}
      <div style={styles.brand}>
        <Network size={22} color="#2563eb" style={{ marginRight: '8px' }} />
        <span style={styles.brandName}>NIGHT DREAM Portal</span>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.sectionLabel}>Navigation</div>
        <ul style={styles.navList}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link 
                  href={item.href} 
                  style={{
                    ...styles.navLink,
                    ...(isActive ? styles.navLinkActive : {})
                  }}
                >
                  <span style={styles.linkLeft}>
                    <Icon size={18} style={{ marginRight: '10px' }} />
                    {item.name}
                  </span>
                  {isActive && <ChevronRight size={14} color="#2563eb" />}
                </Link>
              </li>
            );
          })}
        </ul>

        {user && user.email === 'vedantsonawane5012@gmail.com' && user.isAdmin && (
          <>
            <div style={styles.sectionLabel}>Administration</div>
            <ul style={styles.navList}>
              <li>
                <Link 
                  href="/admin" 
                  style={{
                    ...styles.navLink,
                    ...(pathname.startsWith('/admin') ? styles.navLinkActive : {})
                  }}
                >
                  <span style={styles.linkLeft}>
                    <ShieldCheck size={18} color="#4f46e5" style={{ marginRight: '10px' }} />
                    Admin Panel
                  </span>
                  {pathname.startsWith('/admin') && <ChevronRight size={14} color="#4f46e5" />}
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>

      {/* Footer Profile & Logout */}
      <div style={styles.footer}>
        <div style={styles.profileBox}>
          <div style={styles.avatar}>
            {user ? user.username[0].toUpperCase() : 'U'}
          </div>
          <div style={styles.profileText}>
            <div style={styles.username}>{user ? user.username : 'User'}</div>
            <div style={styles.roleBadge}>
              {user ? (user.isAdmin ? 'System Administrator' : 'Independent Distributor') : ''}
            </div>
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} style={{ marginRight: '8px' }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    borderRight: '1px solid var(--border)',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100,
  },
  brand: {
    padding: '1.5rem',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
  },
  brandName: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--foreground)',
    letterSpacing: '-0.02em',
  },
  nav: {
    flex: 1,
    padding: '1.5rem 1rem',
    overflowY: 'auto',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--secondary)',
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
    paddingLeft: '0.5rem',
    marginTop: '1.5rem',
  },
  navList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--secondary)',
    transition: 'all 0.15s ease',
  },
  navLinkActive: {
    backgroundColor: 'var(--background-alt)',
    color: 'var(--primary)',
    fontWeight: 600,
  },
  linkLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  footer: {
    borderTop: '1px solid var(--border)',
    padding: '1.25rem 1rem',
    backgroundColor: 'var(--background-alt)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  profileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.875rem',
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  username: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--foreground)',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  roleBadge: {
    fontSize: '0.6875rem',
    color: 'var(--secondary)',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: 550,
    color: 'var(--danger-text)',
    backgroundColor: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.15s ease',
  },
};
