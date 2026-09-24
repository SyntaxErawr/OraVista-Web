import PatientDialog from "../../components/PatientDialog";
import BrandWordmark from "../../components/BrandWordmark";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL } from "../../config/api";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LayoutDashboard,
  User,
  CalendarHeart,
  History,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userData, setUserData] = useState({ firstName: "User", email: "" });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const passwordRequest = useRef(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [passwords, setPasswords] = useState({
    old: "",
    next: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState({
    old: false,
    next: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});

  const [preferences, setPreferences] = useState({
    language: localStorage.getItem("language") || "English",
    timezone: localStorage.getItem("timezone") || "Asia/Manila",
  });


  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadUser = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        id: user.id,
        firstName: user.firstName || "User",
        email: user.email || "",
      });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const savePreferences = () => {
    localStorage.setItem("language", preferences.language);
    localStorage.setItem("timezone", preferences.timezone);
    setShowPreferenceModal(false);
    setSuccessMessage("Preferences saved on this device.");
    setShowSuccessModal(true);
  };

  const handleSaveAttempt = () => {
    const val = passwords.next;
    const hasMinLength = val.length >= 8;
    const hasUppercase = /[A-Z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
    const isValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

    let newErrors = {};
    if (!passwords.old) newErrors.old = "Old password is required.";
    if (!isValid) newErrors.next = "Password does not meet all requirements.";
    if (passwords.next !== passwords.confirm)
      newErrors.confirm = "Passwords do not match.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      setShowConfirmModal(true);
    }
  };

  const sendOTP = async () => {
    if (passwordRequest.current) return;
    passwordRequest.current = true;
    setIsOtpLoading(true);
    setOtpMessage("");
    setOtpSent("");
    setOtpInput("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userData.email,
            action: "change_password",
          }),
        },
      );
      const data = await response.json();
      if (response.ok && /^\d{6}$/.test(String(data.generatedOtp || ""))) {
        setOtpSent(String(data.generatedOtp));
        setShowConfirmModal(false);
        setShowPasswordModal(false);
        setShowOtpModal(true);
        setOtpMessage("Code sent! Check your email.");
      } else {
        setOtpMessage(data.message || "Failed to send verification code.");
      }
    } catch (err) {
      setOtpMessage("Failed to process request. Ensure backend is running.");
    } finally {
      passwordRequest.current = false;
      setIsOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (passwordRequest.current) return;
    if (!/^\d{6}$/.test(otpInput) || !otpSent || otpInput !== otpSent) {
      setOtpMessage("Invalid code. Please try again.");
      return;
    }
    if (!userData.id) {
      setOtpMessage("Your session is unavailable. Please sign in again.");
      return;
    }
    passwordRequest.current = true;
    setIsOtpLoading(true);
    setOtpMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/update-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userData.id, oldPassword: passwords.old, newPassword: passwords.next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Password could not be updated. Please try again.");
      setShowOtpModal(false);
      setSuccessMessage("Your password has been updated.");
      setShowSuccessModal(true);
      setOtpInput("");
      setOtpMessage("");
      setPasswords({ old: "", next: "", confirm: "" });
      setOtpSent("");
    } catch (error) {
      setOtpMessage(error.message || "Unable to connect. Your password change has not been confirmed.");
    } finally {
      passwordRequest.current = false;
      setIsOtpLoading(false);
    }
  };

  const handleFinalSubmit = () => {
    sendOTP();
  };

  const ToggleSwitch = ({ label, description }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <div style={{ textAlign: "left", flex: 1, paddingRight: "20px" }}>
        <h4 style={{ margin: "0 0 5px 0", color: "#087F8C", fontSize: "15px" }}>
          {label}
        </h4>
        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
          {description}
        </p>
      </div>
      <button type="button" className="ov-ui-button" role="switch" aria-checked={false} aria-label={label} disabled aria-describedby="notification-availability"
        style={{
          width: "50px",
          height: "26px",
          backgroundColor: "#ccc",
          borderRadius: "15px",
          position: "relative",
          cursor: "pointer",
          transition: "background-color 0.3s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "22px",
            height: "22px",
            backgroundColor: "white",
            borderRadius: "50%",
            position: "absolute",
            top: "2px",
            left: "2px",
            transition: "left 0.3s",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );

  const sidebarWidth = isCollapsed ? "80px" : "260px";

  const getNavItemStyle = (path) => ({
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
    backgroundColor:
      location.pathname === path ? "var(--ov-on-wash, rgba(255, 255, 255, 0.2))" : "transparent",
    fontWeight: location.pathname === path ? "700" : "400",
    borderLeft:
      location.pathname === path ? "4px solid #21B9C8" : "4px solid transparent",
  });

  const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(5px)",
    padding: "16px",
    boxSizing: "border-box",
  };

  const modalBox = {
    backgroundColor: "white",
    padding: isMobile ? "24px 20px" : "30px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    boxSizing: "border-box",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Manrope', sans-serif",
    fontSize: "14px",
  };

  const btnBase = {
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Manrope', sans-serif",
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
          <h2 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}><BrandWordmark /></h2>
        )}
        {isMobile ? (
          <button className="ov-ui-button"
            onClick={() => setIsMobileOpen(false)}
            style={{ cursor: "pointer" }}
           type="button" aria-label="Close navigation">
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
              if (isMobile) setIsMobileOpen(false);
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
            if (isMobile) setIsMobileOpen(false);
          }}
        >
          <SettingsIcon size={20} style={{ flexShrink: 0 }} />
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
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* ---- MODALS ---- */}

      {/* Privacy & Security */}
      {showPrivacyModal && (
        <PatientDialog onClose={() => setShowPrivacyModal(false)} busy={isOtpLoading} style={{ ...modalOverlay, zIndex: 2000 }}>
          <div
            style={{
              ...modalBox,
              maxWidth: "500px",
              overflowY: "auto",
              maxHeight: "90vh",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <ShieldCheck size={28} color="#087F8C" />
              <h2
                style={{
                  color: "#087F8C",
                  fontWeight: "800",
                  margin: 0,
                  fontSize: isMobile ? "20px" : "24px",
                }}
              >
                Privacy & Security
              </h2>
            </div>
            <div
              style={{
                backgroundColor: "#e6f4ea",
                padding: "16px",
                borderRadius: "15px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <CheckCircle2
                size={22}
                color="#28a745"
                style={{ flexShrink: 0 }}
              />
              <div>
                <h4
                  style={{
                    margin: "0 0 4px 0",
                    color: "#155724",
                    fontSize: "14px",
                  }}
                >
                  Two-Factor Authentication
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#28a745" }}>
                  Email Verification (OTP) is Active
                </p>
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  color: "#087F8C",
                  marginBottom: "12px",
                  borderBottom: "2px solid #f0f0f0",
                  paddingBottom: "8px",
                  fontSize: "15px",
                }}
              >
                Recent Logins
              </h4>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 0",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f0f2f5",
                    padding: "10px",
                    borderRadius: "10px",
                    flexShrink: 0,
                  }}
                >
                  <Smartphone size={18} color="#666" />
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 3px 0",
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    Login history is unavailable
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#888" }}>
                    Device, location and sign-in history are not provided here.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              style={{
                ...btnBase,
                width: "100%",
                border: "1px solid #ccc",
                backgroundColor: "white",
                color: "#333",
              }}
            >
              Close
            </button>
          </div>
        </PatientDialog>
      )}

      {/* Notifications */}
      {showNotifModal && (
        <PatientDialog onClose={() => setShowNotifModal(false)} busy={isOtpLoading} style={{ ...modalOverlay, zIndex: 2000 }}>
          <div style={{ ...modalBox, maxHeight: "90vh", overflowY: "auto" }}>
            <h2
              style={{
                color: "#087F8C",
                fontWeight: "800",
                marginTop: 0,
                marginBottom: "20px",
                fontSize: isMobile ? "20px" : "24px",
              }}
            >
              Notifications
            </h2>
            <p id="notification-availability" role="status">Notification preferences are coming soon. These controls are unavailable and do not change the notifications you currently receive.</p>
            <div style={{ marginBottom: "24px" }}>
              <ToggleSwitch
                label="Appointment Reminders"
                description="Appointment reminder preferences."
              />
              <ToggleSwitch
                label="Marketing & Promos"
                description="Get updates on dental discounts and clinic news."
              />
              <ToggleSwitch
                label="System Alerts"
                description="Security notifications, login alerts, and system updates."
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowNotifModal(false)}
                style={{
                  ...btnBase,
                  flex: 1,
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  color: "#333",
                }}
              >
                Cancel
              </button>
              <button
                disabled
                aria-describedby="notification-availability"
                style={{ "--ov-on-color": "var(--ov-ink)",
                  ...btnBase,
                  flex: 1,
                  border: "none",
                  backgroundColor: "var(--ov-primary)",
                  color: "var(--ov-on-color, #fff)",
                }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </PatientDialog>
      )}

      {/* Preferences */}
      {showPreferenceModal && (
        <PatientDialog onClose={() => setShowPreferenceModal(false)} busy={isOtpLoading} style={{ ...modalOverlay, zIndex: 2000 }}>
          <div style={{ ...modalBox, maxHeight: "90vh", overflowY: "auto" }}>
            <h2
              style={{
                color: "#087F8C",
                fontWeight: "800",
                marginTop: 0,
                marginBottom: "20px",
                fontSize: isMobile ? "20px" : "24px",
              }}
            >
              Preferences
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  color: "#087F8C",
                  fontWeight: "700",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Language
              </label>
              <select aria-label="language"
                name="language"
                value={preferences.language}
                onChange={handlePreferenceChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: "'Manrope', sans-serif",
                  boxSizing: "border-box",
                }}
              >
                <option value="English">English</option>
                <option value="Tagalog">Tagalog</option>
              </select>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  color: "#087F8C",
                  fontWeight: "700",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Timezone
              </label>
              <select aria-label="timezone"
                name="timezone"
                value={preferences.timezone}
                onChange={handlePreferenceChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: "'Manrope', sans-serif",
                  boxSizing: "border-box",
                }}
              >
                <option value="Asia/Manila">Asia/Manila (PHT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowPreferenceModal(false)}
                style={{
                  ...btnBase,
                  flex: 1,
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  color: "#333",
                }}
              >
                Cancel
              </button>
              <button
                onClick={savePreferences}
                style={{ "--ov-on-color": "var(--ov-ink)",
                  ...btnBase,
                  flex: 1,
                  border: "none",
                  backgroundColor: "var(--ov-primary)",
                  color: "var(--ov-on-color, #fff)",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </PatientDialog>
      )}

      {/* Change Password */}
      {showPasswordModal && (
        <PatientDialog onClose={() => setShowPasswordModal(false)} busy={isOtpLoading}
          style={{
            ...modalOverlay,
            zIndex: 2000,
            alignItems: "flex-start",
            paddingTop: "20px",
            paddingBottom: "20px",
          }}
        >
          <div className="ov-panel"
            style={{ "--ov-on-color": "var(--ov-ink)",
              backgroundColor: "var(--ov-primary)",
              padding: isMobile ? "24px 20px" : "40px 50px",
              borderRadius: "30px",
              width: "100%",
              maxWidth: "800px",
              boxSizing: "border-box",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2
              style={{
                color: "var(--ov-on-color, #fff)",
                fontSize: isMobile ? "22px" : "30px",
                fontWeight: "800",
                marginBottom: "28px",
                marginTop: 0,
              }}
            >
              Change Password
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Old Password */}
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    color: "var(--ov-on-color, #fff)",
                    marginBottom: "8px",
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Old Password
                </label>
                <div style={{ position: "relative" }}>
                  <input aria-label="old"
                    type={showPass.old ? "text" : "password"}
                    name="old"
                    value={passwords.old}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, paddingRight: "44px" }}
                  />
                  <button className="ov-ui-button"
                    onClick={() =>
                      setShowPass({ ...showPass, old: !showPass.old })
                    }
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#666",
                    }}
                   type="button" aria-label="Show or hide password">
                    {showPass.old ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.old && (
                  <p
                    style={{
                      color: "#ff4d4d",
                      fontSize: "12px",
                      marginTop: "5px",
                    }}
                  >
                    {errors.old}
                  </p>
                )}
              </div>

              {/* New + Confirm — stack on mobile */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: "20px",
                }}
              >
                <div style={{ flex: 1, position: "relative" }}>
                  <label
                    style={{
                      color: "var(--ov-on-color, #fff)",
                      marginBottom: "8px",
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input aria-label="next"
                      type={showPass.next ? "text" : "password"}
                      name="next"
                      value={passwords.next}
                      onChange={handleInputChange}
                      style={{ ...inputStyle, paddingRight: "44px" }}
                    />
                    <button className="ov-ui-button"
                      onClick={() =>
                        setShowPass({ ...showPass, next: !showPass.next })
                      }
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "#666",
                      }}
                     type="button" aria-label="Show or hide password">
                      {showPass.next ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p
                    style={{
                      color: "var(--ov-on-color, #fff)",
                      fontSize: "11px",
                      marginTop: "8px",
                      opacity: 0.8,
                      lineHeight: "1.5",
                    }}
                  >
                    Must be at least 8 characters, include 1 uppercase, 1
                    number, and 1 special character.
                  </p>
                  {errors.next && (
                    <p
                      style={{
                        color: "#ff4d4d",
                        fontSize: "12px",
                        marginTop: "5px",
                      }}
                    >
                      {errors.next}
                    </p>
                  )}
                </div>

                <div style={{ flex: 1, position: "relative" }}>
                  <label
                    style={{
                      color: "var(--ov-on-color, #fff)",
                      marginBottom: "8px",
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    Confirm New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input aria-label="confirm"
                      type={showPass.confirm ? "text" : "password"}
                      name="confirm"
                      value={passwords.confirm}
                      onChange={handleInputChange}
                      style={{ ...inputStyle, paddingRight: "44px" }}
                    />
                    <button className="ov-ui-button"
                      onClick={() =>
                        setShowPass({ ...showPass, confirm: !showPass.confirm })
                      }
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "#666",
                      }}
                     type="button" aria-label="Show or hide password">
                      {showPass.confirm ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  {errors.confirm && (
                    <p
                      style={{
                        color: "#ff4d4d",
                        fontSize: "12px",
                        marginTop: "5px",
                      }}
                    >
                      {errors.confirm}
                    </p>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "8px",
                }}
              >
                <button
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    ...btnBase,
                    padding: "12px 32px",
                    border: "none",
                    backgroundColor: "#ff4d4d",
                    color: "var(--ov-on-color, #fff)",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAttempt}
                  style={{
                    ...btnBase,
                    padding: "12px 32px",
                    border: "none",
                    backgroundColor: "#4ade80",
                    color: "var(--ov-on-color, #fff)",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </PatientDialog>
      )}

      {/* Confirm */}
      {showConfirmModal && (
        <PatientDialog onClose={() => setShowConfirmModal(false)} busy={isOtpLoading}
          style={{
            ...modalOverlay,
            zIndex: 2100,
            backdropFilter: "none",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ ...modalBox, textAlign: "center" }}>
            <AlertTriangle
              size={50}
              color="#087F8C"
              style={{ margin: "0 auto 15px" }}
            />
            <h3
              style={{
                color: "#087F8C",
                fontWeight: "800",
                marginBottom: "8px",
              }}
            >
              Confirm Changes?
            </h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: 0 }}>
              Are you sure you want to update your password?
            </p>
            {otpMessage && <p role="alert">{otpMessage}</p>}
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  ...btnBase,
                  flex: 1,
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  color: "#333",
                }}
                disabled={isOtpLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                style={{ "--ov-on-color": "var(--ov-ink)",
                  ...btnBase,
                  flex: 1,
                  border: "none",
                  backgroundColor: "var(--ov-primary)",
                  color: "var(--ov-on-color, #fff)",
                  opacity: isOtpLoading ? 0.7 : 1,
                }}
                disabled={isOtpLoading}
              >
                {isOtpLoading ? "Sending OTP..." : "Confirm"}
              </button>
            </div>
          </div>
        </PatientDialog>
      )}

      {/* OTP */}
      {showOtpModal && (
        <PatientDialog onClose={() => setShowOtpModal(false)} busy={isOtpLoading} style={{ ...modalOverlay, zIndex: 2150 }}>
          <div
            style={{
              ...modalBox,
              textAlign: "center",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2
              style={{
                color: "#087F8C",
                fontWeight: "800",
                marginBottom: "8px",
                fontSize: isMobile ? "18px" : "22px",
              }}
            >
              Verification Required
            </h2>
            <p
              style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}
            >
              Enter the 6-digit code sent to <strong>{userData.email}</strong>{" "}
              to finalize your password change.
            </p>
            <input aria-label="Enter 6-digit code"
              type="text"
              placeholder="Enter 6-digit code"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 15px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                marginBottom: "15px",
                letterSpacing: "5px",
                textAlign: "center",
                fontSize: "20px",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "'Manrope', sans-serif",
              }}
              maxLength="6"
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={isOtpLoading}
            />
            <button
              onClick={verifyOTP}
              disabled={isOtpLoading || !/^\d{6}$/.test(otpInput) || !otpSent}
              style={{
                ...btnBase,
                width: "100%",
                border: "none",
                backgroundColor: "#28a745",
                color: "var(--ov-on-color, #fff)",
              }}
            >
              {isOtpLoading ? "Please wait..." : "Verify Code"}
            </button>
            <button className="ov-ui-button"
              onClick={sendOTP}
              disabled={isOtpLoading}
              style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "#087F8C",
                cursor: "pointer",
                textDecoration: "underline",
              }}
             type="button">
              Resend Code
            </button>
            {otpMessage && (
              <p role="status"
                style={{
                  color: otpMessage.includes("sent") ? "green" : "red",
                  fontSize: "12px",
                  marginTop: "8px",
                  fontWeight: "600",
                }}
              >
                {otpMessage}
              </p>
            )}
            <button
              onClick={() => {
                setShowOtpModal(false);
                setOtpInput("");
                setOtpMessage("");
              }}
              disabled={isOtpLoading}
              style={{
                marginTop: "12px",
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Cancel Change
            </button>
          </div>
        </PatientDialog>
      )}

      {/* Success */}
      {showSuccessModal && (
        <PatientDialog onClose={() => setShowSuccessModal(false)} busy={isOtpLoading}
          style={{
            ...modalOverlay,
            zIndex: 2200,
            backdropFilter: "none",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ ...modalBox, textAlign: "center" }}>
            <CheckCircle2
              size={50}
              color="#3ddb73"
              style={{ margin: "0 auto 15px" }}
            />
            <h3 style={{ color: "#087F8C", fontWeight: "800" }}>
              Action Successful!
            </h3>
            <p>{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{ "--ov-on-color": "var(--ov-ink)",
                ...btnBase,
                width: "100%",
                border: "none",
                backgroundColor: "var(--ov-primary)",
                color: "var(--ov-on-color, #fff)",
                marginTop: "15px",
              }}
            >
              Close
            </button>
          </div>
        </PatientDialog>
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
        <div className="ov-sidebar"
          style={{ "--ov-on-color": "var(--ov-ink)",
            width: sidebarWidth,
            backgroundColor: "var(--ov-primary)",
            height: "100vh",
            color: "var(--ov-on-color, #fff)",
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
        <div inert={!isMobileOpen} aria-hidden={!isMobileOpen} className="ov-sidebar"
          style={{ "--ov-on-color": "var(--ov-ink)",
            width: "260px",
            backgroundColor: "var(--ov-primary)",
            height: "100vh",
            color: "var(--ov-on-color, #fff)",
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
      <div className="ov-workspace"
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          width: isMobile ? "100%" : `calc(100% - ${sidebarWidth})`,
          transition: "margin-left 0.3s ease, width 0.3s ease",
          backgroundColor: "white",
          minHeight: "100vh",
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
            padding: isMobile ? "24px 16px" : "60px 80px",
            maxWidth: "1200px",
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              color: "#087F8C",
              fontSize: isMobile ? "32px" : "48px",
              fontWeight: "800",
              marginBottom: isMobile ? "28px" : "50px",
            }}
          >
            Settings
          </h1>

          {[
            "Change Password",
            "Privacy & Security",
            "Notifications",
            "Preference",
          ].map((label) => (
            <button className="ov-ui-button"
              key={label}
              onClick={() => {
                if (label === "Change Password") setShowPasswordModal(true);
                if (label === "Preference") setShowPreferenceModal(true);
                if (label === "Privacy & Security") setShowPrivacyModal(true);
                if (label === "Notifications") setShowNotifModal(true);
              }}
              style={{
                width: "100%",
                backgroundColor: "#EAF5F6",
                borderRadius: "16px",
                padding: isMobile ? "20px 24px" : "28px 40px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#d8dcee")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#EAF5F6")
              }
             aria-label={label} type="button">
              <h3
                style={{
                  color: "#087F8C",
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "800",
                  margin: 0,
                }}
              >
                {label}
              </h3>
              <ChevronRight
                size={isMobile ? 24 : 30}
                color="#087F8C"
                style={{ flexShrink: 0 }}
              />
            </button>
          ))}

          <p style={{ color: "#666", marginTop: "32px", fontSize: "13px" }}>
            Signed in as: {userData.firstName} ({userData.email})
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
