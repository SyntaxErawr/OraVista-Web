import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Mail,
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
  ChevronUp,
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [appLanguage] = useState(localStorage.getItem("language") || "English");
  const [userData, setUserData] = useState({
    id: null,
    firstName: "User",
    selectedBranch: "Select Branch",
  });
  const [funFact, setFunFact] = useState("");
  const [appointments, setAppointments] = useState([]);
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
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async (userId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
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

  const upcomingAppt = appointments.find((a) =>
    ["Pending", "Approved", "Confirmed"].includes(a.status)
  );

  const sidebarWidth = isCollapsed ? "80px" : "260px";

  const getNavItemStyle = (path) => {
    const isActive = location.pathname === path;
    return {
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
      backgroundColor: isActive ? "rgba(255, 255, 255, 0.2)" : "transparent",
      fontWeight: isActive ? "700" : "400",
      borderLeft: isActive ? "4px solid white" : "4px solid transparent",
    };
  };

  const cardStyle = {
    backgroundColor: "#001166",
    borderRadius: "15px",
    padding: "25px",
    color: "white",
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
          <h2 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}>
            OraVista
          </h2>
        )}
        {isMobile ? (
          <div onClick={closeMobileSidebar} style={{ cursor: "pointer" }}>
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
              if (isMobile) closeMobileSidebar();
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
            if (isMobile) closeMobileSidebar();
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
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .patient-search-toggle-btn  { display: none !important; }
        .patient-search-collapsible { display: none !important; }
        .patient-mail-btn { display: none !important; }

        .notification-action-btn:disabled { opacity: 0.45; cursor: not-allowed !important; }
        .notification-page-btn { border: 1px solid #d5dbea; border-radius: 6px; background: white; color: #001166; padding: 6px 8px; cursor: pointer; }
        .notification-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .notification-page-btn:not(:disabled):hover { background: #f0f4ff; }
        .notification-cancel-dialog::backdrop { background: rgba(0, 17, 60, 0.5); }
        .notification-modal-btn { padding: 10px 16px; border-radius: 8px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
        .notification-modal-btn:disabled { opacity: 0.5; cursor: wait; }
        .notification-modal-btn:focus-visible { outline: 3px solid #63a9ed; outline-offset: 3px; }

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
          style={{ border: "none", borderRadius: "18px", padding: "28px", width: "min(440px, calc(100vw - 32px))", color: "#001166", fontFamily: "'Poppins', sans-serif", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
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
              <button className="notification-modal-btn" onClick={() => setCancelModal(null)} style={{ background: "#001166", color: "white", border: "none" }}>Done</button>
            ) : (
              <>
                <button className="notification-modal-btn" disabled={isCancelling} onClick={() => setCancelModal(null)} style={{ background: "white", color: "#001166", border: "1px solid #d5dbea" }}>Keep appointment</button>
                <button className="notification-modal-btn" disabled={isCancelling} onClick={confirmLateNoShowCancel} style={{ background: "#dc2626", color: "white", border: "none" }}>{isCancelling ? "Cancelling…" : "Yes, cancel"}</button>
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
          fontFamily: "'Poppins', sans-serif",
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
          <div
            style={{
              width: sidebarWidth,
              backgroundColor: "#001166",
              height: "100vh",
              color: "white",
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
          <div
            style={{
              width: "260px",
              backgroundColor: "#001166",
              height: "100vh",
              color: "white",
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
        <div
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
                    color: "#001166",
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
                    color: "#001166",
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
                <button
                  className="patient-search-toggle-btn"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#001166",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isSearchOpen ? (
                    <ChevronUp size={22} />
                  ) : (
                    <Search size={22} />
                  )}
                </button>

                <Mail
                  className="patient-mail-btn"
                  color="#001166"
                  size={22}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                  onClick={() => alert("Inbox is currently empty.")}
                />

                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{ cursor: "pointer", position: "relative" }}
                    onClick={toggleNotifications}
                  >
                    <Bell color="#001166" size={22} />
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
                          color: "white",
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
                  </div>
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
                          color: "#001166",
                          borderBottom: "2px solid #f0f4ff",
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
                            backgroundColor: notification.is_read ? "#f9f9f9" : "#f0f4ff",
                            borderRadius: "10px",
                            borderLeft: "4px solid #001166",
                            cursor: notification.is_read ? "default" : "pointer",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#001166",
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
                                style={{ border: "none", borderRadius: "6px", background: "#dc2626", color: "white", padding: "7px 9px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
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
                                style={{ border: "none", borderRadius: "6px", background: "#001166", color: "white", padding: "7px 9px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                              >
                                Reschedule
                              </button>
                            </div>
                          )}
                        </div>
                        ))}
                        {notifications.length === 0 && (
                          <p style={{ margin: 0, color: "#777", fontSize: "13px" }}>
                            You have no notifications.
                          </p>
                        )}
                      </div>
                      {notifications.length > notificationsPerPage && (
                        <nav aria-label="Notification pages" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
                          <button className="notification-page-btn" disabled={currentNotificationPage === 1} onClick={() => setNotificationPage(currentNotificationPage - 1)}>Previous</button>
                          <span aria-live="polite" style={{ fontSize: "12px", color: "#001166" }}>Page {currentNotificationPage} of {notificationPageCount}</span>
                          <button className="notification-page-btn" disabled={currentNotificationPage === notificationPageCount} onClick={() => setNotificationPage(currentNotificationPage + 1)}>Next</button>
                        </nav>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible search (mobile only) */}
            {isSearchOpen && (
              <div className="patient-search-collapsible">
                <div style={{ position: "relative", width: "100%" }}>
                  <Search
                    style={{
                      position: "absolute",
                      left: "15px",
                      top: "12px",
                      color: "#666",
                    }}
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search here..."
                    style={{
                      padding: "12px 15px 12px 45px",
                      borderRadius: "25px",
                      border: "1px solid #ddd",
                      backgroundColor: "#f0f2f5",
                      width: "100%",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {/* ── DASHBOARD GRID ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "25px",
              }}
              className="patient-dashboard-grid"
            >
              <div style={cardStyle} className="dashboard-card">
                <h3 style={{ margin: 0, fontSize: "20px" }}>
                  Upcoming Appointment
                </h3>
                <div
                  style={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "10px",
                  }}
                >
                  {upcomingAppt ? (
                    <>
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
                    </>
                  ) : (
                    <p style={{ opacity: 0.8 }}>No upcoming appointment</p>
                  )}
                </div>
              </div>

              <div style={cardStyle} className="dashboard-card">
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

              <div style={cardStyle} className="dashboard-card">
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
                className="dashboard-card grid-span-3"
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
                      color: "#001166",
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
                <div
                  style={{
                    overflowX: "auto",
                    overflowY: "auto",
                    maxHeight: "180px",
                  }}
                >
                  {appointments.length > 0 ? (
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
                            borderBottom: "1px solid rgba(255,255,255,0.3)",
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
                        {appointments.map((appt) => (
                          <tr
                            key={appt.id}
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.1)",
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
                        You have no appointments yet. Book your first
                        appointment now.
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
