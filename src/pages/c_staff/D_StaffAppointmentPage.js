import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import {
  Search,
  Bell,
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function StaffAppointments() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  // ADDED: canceled to the summary state
  const [summary, setSummary] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
    canceled: 0,
  });
  const [loading, setLoading] = useState(true);

  // --- Calendar & Filter States ---
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // --- Dynamic Calendar Logic ---
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const currentMonthName = viewDate.toLocaleString("default", {
    month: "long",
  });

  const formatDate = (y, m, d) => {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const formatDbDate = (dbDate) => {
    if (!dbDate) return "";
    const d = new Date(dbDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // FETCH LOGIC
  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch(
        "https://oravista-server-474976105474.asia-southeast1.run.app/api/dashboard/stats",
      );
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
          type: app.serviceType || "Consultation",
          approved: app.status === "Confirmed",
        }));
        setAppointments(formattedApps);
      }

      setSummary({
        total: data.todayCount || 0,
        confirmed: data.schedule.filter((a) => a.status === "Confirmed").length,
        pending: data.schedule.filter((a) => a.status === "Pending").length,
        completed: data.schedule.filter((a) => a.status === "Completed").length,
        canceled: data.schedule.filter(
          (a) => a.status === "Canceled" || a.status === "Cancelled",
        ).length, // Tracks cancellations
      });
    } catch (err) {
      console.error("Error fetching staff appointments:", err);
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
      const response = await fetch(
        "https://oravista-server-474976105474.asia-southeast1.run.app/api/update-appointment-status",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointment_id: appointmentId,
            status: "Confirmed",
          }),
        },
      );

      if (response.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error("Staff approval failed:", err);
    }
  };

  // --- APPOINTMENT FILTER LOGIC ---
  const filteredAppointments = selectedDate
    ? appointments.filter((app) => formatDbDate(app.date) === selectedDate)
    : appointments;

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* HEADER */}
        <header style={styles.header} className="dashboard-page-header">
          <div style={styles.headerActions} className="header-actions">
            <div style={styles.searchBox} className="header-search-box">
              <Search size={18} color="rgba(255,255,255,0.6)" />
              <input
                type="text"
                placeholder="Search appointments..."
                style={styles.searchInput}
              />
            </div>

            {/* Mobile Search Toggle */}
            <button
              className="mobile-search-toggle-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>

            <Bell size={20} color="white" />
            <MessageSquare size={20} color="white" />
            <div style={styles.profile} className="header-profile">
              <div style={styles.profileText} className="header-profile-text">
                <p style={styles.userName}>Staff User</p>
                <p style={styles.userRole}>Receptionist</p>
              </div>
              <div style={styles.avatar}>
                <User size={20} color="#001166" />
              </div>
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
                placeholder="Search appointments..."
                style={styles.searchInput}
              />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div style={styles.content} className="settings-content">
          <div style={styles.titleSection}>
            <h1 style={styles.pageTitle}>Master Schedule</h1>
            <p style={styles.pageSubtitle}>
              Daily appointment management and patient check-in
            </p>
          </div>

          <div style={styles.mainGrid} className="appointment-main-grid">
            {/* LEFT COLUMN: Calendar & Summary */}
            <div style={styles.leftCol}>
              <div style={styles.calendarCard}>
                <div style={styles.calHeader}>
                  <p style={styles.calMonth}>
                    {currentMonthName} {currentYear}
                  </p>
                  <div style={styles.calNav}>
                    <ChevronLeft
                      size={16}
                      cursor="pointer"
                      onClick={() =>
                        setViewDate(new Date(currentYear, currentMonth - 1, 1))
                      }
                    />
                    <ChevronRight
                      size={16}
                      cursor="pointer"
                      onClick={() =>
                        setViewDate(new Date(currentYear, currentMonth + 1, 1))
                      }
                    />
                  </div>
                </div>
                <div style={styles.calGrid}>
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} style={styles.calDayHead}>
                      {day}
                    </div>
                  ))}

                  {[...Array(firstDayOfMonth)].map((_, i) => (
                    <div key={`empty-${i}`}></div>
                  ))}

                  {[...Array(daysInMonth)].map((_, i) => {
                    const dateStr = formatDate(
                      currentYear,
                      currentMonth,
                      i + 1,
                    );
                    const isSelected = selectedDate === dateStr;

                    return (
                      <div
                        key={i}
                        onClick={() =>
                          setSelectedDate(isSelected ? null : dateStr)
                        }
                        style={{
                          ...styles.calDay,
                          backgroundColor: isSelected ? "white" : "transparent",
                          color: isSelected ? "#001166" : "white",
                          fontWeight: isSelected ? "bold" : "normal",
                        }}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.summaryCard}>
                <p style={styles.sectionTitle}>Today's Summary</p>
                <div style={styles.sumRow}>
                  <span>Total</span> <span>{summary.total}</span>
                </div>
                <div style={styles.sumRow}>
                  <span>Confirmed</span> <span>{summary.confirmed}</span>
                </div>
                <div style={styles.sumRow}>
                  <span>Pending</span> <span>{summary.pending}</span>
                </div>
                {/* NEW: Display Canceled count */}
                <div style={styles.sumRow}>
                  <span>Canceled</span> <span>{summary.canceled}</span>
                </div>
                <div style={styles.sumRow}>
                  <span>Completed</span> <span>{summary.completed}</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Appointment Cards */}
            <div style={styles.rightCol}>
              <div style={styles.listHeader}>
                <h3 style={styles.listTitle}>
                  {selectedDate
                    ? `Appointments for ${selectedDate}`
                    : "All Appointments"}
                </h3>
                <button
                  style={styles.newAppBtn}
                  onClick={() => navigate("/staff/booking")}
                >
                  <Plus size={18} /> Book Appointment
                </button>
              </div>

              <div className="appointment-list-scrollable">
                {loading ? (
                  <p>Loading Schedule...</p>
                ) : filteredAppointments.length === 0 ? (
                  <p style={{ color: "#666" }}>
                    No appointments found for this selection.
                  </p>
                ) : (
                  filteredAppointments.map((app) => {
                    // Helper to determine badge color
                    const isCanceled =
                      app.status === "Canceled" || app.status === "Cancelled";
                    let badgeColor = "#f59e0b"; // Pending (Orange)
                    let badgeText = "#001166";
                    if (app.status === "Confirmed") {
                      badgeColor = "#4ade80";
                      badgeText = "#001166";
                    } // Green
                    if (isCanceled) {
                      badgeColor = "#ef4444";
                      badgeText = "white";
                    } // Red

                    return (
                      <div
                        key={app.id}
                        style={styles.appCard}
                        className="appointment-card"
                      >
                        <div style={styles.appMain}>
                          <div
                            style={styles.appTimeRow}
                            className="appointment-time-row"
                          >
                            <span style={styles.appTime}>🕒 {app.time}</span>
                            <span
                              style={{
                                ...styles.statusBadge,
                                backgroundColor: badgeColor,
                                color: badgeText,
                              }}
                            >
                              {app.status}
                            </span>
                          </div>
                          <div
                            style={styles.appInfoGrid}
                            className="appointment-info-grid"
                          >
                            <div className="appointment-info-item">
                              <p style={styles.infoLabel}>Patient</p>
                              <p style={styles.infoVal}>{app.patient}</p>
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

                        {/* Conditionally render actions based on status */}
                        {!isCanceled ? (
                          <div
                            style={styles.appActions}
                            className="app-actions-container"
                          >
                            <button
                              onClick={() =>
                                !app.approved && handleApprove(app.dbId)
                              }
                              style={{
                                ...styles.actionBtn,
                                background: app.approved
                                  ? "#4ade80"
                                  : "transparent",
                                border: app.approved
                                  ? "none"
                                  : "1px solid #4ade80",
                                color: app.approved ? "white" : "#4ade80",
                                cursor: app.approved ? "default" : "pointer",
                              }}
                            >
                              {app.approved ? "Approved" : "Approve"}
                            </button>
                            <button style={styles.actionBtnOutline}>
                              Reschedule
                            </button>
                          </div>
                        ) : (
                          <div
                            style={styles.appActions}
                            className="app-actions-container"
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#ef4444",
                                fontWeight: "bold",
                                fontStyle: "italic",
                                paddingRight: "10px",
                              }}
                            >
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
  container: { display: "flex", flexDirection: "column", width: "100%" },
  header: {
    height: "80px",
    background: "#001166",
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
    background: "rgba(255,255,255,0.1)",
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
    color: "white",
  },
  headerActions: { display: "flex", alignItems: "center", gap: "25px" },
  profile: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    borderLeft: "1px solid rgba(255,255,255,0.2)",
    paddingLeft: "20px",
  },
  profileText: { textAlign: "right" },
  userName: { margin: 0, fontWeight: "bold", fontSize: "14px", color: "white" },
  userRole: { margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.6)" },
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
    padding: "40px",
    backgroundColor: "#F4F7FE",
    minHeight: "calc(100vh - 80px)",
  },
  titleSection: { marginBottom: "30px" },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#001166",
    margin: 0,
  },
  pageSubtitle: { fontSize: "14px", color: "#666", marginTop: "5px" },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "25px",
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: "20px" },
  calendarCard: {
    background: "#001166",
    padding: "20px",
    borderRadius: "15px",
    color: "white",
  },
  calHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  calMonth: { fontWeight: "bold", fontSize: "14px" },
  calNav: { display: "flex", gap: "10px" },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "5px",
    textAlign: "center",
  },
  calDayHead: { fontSize: "10px", opacity: 0.6, paddingBottom: "10px" },
  calDay: {
    fontSize: "11px",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.2s",
  },
  summaryCard: {
    background: "#001166",
    padding: "25px",
    borderRadius: "15px",
    color: "white",
  },
  sectionTitle: { fontSize: "14px", fontWeight: "bold", marginBottom: "15px" },
  sumRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    marginBottom: "10px",
    opacity: 0.9,
  },
  rightCol: { display: "flex", flexDirection: "column", gap: "15px" },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  listTitle: { fontSize: "16px", fontWeight: "bold", color: "#333" },
  newAppBtn: {
    background: "#001166",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  appCard: {
    background: "#001166",
    borderRadius: "15px",
    padding: "14px 20px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appMain: { flex: 1 },
  appTimeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  },
  appTime: { fontSize: "14px", fontWeight: "bold" },
  statusBadge: {
    fontSize: "10px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontWeight: "bold",
  },
  appInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
  },
  infoLabel: { fontSize: "10px", opacity: 0.6, marginBottom: "5px" },
  infoVal: { fontSize: "12px", fontWeight: "500" },
  appActions: { display: "flex", gap: "10px", alignItems: "center" },
  actionBtn: {
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "12px",
    transition: "0.2s",
  },
  actionBtnOutline: {
    background: "transparent",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default StaffAppointments;
