import React, { useState, useEffect, useCallback, useRef } from "react";
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
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

// Display seconds without changing the saved booking time.
function formatAppointmentTime(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return value || "Time not provided";
  let hour = Number(match[1]);
  const period = match[4]?.toUpperCase();
  if (Number(match[2]) > 59 || Number(match[3] || 0) > 59 || hour > (period ? 12 : 23) || (period && hour < 1)) return value;
  if (period) hour = hour % 12 + (period === "PM" ? 12 : 0);
  return `${String(hour % 12 || 12).padStart(2, "0")}:${match[2]}:${match[3] || "00"} ${hour >= 12 ? "PM" : "AM"}`;
}

function StaffAppointments() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
    canceled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const approvalInProgress = useRef(false);
  const [lateNoShowAppointment, setLateNoShowAppointment] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    type: "success",
    message: "",
  });

  // --- Calendar & Filter States ---
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 5;

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

  const formatDisplayDate = (dbDate) => {
    if (!dbDate) return "No date";
    const d = new Date(dbDate);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatBookedDateTime = (value) => {
    if (!value) return "Not available";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Not available";
    return d.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // FETCH LOGIC
  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      const data = await response.json();

      if (data.schedule) {
        const formattedApps = data.schedule.map((app) => ({
          dbId: app.id,
          id: app.booking_ref || `APT-50${app.id}`,
          patient: app.patientName,
          dentist: app.dentist,
          date: app.date,
          time: app.time,
          requestedDate: app.requestedDate,
          requestedTime: app.requestedTime,
          status: app.status,
          type: app.serviceType || "Consultation",
          bookedAt: app.bookedAt,
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
        ).length,
      });
    } catch (err) {
      console.error("Error fetching staff appointments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    const intervalId = window.setInterval(fetchAppointments, 30000);
    window.addEventListener("focus", fetchAppointments);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", fetchAppointments);
    };
  }, [fetchAppointments]);

  // APPROVAL LOGIC
  const handleApprove = async (appointment) => {
    if (approvalInProgress.current) return;
    approvalInProgress.current = true;
    setApprovingId(appointment.dbId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/update-appointment-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appointment.dbId,
          status: "Confirmed",
          expected_status: appointment.status,
          ...(appointment.status === "Reschedule Requested" ? {
            expected_requested_date: appointment.requestedDate,
            expected_requested_time: appointment.requestedTime,
          } : {}),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to approve the appointment.");
      if (appointment.status === "Reschedule Requested") {
        setFeedbackModal({ show: true, type: "success", message: result.warning
          ? `${result.message} ${result.warning}`
          : "Reschedule approved. The appointment now uses the requested date and time. The patient's dashboard notification has been saved and the email has been sent." });
      }
    } catch (err) {
      setFeedbackModal({ show: true, type: "error", message: err.message || "Approval failed." });
    } finally {
      await fetchAppointments();
      approvalInProgress.current = false;
      setApprovingId(null);
    }
  };

  const handleLateNoShow = async () => {
    if (!lateNoShowAppointment) return;
    const appointmentId = lateNoShowAppointment.dbId;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/${appointmentId}/late-no-show`,
        { method: "PUT" },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to update the appointment.");
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.dbId === appointmentId
            ? { ...appointment, status: "Late / No Show", approved: false }
            : appointment,
        ),
      );
      setLateNoShowAppointment(null);
      setFeedbackModal({
        show: true,
        type: "success",
        message: "The appointment is now marked Late / No Show. The patient has been sent an email and dashboard notification with cancel and reschedule options.",
      });
      await fetchAppointments();
    } catch (err) {
      setLateNoShowAppointment(null);
      setFeedbackModal({
        show: true,
        type: "error",
        message: err.message || "Unable to mark the appointment Late / No Show.",
      });
      fetchAppointments();
    }
  };

  const modalOverlay = {
    position: "fixed",
    inset: 0,
    zIndex: 3000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backgroundColor: "rgba(0, 0, 0, 0.52)",
  };

  const modalBox = {
    width: "100%",
    maxWidth: "420px",
    padding: "28px",
    borderRadius: "18px",
    backgroundColor: "white",
    textAlign: "center",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.25)",
  };

  // --- APPOINTMENT FILTER LOGIC ---
  const filteredAppointments = (selectedDate
    ? appointments.filter((app) => formatDbDate(app.date) === selectedDate)
    : appointments
  ).slice().sort((a, b) => {
    const aTime = a.bookedAt ? new Date(a.bookedAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.bookedAt ? new Date(b.bookedAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime || a.dbId - b.dbId;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / appointmentsPerPage));
  const startIndex = (currentPage - 1) * appointmentsPerPage;
  const paginatedAppointments = filteredAppointments.slice(
    startIndex,
    startIndex + appointmentsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <AdminLayout>
      <div style={styles.container}>
        {lateNoShowAppointment && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              <XCircle size={48} color="#dc2626" style={{ marginBottom: "12px" }} />
              <h3 style={{ margin: "0 0 10px", color: "#087F8C" }}>Mark Late / No Show?</h3>
              <p style={{ margin: "0 0 22px", color: "#555", fontSize: "14px", lineHeight: 1.5 }}>
                Marking {lateNoShowAppointment.patient}'s appointment as Late / No Show will notify the patient by email and in their dashboard. They will be able to cancel or request rescheduling.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setLateNoShowAppointment(null)}
                  style={{ ...styles.modalButton, backgroundColor: "white", color: "#087F8C", border: "1px solid #cbd5e1" }}
                >
                  Go Back
                </button>
                <button
                  onClick={handleLateNoShow}
                  style={{ ...styles.modalButton, backgroundColor: "#dc2626", color: "var(--ov-on-color, #fff)", border: "none" }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {feedbackModal.show && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              {feedbackModal.type === "success" ? (
                <CheckCircle2 size={48} color="#16a34a" style={{ marginBottom: "12px" }} />
              ) : (
                <XCircle size={48} color="#dc2626" style={{ marginBottom: "12px" }} />
              )}
              <h3 style={{ margin: "0 0 10px", color: "#087F8C" }}>
                {feedbackModal.type === "success" ? "Appointment Updated" : "Unable to Update Appointment"}
              </h3>
              <p style={{ margin: "0 0 22px", color: "#555", fontSize: "14px", lineHeight: 1.5 }}>
                {feedbackModal.message}
              </p>
              <button
                onClick={() => setFeedbackModal((current) => ({ ...current, show: false }))}
                style={{ "--ov-on-color": "var(--ov-ink)", ...styles.modalButton, width: "100%", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: "none" }}
              >
                Okay
              </button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header style={styles.header} className="dashboard-page-header ov-header">
          <div style={styles.headerActions} className="header-actions">
            <div style={styles.searchBox} className="header-search-box">
              <Search size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
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

            <Bell size={20} color="var(--ov-on-color, #fff)" />
            <MessageSquare size={20} color="var(--ov-on-color, #fff)" />
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
              <input
                type="text"
                placeholder="Search appointments..."
                style={styles.searchInput}
              />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div style={styles.content} className="settings-content ov-workspace-content">
          <div style={styles.titleSection}>
            <h1 style={styles.pageTitle}>Master Schedule</h1>
            <p style={styles.pageSubtitle}>
              Daily appointment management and patient check-in
            </p>
          </div>

          <div style={styles.mainGrid} className="appointment-main-grid">
            {/* LEFT COLUMN: Calendar & Summary */}
            <div style={styles.leftCol}>
              <div className="ov-panel" style={styles.calendarCard}>
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
                          color: isSelected ? "#087F8C" : "#fff",
                          fontWeight: isSelected ? "bold" : "normal",
                        }}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ov-panel" style={styles.summaryCard}>
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
                  <p style={{ color: "#666", padding: "20px 0" }}>Loading Schedule...</p>
                ) : filteredAppointments.length === 0 ? (
                  <p style={{ color: "#666", padding: "20px 0" }}>
                    No appointments found for this selection.
                  </p>
                ) : (
                  paginatedAppointments.map((app) => {
                    const isCanceled =
                      app.status === "Canceled" || app.status === "Cancelled";
                    const isLateNoShow = app.status === "Late / No Show";
                    let badgeColor = "#f59e0b";
                    let badgeText = "#ffffff";
                    if (app.status === "Confirmed") {
                      badgeColor = "#10b981";
                      badgeText = "white";
                    }
                    if (app.status === "Completed") { badgeColor = "var(--ov-completed, #2864c5)"; badgeText = "white"; }
                    if (isCanceled) {
                      badgeColor = "#ef4444";
                      badgeText = "white";
                    }
                    if (isLateNoShow) {
                      badgeColor = "#dc2626";
                      badgeText = "white";
                    }

                    return (
                      <div className="ov-panel"
                        key={app.id}
                        style={{
                          ...styles.appCard,
                          borderLeft: `5px solid ${badgeColor}`,
                        }}
                      >
                        <div style={styles.appMain}>
                          {/* Card Header */}
                          <div style={styles.appHeaderRow} className="appointment-time-row">
                            <div style={styles.timeDateGroup}>
                              <span style={styles.appTime}>
                                <Clock size={15} style={{ marginRight: "6px" }} />
                                Scheduled Time: {formatAppointmentTime(app.time)}
                              </span>
                              <span style={styles.appDate}>
                                <Calendar size={15} style={{ marginRight: "6px" }} />
                                Scheduled Date: {formatDisplayDate(app.date)}
                              </span>
                            </div>
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

                          {app.status === "Reschedule Requested" && (
                            <div style={{ margin: "0 0 14px", padding: "10px 12px", borderRadius: "8px", backgroundColor: "#E6F8FA", color: "#076C79", fontSize: "13px", lineHeight: 1.6 }}>
                              <strong>Requested schedule:</strong>{" "}
                              {formatDisplayDate(app.requestedDate)} at {formatAppointmentTime(app.requestedTime)}
                            </div>
                          )}

                          {/* Info Grid */}
                          <div
                            style={styles.appInfoGrid}
                            className="appointment-info-grid"
                          >
                            <div className="appointment-info-item" style={styles.infoItem}>
                              <p style={styles.infoLabel}>Patient</p>
                              <p style={styles.infoVal} title={app.patient}>{app.patient}</p>
                            </div>
                            <div className="appointment-info-item" style={styles.infoItem}>
                              <p style={styles.infoLabel}>Dentist</p>
                              <p style={styles.infoVal} title={app.dentist}>{app.dentist}</p>
                            </div>
                            <div className="appointment-info-item" style={styles.infoItem}>
                              <p style={styles.infoLabel}>Service Type</p>
                              <p style={styles.infoVal} title={app.type}>{app.type}</p>
                            </div>
                            <div className="appointment-info-item" style={styles.infoItem}>
                              <p style={styles.infoLabel}>Booking ID</p>
                              <p style={{ ...styles.infoVal, fontFamily: "monospace", letterSpacing: "0.5px" }}>{app.id}</p>
                            </div>
                            <div className="appointment-info-item" style={styles.infoItem}>
                              <p style={styles.infoLabel}>Booked On</p>
                              <p style={styles.infoVal}>{formatBookedDateTime(app.bookedAt)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        {!isCanceled && !isLateNoShow ? (
                          <div
                            style={styles.appActions}
                            className="app-actions-container"
                          >
                            <button
                              onClick={() => handleApprove(app)}
                              disabled={approvingId !== null || !["Pending", "Approved", "Reschedule Requested"].includes(app.status)}
                              style={{
                                ...styles.actionBtn,
                                background: app.approved
                                  ? "#10b981"
                                  : "transparent",
                                border: app.approved
                                  ? "none"
                                  : "1px solid #10b981",
                                color: app.approved ? "#fff" : "#10b981",
                                cursor: app.approved ? "default" : "pointer",
                              }}
                            >
                              {approvingId === app.dbId ? "Approving..." : app.status === "Reschedule Requested" ? "Approve Reschedule" : app.approved ? "Approved" : "Approve"}
                            </button>
                            {app.status !== "Reschedule Requested" && (
                              <button style={styles.actionBtnOutline}>
                                Reschedule
                              </button>
                            )}
                            {app.status === "Confirmed" && (
                              <button
                                onClick={() => setLateNoShowAppointment(app)}
                                style={{
                                  ...styles.actionBtnOutline,
                                  borderColor: "#fca5a5",
                                  color: "#fca5a5",
                                  backgroundColor: "rgba(220, 38, 38, 0.12)",
                                }}
                              >
                                Late / No Show
                              </button>
                            )}
                          </div>
                        ) : (
                          <div
                            style={styles.appActions}
                            className="app-actions-container"
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#f87171",
                                fontWeight: "600",
                                paddingRight: "6px",
                                letterSpacing: "0.2px",
                              }}
                            >
                              {isLateNoShow ? "Marked Late / No Show" : "Canceled by Patient"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {!loading && filteredAppointments.length > 0 && (
                <div style={styles.paginationContainer}>
                  <span style={styles.paginationInfo}>
                    Showing {startIndex + 1}-{Math.min(startIndex + appointmentsPerPage, filteredAppointments.length)} of {filteredAppointments.length}
                  </span>
                  <div style={styles.paginationControls}>
                    <button
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            ...styles.paginationButton,
                            ...(currentPage === page ? styles.paginationButtonActive : {}),
                          }}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
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
    padding: "40px",
    backgroundColor: "#F3F9FA",
    minHeight: "calc(100vh - 80px)",
  },
  titleSection: { marginBottom: "30px" },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#087F8C",
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
  calendarCard: { "--ov-on-color": "var(--ov-ink)",
    background: "var(--ov-primary)",
    padding: "20px",
    borderRadius: "15px",
    color: "var(--ov-on-color, #fff)",
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
  summaryCard: { "--ov-on-color": "var(--ov-ink)",
    background: "var(--ov-primary)",
    padding: "25px",
    borderRadius: "15px",
    color: "var(--ov-on-color, #fff)",
  },
  sectionTitle: { fontSize: "14px", fontWeight: "bold", marginBottom: "15px" },
  sumRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid var(--ov-on-line, rgba(255, 255, 255, 0.08))",
    opacity: 0.95,
  },
  rightCol: { display: "flex", flexDirection: "column", gap: "15px", minWidth: 0 },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  listTitle: { fontSize: "16px", fontWeight: "bold", color: "#333" },
  newAppBtn: { "--ov-on-color": "var(--ov-ink)",
    background: "var(--ov-primary)",
    color: "var(--ov-on-color, #fff)",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  appCard: { "--ov-on-color": "var(--ov-ink)",
    background: "var(--ov-primary)",
    borderRadius: "16px",
    padding: "20px 24px",
    color: "var(--ov-on-color, #fff)",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    marginBottom: "16px",
    border: "1px solid var(--ov-on-line, rgba(255, 255, 255, 0.1))",
    boxShadow: "0 8px 24px rgba(8, 127, 140, 0.12)",
    boxSizing: "border-box",
    width: "100%",
  },
  appMain: { width: "100%", minWidth: 0 },
  appHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "18px",
  },
  timeDateGroup: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  appTime: {
    fontSize: "13px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    background: "var(--ov-on-wash, rgba(255, 255, 255, 0.12))",
    padding: "6px 12px",
    borderRadius: "8px",
    letterSpacing: "0.2px",
  },
  appDate: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--ov-on-color, #fff)",
    display: "inline-flex",
    alignItems: "center",
    background: "var(--ov-on-wash, rgba(255, 255, 255, 0.08))",
    padding: "6px 12px",
    borderRadius: "8px",
  },
  statusBadge: {
    fontSize: "11px",
    padding: "5px 13px",
    borderRadius: "20px",
    fontWeight: "700",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  appInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    width: "100%",
  },
  infoItem: {
    minWidth: 0,
    padding: "12px 14px",
    borderRadius: "10px",
    background: "var(--ov-on-wash, rgba(255, 255, 255, 0.06))",
    border: "1px solid var(--ov-on-line, rgba(255, 255, 255, 0.08))",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  infoLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--ov-on-muted, rgba(255,255,255,0.75))",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 5px",
    lineHeight: 1.2,
  },
  infoVal: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--ov-on-color, #fff)",
    margin: 0,
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  appActions: {
    width: "100%",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid var(--ov-on-line, rgba(255, 255, 255, 0.1))",
    boxSizing: "border-box",
  },
  actionBtn: {
    minHeight: "36px",
    padding: "8px 18px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    transition: "0.2s",
    whiteSpace: "nowrap",
  },
  actionBtnOutline: { "--ov-on-color": "#087F8C",
    background: "var(--ov-on-wash, rgba(255, 255, 255, 0.05))",
    color: "var(--ov-on-color, #fff)",
    border: "1px solid var(--ov-on-line, rgba(255, 255, 255, 0.3))",
    minHeight: "36px",
    padding: "8px 18px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    whiteSpace: "nowrap",
    transition: "0.2s",
  },
  modalButton: {
    flex: 1,
    padding: "11px 14px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Manrope', sans-serif",
  },
  paginationContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "16px 4px 0",
    flexWrap: "wrap",
  },
  paginationInfo: { fontSize: "13px", color: "#64748b", fontWeight: "500" },
  paginationControls: { display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" },
  paginationButton: {
    minWidth: "34px",
    height: "34px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #dbe3f0",
    background: "white",
    color: "#087F8C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: "700",
  },
  paginationButtonActive: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", borderColor: "#087F8C" },
  paginationButtonDisabled: { opacity: 0.4, cursor: "not-allowed" },
};

export default StaffAppointments;