import { PortalSearch, RoleNotifications } from '../../components/ClinicPortalTools';
import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, User, ZoomIn, RotateCw, Copy } from 'lucide-react';

function AdminDiagnostics() {
  const diagnosticInsights = [
    { title: 'Possible cavity detection on lower right molar', confidence: 'High' },
    { title: 'Gum disease risk level - Moderate', confidence: 'Medium' },
    { title: 'Tooth structure anomaly detected on upper left incisor', confidence: 'High' },
    { title: 'Minor bone density irregularity', confidence: 'Low' },
  ];

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* HEADER */}
        <header className="ov-header" style={styles.header}>
          <div style={styles.searchBox}>
            <Search size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
            <PortalSearch style={styles.searchInput} />
          </div>
          <div style={styles.headerActions}>
            <RoleNotifications />

            <div style={styles.profile}>
              <div style={styles.profileText}>
                <p style={styles.userName}>Admin User</p>
                <p style={styles.userRole}>Administrator</p>
              </div>
              <div style={styles.avatar}><User size={20} color="#087F8C" /></div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="ov-workspace-content" style={styles.content}>
          <div style={styles.titleSection}>
            <h1 style={styles.pageTitle}>Diagnostics</h1>
            <p style={styles.pageSubtitle}>AI-Assisted Imaging & Clinical Insights</p>
          </div>

          {/* PATIENT SELECTION DROPDOWN */}
          <div className="ov-panel" style={styles.selectionCard}>
            <p style={styles.label}>Select Patient</p>
            <select style={styles.select}>
              <option>John Smith (P-001)</option>
              <option>Jane Doe (P-002)</option>
            </select>
          </div>

          {/* PATIENT INFO BAR */}
          <div className="ov-panel" style={styles.infoBar}>
            <div style={styles.infoItem}><p style={styles.infoLabel}>Patient Name</p><p style={styles.infoVal}>John Smith</p></div>
            <div style={styles.infoItem}><p style={styles.infoLabel}>Patient ID</p><p style={styles.infoVal}>P-001</p></div>
            <div style={styles.infoItem}><p style={styles.infoLabel}>Dentist Assigned</p><p style={styles.infoVal}>Dr. Sarah Johnson</p></div>
            <div style={styles.infoItem}><p style={styles.infoLabel}>Scan Date</p><p style={styles.infoVal}>2026-02-01</p></div>
          </div>

          {/* MAIN DIAGNOSTIC GRID */}
          <div style={styles.mainGrid}>

            {/* LEFT: X-RAY VIEWER */}
            <div className="ov-panel" style={styles.viewerCard}>
              <div style={styles.viewerHeader}>
                <p style={styles.sectionTitle}>Dental X-ray Image</p>
                <div style={styles.viewerActions}>
                  <button style={styles.vBtn}><ZoomIn size={14} /> Zoom</button>
                  <button style={styles.vBtn}><RotateCw size={14} /> Rotate</button>
                  <button style={styles.vBtn}><Copy size={14} /> Compare</button>
                </div>
              </div>
              <div style={styles.xrayPlaceholder}>
                <div style={styles.xrayCircle}></div>
                <p style={styles.xrayText}>X-Ray Image Placeholder</p>
                <p style={styles.xraySubText}>Panoramic View - Full Mouth</p>
              </div>
            </div>

            {/* RIGHT: AI INSIGHTS & NOTES */}
            <div style={styles.sidePanel}>
              <div className="ov-panel" style={styles.insightsCard}>
                <p style={styles.sectionTitle}>AI-Assisted Diagnostic Insights</p>
                {diagnosticInsights.map((insight, idx) => (
                  <div key={idx} style={styles.insightRow}>
                    <p style={styles.insightTitle}>{insight.title}</p>
                    <p style={styles.insightConf}>Confidence: <span style={{fontWeight: '700'}}>{insight.confidence}</span></p>
                  </div>
                ))}
              </div>

              <div className="ov-panel" style={styles.notesCard}>
                <p style={styles.sectionTitle}>Add New Note</p>
                <textarea 
                  placeholder="Enter diagnosis notes and treatment recommendations..." 
                  style={styles.textarea}
                ></textarea>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  header: { "--ov-on-color": "var(--ov-ink)", height: '80px', background: "var(--ov-primary)", display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 },
  searchBox: { display: 'flex', alignItems: 'center', background: "var(--ov-on-wash, rgba(255,255,255,0.1))", padding: '10px 20px', borderRadius: '12px', width: '350px' },
  searchInput: { border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%', color: "var(--ov-on-color, #fff)" },
  headerActions: { display: 'flex', alignItems: 'center', gap: '25px' },
  profile: { display: 'flex', alignItems: 'center', gap: '15px', borderLeft: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))", paddingLeft: '20px' },
  profileText: { textAlign: 'right' },
  userName: { margin: 0, fontWeight: 'bold', fontSize: '14px', color: "var(--ov-on-color, #fff)" },
  userRole: { margin: 0, fontSize: '12px', color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },
  avatar: { width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  content: { padding: '40px' },
  titleSection: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#087F8C', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#666', marginTop: '5px' },

  selectionCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", padding: '20px', borderRadius: '15px', marginBottom: '20px', color: "var(--ov-on-color, #fff)" },
  label: { fontSize: '12px', fontWeight: '700', marginBottom: '10px' },
  select: { width: '100%', padding: '12px', borderRadius: '10px', border: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))", background: "var(--ov-on-wash, rgba(255,255,255,0.1))", color: "var(--ov-on-color, #fff)", outline: 'none' },

  infoBar: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", padding: '20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: "var(--ov-on-color, #fff)" },
  infoLabel: { fontSize: '11px', opacity: 0.6, marginBottom: '4px' },
  infoVal: { fontSize: '13px', fontWeight: '600' },

  mainGrid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' },
  viewerCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '15px', padding: '25px', color: "var(--ov-on-color, #fff)" },
  viewerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', margin: 0 },
  viewerActions: { display: 'flex', gap: '10px' },
  vBtn: { background: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#087F8C', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },

  xrayPlaceholder: { height: '400px', background: "var(--ov-on-wash, rgba(255,255,255,0.05))", borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: "1px dashed var(--ov-on-line, rgba(255,255,255,0.2))" },
  xrayCircle: { width: '80px', height: '80px', background: "var(--ov-on-wash, rgba(255,255,255,0.1))", borderRadius: '50%', marginBottom: '15px' },
  xrayText: { margin: 0, fontWeight: '600', fontSize: '14px' },
  xraySubText: { margin: 0, fontSize: '11px', opacity: 0.5 },

  sidePanel: { display: 'flex', flexDirection: 'column', gap: '20px' },
  insightsCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '15px', padding: '25px', color: "var(--ov-on-color, #fff)" },
  insightRow: { background: "var(--ov-on-wash, rgba(255,255,255,0.05))", padding: '15px', borderRadius: '10px', marginBottom: '10px' },
  insightTitle: { margin: 0, fontSize: '13px', fontWeight: '500', marginBottom: '5px' },
  insightConf: { margin: 0, fontSize: '11px', opacity: 0.7 },

  notesCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '15px', padding: '25px', color: "var(--ov-on-color, #fff)" },
  textarea: { width: '100%', height: '100px', background: "var(--ov-on-wash, rgba(255,255,255,0.05))", border: "1px solid var(--ov-on-line, rgba(255,255,255,0.1))", borderRadius: '10px', padding: '15px', color: "var(--ov-on-color, #fff)", resize: 'none', marginTop: '10px', outline: 'none' }
};

export default AdminDiagnostics;