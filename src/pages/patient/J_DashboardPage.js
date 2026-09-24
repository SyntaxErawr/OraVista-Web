import BrandWordmark from "../../components/BrandWordmark";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  Menu,
  X,
  LayoutDashboard,
  User,
  CalendarHeart,
  History,
  FileText,
  Settings,
  LogOut,
  CreditCard,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

const dentalFacts = [
  "Flossing can remove up to 40% of the plaque between your teeth.",
  "Tooth enamel is the hardest substance in the human body, even harder than bone.",
  "The average person spends about 38.5 days brushing their teeth over a lifetime.",
  "Just like your fingerprints, your tongue print and tooth pattern are completely unique to you.",
  "Your mouth produces about a liter of saliva every single day.",
  "Cotton candy was surprisingly co-invented by a dentist and was originally called 'fairy floss'.",
  "The oldest known dental filling is 6,500 years old and was made of beeswax.",
  "Contrary to the popular myth, George Washington never had wooden teeth.",
  "Your mouth is home to over 6 billion bacteria.",
  "Just because teeth look white doesn't always mean they are completely healthy.",
];

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

function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [appLanguage] = useState(localStorage.getItem("language") || "English");
  const [userData, setUserData] = useState({
    id: null,
    firstName: "User",
    selectedBranch: "Select Branch",
  });
  const [funFact, setFunFact] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [notificationsError, setNotificationsError] = useState("");
  const historyAppointments = appointments.filter(appt =>
    [appt.service_type, appt.dentist_name, appt.status, appt.appointment_date]
      .join(" ").toLowerCase().includes(historySearch.trim().toLowerCase())
  );
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationChoices, setNotificationChoices] = useState({});
  const [cancelModal, setCancelModal] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelDialogRef = useRef(null);
  const actionInProgress = useRef(false);
  const notificationsPerPage = 5;
  const notificationPageCount = Math.max(1, Math.ceil(notifications.length / notificationsPerPage));
  const currentNotificationPage = Math.min(notificationPage, notificationPageCount);
  const visibleNotifications = notifications.slice(
    (currentNotificationPage - 1) * notificationsPerPage,
    currentNotificationPage * notificationsPerPage,
  );

  useEffect(() => {
    setNotificationPage((page) => Math.min(page, notificationPageCount));
  }, [notificationPageCount]);

  useEffect(() => {
    if (!userData.id) return;
    try {
      const saved = JSON.parse(localStorage.getItem(
        `oravista-notification-choices:${userData.id}`,
      ) || "{}");
      setNotificationChoices(saved && typeof saved === "object" ? saved : {});
    } catch {
      setNotificationChoices({});
    }
  }, [userData.id]);

  useEffect(() => {
    const dialog = cancelDialogRef.current;
    if (cancelModal && dialog && !dialog.open) dialog.showModal();
  }, [cancelModal]);

  const rememberNotificationChoice = (notification, choice) => {
    setNotificationChoices((current) => {
      const updated = { ...current, [notification.id]: choice };
      try {
        localStorage.setItem(
          `oravista-notification-choices:${userData.id}`,
          JSON.stringify(updated),
        );
      } catch (error) {
        console.error("Unable to remember notification choice:", error);
      }
      return updated;
    });
  };

  const notificationActionsDisabled = (notification) => {
    const appointment = appointments.find(
      (item) => String(item.id) === String(notification.appointment_id),
    );
    return Boolean(
      notificationChoices[notification.id] ||
      isCancelling ||
      (appointment && appointment.status !== "Late / No Show")
    );
  };


  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchAppointments = useCallback(async (userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-appointments/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid appointments response");
        setAppointments(data);
        setAppointmentsError("");
      } else {
        throw new Error("Appointments request failed");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointmentsError("Appointments could not be loaded. Please retry.");
    }
  }, []);

  const fetchNotifications = useCallback(async (userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid notifications response");
        setNotifications(data);
        setNotificationsError("");
      } else {
        throw new Error("Notifications request failed");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotificationsError("Notifications could not be loaded. Please retry.");
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        id: user.id,
        firstName: user.firstName || "User",
        selectedBranch: user.selectedBranch || "Gil Puyat, Pasay",
      });
      fetchAppointments(user.id);
      fetchNotifications(user.id);
    }
    setFunFact(dentalFacts[Math.floor(Math.random() * dentalFacts.length)]);
  }, [fetchAppointments, fetchNotifications]);

  useEffect(() => {
    if (!userData.id) return undefined;
    const refreshNotifications = () => {
      fetchNotifications(userData.id);
      fetchAppointments(userData.id);
    };
    const intervalId = window.setInterval(refreshNotifications, 30000);
    window.addEventListener("focus", refreshNotifications);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshNotifications);
    };
  }, [userData.id, fetchNotifications, fetchAppointments]);

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const markNotificationRead = async (notificationId) => {
    if (!userData.id) return;
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification,
      ),
    );
    try {
      await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userData.id }),
        },
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleLateNoShowCancel = (notification) => {
    if (notificationActionsDisabled(notification)) return;
    setCancelModal({ notification, stage: "confirm", message: "" });
  };

  const confirmLateNoShowCancel = async () => {
    if (!cancelModal || actionInProgress.current) return;
    const { notification } = cancelModal;
    actionInProgress.current = true;
    setIsCancelling(true);
    setCancelModal((current) => ({ ...current, message: "" }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/${notification.appointment_id}/cancel`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userData.id, expected_status: "Late / No Show" }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to cancel the appointment.");
      rememberNotificationChoice(notification, "cancel");
      await markNotificationRead(notification.id);
      await fetchAppointments(userData.id);
      setCancelModal({ notification, stage: "success", message: "Your appointment has been cancelled." });
    } catch (error) {
      setCancelModal({
        notification,
        stage: "confirm",
        message: error.message || "Unable to cancel the appointment. Please try again.",
      });
    } finally {
      actionInProgress.current = false;
      setIsCancelling(false);
    }
  };

  const handleLateNoShowReschedule = async (notification) => {
    if (actionInProgress.current || notificationActionsDisabled(notification)) return;
    const appointment = appointments.find(
      (item) => String(item.id) === String(notification.appointment_id),
    );
    if (!appointment) {
      navigate("/appointments");
      return;
    }
    actionInProgress.current = true;
    rememberNotificationChoice(notification, "reschedule");
    await markNotificationRead(notification.id);
    actionInProgress.current = false;
    navigate("/booking", {
      state: {
        mode: "reschedule",
        appointmentId: appointment.id,
        currentDentist: appointment.dentist_name,
        currentService: appointment.service_type,
        currentDate: appointment.appointment_date,
        currentTime: appointment.appointment_time,
      },
    });
  };

  const toggleNotifications = () => {
    if (!showNotifications && userData.id) {
      setNotificationPage(1);
      fetchNotifications(userData.id);
      fetchAppointments(userData.id);
    }
    setShowNotifications((isOpen) => !isOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const closeMobileSidebar = () => setIsMobileOpen(false);

  const getAppointmentDateTimeValue = (appointment) => {
    const datePart = String(appointment?.appointment_date || "").slice(0, 10);
    const timeMatch = String(appointment?.appointment_time || "")
      .trim()
      .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart) || !timeMatch) return NaN;

    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    const second = Number(timeMatch[3] || 0);
    const period = timeMatch[4]?.toUpperCase();

    if (
      minute > 59 ||
      second > 59 ||
      hour > (period ? 12 : 23) ||
      (period && hour < 1)
    ) {
      return NaN;
    }

    if (period) hour = hour % 12 + (period === "PM" ? 12 : 0);

    return new Date(
      `${datePart}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}+08:00`
    ).getTime();
  };

  const upcomingAppointments = appointments
    .filter((appointment) => {
      if (!['Pending', 'Approved', 'Confirmed'].includes(appointment.status)) {
        return false;
      }
      const scheduledAt = getAppointmentDateTimeValue(appointment);
      return Number.isFinite(scheduledAt) && scheduledAt > Date.now();
    })
    .sort(
      (a, b) =>
        getAppointmentDateTimeValue(a) - getAppointmentDateTimeValue(b)
    );

  const visibleUpcomingAppointments = upcomingAppointments.slice(0, 2);
  const additionalUpcomingCount = Math.max(0, upcomingAppointments.length - 2);

  const sidebarWidth = isCollapsed ? "80px" : "260px";

  const getNavItemStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      color: "var(--ov-on-color, #fff)",
      textDecoration: "none",
      padding: "12px 15px",
      margin: "5px 0",
      fontSize: "16px",
      cursor: "pointer",
      borderRadius: "10px",
      transition: "all 0.3s ease",
      whiteSpace: "nowrap",
      overflow: "hidden",
      backgroundColor: isActive ? "var(--ov-on-wash, rgba(255, 255, 255, 0.2))" : "transparent",
      fontWeight: isActive ? "700" : "400",
      borderLeft: isActive ? "4px solid #21B9C8" : "4px solid transparent",
    };
  };

  const cardStyle = { "--ov-on-color": "var(--ov-ink)",
    backgroundColor: "var(--ov-primary)",
    borderRadius: "15px",
    padding: "25px",
    color: "var(--ov-on-color, #fff)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "220px",
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
          <h2 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}><BrandWordmark /></h2>
        )}
        {isMobile ? (
          <button className="ov-ui-button" onClick={closeMobileSidebar} style={{ cursor: "pointer" }} type="button" aria-label="Close navigation">
            <X size={24} />
          </button>
        ) : (
          <button className="ov-ui-button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ cursor: "pointer" }}
           type="button" aria-label="Toggle sidebar">
            {isCollapsed ? <Menu size={24} /> : <X size={24} />}
          </button>
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
          <button aria-label={label} aria-current={location.pathname === path ? 'page' : undefined} type="button" className="ov-nav-item"
            key={path}
            style={getNavItemStyle(path)}
            onClick={() => {
              navigate(path);
              if (isMobile) closeMobileSidebar();
            }}
          >
            {icon}
            {(!isCollapsed || isMobile) && (
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {label}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div
        style={{
          borderTop: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))",
          paddingTop: "10px",
        }}
      >
        <button aria-label="Settings" aria-current={location.pathname === "/settings" ? 'page' : undefined} type="button" className="ov-nav-item"
          style={getNavItemStyle("/settings")}
          onClick={() => {
            navigate("/settings");
            if (isMobile) closeMobileSidebar();
          }}
        >
          <Settings size={20} style={{ flexShrink: 0 }} />
          {(!isCollapsed || isMobile) && "Settings"}
        </button>
        <button aria-label="Logout" aria-current={location.pathname === "/logout" ? 'page' : undefined} data-ov-action="logout" type="button" className="ov-nav-item"
          style={{ ...getNavItemStyle("/logout"), color: "#ff4d4d" }}
          onClick={handleLogout}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {(!isCollapsed || isMobile) && "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .patient-search-toggle-btn  { display: none !important; }
        .patient-search-collapsible { display: none !important; }
        .patient-mail-btn { display: none !important; }

        .notification-action-btn:disabled { opacity: 0.45; cursor: not-allowed !important; }
        .notification-page-btn { border: 1px solid #d5dbea; border-radius: 6px; background: white; color: #087F8C; padding: 6px 8px; cursor: pointer; }
        .notification-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .notification-page-btn:not(:disabled):hover { background: #E4F7F9; }
        .notification-cancel-dialog::backdrop { background: rgba(0, 17, 60, 0.5); }
        .notification-modal-btn { padding: 10px 16px; border-radius: 8px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
        .notification-modal-btn:disabled { opacity: 0.5; cursor: wait; }
        .notification-modal-btn:focus-visible { outline: 3px solid #27B8C7; outline-offset: 3px; }

        /* ── MOBILE OVERRIDES ── */
        @media (max-width: 768px) {
          /* ── HEADER FIX ── */
          .patient-header-row {
            flex-direction: row !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 12px !important;
            width: 100% !important;
          }
          .patient-header-text { flex: 1 1 auto; min-width: 0; }
          .patient-header-text h1 {
            font-size: 22px !important; line-height: 1.2 !important; margin: 0 !important;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .patient-header-text p {
            font-size: 12px !important; margin: 3px 0 0 0 !important;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .patient-header-actions {
            display: flex !important; align-items: center !important; gap: 16px !important;
            flex-shrink: 0; padding-top: 2px !important;
          }
          .patient-search-toggle-btn  { display: flex !important; }
          .patient-search-collapsible { display: block !important; width: 100%; }
          .patient-mail-btn { display: block !important; }

          /* ── GRID FIX ── */
          .patient-dashboard-grid { grid-template-columns: 1fr !important; gap: 14px !important; width: 100% !important; }
          .grid-span-3 { grid-column: span 1 !important; }

          /* ── CARDS FIX ── */
          .dashboard-card {
            width: 100% !important; max-width: 100% !important; min-width: 0 !important;
            min-height: auto !important; padding: 18px !important; box-sizing: border-box !important;
          }
          .dashboard-card h3      { font-size: 16px !important; }
          .dashboard-card p       { font-size: 13px !important; }
          .upcoming-date          { font-size: 18px !important; }
          .history-table th,
          .history-table td       { font-size: 11px !important; padding: 7px 4px !important; }
          .book-btn               { padding: 6px 12px !important; font-size: 12px !important; }

          /* Notification dropdown */
          .notif-dropdown { right: 0 !important; width: calc(100vw - 32px) !important; max-width: 300px !important; }
        }
      `}</style>

      {cancelModal && (
        <dialog
          ref={cancelDialogRef}
          className="notification-cancel-dialog"
          aria-labelledby="notification-cancel-title"
          aria-describedby="notification-cancel-description"
          onCancel={(event) => {
            event.preventDefault();
            if (!actionInProgress.current) setCancelModal(null);
          }}
          style={{ border: "none", borderRadius: "18px", padding: "28px", width: "min(440px, calc(100vw - 32px))", color: "#087F8C", fontFamily: "'Manrope', sans-serif", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
        >
          <h2 id="notification-cancel-title" style={{ fontSize: "22px", margin: "0 0 12px" }}>
            {cancelModal.stage === "success" ? "Appointment cancelled" : "Cancel appointment?"}
          </h2>
          <p id="notification-cancel-description" style={{ fontSize: "14px", color: "#555", lineHeight: 1.6, margin: "0 0 20px" }}>
            {cancelModal.stage === "success"
              ? cancelModal.message
              : "Are you sure you want to cancel this late/no-show appointment?"}
          </p>
          {cancelModal.stage !== "success" && cancelModal.message && (
            <p role="alert" style={{ color: "#b91c1c", fontSize: "13px" }}>{cancelModal.message}</p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            {cancelModal.stage === "success" ? (
              <button className="notification-modal-btn" onClick={() => setCancelModal(null)} style={{ "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: "none" }}>Done</button>
            ) : (
              <>
                <button className="notification-modal-btn" disabled={isCancelling} onClick={() => setCancelModal(null)} style={{ background: "white", color: "#087F8C", border: "1px solid #d5dbea" }}>Keep appointment</button>
                <button className="notification-modal-btn" disabled={isCancelling} onClick={confirmLateNoShowCancel} style={{ background: "#dc2626", color: "var(--ov-on-color, #fff)", border: "none" }}>{isCancelling ? "Cancelling…" : "Yes, cancel"}</button>
              </>
            )}
          </div>
        </dialog>
      )}

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          width: "100%",
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        {/* Mobile overlay backdrop */}
        {isMobile && isMobileOpen && (
          <div
            onClick={closeMobileSidebar}
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
          <div className="ov-sidebar"
            style={{ "--ov-on-color": "var(--ov-ink)",
              width: sidebarWidth,
              backgroundColor: "var(--ov-primary)",
              height: "100vh",
              color: "var(--ov-on-color, #fff)",
              padding: "20px 15px",
              display: "flex",
              flexDirection: "column",
              position: "fixed",
              left: 0,
              top: 0,
              transition: "width 0.3s ease",
              zIndex: 1000,
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <SidebarContent />
          </div>
        )}

        {/* Mobile Sidebar Drawer */}
        {isMobile && (
          <div inert={!isMobileOpen} aria-hidden={!isMobileOpen} className="ov-sidebar"
            style={{ "--ov-on-color": "var(--ov-ink)",
              width: "260px",
              backgroundColor: "var(--ov-primary)",
              height: "100vh",
              color: "var(--ov-on-color, #fff)",
              padding: "20px 15px",
              display: "flex",
              flexDirection: "column",
              position: "fixed",
              left: isMobileOpen ? 0 : "-260px",
              top: 0,
              transition: "left 0.3s ease",
              zIndex: 2000,
              boxSizing: "border-box",
              overflowY: "auto",
            }}
          >
            <SidebarContent />
          </div>
        )}

        {/* Main Content */}
        <div className="ov-workspace"
          style={{
            marginLeft: isMobile ? 0 : sidebarWidth,
            width: isMobile ? "100%" : `calc(100% - ${sidebarWidth})`,
            backgroundColor: "white",
            minHeight: "100vh",
            transition: "margin-left 0.3s ease, width 0.3s ease",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          {/* Mobile Top Bar */}
          {isMobile && (
            <div className="ov-color-surface"
              style={{ "--ov-on-color": "var(--ov-ink)",
                display: "flex",
                alignItems: "center",
                padding: "15px 20px",
                backgroundColor: "var(--ov-primary)",
                color: "var(--ov-on-color, #fff)",
                position: "sticky",
                top: 0,
                zIndex: 100,
              }}
            >
              <button className="ov-ui-button"
                onClick={() => setIsMobileOpen(true)}
                style={{ cursor: "pointer", marginRight: "15px" }}
               type="button" aria-label="Open navigation">
                <Menu size={24} />
              </button>
              <h2 style={{ fontSize: "22px", fontWeight: "800", margin: 0 }}><BrandWordmark /></h2>
            </div>
          )}

          <div
            style={{
              padding: isMobile ? "20px 16px" : "40px",
              display: "flex",
              flexDirection: "column",
              gap: "25px",
            }}
          >
            {/* ── HEADER ROW ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
              className="patient-header-row"
            >
              <div className="patient-header-text">
                <h1
                  style={{
                    color: "#087F8C",
                    fontSize: "42px",
                    fontWeight: "800",
                    margin: 0,
                  }}
                >
                  {appLanguage === "Tagalog" ? "Mabuhay" : "Hi"},{" "}
                  {userData.firstName}
                </h1>
                <p
                  style={{
                    color: "#087F8C",
                    fontSize: "18px",
                    marginTop: "5px",
                    margin: 0,
                  }}
                >
                  You're in {userData.selectedBranch} Branch
                </p>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "25px" }}
                className="patient-header-actions"
              >
                {/* Mobile search toggle */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button className="ov-ui-button"
                    style={{ cursor: "pointer", position: "relative" }}
                    onClick={toggleNotifications}
                   aria-expanded={showNotifications} type="button" aria-label="Notifications">
                    <Bell color="#087F8C" size={22} />
                    {unreadNotificationCount > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-8px",
                          minWidth: "16px",
                          height: "16px",
                          padding: "0 3px",
                          backgroundColor: "#ff4d4d",
                          color: "var(--ov-on-color, #fff)",
                          borderRadius: "10px",
                          border: "2px solid white",
                          fontSize: "10px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxSizing: "border-box",
                        }}
                      >
                        {unreadNotificationCount}
                      </div>
                    )}
                  </button>
                  {showNotifications && (
                    <div
                      className="notif-dropdown"
                      style={{
                        position: "absolute",
                        top: "40px",
                        right: "-10px",
                        width: "320px",
                        backgroundColor: "white",
                        boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
                        borderRadius: "15px",
                        padding: "20px",
                        zIndex: 2000,
                        border: "1px solid #f0f0f0",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 15px 0",
                          color: "#087F8C",
                          borderBottom: "2px solid #E4F7F9",
                          paddingBottom: "10px",
                        }}
                      >
                        Notifications
                      </h4>
                      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                        {visibleNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markNotificationRead(notification.id)}
                          style={{
                            marginBottom: "12px",
                            padding: "12px",
                            backgroundColor: notification.is_read ? "#f9f9f9" : "#E4F7F9",
                            borderRadius: "10px",
                            borderLeft: "4px solid #087F8C",
                            cursor: notification.is_read ? "default" : "pointer",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#087F8C",
                              fontWeight: "700",
                            }}
                          >
                            {notification.title}
                          </p>
                          <p
                            style={{
                              margin: "5px 0 0 0",
                              fontSize: "12px",
                              color: "#555",
                              lineHeight: "1.4",
                            }}
                          >
                            {notification.message}
                          </p>
                          {notification.notification_type === "appointment_late_no_show" && (
                            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                              <button
                                className="notification-action-btn"
                                disabled={notificationActionsDisabled(notification)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleLateNoShowCancel(notification);
                                }}
                                style={{ border: "none", borderRadius: "6px", background: "#dc2626", color: "var(--ov-on-color, #fff)", padding: "7px 9px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                              <button
                                className="notification-action-btn"
                                disabled={notificationActionsDisabled(notification)}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleLateNoShowReschedule(notification);
                                }}
                                style={{ "--ov-on-color": "var(--ov-ink)", border: "none", borderRadius: "6px", background: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", padding: "7px 9px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                              >
                                Reschedule
                              </button>
                            </div>
                          )}
                        </div>
                        ))}
                        {notifications.length === 0 && (
                          <p style={{ margin: 0, color: "#777", fontSize: "13px" }}>
                            {notificationsError ? "Notifications are currently unavailable." : "You have no notifications."}
                          </p>
                        )}
                      </div>
                      {notifications.length > notificationsPerPage && (
                        <nav aria-label="Notification pages" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
                          <button className="notification-page-btn" disabled={currentNotificationPage === 1} onClick={() => setNotificationPage(currentNotificationPage - 1)}>Previous</button>
                          <span aria-live="polite" style={{ fontSize: "12px", color: "#087F8C" }}>Page {currentNotificationPage} of {notificationPageCount}</span>
                          <button className="notification-page-btn" disabled={currentNotificationPage === notificationPageCount} onClick={() => setNotificationPage(currentNotificationPage + 1)}>Next</button>
                        </nav>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {appointmentsError && <div className="ov-inline-error" role="alert">{appointmentsError} <button type="button" className="ov-ui-button ov-text-link" onClick={() => fetchAppointments(userData.id)}>Retry appointments</button></div>}
            {notificationsError && <div className="ov-inline-error" role="alert">{notificationsError} <button type="button" className="ov-ui-button ov-text-link" onClick={() => fetchNotifications(userData.id)}>Retry notifications</button></div>}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "25px",
              }}
              className="patient-dashboard-grid"
            >
              <div style={cardStyle} className="dashboard-card ov-panel">
                <h3 style={{ margin: 0, fontSize: "20px" }}>
                  Upcoming Appointments
                </h3>
                <div
                  style={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "10px",
                    width: "100%",
                  }}
                >
                  {visibleUpcomingAppointments.length > 0 ? (
                    <>
                      {visibleUpcomingAppointments.map((upcomingAppt, index) => (
                        <div
                          key={upcomingAppt.id}
                          style={{
                            width: "100%",
                            textAlign: "center",
                            padding:
                              index === 0 && visibleUpcomingAppointments.length > 1
                                ? "0 0 12px 0"
                                : index > 0
                                  ? "12px 0 0 0"
                                  : 0,
                            borderBottom:
                              index === 0 && visibleUpcomingAppointments.length > 1
                                ? "1px solid var(--ov-on-line, rgba(255,255,255,0.2))"
                                : "none",
                          }}
                        >
                          <p
                            className="upcoming-date"
                            style={{
                              margin: "0 0 5px 0",
                              fontSize: "22px",
                              fontWeight: "700",
                              color: "#10b981",
                            }}
                          >
                            {new Date(
                              upcomingAppt.appointment_date
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p
                            style={{
                              margin: "0 0 5px 0",
                              fontSize: "15px",
                              fontWeight: "600",
                            }}
                          >
                            {formatAppointmentTime(upcomingAppt.appointment_time)}
                          </p>
                          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
                            {upcomingAppt.service_type}
                          </p>
                        </div>
                      ))}
                      {additionalUpcomingCount > 0 && (
                        <p
                          style={{
                            margin: "12px 0 0 0",
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "#10b981",
                          }}
                        >
                          +{additionalUpcomingCount} more
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ opacity: 0.8 }}>No upcoming appointments</p>
                  )}
                </div>
              </div>

              <div style={cardStyle} className="dashboard-card ov-panel">
                <h3 style={{ margin: 0, fontSize: "20px" }}>
                  Today's Fun Fact
                </h3>
                <div
                  style={{
                    textAlign: "center",
                    flexGrow: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <p
                    style={{
                      fontStyle: "italic",
                      fontSize: "15px",
                      padding: "0 10px",
                    }}
                  >
                    Did you know? {funFact}
                  </p>
                </div>
              </div>

              <div style={cardStyle} className="dashboard-card ov-panel">
                <h3 style={{ margin: 0, fontSize: "20px" }}>
                  Dental Summary
                </h3>
                <div
                  style={{
                    textAlign: "center",
                    flexGrow: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <p style={{ opacity: 0.8 }}>
                    No dental records yet. Your first visit will create your
                    dental summary.
                  </p>
                </div>
              </div>

              {/* Full-width appointment history */}
              <div
                style={{
                  ...cardStyle,
                  gridColumn: "span 3",
                  minHeight: "250px",
                  marginTop: "10px",
                  justifyContent: "flex-start",
                }}
                className="dashboard-card grid-span-3 ov-panel"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "20px" }}>
                    My Appointment History
                  </h3>
                  <button
                    className="book-btn"
                    onClick={() => navigate("/booking")}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: "white",
                      color: "#087F8C",
                      border: "none",
                      borderRadius: "20px",
                      fontWeight: "700",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Book Appointment
                  </button>
                </div>
                <label className="ov-field-label" htmlFor="history-search">Search appointment history</label>
                <div className="ov-search-field">
                  <Search size={18} aria-hidden="true" />
                  <input id="history-search" type="search" value={historySearch} onChange={event => setHistorySearch(event.target.value)} placeholder="Search service, dentist, status or date" />
                </div>
                <div
                  style={{
                    overflowX: "auto",
                    overflowY: "auto",
                    maxHeight: "180px",
                  }}
                >
                  {historyAppointments.length > 0 ? (
                    <table
                      className="history-table"
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "14px",
                        textAlign: "left",
                        minWidth: "420px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.3))",
                          }}
                        >
                          <th
                            style={{
                              paddingBottom: "10px",
                              fontWeight: "600",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Date
                          </th>
                          <th
                            style={{
                              paddingBottom: "10px",
                              fontWeight: "600",
                            }}
                          >
                            Service
                          </th>
                          <th
                            style={{
                              paddingBottom: "10px",
                              fontWeight: "600",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Dentist
                          </th>
                          <th
                            style={{
                              paddingBottom: "10px",
                              fontWeight: "600",
                              textAlign: "right",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyAppointments.map((appt) => (
                          <tr
                            key={appt.id}
                            style={{
                              borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.1))",
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 0",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {new Date(
                                appt.appointment_date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                              <div style={{ marginTop: "4px", fontSize: "12px", fontWeight: "400" }}>
                                {formatAppointmentTime(appt.appointment_time)}
                              </div>
                            </td>
                            <td style={{ padding: "10px 0" }}>
                              {appt.service_type}
                            </td>
                            <td
                              style={{
                                padding: "10px 0",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {appt.dentist_name}
                            </td>
                            <td
                              style={{
                                padding: "10px 0",
                                textAlign: "right",
                                fontWeight: "700",
                                whiteSpace: "nowrap",
                                color:
                                  appt.status === "Pending"
                                    ? "#ffc107"
                                    : appt.status === "Cancelled"
                                    ? "#ff4d4d"
                                    : appt.status === "Completed"
                                    ? "var(--ov-completed, #2864c5)"
                                    : "#10b981",
                              }}
                            >
                              {appt.status || "Pending"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        height: "100px",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ fontSize: "14px", opacity: 0.8, margin: 0 }}>
                        {appointmentsError ? "Appointment history is currently unavailable." : historySearch ? "No appointments match your search. Try another keyword." : "You have no appointments yet. Book your first appointment now."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;
