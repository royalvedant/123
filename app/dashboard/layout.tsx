import Sidebar from '@/components/Sidebar';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch current user's status to restrict access if pending
  const userRes = await db.execute({
    sql: 'SELECT status, fullName, sponsorId FROM Users WHERE id = ?',
    args: [session.userId]
  });
  const user = userRes.rows[0] as any;

  if (user && user.status === 'pending') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#080C0A',
        color: '#ffffff',
        padding: '2rem',
        textAlign: 'center',
        width: '100vw',
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          padding: '2.5rem',
          borderRadius: '24px',
          backgroundColor: '#111815',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 10px 40px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1.5rem auto',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem'
          }}>
            ⏳
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            Pending Admin Approval
          </span>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#ffffff',
            marginTop: '1.5rem',
            lineHeight: 1.3
          }}>
            YOUR ID IS UNDER ACTIVATION PLEASE TRY LATER
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#94a3b8',
            marginTop: '0.75rem',
            lineHeight: 1.5
          }}>
            Your registration has been received. Once the admin verifies your payment and activates your ID, your full dual-team dashboard and tree will be unlocked.
          </p>

          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'left',
            fontSize: '0.8125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <p style={{ margin: 0, color: '#94a3b8' }}>User ID: <span style={{ color: '#ffffff', fontWeight: 600, fontFamily: 'monospace' }}>{session.userId}</span></p>
            <p style={{ margin: 0, color: '#94a3b8' }}>Name: <span style={{ color: '#ffffff', fontWeight: 600 }}>{user.fullName}</span></p>
            <p style={{ margin: 0, color: '#94a3b8' }}>Sponsor ID: <span style={{ color: '#34d399', fontWeight: 600, fontFamily: 'monospace' }}>{user.sponsorId || 'Direct'}</span></p>
          </div>

          <a
            href="/dashboard"
            style={{
              display: 'block',
              marginTop: '1.5rem',
              padding: '0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#fbbf24',
              color: '#080C0A',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textDecoration: 'none',
              transition: 'background-color 0.15s ease'
            }}
          >
            Check Status Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Sidebar user={session} />
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width)', 
        padding: '2.5rem 3rem',
        backgroundColor: '#ffffff',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  );
}
