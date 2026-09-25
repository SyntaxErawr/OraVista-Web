import { PortalSearch, RoleNotifications } from '../../components/ClinicPortalTools';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { Search, User, ChevronDown, ChevronUp, CreditCard } from "lucide-react";

function StaffDashboard() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    availableDentists: 3,
    totalDentists: 3,
    monthPatients: 0,
    loading: true
  });

  const getDateKey = (date) => {
    if (!date) return "";
    if (typeof date === "string") return date.slice(0, 10);
    return new Date(date).toISOString().slice(0, 10);
  };

  const getTodayKey = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/dashboard/stats');

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();

        const todayAppointments = (data.schedule || []).filter(
          (appointment) => getDateKey(appointment.date) === getTodayKey(),
        );

        const completedVisits = (data.schedule || []).filter(
          (appointment) => appointment.status === 'Completed'
        );

        setStats({
          todayCount: todayAppointments.length,
          availableDentists: 3,
          totalDentists: 3,
          monthPatients: data.monthPatients,
          loading: false
        });

        setAppointments(todayAppointments);
        setRecentVisits(completedVisits);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* HEADER */}
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
                <p style={styles.userName}>Staff User</p>
                <p style={styles.userRole}>Receptionist</p>
              </div>
              <div style={styles.avatar}>
                <User size={20} color="#087F8C" />
              </div>
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

        {/* DASHBOARD CONTENT */}
        <div style={styles.content} className="settings-content ov-workspace-content">
          <div className="ov-page-intro"><span className="ov-eyebrow">Your workspace</span><h1>Ready for the day</h1><p>Keep appointments and patient visits moving smoothly.</p></div>
          <div style={styles.gridTop} className="dashboard-grid-top">
            {/* CARD 1: TODAY'S APPOINTMENTS */}
            <div className="ov-panel" style={styles.card}>
              <p style={styles.cardLabel}>Today's Appointments</p>
              <h2 style={styles.cardValue}>{stats.todayCount}</h2>
              <div style={styles.progressBase}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min((stats.todayCount / 20) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* CARD 2: CURRENT DATE */}
            <div className="ov-panel" style={styles.card}>
              <p style={styles.cardLabel}>Current Date</p>
              <h2 style={{ ...styles.cardValue, fontSize: "17px", lineHeight: "1.4" }}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>

            {/* CARD 3: DENTIST AVAILABILITY */}
            <div className="ov-panel" style={styles.card}>
              <p style={styles.cardLabel}>Dentist Availability</p>
              <h2 style={styles.cardValue}>
                {stats.availableDentists}/{stats.totalDentists}
              </h2>
              <p style={styles.cardSub}>Available now</p>
            </div>

            {/* CARD 4: PATIENTS THIS MONTH */}
            <div className="ov-panel" style={styles.card}>
              <p style={styles.cardLabel}>Patients This Month</p>
              <h2 style={styles.cardValue}>{stats.monthPatients}</h2>
              <p style={styles.cardSub}>Monthly growth</p>
            </div>
          </div>

          <div style={styles.billingCard}>
            <div style={styles.billingCardIcon}>
              <CreditCard size={24} color="#087F8C" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.billingCardTitle}>Billing & Receipts</p>
              <p style={styles.billingCardText}>
                Approve patient bills, record payments, and customize treatment-record receipts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/staff/billings")}
              style={styles.billingButton}
            >
              Open Billings
            </button>
          </div>

          <div style={styles.gridMid} className="dashboard-grid-mid">
            <div className="ov-panel" style={styles.chartCard}>
              <p style={styles.sectionTitle}>Revenue Overview</p>
              <div style={styles.placeholder}>Revenue Analytics Placeholder</div>
            </div>
            <div className="ov-panel" style={styles.chartCard}>
              <p style={styles.sectionTitle}>Patient Growth</p>
              <div style={styles.placeholder}>Growth Analytics Placeholder</div>
            </div>
          </div>

          <div style={styles.gridBottom} className="dashboard-grid-bottom">
            {/* RECENT PATIENT VISITS */}
            <div className="ov-panel" style={styles.listCard}>
              <p style={styles.sectionTitle}>Recent Patient Visits</p>
              {recentVisits.length > 0 ? (
                recentVisits.slice(0, 5).map((visit, idx) => (
                  <div key={visit.id || idx} style={styles.patientRow}>
                    <div style={styles.pAvatar}>
                      <User size={18} color="var(--ov-on-color, #fff)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={styles.pName}>{visit.patientName}</p>
                      <p style={styles.pId}>ID: {visit.booking_ref || `PT-100${visit.id}`}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={styles.pType}>{visit.serviceType || "Check-up"}</p>
                      <p style={styles.pTime}>{visit.time || "Completed"}</p>
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
            <div className="ov-panel" style={styles.listCard}>
              <p style={styles.sectionTitle}>Today's Schedule</p>

              {stats.loading ? (
                <p style={styles.emptyText}>Loading schedule...</p>
              ) : appointments.length > 0 ? (
                appointments.map((item, idx) => (
                  <div key={idx} style={styles.scheduleRow}>
                    <div style={styles.scheduleInfo}>
                      <span style={styles.scheduleTime}>🕒 {item.time}</span>
                      <span style={styles.schedulePatient}>{item.patientName}</span>
                    </div>
                    <span style={{
                      ...styles.scheduleBadge,
                      background: item.status === 'Completed' ? 'var(--ov-completed-soft, #e0ecff)' : item.status === 'Confirmed' ? '#e6fffa' : '#fff7ed',
                      color: item.status === 'Completed' ? 'var(--ov-completed, #2864c5)' : item.status === 'Confirmed' ? '#047857' : '#c2410c'
                    }}>
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>No appointments scheduled for today.</p>
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
  container: { display: "flex", flexDirection: "column", width: "100%" },
  header: { "--ov-on-color": "var(--ov-ink)",
    height: "80px",
    background: "var(--ov-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 40px",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    background: "var(--ov-on-wash, rgba(255,255,255,0.1))",
    padding: "10px 20px",
    borderRadius: "12px",
    width: "350px",
  },
  searchInput: {
    border: "none",
    background: "transparent",
    marginLeft: "10px",
    outline: "none",
    width: "100%",
    color: "var(--ov-on-color, #fff)",
  },
  headerActions: { display: "flex", alignItems: "center", gap: "25px" },
  actionIcon: { cursor: "pointer", opacity: 0.9 },
  profile: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    borderLeft: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))",
    paddingLeft: "20px",
  },
  profileText: { textAlign: "right" },
  userName: { margin: 0, fontWeight: "bold", fontSize: "14px", color: "var(--ov-on-color, #fff)" },
  userRole: { margin: 0, fontSize: "12px", color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },
  avatar: {
    width: "40px",
    height: "40px",
    background: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    padding: "32px 40px",
    backgroundColor: "#F3F9FA",
    minHeight: "calc(100vh - 80px)",
    boxSizing: "border-box",
  },
  gridTop: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  card: { "--ov-on-color": "var(--ov-ink)",
    padding: "22px 24px",
    borderRadius: "16px",
    color: "var(--ov-on-color, #fff)",
    background: "var(--ov-primary)",
    boxShadow: "0 6px 20px rgba(8, 127, 140, 0.1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--ov-on-muted, rgba(255,255,255,0.75))",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 8px 0",
  },
  cardValue: { margin: "0 0 6px 0", fontSize: "26px", fontWeight: "700", color: "var(--ov-on-color, #fff)" },
  progressBase: {
    height: "6px",
    background: "var(--ov-on-wash, rgba(255,255,255,0.15))",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "8px",
  },
  progressFill: { height: "100%", background: "#2CCAD5", borderRadius: "4px" },
  cardSub: { fontSize: "12px", margin: 0, color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },

  billingCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "18px 24px",
    borderRadius: "16px",
    background: "white",
    border: "1px solid rgba(8, 127, 140, 0.08)",
    boxShadow: "0 4px 16px rgba(8, 127, 140, 0.06)",
    marginBottom: "24px",
  },
  billingCardIcon: {
    display: "flex",
    padding: "12px",
    background: "#EAF5F6",
    borderRadius: "12px",
  },
  billingCardTitle: { margin: 0, color: "#087F8C", fontSize: "16px", fontWeight: "700" },
  billingCardText: { margin: "4px 0 0", color: "#64748b", fontSize: "13px" },
  billingButton: { "--ov-on-color": "var(--ov-ink)",
    border: "none",
    background: "var(--ov-primary)",
    color: "var(--ov-on-color, #fff)",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "0.2s",
  },

  gridMid: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: "20px",
    marginBottom: "24px",
  },
  chartCard: { "--ov-on-color": "var(--ov-ink)",
    background: "var(--ov-primary)",
    borderRadius: "16px",
    padding: "24px",
    color: "var(--ov-on-color, #fff)",
    boxShadow: "0 6px 20px rgba(8, 127, 140, 0.1)",
  },
  placeholder: {
    height: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px dashed var(--ov-on-line, rgba(255,255,255,0.2))",
    marginTop: "14px",
    borderRadius: "12px",
    color: "var(--ov-on-muted, rgba(255,255,255,0.75))",
    fontSize: "13px",
    background: "var(--ov-on-wash, rgba(255,255,255,0.02))",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontWeight: "700",
    fontSize: "16px",
    color: "var(--ov-on-color, #fff)",
    letterSpacing: "0.2px",
  },

  gridBottom: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr",
    gap: "20px",
  },
  listCard: { "--ov-on-color": "var(--ov-ink)",
    borderRadius: "16px",
    padding: "24px",
    background: "var(--ov-primary)",
    color: "var(--ov-on-color, #fff)",
    boxShadow: "0 6px 20px rgba(8, 127, 140, 0.1)",
    display: "flex",
    flexDirection: "column",
  },
  patientRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 0",
    borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.08))",
  },
  pAvatar: {
    width: "38px",
    height: "38px",
    background: "var(--ov-on-wash, rgba(255,255,255,0.12))",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pName: { margin: 0, fontWeight: "600", fontSize: "14px", color: "var(--ov-on-color, #fff)" },
  pId: { margin: "2px 0 0", fontSize: "11px", color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },
  pType: { margin: 0, fontSize: "13px", fontWeight: "600", color: "var(--ov-on-color, #fff)" },
  pTime: { margin: "2px 0 0", fontSize: "11px", color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },

  scheduleRow: {
    background: "white",
    color: "#087F8C",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  scheduleInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    minWidth: 0,
  },
  scheduleTime: {
    fontWeight: "700",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  schedulePatient: {
    fontWeight: "600",
    fontSize: "13px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  scheduleBadge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },
  emptyState: {
    padding: "36px 0",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    margin: 0,
    fontSize: "13px",
    color: "var(--ov-on-muted, rgba(255,255,255,0.75))",
    fontStyle: "italic",
  },
};

export default StaffDashboard;