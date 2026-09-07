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

  const [notifSettings, setNotifSettings] = useState({
    reminders: true,
    promos: false,
    alerts: true,
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

  const toggleNotif = (key) => {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = () => {
    localStorage.setItem("language", preferences.language);
    localStorage.setItem("timezone", preferences.timezone);
    setShowPreferenceModal(false);
    setShowSuccessModal(true);
  };

  const saveNotifications = () => {
    setShowNotifModal(false);
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
    setIsOtpLoading(true);
    setOtpMessage("");
    try {
      const response = await fetch(
        "https://oravista-server-474976105474.asia-southeast1.run.app/api/send-otp",
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
      if (response.ok) {
        setOtpSent(data.generatedOtp);
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
      setIsOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otpInput === otpSent) {
      setShowOtpModal(false);
      setShowSuccessModal(true);
      setOtpInput("");
      setOtpMessage("");
      setPasswords({ old: "", next: "", confirm: "" });
    } else {
      setOtpMessage("Invalid code. Please try again.");
    }
  };

  const handleFinalSubmit = () => {
    sendOTP();
  };

  const ToggleSwitch = ({ label, description, isOn, onToggle }) => (
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
        <h4 style={{ margin: "0 0 5px 0", color: "#001166", fontSize: "15px" }}>
          {label}
        </h4>
        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
          {description}
        </p>
      </div>
      <div
        onClick={onToggle}
        style={{
          width: "50px",
          height: "26px",
          backgroundColor: isOn ? "#28a745" : "#ccc",
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
            left: isOn ? "26px" : "2px",
            transition: "left 0.3s",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
        />
      </div>
    </div>
  );

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
    fontFamily: "'Poppins', sans-serif",
    fontSize: "14px",
  };

  const btnBase = {
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
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
          <SettingsIcon size={20} style={{ flexShrink: 0 }} />
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
      {/* ---- MODALS ---- */}

      {/* Privacy & Security */}
      {showPrivacyModal && (
        <div style={{ ...modalOverlay, zIndex: 2000 }}>
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
              <ShieldCheck size={28} color="#001166" />
              <h2
                style={{
                  color: "#001166",
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
                  color: "#001166",
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
                    Windows Desktop (Current)
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#888" }}>
                    IP: 192.168.1.45 • Manila, PH
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
        </div>
      )}

      {/* Notifications */}
      {showNotifModal && (
        <div style={{ ...modalOverlay, zIndex: 2000 }}>
          <div style={{ ...modalBox, maxHeight: "90vh", overflowY: "auto" }}>
            <h2
              style={{
                color: "#001166",
                fontWeight: "800",
                marginTop: 0,
                marginBottom: "20px",
                fontSize: isMobile ? "20px" : "24px",
              }}
            >
              Notifications
            </h2>
            <div style={{ marginBottom: "24px" }}>
              <ToggleSwitch
                label="Appointment Reminders"
                description="Receive emails 24 hours before your scheduled visit."
                isOn={notifSettings.reminders}
                onToggle={() => toggleNotif("reminders")}
              />
              <ToggleSwitch
                label="Marketing & Promos"
                description="Get updates on dental discounts and clinic news."
                isOn={notifSettings.promos}
                onToggle={() => toggleNotif("promos")}
              />
              <ToggleSwitch
                label="System Alerts"
                description="Security notifications, login alerts, and system updates."
                isOn={notifSettings.alerts}
                onToggle={() => toggleNotif("alerts")}
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
                onClick={saveNotifications}
                style={{
                  ...btnBase,
                  flex: 1,
                  border: "none",
                  backgroundColor: "#001166",
                  color: "white",
                }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      {showPreferenceModal && (
        <div style={{ ...modalOverlay, zIndex: 2000 }}>
          <div style={{ ...modalBox, maxHeight: "90vh", overflowY: "auto" }}>
            <h2
              style={{
                color: "#001166",
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
                  color: "#001166",
                  fontWeight: "700",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Language
              </label>
              <select
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
                  fontFamily: "'Poppins', sans-serif",
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
                  color: "#001166",
                  fontWeight: "700",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Timezone
              </label>
              <select
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
                  fontFamily: "'Poppins', sans-serif",
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
                style={{
                  ...btnBase,
                  flex: 1,
                  border: "none",
                  backgroundColor: "#001166",
                  color: "white",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      {showPasswordModal && (
        <div
          style={{
            ...modalOverlay,
            zIndex: 2000,
            alignItems: "flex-start",
            paddingTop: "20px",
            paddingBottom: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#001166",
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
                color: "white",
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
                    color: "white",
                    marginBottom: "8px",
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Old Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass.old ? "text" : "password"}
                    name="old"
                    value={passwords.old}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, paddingRight: "44px" }}
                  />
                  <div
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
                  >
                    {showPass.old ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
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
                      color: "white",
                      marginBottom: "8px",
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPass.next ? "text" : "password"}
                      name="next"
                      value={passwords.next}
                      onChange={handleInputChange}
                      style={{ ...inputStyle, paddingRight: "44px" }}
                    />
                    <div
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
                    >
                      {showPass.next ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </div>
                  <p
                    style={{
                      color: "white",
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
                      color: "white",
                      marginBottom: "8px",
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    Confirm New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPass.confirm ? "text" : "password"}
                      name="confirm"
                      value={passwords.confirm}
                      onChange={handleInputChange}
                      style={{ ...inputStyle, paddingRight: "44px" }}
                    />
                    <div
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
                    >
                      {showPass.confirm ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </div>
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
                    color: "white",
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
                    color: "white",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm */}
      {showConfirmModal && (
        <div
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
              color="#001166"
              style={{ margin: "0 auto 15px" }}
            />
            <h3
              style={{
                color: "#001166",
                fontWeight: "800",
                marginBottom: "8px",
              }}
            >
              Confirm Changes?
            </h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: 0 }}>
              Are you sure you want to update your password?
            </p>
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
                style={{
                  ...btnBase,
                  flex: 1,
                  border: "none",
                  backgroundColor: "#001166",
                  color: "white",
                  opacity: isOtpLoading ? 0.7 : 1,
                }}
                disabled={isOtpLoading}
              >
                {isOtpLoading ? "Sending OTP..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP */}
      {showOtpModal && (
        <div style={{ ...modalOverlay, zIndex: 2150 }}>
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
                color: "#001166",
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
            <input
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
                fontFamily: "'Poppins', sans-serif",
              }}
              maxLength="6"
            />
            <button
              onClick={verifyOTP}
              style={{
                ...btnBase,
                width: "100%",
                border: "none",
                backgroundColor: "#28a745",
                color: "white",
              }}
            >
              Verify Code
            </button>
            <p
              onClick={sendOTP}
              style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "#001166",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Resend Code
            </p>
            {otpMessage && (
              <p
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
              style={{
                marginTop: "12px",
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Cancel Change
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {showSuccessModal && (
        <div
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
            <h3 style={{ color: "#001166", fontWeight: "800" }}>
              Action Successful!
            </h3>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                ...btnBase,
                width: "100%",
                border: "none",
                backgroundColor: "#001166",
                color: "white",
                marginTop: "15px",
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
          minHeight: "100vh",
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
            padding: isMobile ? "24px 16px" : "60px 80px",
            maxWidth: "1200px",
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              color: "#001166",
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
            <div
              key={label}
              onClick={() => {
                if (label === "Change Password") setShowPasswordModal(true);
                if (label === "Preference") setShowPreferenceModal(true);
                if (label === "Privacy & Security") setShowPrivacyModal(true);
                if (label === "Notifications") setShowNotifModal(true);
              }}
              style={{
                backgroundColor: "#e8ebf5",
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
                (e.currentTarget.style.backgroundColor = "#e8ebf5")
              }
            >
              <h3
                style={{
                  color: "#001166",
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "800",
                  margin: 0,
                }}
              >
                {label}
              </h3>
              <ChevronRight
                size={isMobile ? 24 : 30}
                color="#001166"
                style={{ flexShrink: 0 }}
              />
            </div>
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
