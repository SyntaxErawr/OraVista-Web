import React, { useState, useEffect, useCallback } from "react";
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
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isReschedule = location.state?.mode === "reschedule";
  const rescheduleAppointment = location.state;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userData, setUserData] = useState({
    id: null,
    firstName: "User",
    branch: "",
  });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [bookingData, setBookingData] = useState({
    mainService: "",
    specificService: "",
    dentist: "",
    date: "",
    time: "",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date());

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const currentMonthName = viewDate.toLocaleString("default", {
    month: "long",
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const generateWeekdaySchedule = () => {
    const schedule = [];
    const startMonth = today.getMonth();
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(today.getFullYear(), startMonth + i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const daysInThisMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInThisMonth; day++) {
        const date = new Date(year, month, day);
        if (date >= new Date(today.setHours(0, 0, 0, 0))) {
          schedule.push(formatDate(date));
        }
      }
    }
    return schedule;
  };

  const mockSchedule = generateWeekdaySchedule();

  const servicesData = {
    "General Dentistry": [
      { name: "Oral Prophylaxis", price: 1500, duration: "(30 mins)" },
      { name: "Restoration", price: 1200, duration: "(1hr)" },
      { name: "Extraction", price: 1000, duration: "(1hr)" },
    ],
    Orthodontics: [
      { name: "Braces Installation", price: 35000, duration: "(1hr)" },
      { name: "Braces Adjustment", price: 1000, duration: "(30 mins)" },
      { name: "Veneers", price: 15000, duration: "(2hrs)" },
    ],
    "Restorative Treatment": [
      { name: "Root Canal (RCT)", price: 8000, duration: "(2hrs)" },
      { name: "Wisdom Tooth Surgery", price: 10000, duration: "(3hrs)" },
      { name: "Dentures", price: 5000, duration: "(30 mins)" },
      { name: "Fixed Bridge", price: 12000, duration: "(2hrs)" },
      { name: "Teeth Whitening", price: 7000, duration: "(1hr 30mins)" },
    ],
  };

  const branchDentists = {
    "Gil Puyat, Pasay": [
      { name: "Dra. Theresa Madrid", available: true, schedule: mockSchedule },
      {
        name: "Dra. Ruth Bozar",
        available: true,
        schedule: mockSchedule,
      },
      {
        name: "Dr. Vicente Epres",
        available: true,
        schedule: mockSchedule,
      },
      {
        name: "Dra. Queenie Balmedina",
        available: true,
        schedule: mockSchedule,
      },
    ],
    "Sta. Ana, Manila": [
      {
        name: "Dra. Queenie Balmedina",
        available: true,
        schedule: mockSchedule,
      },
      {
        name: "Dr. Vicente Epres",
        available: true,
        schedule: mockSchedule,
      },
    ],
    "Angeles, Pampanga": [
      {
        name: "Dra.Paulette Maliit",
        available: true,
        schedule: mockSchedule,
      },
      {
        name: "Dr. Vicente Epres",
        available: true,
        schedule: mockSchedule,
      },
    ],
  };

  // Legacy patient records may still use "Main Branch". It is the Gil Puyat,
  // Pasay branch and therefore uses the same dentist roster.
  const selectedBranch =
    userData.branch === "Main Branch" ? "Gil Puyat, Pasay" : userData.branch;
  const filteredDentists = branchDentists[selectedBranch] || [];

  useEffect(() => {
    if (!isReschedule || !rescheduleAppointment?.currentService) return;
    const matchingMainService = Object.keys(servicesData).find((category) =>
      servicesData[category].some(
        (service) => service.name === rescheduleAppointment.currentService,
      ),
    );
    setBookingData((current) => ({
      ...current,
      mainService: matchingMainService || current.mainService,
      specificService: rescheduleAppointment.currentService || current.specificService,
      dentist: rescheduleAppointment.currentDentist || current.dentist,
      date: rescheduleAppointment.currentDate
        ? String(rescheduleAppointment.currentDate).slice(0, 10)
        : current.date,
      time: rescheduleAppointment.currentTime || current.time,
    }));
    if (rescheduleAppointment.currentDate) {
      const requestedDate = new Date(rescheduleAppointment.currentDate);
      if (!Number.isNaN(requestedDate.getTime())) setViewDate(requestedDate);
    }
  }, [isReschedule, rescheduleAppointment]);

  const generateTimeSlots = (service, selectedDate) => {
    if (!selectedDate) return [];
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay();
    const slots = [
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "01:00 PM",
      "01:30 PM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
      "04:30 PM",
    ];
    if (dayOfWeek === 0) slots.push("05:00 PM");
    return slots;
  };

  const loadUser = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        id: user.id,
        firstName: user.firstName || "User",
        branch: user.selectedBranch || user.branch || "Gil Puyat, Pasay",
      });
    }
  }, []);

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const modifier = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${modifier}`;
  };

  const getDurationFromService = (serviceName) => {
    if (!serviceName) return 30;
    for (const key in servicesData) {
      const svc = servicesData[key].find(
        (s) =>
          s.name === serviceName || `${s.name} ${s.duration}` === serviceName,
      );
      if (svc) {
        const text = svc.duration.toLowerCase().replace(/[()]/g, "");
        if (text.includes("hr") && text.includes("30mins")) return 90;
        if (text.includes("hr")) return parseFloat(text) * 60;
        if (text.includes("min")) return parseFloat(text);
      }
    }
    const durationMatch = serviceName.match(/\(([^)]+)\)/);
    if (!durationMatch) return 30;
    const text = durationMatch[1].toLowerCase();
    if (text.includes("hr") && text.includes("30mins")) return 90;
    if (text.includes("hr")) return parseFloat(text) * 60;
    if (text.includes("min")) return parseFloat(text);
    return 30;
  };

  const getSelectedServicePrice = () => {
    if (!bookingData.mainService || !bookingData.specificService) return 0;
    const svc = servicesData[bookingData.mainService].find(
      (s) => s.name === bookingData.specificService,
    );
    return svc ? svc.price : 0;
  };

  const selectedServicePrice = getSelectedServicePrice();

  const fetchBookedSlots = useCallback(async () => {
    if (!bookingData.date || !bookingData.dentist) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/check-availability?date=${bookingData.date}&dentist=${encodeURIComponent(bookingData.dentist)}${isReschedule && rescheduleAppointment?.appointmentId ? `&excludeAppointmentId=${rescheduleAppointment.appointmentId}` : ""}`,
      );
      const data = await response.json();
      const allOccupiedMinutes = [];
      data.forEach((app) => {
        const start = timeToMinutes(app.time);
        const duration = getDurationFromService(app.service);
        for (let i = 0; i < duration; i += 30)
          allOccupiedMinutes.push(start + i);
      });
      setBookedSlots(allOccupiedMinutes);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.date, bookingData.dentist, isReschedule, rescheduleAppointment?.appointmentId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);
  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const handleDiscard = () => {
    setBookingData({
      mainService: "",
      specificService: "",
      dentist: "",
      date: "",
      time: "",
    });
  };

  const handleFinalSubmit = async () => {
    if (isReschedule) {
      if (
        !rescheduleAppointment?.appointmentId ||
        !userData.id ||
        !bookingData.date ||
        !bookingData.time
      ) {
        setRescheduleError(
          "Please select a date and time before submitting the reschedule request.",
        );
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/request-reschedule`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointment_id: rescheduleAppointment.appointmentId,
              user_id: userData.id,
              requested_date: bookingData.date,
              requested_time: bookingData.time,
            }),
          },
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            result.message || "The reschedule request could not be submitted.",
          );
        }
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        setRescheduleError("");
      } catch (error) {
        console.error("Reschedule Error:", error);
        setRescheduleError(
          error.message ||
            "The reschedule request could not be submitted. Please try again.",
        );
      }
      return;
    }

    const appointmentData = {
      user_id: userData.id,
      service_type: bookingData.specificService,
      dentist_name: bookingData.dentist,
      appointment_date: bookingData.date,
      appointment_time: bookingData.time,
      amount: selectedServicePrice,
      branch: selectedBranch,
    };
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/book-appointment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData),
        },
      );
      if (response.ok) {
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        handleDiscard();
        fetchBookedSlots();
      }
    } catch (error) {
      console.error("Connection Error:", error);
    }
  };

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

  const currentDentist = filteredDentists.find(
    (d) => d.name === bookingData.dentist,
  );
  const timeSlots = generateTimeSlots(
    bookingData.specificService,
    bookingData.date,
  );
  const selectedDuration = bookingData.specificService
    ? getDurationFromService(bookingData.specificService)
    : 0;
  const startTimeMins = timeToMinutes(bookingData.time);
  const endTimeStr = minutesToTime(startTimeMins + selectedDuration);

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

  const selectStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontFamily: "'Poppins', sans-serif",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    color: isMobile ? "#001166" : "white",
    fontWeight: "700",
    marginBottom: "10px",
    display: "block",
    fontSize: "14px",
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
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Modals */}
      {showConfirmModal && (
        <div style={{ ...modalOverlay, zIndex: 2000 }}>
          <div style={{ ...modalBox, textAlign: "left" }}>
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <AlertTriangle
                size={50}
                color="#001166"
                style={{ margin: "0 auto 10px" }}
              />
              <h3 style={{ color: "#001166", fontWeight: "800", margin: 0 }}>
                {isReschedule ? "Submit Reschedule Request?" : "Confirm Appointment?"}
              </h3>
            </div>
            <div
              style={{
                borderTop: "1px solid #eee",
                borderBottom: "1px solid #eee",
                padding: "15px 0",
                margin: "15px 0",
              }}
            >
              <p style={{ fontSize: "14px", margin: "5px 0" }}>
                <strong>Service:</strong> {bookingData.specificService}
              </p>
              <p style={{ fontSize: "14px", margin: "5px 0" }}>
                <strong>Dentist:</strong> {bookingData.dentist}
              </p>
              <p style={{ fontSize: "14px", margin: "5px 0" }}>
                <strong>{isReschedule ? "Requested date" : "Date"}:</strong> {bookingData.date}
              </p>
              <p style={{ fontSize: "14px", margin: "5px 0" }}>
                <strong>Time:</strong> {bookingData.time} - {endTimeStr}
              </p>
              <p
                style={{
                  fontSize: "15px",
                  margin: "10px 0 0 0",
                  color: "#28a745",
                  fontWeight: "800",
                }}
              >
                <strong>Base Price:</strong> ₱
                {selectedServicePrice.toLocaleString()}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
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
                {isReschedule ? "Submit Request" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div style={{ ...modalOverlay, zIndex: 2100 }}>
          <div style={modalBox}>
            <CheckCircle2
              size={50}
              color="#28a745"
              style={{ margin: "0 auto 15px" }}
            />
            <h3 style={{ color: "#001166", fontWeight: "800" }}>
              {isReschedule ? "Reschedule Request Submitted!" : "Appointment Booked!"}
            </h3>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#001166",
                color: "white",
                cursor: "pointer",
                marginTop: "15px",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Close
            </button>
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
          transition: "margin-left 0.3s ease, width 0.3s ease",
          backgroundColor: "white",
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

        <div style={{ padding: isMobile ? "20px 16px" : "40px" }}>
          <h1
            style={{
              color: "#001166",
              fontSize: isMobile ? "28px" : "42px",
              fontWeight: "800",
              margin: 0,
            }}
          >
            {isReschedule ? "Reschedule Appointment" : "Book Now"}
          </h1>
          <p
            style={{
              color: "#001166",
              fontWeight: "600",
              marginTop: "8px",
              fontSize: "14px",
            }}
          >
            {isReschedule
              ? "Choose a new date and time for your confirmed appointment."
              : `Welcome, ${userData.firstName}! (${selectedBranch || "Branch not set"})`}
          </p>

          <div
            style={{
              backgroundColor: isMobile ? "#e8ebf5" : "#001166",
              borderRadius: isMobile ? "20px" : "40px",
              padding: isMobile ? "20px 16px" : "50px",
              marginTop: "24px",
            }}
          >
            {/* Top Row: Services, Dentist, Date */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                gap: isMobile ? "16px" : "30px",
                marginBottom: isMobile ? "20px" : "40px",
              }}
            >
              <div>
                <label style={labelStyle}>Services</label>
                <select
                  style={selectStyle}
                  value={bookingData.mainService}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      mainService: e.target.value,
                      specificService: "",
                      dentist: "",
                      date: "",
                      time: "",
                    })
                  }
                  disabled={isReschedule}
                >
                  <option value="">Select Service</option>
                  {Object.keys(servicesData).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Available Dentist</label>
                <select
                  style={{
                    ...selectStyle,
                    cursor: bookingData.mainService ? "pointer" : "not-allowed",
                    opacity: bookingData.mainService ? 1 : 0.6,
                  }}
                  value={bookingData.dentist}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      dentist: e.target.value,
                      date: "",
                      time: "",
                    })
                  }
                  disabled={!bookingData.mainService || isReschedule}
                >
                  <option value="">Select Dentist</option>
                  {filteredDentists.length > 0 ? (
                    filteredDentists.map((d) => (
                      <option
                        key={d.name}
                        value={d.name}
                        disabled={!d.available}
                      >
                        {d.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No dentists for your branch</option>
                  )}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Available Slot</label>
                <select
                  style={selectStyle}
                  value={bookingData.date}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      date: e.target.value,
                      time: "",
                    })
                  }
                  disabled={!bookingData.dentist}
                >
                  <option value="">Select Date</option>
                  {currentDentist?.schedule.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom Row: Choose Type, Calendar, Time */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                gap: isMobile ? "20px" : "30px",
              }}
            >
              {/* Choose Type */}
              <div>
                <label style={labelStyle}>Choose Type</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {bookingData.mainService &&
                    servicesData[bookingData.mainService].map((type) => (
                      <button
                        key={type.name}
                        onClick={() =>
                          !isReschedule && setBookingData({
                            ...bookingData,
                            specificService: type.name,
                          })
                        }
                        disabled={isReschedule}
                        style={{
                          padding: "14px",
                          borderRadius: "12px",
                          border: "none",
                          textAlign: "left",
                          cursor: isReschedule ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          fontFamily: "'Poppins', sans-serif",
                          backgroundColor:
                            bookingData.specificService === type.name
                              ? (isMobile ? "#001166" : "#C2E6E6")
                              : "#f0f2f8",
                          color:
                            bookingData.specificService === type.name
                              ? (isMobile ? "white" : "#001166")
                              : "#001166",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                          opacity: isReschedule ? 0.75 : 1,
                        }}
                      >
                        <span>
                          {type.name} {type.duration}
                        </span>
                        <span style={{ flexShrink: 0, marginLeft: "8px" }}>
                          ₱{type.price.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  {!bookingData.mainService && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: isMobile ? "#888" : "#C2E6E6",
                      }}
                    >
                      Please select a service category first.
                    </p>
                  )}
                </div>
              </div>

              {/* Calendar */}
              <div>
                <label style={labelStyle}>Dentist Schedule</label>
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "15px",
                    padding: "15px",
                    border: "1px solid #ddd",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <button
                      onClick={() =>
                        setViewDate(new Date(currentYear, currentMonth - 1, 1))
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#001166",
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <p
                      style={{
                        fontWeight: "800",
                        textAlign: "center",
                        margin: 0,
                        fontSize: "13px",
                      }}
                    >
                      {currentMonthName} {currentYear}
                    </p>
                    <button
                      onClick={() =>
                        setViewDate(new Date(currentYear, currentMonth + 1, 1))
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#001166",
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "2px",
                      textAlign: "center",
                    }}
                  >
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div
                        key={i}
                        style={{
                          fontWeight: "700",
                          fontSize: "11px",
                          paddingBottom: "5px",
                        }}
                      >
                        {d}
                      </div>
                    ))}
                    {[...Array(firstDayOfMonth)].map((_, i) => (
                      <div key={`empty-${i}`}></div>
                    ))}
                    {[...Array(daysInMonth)].map((_, i) => {
                      const currentDayDate = new Date(
                        currentYear,
                        currentMonth,
                        i + 1,
                      );
                      const dayStr = formatDate(currentDayDate);
                      const isAvailable =
                        currentDentist?.schedule.includes(dayStr);
                      const isSelected = bookingData.date === dayStr;
                      return (
                        <div
                          key={i}
                          onClick={() =>
                            isAvailable &&
                            setBookingData({
                              ...bookingData,
                              date: dayStr,
                              time: "",
                            })
                          }
                          style={{
                            padding: "7px 0",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: isAvailable ? "pointer" : "default",
                            backgroundColor: isSelected
                              ? "#001166"
                              : isAvailable
                                ? "#e8ebf5"
                                : "transparent",
                            color: isSelected
                              ? "white"
                              : isAvailable
                                ? "#001166"
                                : "#ccc",
                          }}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <label style={{ ...labelStyle, margin: 0 }}>
                    Choose Time
                  </label>
                  <button
                    onClick={fetchBookedSlots}
                    disabled={
                      !bookingData.date || !bookingData.dentist || isRefreshing
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      color: isMobile ? "#001166" : "white",
                      fontSize: "12px",
                      fontWeight: "600",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    <RotateCw
                      size={14}
                      className={isRefreshing ? "animate-spin" : ""}
                    />{" "}
                    Refresh
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  {bookingData.date ? (
                    timeSlots.map((t) => {
                      const currentMinutes = timeToMinutes(t);
                      const isTaken = bookedSlots.includes(currentMinutes);
                      return (
                        <button
                          key={t}
                          onClick={() =>
                            !isTaken &&
                            setBookingData({ ...bookingData, time: t })
                          }
                          disabled={isTaken}
                          style={{
                            padding: "11px 8px",
                            borderRadius: "10px",
                            border: "none",
                            fontWeight: "600",
                            fontSize: "12px",
                            cursor: isTaken ? "not-allowed" : "pointer",
                            fontFamily: "'Poppins', sans-serif",
                            backgroundColor: isTaken
                              ? "#ccc"
                              : bookingData.time === t
                                ? (isMobile ? "#001166" : "#C2E6E6")
                                : "white",
                            color: isTaken
                              ? "#888"
                              : bookingData.time === t
                                ? (isMobile ? "white" : "#001166")
                                : "#001166",
                            opacity: isTaken ? 0.6 : 1,
                          }}
                        >
                          {t}
                          {isTaken && " (Occupied)"}
                        </button>
                      );
                    })
                  ) : (
                    <p
                      style={{
                        fontSize: "12px",
                        color: isMobile ? "#666" : "#C2E6E6",
                        gridColumn: "span 2",
                      }}
                    >
                      Please select a date first.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "32px",
              }}
            >
              <button
                onClick={handleDiscard}
                style={{
                  padding: "12px 30px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#ff4d4d",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Cancel Booking
              </button>
              <button
                onClick={() => {
                  setRescheduleError("");
                  setShowConfirmModal(true);
                }}
                disabled={!bookingData.time}
                style={{
                  padding: "12px 30px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#28a745",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                  opacity: !bookingData.time ? 0.6 : 1,
                  fontFamily: "'Poppins', sans-serif",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                {isReschedule ? "Submit Reschedule Request" : "Confirm Appointment"}
              </button>
              {isReschedule && rescheduleError && (
                <p
                  style={{
                    color: "#b42318",
                    fontSize: "12px",
                    margin: "8px 0 0",
                    width: "100%",
                    textAlign: isMobile ? "center" : "right",
                  }}
                >
                  {rescheduleError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

export default BookingPage;
