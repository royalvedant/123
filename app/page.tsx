'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Network, CircleDollarSign } from 'lucide-react';

export default function Home() {
  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoContainer}>
            <Network size={22} color="#2563eb" style={{ marginRight: '8px' }} />
            <span style={styles.logoText}>NIGHT DREAM</span>
          </div>
          <div style={styles.navLinks}>
            <Link href="/login" style={styles.navLink}>Portal Dashboard</Link>
          </div>
          <div style={styles.authButtons}>
            <Link href="/login" style={styles.loginBtn}>Sign In</Link>
            <Link href="/register" style={styles.registerBtn}>Get Started <ArrowRight size={16} /></Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.badgeContainer}>
            <span style={styles.heroBadge}>Platform Launch 2026</span>
          </div>
          <h1 style={styles.heroTitle}>
            The Modern Engine for <br />
            <span style={styles.heroAccent}>Binary MLM Networks</span>
          </h1>
          <p style={styles.heroSubtitle}>
            A secure, real-time customer portal and administration console designed for high-performance networks. Trace volumes, manage downlines, and distribute payouts with complete transparency.
          </p>
          <div style={styles.ctaGroup}>
            <Link href="/register" style={styles.heroPrimaryBtn}>Start Your Network</Link>
            <Link href="/login" style={styles.heroSecondaryBtn}>Enter Dashboard</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Engineered for Growth & Trust</h2>
          <p style={styles.sectionSubtitle}>Everything you need to run, scale, and visualize your MLM organization.</p>
        </div>
        
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.iconWrapper}>
              <Network size={24} color="#2563eb" />
            </div>
            <h3 style={styles.featureName}>Interactive Binary Tree</h3>
            <p style={styles.featureDesc}>
              Visualize your left and right branches in real-time. Double-click to navigate deep downlines and place new members dynamically.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.iconWrapper}>
              <CircleDollarSign size={24} color="#2563eb" />
            </div>
            <h3 style={styles.featureName}>Automated Commissions</h3>
            <p style={styles.featureDesc}>
              Referral bonuses and binary matching commissions are calculated instantly. Point spillover and carryover are managed automatically.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.iconWrapper}>
              <Shield size={24} color="#2563eb" />
            </div>
            <h3 style={styles.featureName}>Bank-Grade Payouts</h3>
            <p style={styles.featureDesc}>
              Request secure balance withdrawals. Admins approve requests and manage ledger sheets in a single click.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Checklist */}
      <section style={styles.trustSection}>
        <div style={styles.trustInner}>
          <div style={styles.trustTextColumn}>
            <h2>A Premium Experience for Your Distributors</h2>
            <p style={{ marginBottom: '24px' }}>
              We build client satisfaction by offering tools that empower members to see their downline progress, ledger records, and referrals.
            </p>
            <div style={styles.checklist}>
              <div style={styles.checkItem}>
                <CheckCircle2 size={18} color="#166534" style={{ marginRight: '8px', flexShrink: 0 }} />
                <span>1-Click Copy Left & Right Referral URLs</span>
              </div>
              <div style={styles.checkItem}>
                <CheckCircle2 size={18} color="#166534" style={{ marginRight: '8px', flexShrink: 0 }} />
                <span>Real-Time Volume (PV) Tracking Up the Tree</span>
              </div>
              <div style={styles.checkItem}>
                <CheckCircle2 size={18} color="#166534" style={{ marginRight: '8px', flexShrink: 0 }} />
                <span>Transparent Matching Audit Ledger logs</span>
              </div>
            </div>
          </div>
          <div style={styles.mockupColumn}>
            <div style={styles.mockupCard}>
              <div style={styles.mockupHeader}>
                <div style={styles.mockupDot} />
                <div style={styles.mockupDot} />
                <div style={styles.mockupDot} />
              </div>
              <div style={styles.mockupBody}>
                <div style={styles.mockupTitleRow}>
                  <span>Left Leg (Points)</span>
                  <strong>1,400 PV</strong>
                </div>
                <div style={styles.mockupProgressBg}>
                  <div style={{ ...styles.mockupProgressFill, width: '70%' }} />
                </div>
                <div style={{ ...styles.mockupTitleRow, marginTop: '16px' }}>
                  <span>Right Leg (Points)</span>
                  <strong>900 PV</strong>
                </div>
                <div style={styles.mockupProgressBg}>
                  <div style={{ ...styles.mockupProgressFill, width: '45%' }} />
                </div>
                <div style={styles.mockupStatus}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Account Status:</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontWeight: 'bold' }}>ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <span>© 2026 NIGHT DREAM. All rights reserved. Secure Binary Network Engine.</span>
          <div style={styles.footerLinks}>
            <Link href="/login" style={styles.footerLink}>User Portal</Link>
            <Link href="/register" style={styles.footerLink}>Registration</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 10,
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.25rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  navLink: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#64748b',
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  loginBtn: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#0f172a',
    padding: '0.5rem 1rem',
  },
  registerBtn: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#ffffff',
    backgroundColor: '#0f172a',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'background-color 0.15s ease',
  },
  heroSection: {
    padding: '6rem 2rem 4rem 2rem',
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: '1.5rem',
  },
  heroBadge: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.03em',
    color: '#0f172a',
    marginBottom: '1.5rem',
  },
  heroAccent: {
    color: '#2563eb',
  },
  heroSubtitle: {
    fontSize: '1.125rem',
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  ctaGroup: {
    display: 'flex',
    gap: '1rem',
  },
  heroPrimaryBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: 550,
    fontSize: '0.9375rem',
    transition: 'background-color 0.15s ease',
  },
  heroSecondaryBtn: {
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: 550,
    fontSize: '0.9375rem',
    transition: 'background-color 0.15s ease',
  },
  featuresSection: {
    padding: '5rem 2rem',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto 3.5rem auto',
  },
  sectionTitle: {
    fontSize: '2rem',
    color: '#0f172a',
    marginBottom: '0.5rem',
  },
  sectionSubtitle: {
    color: '#64748b',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    maxWidth: '1200px',
    margin: '0 auto',
    gap: '2rem',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '2.25rem 2rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  featureName: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '0.75rem',
  },
  featureDesc: {
    color: '#64748b',
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  trustSection: {
    padding: '6rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  trustInner: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    alignItems: 'center',
  },
  trustTextColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.9375rem',
    color: '#0f172a',
    fontWeight: 500,
  },
  mockupColumn: {
    display: 'flex',
    justifyContent: 'center',
  },
  mockupCard: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  mockupHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    padding: '12px 16px',
    display: 'flex',
    gap: '6px',
  },
  mockupDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#cbd5e1',
  },
  mockupBody: {
    padding: '24px',
  },
  mockupTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#0f172a',
    marginBottom: '6px',
  },
  mockupProgressBg: {
    width: '100%',
    height: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  mockupProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: '3px',
  },
  mockupStatus: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
  footer: {
    borderTop: '1px solid #e2e8f0',
    padding: '2rem',
    backgroundColor: '#ffffff',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8125rem',
    color: '#64748b',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  footerLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  footerLink: {
    color: '#64748b',
  },
};
