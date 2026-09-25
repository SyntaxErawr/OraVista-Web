import { PortalSearch, RoleNotifications } from '../../components/ClinicPortalTools';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import {
  Search, User, Mail, Phone, MapPin,
  Calendar, Edit, Download, FileText, X, ExternalLink, Clock,
  ChevronDown, ChevronUp
} from 'lucide-react';
import AIDiagnosticModal from '../../components/AIDiagnosticModal';
import { exportPatientPDF } from '../../utils/exportPDF';

function DentistPatientProfile() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeRecordForModal, setActiveRecordForModal] = useState(null);
  const [formData, setFormData] = useState({
    blood_type: '',
    allergies: '',
    insurance: '',
    policy_number: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchPatientDetails = useCallback(async () => {
    try {
      setLoading(true);
      const dbId = id.replace('PT-100', '');

      const response = await fetch(`https://oravista-server-474976105474.asia-southeast1.run.app/api/patients`);
      const allPatients = await response.json();
      const currentPatient = allPatients.find(p => p.id.toString() === dbId);

      if (currentPatient) {
        setPatient(currentPatient);
        setFormData({
          blood_type: currentPatient.blood_type || 'O+',
          allergies: currentPatient.allergies || 'None',
          insurance: currentPatient.insurance || 'None',
          policy_number: currentPatient.policy_number || 'N/A'
        });

        const historyRes = await fetch(`https://oravista-server-474976105474.asia-southeast1.run.app/api/user-appointments/${dbId}`);
        const historyData = await historyRes.json();
        setHistory(historyData);

        console.log(`Fetching records for patient ID: ${dbId}`);
        const recordsRes = await fetch(`https://oravista-server-474976105474.asia-southeast1.run.app/api/patient-records/${dbId}`);
        if (recordsRes.ok) {
          const recordsData = await recordsRes.json();
          setRecords(recordsData);
          console.log("Fetched patient records:", recordsData);
        }
      }
    } catch (err) {
      console.error("Error fetching patient profile:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatientDetails();
  }, [fetchPatientDetails]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportPatientPDF(patient, formData, history, records);
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Failed to export patient clinical report.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const dbId = id.replace('PT-100', '');
      const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: dbId,
          firstName: patient.name.split(' ')[0],
          lastName: patient.name.split(' ')[1] || '',
          email: patient.email || ''
        }),
      });
      if (response.ok) {
        setShowEditModal(false);
        fetchPatientDetails();
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (loading) return <AdminLayout><div style={styles.loading}>Loading Profile...</div></AdminLayout>;
  if (!patient) return <AdminLayout><div style={styles.loading}>Patient not found.</div></AdminLayout>;

  const earliestRecord = records[0];
  const hasClinicalNotes = earliestRecord && earliestRecord.clinical_notes && earliestRecord.clinical_notes.trim() !== "";

  return (
    <AdminLayout>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── DESKTOP HEADER ── */
        .dentist-header-bar {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          height: 70px !important;
          padding: 0 32px !important;
        }
        .dentist-actions-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: 20px;
        }
        .dentist-search-toggle { display: none; }
        .dentist-desktop-search {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.1);
          padding: 8px 16px;
          border-radius: 10px;
          width: 260px;
        }
        .dentist-mobile-search-row { display: none; }

        /* ── MOBILE OVERRIDES ── */
        @media (max-width: 768px) {
          .dentist-header-bar {
            flex-direction: column !important;
            height: auto !important;
            padding: 10px 16px !important;
            gap: 0 !important;
            align-items: stretch !important;
          }
          .dentist-actions-row {
            justify-content: flex-end;
            gap: 14px;
          }
          .dentist-desktop-search { display: none !important; }
          .dentist-search-toggle {
            display: flex !important;
            align-items: center;
            gap: 4px;
            background: rgba(255,255,255,0.1);
            border: none;
            border-radius: 8px;
            padding: 7px 10px;
            cursor: pointer;
          }
          .dentist-mobile-search-row {
            display: block;
            width: 100%;
            overflow: hidden;
            max-height: 0;
            opacity: 0;
            transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
            margin-bottom: 0;
          }
          .dentist-mobile-search-row.expanded {
            max-height: 60px;
            opacity: 1;
            margin-bottom: 8px;
          }
          .dentist-mobile-search-inner {
            display: flex;
            align-items: center;
            background: rgba(255,255,255,0.1);
            padding: 8px 14px;
            border-radius: 10px;
            width: 100%;
          }
          .dentist-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
          .dentist-medical-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .dentist-content-pad {
            padding: 16px !important;
            width: 100% !important;
            overflow-x: hidden !important;
          }
          .dentist-top-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .dentist-table-wrap { overflow-x: auto; width: 100%; }
          .dentist-modal-content { width: 90vw !important; padding: 24px 16px !important; }
          .dentist-form-grid { grid-template-columns: 1fr !important; }
          .dentist-dashboard-grid > div,
          .dentist-dashboard-grid > div > div {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }
          .dentist-content-pad > * { max-width: 100% !important; }
        }
      `}</style>

      <div style={styles.container}>

        {/* ── HEADER ── */}
        <header style={styles.header} className="dentist-header-bar ov-header">
          {/* Desktop search */}
          <div className="dentist-desktop-search">
            <Search size={16} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
            <PortalSearch style={styles.searchInput} />
          </div>

          {/* Right side actions */}
          <div className="dentist-actions-row">
            {/* Mobile search toggle */}
            <button
              className="dentist-search-toggle"
              onClick={() => setSearchExpanded(v => !v)}
              aria-label="Toggle search"
            >
              <Search size={17} color="var(--ov-on-color, #fff)" />
              {searchExpanded ? <ChevronUp size={14} color="var(--ov-on-color, #fff)" /> : <ChevronDown size={14} color="var(--ov-on-color, #fff)" />}
            </button>

            <RoleNotifications />

            <div style={styles.profileHeader}>
              <div style={styles.profileText}>
                <p style={styles.userName}>Dr. {patient.dentist_name || 'Dentist'}</p>
                <p style={styles.userRole}>Dentist</p>
              </div>
              <div style={styles.avatar}><User size={18} color="#087F8C" /></div>
            </div>
          </div>

          {/* Mobile collapsible search */}
          {isMobile && (
            <div className={`dentist-mobile-search-row${searchExpanded ? ' expanded' : ''}`}>
              <div className="dentist-mobile-search-inner">
                <Search size={16} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
                <PortalSearch style={styles.searchInput} />
              </div>
            </div>
          )}
        </header>

        {/* ── MAIN CONTENT ── */}
        <div style={styles.content} className="dentist-content-pad ov-workspace-content">
          <div style={styles.topRow} className="dentist-top-row">
            <div>
              <h1 style={styles.pageTitle}>Patient Profile</h1>
              <p style={styles.pageSubtitle}>Clinical review of patient information and history</p>
            </div>
            <button style={styles.editProfileBtn} onClick={() => setShowEditModal(true)}>
              <Edit size={14} style={{ marginRight: '7px' }} /> Edit Clinical Info
            </button>
          </div>

          <div style={styles.dashboardGrid} className="dentist-dashboard-grid">

            {/* LEFT COLUMN */}
            <div style={styles.leftCol}>
              <div className="ov-panel" style={styles.mainCard}>
                <div style={styles.profileSection}>
                  <div style={styles.largeAvatar}><User size={44} color="#087F8C" /></div>
                  <h2 style={styles.patientNameDisplay}>{patient.name}</h2>
                  <p style={styles.patientIdDisplay}>Patient ID: {id}</p>
                </div>
                <div style={styles.infoList}>
                  <div style={styles.infoItem}><Mail size={14} /> {patient.email || 'No email provided'}</div>
                  <div style={styles.infoItem}><Phone size={14} /> {patient.contact || 'No phone provided'}</div>
                  <div style={styles.infoItem}><MapPin size={14} /> STI Sta. Mesa, Manila</div>
                  <div style={styles.infoItem}><Calendar size={14} /> Age: {patient.age}</div>
                </div>
              </div>

              <div className="ov-panel" style={styles.mainCard}>
                <h3 style={styles.cardTitle}>Medical Information</h3>
                <div style={styles.medicalGrid} className="dentist-medical-grid">
                  <div><p style={styles.medLabel}>Blood Type</p><p style={styles.medValue}>{formData.blood_type}</p></div>
                  <div><p style={styles.medLabel}>Allergies</p><p style={styles.medValue}>{formData.allergies}</p></div>
                  <div><p style={styles.medLabel}>Insurance</p><p style={styles.medValue}>{formData.insurance}</p></div>
                  <div><p style={styles.medLabel}>Policy #</p><p style={styles.medValue}>{formData.policy_number}</p></div>
                </div>
              </div>

              <div className="ov-panel" style={{ ...styles.mainCard, background: '#064E58' }}>
                <h3 style={styles.cardTitle}>Quick Stats</h3>
                <div style={styles.statsRow}>
                  <span style={{ fontSize: '13px' }}>Total Visits</span>
                  <span style={styles.statNumber}>{history.length}</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={styles.rightCol}>

              {/* Visit History */}
              <div style={styles.whiteCard}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitleBlack}>Visit History</h3>
                  <button style={styles.exportBtn} onClick={handleExportPDF} disabled={isExporting}>
                    <Download size={13} /> {isExporting ? 'Exporting...' : 'Export'}
                  </button>
                </div>
                <div className="dentist-table-wrap">
                  <table style={styles.dataTable}>
                    <thead>
                      <tr>
                        <th style={styles.thBlack}>Date</th>
                        <th style={styles.thBlack}>Service</th>
                        <th style={styles.thBlack}>Dentist</th>
                        <th style={styles.thBlack}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((visit, idx) => (
                        <tr key={idx} style={styles.trBlack}>
                          <td style={styles.tdPadding}>{new Date(visit.appointment_date).toLocaleDateString()}</td>
                          <td style={styles.tdPadding}>{visit.service_type}</td>
                          <td style={styles.tdPadding}>{visit.dentist_name}</td>
                          <td style={styles.tdPadding}><span style={{ ...styles.statusBadge, ...(visit.status === "Completed" ? { backgroundColor: "var(--ov-completed, #2864c5)", color: "#fff" } : {}) }}>{visit.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Patient Documents — scrollable tbody */}
              <div style={styles.whiteCard}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitleBlack}>Patient Documents (X-Rays/Records)</h3>
                </div>
                {records.length > 0 ? (
                  <div style={styles.scrollTableWrap}>
                    <table style={{ ...styles.dataTable, tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th style={{ ...styles.thBlack, width: '50%' }}>File Name</th>
                          <th style={{ ...styles.thBlack, width: '30%' }}>Upload Date</th>
                          <th style={{ ...styles.thBlack, width: '20%' }}>Action</th>
                        </tr>
                      </thead>
                    </table>
                    <div style={styles.scrollableBody}>
                      <table style={{ ...styles.dataTable, tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: '50%' }} />
                          <col style={{ width: '30%' }} />
                          <col style={{ width: '20%' }} />
                        </colgroup>
                        <tbody>
                          {records.map((rec, idx) => (
                            <tr key={rec.file_path || idx} style={styles.trBlack}>
                              <td style={{ ...styles.tdPadding, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                <FileText size={14} color="#087F8C" style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.file_name}</span>
                              </td>
                              <td style={styles.tdPadding}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}>
                                  <Clock size={13} />
                                  {new Date(rec.upload_date).toLocaleDateString()}
                                </div>
                              </td>
                              <td style={styles.tdPadding}>
                                <button
                                  onClick={() => setActiveRecordForModal(rec)}
                                  style={{
                                    background: 'none', border: 'none', color: '#087F8C',
                                    fontWeight: '700', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: 0, fontFamily: 'inherit', fontSize: 'inherit'
                                  }}
                                >
                                  View <ExternalLink size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#999', fontSize: '13px', padding: '10px 0' }}>No clinical documents uploaded by patient.</p>
                )}
              </div>

              {/* Treatment Notes */}
              <div className="ov-panel" style={styles.notesCard}>
                <h3 style={styles.cardTitle}>Treatment Notes</h3>
                {hasClinicalNotes ? (
                  <div style={styles.noteItem}>
                    <p style={styles.noteContent}>{earliestRecord.clinical_notes}</p>
                  </div>
                ) : (
                  <p style={{ opacity: 0.6, fontSize: '13px' }}>No treatment notes available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* EDIT MODAL */}
        {showEditModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent} className="dentist-modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ color: '#087F8C', margin: 0, fontSize: '18px' }}>Update Clinical Profile</h2>
                <X onClick={() => setShowEditModal(false)} style={{ cursor: 'pointer' }} size={20} />
              </div>
              <form onSubmit={handleUpdateSubmit}>
                <div style={styles.formGrid} className="dentist-form-grid">
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Blood Type</label>
                    <input type="text" value={formData.blood_type} onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })} style={styles.modalInput} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Allergies</label>
                    <input type="text" value={formData.allergies} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })} style={styles.modalInput} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Insurance</label>
                    <input type="text" value={formData.insurance} onChange={(e) => setFormData({ ...formData, insurance: e.target.value })} style={styles.modalInput} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Policy Number</label>
                    <input type="text" value={formData.policy_number} onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })} style={styles.modalInput} />
                  </div>
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={styles.cancelBtn}>Cancel</button>
                  <button type="submit" style={styles.saveBtn}>Save Clinical Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <AIDiagnosticModal
          isOpen={!!activeRecordForModal}
          onClose={() => setActiveRecordForModal(null)}
          record={activeRecordForModal}
        />
      </div>
    </AdminLayout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', backgroundColor: '#f4f6f9' },
  header: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", position: 'sticky', top: 0, zIndex: 10 },
  searchInput: { border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%', color: "var(--ov-on-color, #fff)", fontSize: '13px' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '12px', borderLeft: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))", paddingLeft: '16px' },
  profileText: { textAlign: 'right' },
  userName: { margin: 0, fontWeight: 'bold', fontSize: '13px', color: "var(--ov-on-color, #fff)" },
  userRole: { margin: 0, fontSize: '11px', color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },
  avatar: { width: '36px', height: '36px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  loading: { color: '#087F8C', padding: '40px', fontWeight: 'bold' },

  content: { padding: '28px 32px', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: '800', color: '#087F8C', margin: 0 },
  pageSubtitle: { fontSize: '12px', color: '#666', marginTop: '3px' },
  editProfileBtn: { "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '13px' },

  dashboardGrid: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', width: '100%', minWidth: 0 },
  leftCol: { minWidth: 0 },
  mainCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '20px', padding: '24px', color: "var(--ov-on-color, #fff)", marginBottom: '24px', boxShadow: '0 8px 24px rgba(8, 127, 140,0.1)' },
  profileSection: { textAlign: 'center', marginBottom: '24px' },
  largeAvatar: { width: '88px', height: '88px', backgroundColor: 'white', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  patientNameDisplay: { fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' },
  patientIdDisplay: { fontSize: '12px', opacity: 0.7 },
  infoList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', opacity: 0.9 },

  cardTitle: { fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0' },
  cardTitleBlack: { fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0', color: '#087F8C' },
  medicalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  medLabel: { fontSize: '10px', opacity: 0.6, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  medValue: { fontSize: '13px', fontWeight: '600', margin: 0 },
  statsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statNumber: { fontSize: '26px', fontWeight: '800' },

  rightCol: { display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 },
  whiteCard: { background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  exportBtn: { background: 'none', border: '1px solid #ddd', padding: '6px 13px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#666' },
  dataTable: { width: '100%', borderCollapse: 'collapse' },
  thBlack: { textAlign: 'left', padding: '11px 13px', borderBottom: '2px solid #EEF7F8', color: '#087F8C', fontSize: '12px', fontWeight: '700' },
  trBlack: { borderBottom: '1px solid #EEF7F8', fontSize: '12px', color: '#444' },
  tdPadding: { padding: '11px 13px' },
  statusBadge: { backgroundColor: '#e6fffa', color: '#047857', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '10px' },

  scrollTableWrap: { width: '100%' },
  scrollableBody: { maxHeight: '220px', overflowY: 'auto', overflowX: 'hidden' },

  notesCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '20px', padding: '24px', color: "var(--ov-on-color, #fff)" },
  noteItem: { background: "var(--ov-on-wash, rgba(255,255,255,0.05))", borderRadius: '12px', padding: '16px', marginBottom: '16px' },
  noteContent: { fontSize: '13px', opacity: 0.8, margin: 0 },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { background: 'white', padding: '36px', borderRadius: '20px', width: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#666' },
  modalInput: { padding: '11px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' },
  modalActions: { display: 'flex', gap: '12px' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontWeight: '700', cursor: 'pointer', background: 'white', fontSize: '13px' },
  saveBtn: { "--ov-on-color": "var(--ov-ink)", flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
};

export default DentistPatientProfile;