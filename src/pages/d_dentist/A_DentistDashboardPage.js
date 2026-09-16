import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, Bell, MessageSquare, User, ChevronDown, ChevronUp } from 'lucide-react';

function DentistDashboard() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [stats, setStats] = useState({
    todayCount: 0,
    availableDentists: 0,
    totalDentists: 0,
    monthPatients: 0,
    schedule: []
  });
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);

    const fetchDashboardData = async () => {
      try {
        const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/dashboard/stats');
        const data = await response.json();
        
        const completedVisits = (data.schedule || []).filter(
          (appointment) => appointment.status === 'Completed'
        );

        setStats(data);
        setRecentVisits(completedVisits);
      } catch (err) {
        console.error("Error fetching dentist dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    return () => clearInterval(timer);
  }, []);

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* HEADER */}
        <header style={styles.header} className="dashboard-page-header">
          <div style={styles.headerActions} className="header-actions">
            <div style={styles.searchBox} className="header-search-box">
              <Search size={18} color="rgba(255,255,255,0.6)" />
              <input type="text" placeholder="Search patients, appointments..." style={styles.searchInput} />
            </div>

            {/* Mobile Search Toggle */}
            <button 
              className="mobile-search-toggle-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <Bell size={20} color="white" style={styles.actionIcon} />
            <MessageSquare size={20} color="white" style={styles.actionIcon} />
            <div style={styles.profile} className="header-profile">
              <div style={styles.profileText} className="header-profile-text">
                <p style={styles.userName}>Dr. Smith</p>
                <p style={styles.userRole}>Dentist</p>
              </div>
              <div style={styles.avatar}><User size={20} color="#001166" /></div>
            </div>
          </div>
        </header>

        {/* Mobile Collapsible Search & Actions */}
        {isSearchOpen && (
          <div className="mobile-search-collapsible">
            <div style={{ ...styles.searchBox, width: "100%" }}>
              <Search size={18} color="rgba(255,255,255,0.6)" />
              <input
                type="text"
                placeholder="Search patients, appointments..."
                style={styles.searchInput}
              />
            </div>
          </div>
        )}

        {/* CONTENT AREA */}
        <div style={styles.content} className="settings-content">
          {/* TOP STAT CARDS */}
          <div style={styles.gridTop} className="dashboard-grid-top">
            <div style={styles.card}>
              <p style={styles.cardLabel}>Today's Appointments</p>
              <h2 style={styles.cardValue}>{loading ? "..." : stats.todayCount}</h2>
              <div style={styles.progressBase}>
                <div style={{ ...styles.progressFill, width: `${Math.min((stats.todayCount / 50) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div style={styles.card}>
              <p style={styles.cardLabel}>Current Date</p>
              <h2 style={{ ...styles.cardValue, fontSize: '17px', lineHeight: '1.4' }}>
                {currentDateTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <p style={styles.cardSub}>{currentDateTime.toLocaleTimeString()}</p>
            </div>
            <div style={styles.card}>
              <p style={styles.cardLabel}>Dentist Availability</p>
              <h2 style={styles.cardValue}>{loading ? "..." : `${stats.availableDentists}/${stats.totalDentists}`}</h2>
              <p style={styles.cardSub}>Available now</p>
            </div>
            <div style={styles.card}>
              <p style={styles.cardLabel}>Patients This Month</p>
              <h2 style={styles.cardValue}>{loading ? "..." : stats.monthPatients}</h2>
              <p style={styles.cardSub}>Monthly growth tracked</p>
            </div>
          </div>

          {/* ANALYTICS GRID */}
          <div style={styles.gridMid} className="dashboard-grid-mid">
            <div style={styles.chartCard}>
              <p style={styles.sectionTitle}>Revenue Overview</p>
              <div style={styles.placeholder}>Revenue Analytics Placeholder</div>
            </div>
            <div style={styles.chartCard}>
              <p style={styles.sectionTitle}>Patient Growth</p>
              <div style={styles.placeholder}>Growth Analytics Placeholder</div>
            </div>
          </div>

          {/* LOWER GRID: VISITS & SCHEDULE */}
          <div style={styles.gridBottom} className="dashboard-grid-bottom">
            {/* RECENT PATIENT VISITS */}
            <div style={styles.listCard}>
              <p style={styles.sectionTitle}>Recent Patient Visits</p>
              {recentVisits.length > 0 ? (
                recentVisits.slice(0, 5).map((visit, idx) => (
                  <div key={visit.id || idx} style={styles.patientRow}>
                    <div style={styles.pAvatar}>
                      <User size={18} color="white" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={styles.pName}>{visit.patientName}</p>
                      <p style={styles.pId}>ID: {visit.booking_ref || `PT-100${visit.id}`}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={styles.pType}>{visit.serviceType || 'Consultation'}</p>
                      <p style={styles.pTime}>{visit.time || 'Completed'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>No recent patient visits recorded.</p>
                </div>
              )}
            </div>

            {/* TODAY'S SCHEDULE LIST */}
            <div style={styles.listCard}>
              <p style={styles.sectionTitle}>Today's Schedule</p>
              {loading ? (
                <p style={styles.emptyText}>Loading schedule...</p>
              ) : stats.schedule.length > 0 ? (
                stats.schedule.slice(0, 5).map((item, idx) => (
                  <div key={idx} style={styles.scheduleRow}>
                    <div style={styles.scheduleInfo}>
                      <span style={styles.scheduleTime}>🕒 {item.time}</span>
                      <span style={styles.schedulePatient}>{item.patientName}</span>
                    </div>
                    <span style={{
                      ...styles.scheduleBadge,
                      background: item.status === 'Confirmed' ? '#e6fffa' : '#fff7ed',
                      color: item.status === 'Confirmed' ? '#047857' : '#c2410c'
                    }}>
                      {item.status || 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>No appointments assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  header: {
    height: '80px',
    background: '#001166',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 40px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.1)',
    padding: '10px 20px',
    borderRadius: '12px',
    width: '350px',
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    marginLeft: '10px',
    outline: 'none',
    width: '100%',
    color: 'white',
  },
  headerActions: { display: 'flex', alignItems: 'center', gap: '25px' },
  actionIcon: { cursor: 'pointer', opacity: 0.9 },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    borderLeft: '1px solid rgba(255,255,255,0.2)',
    paddingLeft: '20px',
  },
  profileText: { textAlign: 'right' },
  userName: { margin: 0, fontWeight: 'bold', fontSize: '14px', color: 'white' },
  userRole: { margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' },
  avatar: {
    width: '40px',
    height: '40px',
    background: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: '32px 40px',
    backgroundColor: '#F4F7FE',
    minHeight: 'calc(100vh - 80px)',
    boxSizing: 'border-box',
  },
  gridTop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  card: {
    padding: '22px 24px',
    borderRadius: '16px',
    color: 'white',
    background: '#001166',
    boxShadow: '0 6px 20px rgba(0, 17, 102, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 8px 0',
  },
  cardValue: { margin: '0 0 6px 0', fontSize: '26px', fontWeight: '700', color: '#ffffff' },
  progressBase: {
    height: '6px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px',
  },
  progressFill: { height: '100%', background: '#00d4ff', borderRadius: '4px' },
  cardSub: { fontSize: '12px', margin: 0, color: 'rgba(255,255,255,0.7)' },

  gridMid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '20px',
    marginBottom: '24px',
  },
  chartCard: {
    background: '#001166',
    borderRadius: '16px',
    padding: '24px',
    color: 'white',
    boxShadow: '0 6px 20px rgba(0, 17, 102, 0.1)',
  },
  placeholder: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px dashed rgba(255,255,255,0.2)',
    marginTop: '14px',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '13px',
    background: 'rgba(255,255,255,0.02)',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontWeight: '700',
    fontSize: '16px',
    color: 'white',
    letterSpacing: '0.2px',
  },

  gridBottom: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '20px',
  },
  listCard: {
    borderRadius: '16px',
    padding: '24px',
    background: '#001166',
    color: 'white',
    boxShadow: '0 6px 20px rgba(0, 17, 102, 0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  patientRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  pAvatar: {
    width: '38px',
    height: '38px',
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pName: { margin: 0, fontWeight: '600', fontSize: '14px', color: 'white' },
  pId: { margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.55)' },
  pType: { margin: 0, fontSize: '13px', fontWeight: '600', color: 'white' },
  pTime: { margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.5)' },

  scheduleRow: {
    background: 'white',
    color: '#001166',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  scheduleInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: 0,
  },
  scheduleTime: {
    fontWeight: '700',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  schedulePatient: {
    fontWeight: '600',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  scheduleBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: '36px 0',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    margin: 0,
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
};

export default DentistDashboard;