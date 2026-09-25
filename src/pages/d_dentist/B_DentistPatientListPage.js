import { PortalSearch, RoleNotifications } from '../../components/ClinicPortalTools';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Search, User, Eye, FileText, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';

function DentistPatientList() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/patients');
        const data = await response.json();

        if (Array.isArray(data)) {
          const patientData = data.map((patient) => ({
            dbId: patient.id,
            id: `PT-100${patient.id}`,
            name: patient.name,
            age: patient.age || '--',
            lastProcedure: patient.last_procedure || 'None Recorded',
            nextAppt: patient.next_appointment ? new Date(patient.next_appointment).toLocaleDateString() : 'Not Scheduled'
          }));
          setPatients(patientData);
          setFilteredPatients(patientData);
        }
      } catch (err) {
        console.error("Error fetching dentist's patient list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    const results = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastProcedure.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPatients(results);
  }, [searchQuery, patients]);

  // UPDATED: Navigation logic to target G_DentistPatientProfilePage[cite: 9]
  const handleRowClick = (dbId) => {
    navigate(`/dentist/patient-profile/${dbId}`);
  };

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* HEADER - Dentist Profile */}
        <header style={styles.header} className="dashboard-page-header ov-header">
          <div style={styles.headerActions} className="header-actions">
            <div style={styles.searchBox} className="header-search-box">
              <Search size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
              <PortalSearch style={styles.searchInput} />
            </div>

            {/* Mobile Search Toggle */}
            <button 
              className="mobile-search-toggle-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <RoleNotifications />

            <div style={styles.profile} className="header-profile">
              <div style={styles.profileText} className="header-profile-text">
                <p style={styles.userName}>Dr. Smith</p>
                <p style={styles.userRole}>Dentist</p>
              </div>
              <div style={styles.avatar}><User size={20} color="#087F8C" /></div>
            </div>
          </div>
        </header>

        {/* Mobile Collapsible Search & Actions */}
        {isSearchOpen && (
          <div className="mobile-search-collapsible">
            <div style={{ ...styles.searchBox, width: "100%" }}>
              <Search size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
              <PortalSearch style={styles.searchInput} />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div style={styles.content} className="settings-content ov-workspace-content">
          <div style={styles.titleSection}>
            <h1 style={styles.pageTitle}>My Patient List</h1>
            <p style={styles.pageSubtitle}>Review clinical records and procedure history</p>
          </div>

          <div style={styles.tableControls} className="table-controls-row">
            <div style={styles.innerSearch}>
              <Search size={16} color="#999" style={styles.innerSearchIcon} />
              <input
                type="text"
                placeholder="Quick search by name or ID..."
                style={styles.innerSearchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* PATIENT TABLE */}
          <div style={styles.tableContainer} className="patient-table-container ov-panel">
            {loading ? (
              <p style={{ padding: '20px', color: "var(--ov-on-color, #fff)" }}>Loading patients...</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Patient ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Age</th>
                    <th style={styles.th}>Last Procedure</th>
                    <th style={styles.th}>Next Appointment</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                    <tr
                      key={patient.dbId}
                      style={styles.tbodyRow}
                      onClick={() => handleRowClick(patient.dbId)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={styles.td}>{patient.id}</td>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.pAvatar}></div>
                          {patient.name}
                        </div>
                      </td>
                      <td style={styles.td}>{patient.age}</td>
                      <td style={styles.td}>{patient.lastProcedure}</td>
                      <td style={styles.td}>{patient.nextAppt}</td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button title="View History" style={styles.iconBtn}><ClipboardList size={18} /></button>
                          <button title="Diagnostics" style={styles.iconBtn}><FileText size={18} /></button>
                          <button title="Full Profile" style={styles.iconBtn}><Eye size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: "var(--ov-on-color, #fff)" }}>No results found for "{searchQuery}"</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  header: { "--ov-on-color": "var(--ov-ink)", height: '80px', background: "var(--ov-primary)", display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 },
  searchBox: { display: 'flex', alignItems: 'center', background: "var(--ov-on-wash, rgba(255,255,255,0.1))", padding: '10px 20px', borderRadius: '12px', width: '350px' },
  searchInput: { border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%', color: "var(--ov-on-color, #fff)" },
  headerActions: { display: 'flex', alignItems: 'center', gap: '25px' },
  profile: { display: 'flex', alignItems: 'center', gap: '15px', borderLeft: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))", paddingLeft: '20px' },
  profileText: { textAlign: 'right' },
  userName: { margin: 0, fontWeight: 'bold', fontSize: '14px', color: "var(--ov-on-color, #fff)" },
  userRole: { margin: 0, fontSize: '12px', color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },
  avatar: { width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content: { padding: '40px', backgroundColor: '#F3F9FA' },
  titleSection: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#087F8C', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#666', marginTop: '5px' },
  tableControls: { marginBottom: '20px' },
  innerSearch: { position: 'relative', width: '300px' },
  innerSearchIcon: { position: 'absolute', left: '12px', top: '10px' },
  innerSearchInput: { width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' },
  tableContainer: { "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse', color: "var(--ov-on-color, #fff)" },
  th: { textAlign: 'left', padding: '20px', fontSize: '14px', borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.1))", opacity: 0.8 },
  td: { padding: '20px', fontSize: '14px', borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.05))" },
  tbodyRow: { borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.05))", cursor: 'pointer', transition: 'background 0.2s' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  pAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: "var(--ov-on-wash, rgba(255,255,255,0.2))" },
  actionGroup: { display: 'flex', gap: '12px' },
  iconBtn: { "--ov-on-color": "#087F8C", background: 'transparent', border: 'none', color: "var(--ov-on-color, #fff)", cursor: 'pointer', opacity: 0.8 },
};

export default DentistPatientList;