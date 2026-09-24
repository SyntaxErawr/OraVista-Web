import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, Bell, MessageSquare, User, Eye, Edit, Plus, ChevronDown, ChevronUp } from 'lucide-react';

function StaffDentistList() {
  // UPDATED: Added state management to mirror Admin functionality
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dentists, setDentists] = useState([]);
  const [filteredDentists, setFilteredDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [summary, setSummary] = useState({ total: 0, available: 0, busy: 0, offDuty: 0 });

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/dentists');
        const data = await response.json();

        if (Array.isArray(data)) {
          const formattedDentists = data.map(d => ({
            id: `DT-10${d.id}`,
            name: `Dr. ${d.first_name} ${d.last_name}`,
            specialty: d.specialty || 'General Dentistry',
            patients: `${d.patient_count || 0} assigned`,
            status: d.status || 'Available'
          }));

          setDentists(formattedDentists);
          setFilteredDentists(formattedDentists);

          // Calculate summary stats dynamically mirrored from Admin logic
          setSummary({
            total: formattedDentists.length,
            available: formattedDentists.filter(d => d.status === 'Available').length,
            busy: formattedDentists.filter(d => d.status === 'Busy').length,
            offDuty: formattedDentists.filter(d => d.status === 'Off Duty').length,
          });
        }
      } catch (err) {
        console.error("Error fetching dentists:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDentists();
  }, []);

  // UPDATED: Mirrored Search Filter Logic
  useEffect(() => {
    const results = dentists.filter(dentist =>
      dentist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dentist.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dentist.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDentists(results);
  }, [searchQuery, dentists]);

  // Helper function for status badge styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Available': return { backgroundColor: '#10b981', color: "var(--ov-on-color, #fff)" };
      case 'Busy': return { backgroundColor: '#f59e0b', color: "var(--ov-on-color, #fff)" };
      case 'Off Duty': return { backgroundColor: '#6b7280', color: "var(--ov-on-color, #fff)" };
      default: return { backgroundColor: '#eee', color: '#333' };
    }
  };

  return (
    <AdminLayout>
      <style>
        {`
          /* Mobile Toggle Defaults */
          .mobile-search-toggle-btn {
            display: none;
            background: none;
            border: none;
            color: var(--ov-on-color, #fff);
            cursor: pointer;
            padding: 5px;
          }
          
          .mobile-search-collapsible {
            display: none;
          }

          /* General Resets for table wrapper */
          .table-container-scrollable {
            overflow-x: auto;
            overflow-y: auto;
            max-height: 60vh; /* Vertical scroll for long lists */
          }
          
          .dentist-table {
            width: 100%;
            min-width: 800px; /* Forces horizontal scrolling on small screens instead of breaking layout */
          }

          /* Custom Scrollbar for the table container */
          .table-container-scrollable::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .table-container-scrollable::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
          }
          .table-container-scrollable::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
          }
          .table-container-scrollable::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
          }

          /* Responsive Breakpoints */
          @media (max-width: 1024px) {
            .summary-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 768px) {
            .dashboard-page-header {
              padding: 10px 20px !important;
            }
            .header-search-box {
              display: none !important;
            }
            .mobile-search-toggle-btn {
              display: block;
            }
            .mobile-search-collapsible {
              display: block;
              padding: 15px 20px;
              background-color: #087F8C;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .header-profile-text {
              display: none !important;
            }
            .settings-content {
              padding: 20px !important;
            }
            .table-controls-row {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 15px;
            }
            .inner-search-container {
              width: 100% !important;
            }
            .add-dentist-btn {
              width: 100% !important;
              justify-content: center;
            }
            .header-actions {
              gap: 15px !important;
            }
            .table-container-scrollable {
              max-height: 50vh; /* Adjust height for mobile */
            }
          }

          @media (max-width: 480px) {
            .summary-grid {
              grid-template-columns: 1fr !important;
            }
            .page-title {
              font-size: 24px !important;
            }
          }
        `}
      </style>

      <div style={styles.container}>
        {/* TOP NAV HEADER - Staff Profile */}
        <header style={styles.header} className="dashboard-page-header ov-header">
          <div style={styles.searchBox} className="header-search-box">
            <ChevronDown size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
            <input
              type="text"
              placeholder="Search header..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={styles.headerActions} className="header-actions">
            {/* Mobile Search Toggle */}
            <button 
              className="mobile-search-toggle-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            <Bell size={20} color="var(--ov-on-color, #fff)" style={{ cursor: 'pointer' }} />
            <MessageSquare size={20} color="var(--ov-on-color, #fff)" style={{ cursor: 'pointer' }} />
            <div style={styles.profile} className="header-profile">
              <div style={styles.profileText} className="header-profile-text">
                <p style={styles.userName}>Staff User</p>
                <p style={styles.userRole}>Receptionist</p>
              </div>
              <div style={styles.avatar}><User size={20} color="#087F8C" /></div>
            </div>
          </div>
        </header>

        {/* Mobile Collapsible Search Drawer */}
        {isSearchOpen && (
          <div className="mobile-search-collapsible">
            <div style={{ ...styles.searchBox, width: "100%", boxSizing: 'border-box' }}>
              <Search size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
              <input
                type="text"
                placeholder="Search dentists..."
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <div style={styles.content} className="settings-content ov-workspace-content">
          <div style={styles.titleSection}>
            <h1 style={styles.pageTitle} className="page-title">Dentist List</h1>
            <p style={styles.pageSubtitle}>View and manage dental staff information</p>
          </div>

          <div style={styles.tableControls} className="table-controls-row">
            <div style={styles.innerSearch} className="inner-search-container">
              <Search size={16} color="#999" style={styles.innerSearchIcon} />
              <input
                type="text"
                placeholder="Search by name, specialty, or ID..."
                style={styles.innerSearchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button style={styles.addButton} className="add-dentist-btn">
              <Plus size={18} style={{ marginRight: '8px' }} />
              Add New Dentist
            </button>
          </div>

          {/* DENTIST TABLE - Navy Blue Theme mirrored from Admin */}
          <div style={styles.tableContainer} className="table-container-scrollable ov-panel">
            {loading ? (
              <p style={{ padding: '20px', color: "var(--ov-on-color, #fff)", textAlign: 'center' }}>Loading dentists...</p>
            ) : (
              <table style={styles.table} className="dentist-table">
                <thead>
                  <tr style={styles.theadRow}>
                    <th style={styles.th}>Dentist ID</th>
                    <th style={styles.th}>Dentist Name</th>
                    <th style={styles.th}>Specialty</th>
                    <th style={styles.th}>Patients</th>
                    <th style={styles.th}>Availability Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDentists.length > 0 ? filteredDentists.map((dentist) => (
                    <tr key={dentist.id} style={styles.tbodyRow}>
                      <td style={styles.td}>{dentist.id}</td>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.nameAvatar}><User size={16} color="#087F8C" style={{ margin: '8px' }} /></div>
                          {dentist.name}
                        </div>
                      </td>
                      <td style={styles.td}>{dentist.specialty}</td>
                      <td style={styles.td}>{dentist.patients}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, ...getStatusStyle(dentist.status) }}>
                          {dentist.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <Eye size={18} style={styles.iconBtn} />
                          <Edit size={18} style={styles.iconBtn} />
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                        No results found for "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* SUMMARY CARDS - Mirrored dynamic values */}
          <div style={styles.summaryGrid} className="summary-grid">
            <div style={styles.summaryCard} className="summary-card ov-panel">
              <p style={styles.summaryLabel} className="summary-label">Total Dentists</p>
              <h2 style={styles.summaryValue} className="summary-value">{summary.total}</h2>
            </div>
            <div style={styles.summaryCard} className="summary-card ov-panel">
              <p style={styles.summaryLabel} className="summary-label">Currently Available</p>
              <h2 style={styles.summaryValue} className="summary-value">{summary.available}</h2>
            </div>
            <div style={styles.summaryCard} className="summary-card ov-panel">
              <p style={styles.summaryLabel} className="summary-label">Busy</p>
              <h2 style={styles.summaryValue} className="summary-value">{summary.busy}</h2>
            </div>
            <div style={styles.summaryCard} className="summary-card ov-panel">
              <p style={styles.summaryLabel} className="summary-label">Off Duty</p>
              <h2 style={styles.summaryValue} className="summary-value">{summary.offDuty}</h2>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: "'Manrope', sans-serif" },
  header: { "--ov-on-color": "var(--ov-ink)",
    height: '80px', background: "var(--ov-primary)", display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10, boxSizing: 'border-box'
  },
  searchBox: { display: 'flex', alignItems: 'center', background: "var(--ov-on-wash, rgba(255,255,255,0.1))", padding: '10px 20px', borderRadius: '12px', width: '350px' },
  searchInput: { border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%', color: "var(--ov-on-color, #fff)" },
  headerActions: { display: 'flex', alignItems: 'center', gap: '25px' },
  profile: { display: 'flex', alignItems: 'center', gap: '15px', borderLeft: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))", paddingLeft: '20px' },
  profileText: { textAlign: 'right' },
  userName: { margin: 0, fontWeight: 'bold', fontSize: '14px', color: "var(--ov-on-color, #fff)" },
  userRole: { margin: 0, fontSize: '12px', color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },
  avatar: { width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  content: { padding: '40px', boxSizing: 'border-box', width: '100%' },
  titleSection: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#087F8C', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#666', marginTop: '5px' },

  tableControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  innerSearch: { position: 'relative', width: '300px' },
  innerSearchIcon: { position: 'absolute', left: '12px', top: '12px' },
  innerSearchInput: { width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', boxSizing: 'border-box', fontFamily: "'Manrope', sans-serif" },
  addButton: { "--ov-on-color": "var(--ov-ink)",
    backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: 'none', padding: '10px 20px',
    borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', cursor: 'pointer', fontFamily: "'Manrope', sans-serif"
  },

  tableContainer: { "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '30px' },
  table: { borderCollapse: 'collapse', color: "var(--ov-on-color, #fff)" },
  theadRow: { backgroundColor: "var(--ov-on-wash, rgba(255,255,255,0.05))" },
  th: { textAlign: 'left', padding: '20px', borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.1))", fontSize: '14px', fontWeight: '600', opacity: 0.8, whiteSpace: 'nowrap' },
  tbodyRow: { transition: 'background-color 0.2s' },
  td: { padding: '20px', borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.05))", fontSize: '14px', whiteSpace: 'nowrap' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  nameAvatar: { width: '32px', height: '32px', backgroundColor: 'white', borderRadius: '50%', opacity: 0.9, flexShrink: 0 },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
  actionButtons: { display: 'flex', gap: '15px' },
  iconBtn: { cursor: 'pointer', opacity: 0.8 },

  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  summaryCard: { "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", borderRadius: '15px', padding: '20px', color: "var(--ov-on-color, #fff)", boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  summaryLabel: { fontSize: '13px', opacity: 0.8, marginBottom: '8px', fontWeight: '500' },
  summaryValue: { fontSize: '28px', fontWeight: 'bold', margin: 0 }
};

export default StaffDentistList;