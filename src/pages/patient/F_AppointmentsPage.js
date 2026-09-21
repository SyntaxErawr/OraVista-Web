import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LayoutDashboard,
  User,
  CalendarHeart,
  History,
  FileText,
  Settings,
  LogOut,
  Search,
  ChevronDown,
  Calendar,
  AlertTriangle,
  XCircle,
  CreditCard,
  CheckCircle2,
  Save,
  Pencil,
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

function formatBookedDateTime(value) {
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
}

function AppointmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [userData, setUserData] = useState({ id: null, firstName: "User" });

  const [isEditing, setIsEditing] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const editingRef = useRef(false);
  const savingRef = useRef(false);
  const appointmentFetchVersion = useRef(0);
  const [backupAppointments, setBackupAppointments] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDentist, selectedStatus]);

  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showSaveChanges, setShowSaveChanges] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const dentistsList = [
    "Dra. Theresa Madrid",
    "Dra. Ruth Bozar",
    "Dr. Vicente Epres",
    "Dra. Queenie Balmedina",
    "Dra.Paulette Maliit",
  ];

  const statusList = [
    "Confirmed",
    "Pending",
    "Cancelled",
    "Completed",
    "Reschedule Requested",
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchAppointments = useCallback(async (userId) => {
    const version = ++appointmentFetchVersion.current;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-appointments/${userId}`,
      );
      if (response.ok) {
        const data = await response.json();
        const mappedData = data.map((appt) => ({
          ...appt,
          status: appt.status || "Pending",
        }));
        if (!editingRef.current && version === appointmentFetchVersion.current) {
          setAppointments(mappedData);
        }
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  }, []);

  const loadUser = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({ id: user.id, firstName: user.firstName });
      fetchAppointments(user.id);
    }
  }, [fetchAppointments]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!userData.id) return undefined;
    const refresh = () => {
      if (!editingRef.current && !savingRef.current) fetchAppointments(userData.id);
    };
    const intervalId = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
    };
  }, [userData.id, fetchAppointments]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const showFeedback = (message, type = "success") => {
    setFeedbackModal({ show: true, message, type });
  };

  const handleEditClick = () => {
    editingRef.current = true;
    appointmentFetchVersion.current += 1;
    setBackupAppointments(JSON.parse(JSON.stringify(appointments)));
    setIsEditing(true);
  };

  const handleApplyClick = () => setShowSaveChanges(true);

  const handleConfirmSaveChanges = async () => {
    if (savingRef.current) return;
    const modifiedAppointments = appointments.filter((appt) => {
      const original = backupAppointments.find((b) => b.id === appt.id);
      return original && original.status !== appt.status;
    });
    if (modifiedAppointments.length === 0) {
      editingRef.current = false;
      setIsEditing(false);
      setShowSaveChanges(false);
      return;
    }
    savingRef.current = true;
    setIsSavingChanges(true);
    const results = await Promise.allSettled(modifiedAppointments.map(async (appt) => {
      const original = backupAppointments.find((item) => item.id === appt.id);
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appt.id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userData.id, expected_status: original.status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to cancel the appointment.");
      return appt.id;
    }));
    const savedIds = new Set(results.filter((result) => result.status === "fulfilled").map((result) => result.value));
    const failures = results.filter((result) => result.status === "rejected");
    setAppointments(backupAppointments.map((appt) => savedIds.has(appt.id)
      ? { ...appt, status: "Cancelled", reschedule_requested_date: null, reschedule_requested_time: null }
      : appt));
    editingRef.current = false;
    setIsEditing(false);
    setShowSaveChanges(false);
    await fetchAppointments(userData.id);
    savingRef.current = false;
    setIsSavingChanges(false);
    if (failures.length) {
      showFeedback(`${savedIds.size ? `${savedIds.size} cancellation(s) saved. ` : ""}${failures[0].reason.message || "Failed to save changes. Check connection."}`, "error");
    } else {
      showFeedback("Changes saved successfully!", "success");
    }
  };

  const handleDiscardChanges = () => {
    if (savingRef.current) return;
    editingRef.current = false;
    setAppointments(backupAppointments);
    setIsEditing(false);
    setShowSaveChanges(false);
  };

  const handleStatusClick = (appt) => {
    if (!isEditing) return;
    if (appt.status === "Pending") {
      setAppointmentToCancel(appt);
      setShowConfirmCancel(true);
    } else if (appt.status === "Approved" || appt.status === "Confirmed") {
      setAppointmentToCancel(appt);
      setShowCancelWarning(true);
    }
  };

  const proceedToConfirmCancel = () => {
    setShowCancelWarning(false);
    setShowConfirmCancel(true);
  };

  const handleReschedule = (appt) => {
    navigate("/booking", {
      state: {
        mode: "reschedule",
        appointmentId: appt.id,
        currentDentist: appt.dentist_name,
        currentService: appt.service_type,
        currentDate: appt.appointment_date,
        currentTime: appt.appointment_time,
      },
    });
  };

  const confirmCancellation = () => {
    const updatedList = appointments.map((a) =>
      a.id === appointmentToCancel.id ? { ...a, status: "Cancelled" } : a,
    );
    setAppointments(updatedList);
    setShowConfirmCancel(false);
    setAppointmentToCancel(null);
  };

  const canCancelStatus = (status) =>
    isEditing && ["Pending", "Approved", "Confirmed"].includes(status);

  const getStatusStyle = (status) => {
    const base = {
      padding: "6px 14px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "700",
      color: "white",
      display: "inline-block",
      textAlign: "center",
      cursor:
        isEditing &&
        (status === "Pending" ||
          status === "Approved" ||
          status === "Confirmed")
          ? "pointer"
          : "not-allowed",
      transition: "all 0.3s",
      whiteSpace: "nowrap",
      border: canCancelStatus(status)
        ? "2px solid rgba(255,255,255,0.9)"
        : "2px solid transparent",
      boxShadow: canCancelStatus(status)
        ? "0 0 0 3px rgba(255,255,255,0.18)"
        : "none",
    };
    switch (status) {
      case "Approved":
      case "Confirmed":
        return { ...base, backgroundColor: "#10b981" };
      case "Pending":
        return { ...base, backgroundColor: "#ffc107" };
      case "Reschedule Requested":
        return { ...base, backgroundColor: "#007bff" };
      case "Completed":
        return { ...base, backgroundColor: "#cc33cc" };
      case "Cancelled":
        return { ...base, backgroundColor: "#ff4444" };
      default:
        return { ...base, backgroundColor: "#ffc107" };
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    const service = (appt.service_type || "").toLowerCase();
    const dentist = (appt.dentist_name || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = service.includes(search) || dentist.includes(search);
    const matchesDentist = selectedDentist
      ? appt.dentist_name === selectedDentist
      : true;
    const matchesStatus = selectedStatus
      ? appt.status === selectedStatus
      : true;
    return matchesSearch && matchesDentist && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / appointmentsPerPage),
  );
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * appointmentsPerPage;
  const displayedAppointments = isMobile
    ? filteredAppointments
    : filteredAppointments.slice(startIndex, startIndex + appointmentsPerPage);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginationButtonStyle = (disabled) => ({
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#C2E6E6",
    color: "#001166",
    fontWeight: "700",
    fontFamily: "'Poppins', sans-serif",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

  const sidebarWidth = isCollapsed ? "80px" : "260px";

  const getNavItemStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    gap: "15px",
    color: "white",
    textDecoration: "none",
    padding: "12px 15px",
    margin: "5px 0",
    fontSize: "16px",
    cursor: "pointer",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
    backgroundColor:
      location.pathname === path ? "rgba(255, 255, 255, 0.2)" : "transparent",
    fontWeight: location.pathname === path ? "700" : "400",
    borderLeft:
      location.pathname === path ? "4px solid white" : "4px solid transparent",
  });

  const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    boxSizing: "border-box",
  };

  const modalBox = {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "20px",
    textAlign: "center",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  };

  const SidebarContent = () => (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: isCollapsed && !isMobile ? "center" : "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        {(!isCollapsed || isMobile) && (
          <h2 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}>
            OraVista
          </h2>
        )}
        {isMobile ? (
          <div
            onClick={() => setIsMobileOpen(false)}
            style={{ cursor: "pointer" }}
          >
            <X size={24} />
          </div>
        ) : (
          <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ cursor: "pointer" }}
          >
            {isCollapsed ? <Menu size={24} /> : <X size={24} />}
          </div>
        )}
      </div>

      <nav style={{ flexGrow: 1 }}>
        {[
          {
            path: "/dashboard",
            icon: <LayoutDashboard size={20} style={{ flexShrink: 0 }} />,
            label: "Dashboard",
          },
          {
            path: "/profile",
            icon: <User size={20} style={{ flexShrink: 0 }} />,
            label: "Profile",
          },
          {
            path: "/booking",
            icon: <CalendarHeart size={20} style={{ flexShrink: 0 }} />,
            label: "Book an Appointment",
          },
          {
            path: "/appointments",
            icon: <History size={20} style={{ flexShrink: 0 }} />,
            label: "My Appointments",
          },
          {
            path: "/records",
            icon: <FileText size={20} style={{ flexShrink: 0 }} />,
            label: "Records",
          },
          {
            path: "/billings",
            icon: <CreditCard size={20} style={{ flexShrink: 0 }} />,
            label: "Billings",
          },
        ].map(({ path, icon, label }) => (
          <div
            key={path}
            style={getNavItemStyle(path)}
            onClick={() => {
              navigate(path);
              if (isMobile) setIsMobileOpen(false);
            }}
          >
            {icon}
            {(!isCollapsed || isMobile) && (
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {label}
              </span>
            )}
          </div>
        ))}
      </nav>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.2)",
          paddingTop: "10px",
        }}
      >
        <div
          style={getNavItemStyle("/settings")}
          onClick={() => {
            navigate("/settings");
            if (isMobile) setIsMobileOpen(false);
          }}
        >
          <Settings size={20} style={{ flexShrink: 0 }} />
          {(!isCollapsed || isMobile) && "Settings"}
        </div>
        <div
          style={{ ...getNavItemStyle("/logout"), color: "#ff4d4d" }}
          onClick={handleLogout}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {(!isCollapsed || isMobile) && "Logout"}
        </div>
      </div>
    </>
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "white",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <style>{".appointment-cancelable-status { transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; } .appointment-cancelable-status:hover { transform: translateY(-2px) scale(1.04); filter: brightness(1.08); box-shadow: 0 5px 12px rgba(0, 0, 0, 0.24), 0 0 0 3px rgba(255, 255, 255, 0.35) !important; } .appointment-cancelable-status:active { transform: translateY(0) scale(0.98); }"}</style>
      {/* Modals */}
      {feedbackModal.show && (
        <div style={{ ...modalOverlay, zIndex: 4000 }}>
          <div style={modalBox}>
            {feedbackModal.type === "success" ? (
              <CheckCircle2
                size={50}
                color="#28a745"
                style={{ margin: "0 auto 15px" }}
              />
            ) : (
              <XCircle
                size={50}
                color="#ff4d4d"
                style={{ margin: "0 auto 15px" }}
              />
            )}
            <h3
              style={{
                color: "#001166",
                fontWeight: "800",
                marginBottom: "10px",
              }}
            >
              {feedbackModal.type === "success" ? "Done!" : "Error"}
            </h3>
            <p
              style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}
            >
              {feedbackModal.message}
            </p>
            <button
              onClick={() =>
                setFeedbackModal({ ...feedbackModal, show: false })
              }
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#001166",
                color: "white",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {showSaveChanges && (
        <div style={{ ...modalOverlay, zIndex: 3500 }}>
          <div style={modalBox}>
            <Save size={50} color="#001166" style={{ margin: "0 auto 15px" }} />
            <h3 style={{ color: "#001166", fontWeight: "800" }}>
              Save Changes?
            </h3>
            <p
              style={{ color: "#555", fontSize: "14px", marginBottom: "20px" }}
            >
              Do you want to save the changes you made to your appointments?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleDiscardChanges}
                disabled={isSavingChanges}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                No
              </button>
              <button
                onClick={handleConfirmSaveChanges}
                disabled={isSavingChanges}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#001166",
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {isSavingChanges ? "Saving..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelWarning && (
        <div style={{ ...modalOverlay, zIndex: 3000 }}>
          <div style={modalBox}>
            <AlertTriangle
              size={50}
              color="#ff9800"
              style={{ margin: "0 auto 15px" }}
            />
            <h3 style={{ color: "#001166", fontWeight: "800" }}>
              Cancel Policy Warning
            </h3>
            <p
              style={{ color: "#555", fontSize: "14px", marginBottom: "20px" }}
            >
              You can only cancel{" "}
              <strong>one approved appointment per week</strong>. Proceeding may
              affect your ability to book future slots immediately.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowCancelWarning(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Go Back
              </button>
              <button
                onClick={proceedToConfirmCancel}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#ff4d4d",
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmCancel && (
        <div style={{ ...modalOverlay, zIndex: 3000 }}>
          <div style={modalBox}>
            <XCircle
              size={50}
              color="#ff4d4d"
              style={{ margin: "0 auto 15px" }}
            />
            <h3 style={{ color: "#001166", fontWeight: "800" }}>
              Mark for Cancellation?
            </h3>
            <p
              style={{ color: "#555", fontSize: "14px", marginBottom: "20px" }}
            >
              This will mark the appointment with{" "}
              {appointmentToCancel?.dentist_name} as cancelled. Click "Apply" to
              save.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowConfirmCancel(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmCancellation}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#ff4d4d",
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile backdrop */}
      {isMobile && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 1500,
          }}
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          style={{
            width: sidebarWidth,
            backgroundColor: "#001166",
            height: "100vh",
            color: "white",
            padding: "20px 15px",
            position: "fixed",
            transition: "width 0.3s ease",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <SidebarContent />
        </div>
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <div
          style={{
            width: "260px",
            backgroundColor: "#001166",
            height: "100vh",
            color: "white",
            padding: "20px 15px",
            position: "fixed",
            left: isMobileOpen ? 0 : "-260px",
            top: 0,
            transition: "left 0.3s ease",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          <SidebarContent />
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          width: isMobile ? "100%" : `calc(100% - ${sidebarWidth})`,
          transition: "margin-left 0.3s ease",
          boxSizing: "border-box",
        }}
      >
        {/* Mobile Top Bar */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "15px 20px",
              backgroundColor: "#001166",
              color: "white",
              position: "sticky",
              top: 0,
              zIndex: 100,
            }}
          >
            <div
              onClick={() => setIsMobileOpen(true)}
              style={{ cursor: "pointer", marginRight: "15px" }}
            >
              <Menu size={24} />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", margin: 0 }}>
              OraVista
            </h2>
          </div>
        )}

        <div style={{ padding: isMobile ? "20px 16px" : "60px 80px" }}>
          <h1
            style={{
              color: "#001166",
              fontSize: isMobile ? "28px" : "48px",
              fontWeight: "800",
              marginBottom: "6px",
            }}
          >
            My Appointments
          </h1>
          <p
            style={{
              color: "#001166",
              fontWeight: "600",
              marginBottom: isMobile ? "20px" : "40px",
            }}
          >
            Welcome, {userData.firstName}!
          </p>

          {/* Filters Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "24px",
              alignItems: "center",
            }}
          >
            {/* Search */}
            <div
              style={{
                position: "relative",
                flex: isMobile ? "1 1 100%" : "0 0 280px",
                minWidth: isMobile ? "100%" : "200px",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "13px",
                  color: "#666",
                }}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 15px 12px 42px",
                  borderRadius: "30px",
                  border: "none",
                  backgroundColor: "#e8ebf5",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
            </div>

            {/* Dentist filter */}
            <div
              style={{
                position: "relative",
                flex: isMobile ? "1 1 calc(50% - 6px)" : "0 0 auto",
              }}
            >
              <select
                value={selectedDentist}
                onChange={(e) => setSelectedDentist(e.target.value)}
                style={{
                  appearance: "none",
                  backgroundColor: "#e8ebf5",
                  border: "none",
                  padding: "12px 36px 12px 16px",
                  borderRadius: "10px",
                  color: "#001166",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  width: "100%",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <option value="">All Dentists</option>
                {dentistsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "14px",
                  pointerEvents: "none",
                  color: "#001166",
                }}
              />
            </div>

            {/* Status filter */}
            <div
              style={{
                position: "relative",
                flex: isMobile ? "1 1 calc(50% - 6px)" : "0 0 auto",
              }}
            >
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  appearance: "none",
                  backgroundColor: "#e8ebf5",
                  border: "none",
                  padding: "12px 36px 12px 16px",
                  borderRadius: "10px",
                  color: "#001166",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  width: "100%",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <option value="">All Statuses</option>
                {statusList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "14px",
                  pointerEvents: "none",
                  color: "#001166",
                }}
              />
            </div>

            {/* Edit/Apply button */}
            {isEditing ? (
              <button
                onClick={handleApplyClick}
                style={{
                  backgroundColor: "#28a745",
                  border: "none",
                  padding: "12px 28px",
                  borderRadius: "10px",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "'Poppins', sans-serif",
                  marginLeft: isMobile ? 0 : "auto",
                  width: isMobile ? "100%" : "auto",
                  justifyContent: "center",
                }}
              >
                <Save size={16} /> Apply
              </button>
            ) : (
              <button
                onClick={handleEditClick}
                style={{
                  backgroundColor: "#001166",
                  border: "none",
                  padding: "12px 28px",
                  borderRadius: "10px",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "'Poppins', sans-serif",
                  marginLeft: isMobile ? 0 : "auto",
                  width: isMobile ? "100%" : "auto",
                  justifyContent: "center",
                }}
              >
                <Pencil size={16} /> Edit
              </button>
            )}
          </div>

          {/* Appointments Table */}
          <div
            style={{
              backgroundColor: isMobile ? "#e8ebf5" : "#001166",
              borderRadius: "24px",
              padding: isMobile ? "16px 12px" : "40px",
            }}
          >
            <div style={{ overflowX: isMobile ? "visible" : "auto" }}>
            {/* Desktop Table Header */}
            {!isMobile && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(170px, 1.4fr) minmax(180px, 1.4fr) minmax(180px, 1.5fr) minmax(180px, 1.5fr) minmax(110px, 1fr) minmax(130px, 1fr)",
                  columnGap: "24px",
                  minWidth: "1100px",
                  boxSizing: "border-box",
                  padding: "0 28px 20px 28px",
                  color: "white",
                  fontWeight: "800",
                  borderBottom: "2px dashed white",
                  marginBottom: "20px",
                }}
              >
                <div>Date &amp; Time</div>
                <div>Booked On</div>
                <div>Service</div>
                <div>Dentist</div>
                <div>Base Price</div>
                <div style={{ textAlign: "center" }}>Status</div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? "12px" : "18px",
                minWidth: isMobile ? 0 : "1100px",
              }}
            >
              {filteredAppointments.length > 0 ? (
                displayedAppointments.map((appt) =>
                  isMobile ? (
                    /* Mobile Card Layout */
                    <div
                      key={appt.id}
                      style={{
                        backgroundColor: "white",
                        padding: "16px",
                        borderRadius: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color: "#001166",
                              fontWeight: "700",
                              fontSize: "14px",
                            }}
                          >
                            {new Date(appt.appointment_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div style={{ color: "#001166", fontSize: "13px", marginTop: "4px" }}>
                            {formatAppointmentTime(appt.appointment_time)}
                          </div>
                          {appt.status === "Reschedule Requested" && (
                          <div style={{ marginTop: "8px", color: "#0056b3", fontSize: "12px", lineHeight: 1.5 }}>
                            <strong>Requested:</strong>{" "}
                            {appt.reschedule_requested_date
                              ? new Date(String(appt.reschedule_requested_date).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "Date not provided"}
                            <div>{formatAppointmentTime(appt.reschedule_requested_time)}</div>
                          </div>
                        )}
                          <div
                            style={{
                              color: "#333",
                              fontSize: "13px",
                              marginTop: "2px",
                            }}
                          >
                            {appt.service_type}
                          </div>
                          <div style={{ color: "#666", fontSize: "12px", marginTop: "8px", lineHeight: 1.5 }}>
                            <strong>Booked On:</strong> {formatBookedDateTime(appt.created_at)}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                        <span
                          className={
                            canCancelStatus(appt.status)
                              ? "appointment-cancelable-status"
                              : ""
                          }
                          onClick={() => handleStatusClick(appt)}
                          style={getStatusStyle(appt.status)}
                          title={
                            canCancelStatus(appt.status)
                              ? "Click to cancel this appointment"
                              : undefined
                          }
                          aria-label={
                            canCancelStatus(appt.status)
                              ? "Click to cancel this appointment"
                              : `Appointment status: ${appt.status}`
                          }
                        >
                          {appt.status}
                        </span>
                        {appt.status === "Confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleReschedule(appt)}
                            style={{
                              marginTop: "8px",
                              padding: "5px 10px",
                              borderRadius: "8px",
                              border: "1px solid #001166",
                              backgroundColor: "#C2E6E6",
                              color: "#001166",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            Reschedule
                          </button>
                        )}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ color: "#555", fontSize: "13px" }}>
                          {appt.dentist_name}
                        </div>
                        <div
                          style={{
                            color: "#28a745",
                            fontWeight: "700",
                            fontSize: "14px",
                          }}
                        >
                          ₱
                          {appt.amount
                            ? parseFloat(appt.amount).toLocaleString()
                            : "0"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Desktop Row Layout */
                    <div
                      key={appt.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(170px, 1.4fr) minmax(180px, 1.4fr) minmax(180px, 1.5fr) minmax(180px, 1.5fr) minmax(110px, 1fr) minmax(130px, 1fr)",
                        backgroundColor: "white",
                        padding: "26px 28px",
                        borderRadius: "15px",
                        alignItems: "center",
                        columnGap: "24px",
                        minWidth: "922px",
                        boxSizing: "border-box",
                        lineHeight: "1.6",
                        overflowWrap: "anywhere",
                      }}
                    >
                      <div style={{ color: "#001166", fontWeight: "600" }}>
                        {new Date(appt.appointment_date).toLocaleDateString(
                          "en-US",
                          { month: "long", day: "numeric", year: "numeric" },
                        )}
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "400",
                            marginTop: "8px",
                          }}
                        >
                          {formatAppointmentTime(appt.appointment_time)}
                        </div>
                        {appt.status === "Reschedule Requested" && (
                          <div style={{ marginTop: "8px", color: "#0056b3", fontSize: "12px", lineHeight: 1.5 }}>
                            <strong>Requested:</strong>{" "}
                            {appt.reschedule_requested_date
                              ? new Date(String(appt.reschedule_requested_date).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "Date not provided"}
                            <div>{formatAppointmentTime(appt.reschedule_requested_time)}</div>
                          </div>
                        )}
                      </div>
                      <div style={{ color: "#001166", fontSize: "13px", lineHeight: 1.6 }}>
                        {formatBookedDateTime(appt.created_at)}
                      </div>
                      <div style={{ color: "#001166" }}>
                        {appt.service_type}
                      </div>
                      <div style={{ color: "#001166" }}>
                        {appt.dentist_name}
                      </div>
                      <div style={{ color: "#28a745", fontWeight: "700" }}>
                        ₱
                        {appt.amount
                          ? parseFloat(appt.amount).toLocaleString()
                          : "0"}
                      </div>
                      <div
                        style={{
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <span
                          className={
                            canCancelStatus(appt.status)
                              ? "appointment-cancelable-status"
                              : ""
                          }
                          onClick={() => handleStatusClick(appt)}
                          style={getStatusStyle(appt.status)}
                          title={
                            canCancelStatus(appt.status)
                              ? "Click to cancel this appointment"
                              : undefined
                          }
                          aria-label={
                            canCancelStatus(appt.status)
                              ? "Click to cancel this appointment"
                              : `Appointment status: ${appt.status}`
                          }
                        >
                          {appt.status}
                        </span>
                        {appt.status === "Confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleReschedule(appt)}
                            style={{
                              marginTop: "8px",
                              padding: "5px 10px",
                              borderRadius: "8px",
                              border: "1px solid #001166",
                              backgroundColor: "#C2E6E6",
                              color: "#001166",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    </div>
                  ),
                )
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 0",
                    color: isMobile ? "#001166" : "white",
                  }}
                >
                  <Calendar
                    size={50}
                    style={{ opacity: 0.2, marginBottom: "15px" }}
                  />
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>
                    No appointments found.
                  </p>
                </div>
              )}
            </div>

            </div>

            {!isMobile && filteredAppointments.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "24px",
                  color: "white",
                  fontSize: "13px",
                }}
              >
                <span>
                  Showing {startIndex + 1}–
                  {Math.min(startIndex + appointmentsPerPage, filteredAppointments.length)}
                  {" "}of {filteredAppointments.length} appointments
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
                    disabled={activePage === 1}
                    style={paginationButtonStyle(activePage === 1)}
                  >
                    Previous
                  </button>
                  <span>Page {activePage} of {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
                    disabled={activePage === totalPages}
                    style={paginationButtonStyle(activePage === totalPages)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentsPage;
