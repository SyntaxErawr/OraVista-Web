import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, Bell, MessageSquare, User, ChevronLeft, ChevronRight, Plus, Clock, ChevronDown, ChevronUp } from 'lucide-react';

function DentistAppointments() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState({ total: 0, confirmed: 0, pending: 0, completed: 0, canceled: 0 });
  const [loading, setLoading] = useState(true);

  // --- Calendar & Filter States ---
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // --- Dynamic Calendar Logic ---
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const currentMonthName = viewDate.toLocaleString('default', { month: 'long' });

  const formatDate = (y, m, d) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const formatDbDate = (dbDate) => {
    if (!dbDate) return "";
    const d = new Date(dbDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // FETCH LOGIC 
  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/dashboard/stats');
      const data = await response.json();

      if (data.schedule) {
        const formattedApps = data.schedule.map((app) => ({
          dbId: app.id,
          id: app.booking_ref || `APT-50${app.id}`,
          patient: app.patientName,
          dentist: app.dentist,
          date: app.date,
          time: app.time,
          status: app.status,
          type: app.serviceType || 'Consultation',
          approved: app.status === 'Confirmed',
          online: app.serviceType === 'Online'
        }));
        setAppointments(formattedApps);
      }

      setSummary({
        total: data.todayCount || 0,
        confirmed: data.schedule.filter(a => a.status === 'Confirmed').length,
        pending: data.schedule.filter(a => a.status === 'Pending').length,
        completed: data.schedule.filter(a => a.status === 'Completed').length,
        canceled: data.schedule.filter(a => a.status === 'Canceled' || a.status === 'Cancelled').length
      });
    } catch (err) {
      console.error("Error fetching dentist appointments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // APPROVAL LOGIC
  const handleApprove = async (appointmentId) => {
    try {
      const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/update-appointment-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: appointmentId,
          status: 'Confirmed'
        }),
      });

      if (response.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error("Dentist approval action failed:", err);
    }
  };

  // --- APPOINTMENT FILTER LOGIC ---
  const filteredAppointments = selectedDate
    ? appointments.filter(app => formatDbDate(app.date) === selectedDate)
    : appointments;

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* HEADER - Dentist Specific */}
        <header style={styles.header} className="dashboard-page-header ov-header">
          <div style={styles.headerActions} className="header-actions">
            <div style={styles.searchBox} className="header-search-box">
              <Search size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
              <input type="text" placeholder="Search patients, appointments..." style={styles.searchInput} />
            </div>

            {/* Mobile Search Toggle */}
            <button 
              className="mobile-search-toggle-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <Bell size={20} color="var(--ov-on-color, #fff)" />
            <MessageSquare size={20} color="var(--ov-on-color, #fff)" />
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
              <input type="text" placeholder="Search patients, appointments..." style={styles.searchInput} />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div style={styles.content} className="settings-content ov-workspace-content">
          <div style={styles.titleSection}>
            <h1 style={styles.pageTitle}>Appointments</h1>
            <p style={styles.pageSubtitle}>Schedule and manage patient appointments</p>
          </div>

          <div style={styles.mainGrid} className="appointment-main-grid">
            {/* LEFT COLUMN */}
            <div style={styles.leftCol}>
              <div className="ov-panel" style={styles.calendarCard}>
                <div style={styles.calHeader}>
                  <p style={styles.calMonth}>{currentMonthName} {currentYear}</p>
                  <div style={styles.calNav}>
                    <ChevronLeft size={16} cursor="pointer" onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} />
                    <ChevronRight size={16} cursor="pointer" onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} />
                  </div>
                </div>
                <div style={styles.calGrid}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} style={styles.calDayHead}>{day}</div>
                  ))}

                  {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`}></div>)}

                  {[...Array(daysInMonth)].map((_, i) => {
                    const dateStr = formatDate(currentYear, currentMonth, i + 1);
                    const isSelected = selectedDate === dateStr;

                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                        style={{
                          ...styles.calDay,
                          backgroundColor: isSelected ? 'white' : 'transparent',
                          color: isSelected ? '#087F8C' : "#fff",
                          fontWeight: isSelected ? 'bold' : 'normal'
                        }}
                      >
                        {i + 1}
                      </div>
                    )
                  })}
                </div>
                <div style={styles.calLegend}>
                  <div style={styles.legendItem}><div style={{ ...styles.dot, backgroundColor: 'white' }}></div> Today</div>
                  <div style={styles.legendItem}><div style={{ ...styles.dot, backgroundColor: "var(--ov-on-wash, rgba(255,255,255,0.3))" }}></div> Has Appointments</div>
                </div>
              </div>

              <div className="ov-panel" style={styles.summaryCard}>
                <p style={styles.sectionTitle}>Today's Summary</p>
                <div style={styles.sumRow}><span>Total</span> <span>{summary.total}</span></div>
                <div style={styles.sumRow}><span>Confirmed</span> <span>{summary.confirmed}</span></div>
                <div style={styles.sumRow}><span>Pending</span> <span>{summary.pending}</span></div>
                <div style={styles.sumRow}><span>Canceled</span> <span>{summary.canceled}</span></div>
                <div style={styles.sumRow}><span>Completed</span> <span>{summary.completed}</span></div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={styles.rightCol}>
              <div style={styles.listHeader}>
                <h3 style={styles.listTitle}>
                  {selectedDate ? `Appointments for ${selectedDate}` : "All Appointments"}
                </h3>
                <button style={styles.newAppBtn}><Plus size={18} /> New Appointment</button>
              </div>

              <div className="appointment-list-scrollable">
                {loading ? (
                  <p style={{ color: '#087F8C' }}>Loading database schedule...</p>
                ) : filteredAppointments.length === 0 ? (
                  <p style={{ color: "#666" }}>No appointments found for this selection.</p>
                ) : (
                  filteredAppointments.map((app) => {

                    const isCanceled = app.status === 'Canceled' || app.status === 'Cancelled';
                    let badgeColor = '#f59e0b';
                    let badgeText = '#087F8C';
                    if (app.status === 'Confirmed') { badgeColor = '#4ade80'; badgeText = '#087F8C'; }
                    if (app.status === "Completed") { badgeColor = "var(--ov-completed, #2864c5)"; badgeText = "white"; }
                    if (isCanceled) { badgeColor = '#ef4444'; badgeText = 'white'; }

                    return (
                      <div key={app.id} style={styles.appCard} className="appointment-card ov-panel">
                        <div style={styles.appMain}>
                          <div style={styles.appTimeRow} className="appointment-time-row">
                            <span style={styles.appTime}><Clock size={16} style={{ marginRight: '8px' }} /> {app.time}</span>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: badgeColor,
                              color: badgeText
                            }}>{app.status}</span>
                            {app.online && <span style={styles.onlineBadge}>🌐 Online Booking</span>}
                          </div>
                          <div style={styles.appInfoGrid} className="appointment-info-grid">
                            <div className="appointment-info-item">
                              <p style={styles.infoLabel}>Patient</p>
                              <div style={styles.pCell} className="patient-profile-cell"><div style={styles.pAvatar} className="patient-profile-avatar"></div>{app.patient}</div>
                            </div>
                            <div className="appointment-info-item">
                              <p style={styles.infoLabel}>Dentist</p>
                              <p style={styles.infoVal}>{app.dentist}</p>
                            </div>
                            <div className="appointment-info-item">
                              <p style={styles.infoLabel}>Type</p>
                              <p style={styles.infoVal}>{app.type}</p>
                            </div>
                            <div className="appointment-info-item">
                              <p style={styles.infoLabel}>ID</p>
                              <p style={styles.infoVal}>{app.id}</p>
                            </div>
                          </div>
                        </div>

                        {!isCanceled ? (
                          <div style={styles.appActions} className="app-actions-container">
                            <button
                              onClick={() => !app.approved && handleApprove(app.dbId)}
                              style={{
                                ...styles.actionBtn,
                                background: app.approved ? '#4ade80' : 'transparent',
                                border: app.approved ? 'none' : '1px solid #4ade80',
                                color: app.approved ? "#fff" : '#4ade80',
                                cursor: app.approved ? 'default' : 'pointer'
                              }}>
                              {app.approved ? 'Approved' : 'Approve'}
                            </button>
                            <button style={styles.actionBtnOutline}>Reschedule</button>
                            <button style={styles.actionBtnOutline}>View</button>
                          </div>
                        ) : (
                          <div style={styles.appActions} className="app-actions-container">
                            <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 'bold', fontStyle: 'italic', paddingRight: '10px' }}>
                              Canceled by Patient
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
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
  header: { "--ov-on-color": "var(--ov-ink)",
    height: '80px', background: "var(--ov-primary)", display: 'flex', alignItems: 'center',
    justifyContent: 'flex-end', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10
  },
  searchBox: { display: 'flex', alignItems: 'center', background: "var(--ov-on-wash, rgba(255,255,255,0.1))", padding: '10px 20px', borderRadius: '12px', width: '350px' },
  searchInput: { border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%', color: "var(--ov-on-color, #fff)" },
  headerActions: { display: 'flex', alignItems: 'center', gap: '25px' },
  profile: { display: 'flex', alignItems: 'center', gap: '15px', borderLeft: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))", paddingLeft: '20px' },
  profileText: { textAlign: 'right' },
  userName: { margin: 0, fontWeight: 'bold', fontSize: '14px', color: "var(--ov-on-color, #fff)" },
  userRole: { margin: 0, fontSize: '12px', color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },
  avatar: { width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  content: { padding: '40px', backgroundColor: '#F3F9FA', minHeight: 'calc(100vh - 80px)' },
  titleSection: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#087F8C', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#666', marginTop: '5px' },

  mainGrid: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '25px', alignItems: 'start' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  calendarCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", padding: '20px', borderRadius: '15px', color: "var(--ov-on-color, #fff)" },
  calHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  calMonth: { fontWeight: 'bold', fontSize: '14px' },
  calNav: { display: 'flex', gap: '10px' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' },
  calDayHead: { fontSize: '10px', opacity: 0.6, paddingBottom: '10px' },
  calDay: { fontSize: '11px', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' },
  calLegend: { marginTop: '15px', display: 'flex', gap: '15px', fontSize: '10px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '5px' },
  dot: { width: '8px', height: '8px', borderRadius: '2px' },

  summaryCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", padding: '25px', borderRadius: '15px', color: "var(--ov-on-color, #fff)" },
  sectionTitle: { fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' },
  sumRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px', opacity: 0.9 },

  rightCol: { display: 'flex', flexDirection: 'column', gap: '15px' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  listTitle: { fontSize: '16px', fontWeight: 'bold', color: '#333' },
  newAppBtn: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },

  appCard: {
    background: '#000051', borderRadius: '15px', padding: '16px 20px', color: "var(--ov-on-color, #fff)",
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  appMain: { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  appTimeRow: { display: 'flex', alignItems: 'center', gap: '15px' },
  appTime: { fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center' },
  badge: { fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' },
  onlineBadge: { fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.2)', color: '#078493', border: '1px solid #078493' },
  appInfoGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '100px', alignItems: 'center' },
  infoLabel: { fontSize: '12px', color: '#C5CAE9', marginBottom: '4px' },
  infoVal: { fontSize: '14px', fontWeight: '500' },
  pCell: { display: 'flex', alignItems: 'center', gap: '15px', fontSize: '18px', fontWeight: 'bold' },
  pAvatar: { width: '45px', height: '45px', background: '#E8F6F7', borderRadius: '50%' },

  appActions: { display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' },
  actionBtn: { width: '180px', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: '0.2s' },
  actionBtnOutline: { "--ov-on-color": "#087F8C",
    background: 'transparent', color: "var(--ov-on-color, #fff)", border: "1px solid var(--ov-on-line, rgba(255,255,255,0.3))",
    padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
  }
};

export default DentistAppointments;