import PatientDialog from "../../components/PatientDialog";
import BrandWordmark from "../../components/BrandWordmark";
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
  Pencil,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  Upload,
} from "lucide-react";

function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    sex: "",
    dob: "",
    age: "",
    phone: "",
    occupation: "",
  });

  const [errors, setErrors] = useState({});

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

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const loadUserData = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        sex: user.sex || "",
        dob: user.dob || "",
        age: user.dob ? calculateAge(user.dob) : user.age || "",
        phone: user.phone || "",
        occupation: user.occupation || "",
      });
      if (user.profile_picture) {
        setProfilePreview(
          `https://oravista-server-474976105474.asia-southeast1.run.app/${user.profile_picture}`,
        );
      }
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const validate = (name, value) => {
    let error = "";
    if (name !== "age" && typeof value === "string" && value.trim() === "") {
      error = "This field cannot be empty.";
    }
    if (name === "firstName" || name === "lastName") {
      if (value.length > 20) error = "Maximum 20 characters allowed.";
    } else if (name === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test(value))
        error = "Must be a valid @gmail.com address.";
    } else if (name === "occupation") {
      if (value.length > 50) error = "Maximum 50 characters allowed.";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName" || name === "lastName") {
      if (/[^a-zA-Z\s]/.test(value)) return;
    }
    if (name === "phone") {
      if (/[^0-9]/.test(value)) return;
    }
    if (name === "dob") {
      const newAge = calculateAge(value);
      setUserData((prev) => ({ ...prev, dob: value, age: newAge }));
      validate("dob", value);
    } else {
      setUserData((prev) => ({ ...prev, [name]: value }));
      validate(name, value);
    }
  };

  const handleImageUpload = async (e) => {
    if (!isEditing || isUploading) return;

    const file = e.target.files[0];
    if (file) {
      const previousPreview = profilePreview;
      setIsUploading(true);
      setUploadError("");
      const imageUrl = URL.createObjectURL(file);
      setProfilePreview(imageUrl);
      const user = JSON.parse(localStorage.getItem("user"));
      const formData = new FormData();
      formData.append("profileImage", file);
      formData.append("userId", user.id);
      try {
        const response = await fetch(
          "https://oravista-server-474976105474.asia-southeast1.run.app/api/upload-profile-picture",
          {
            method: "POST",
            body: formData,
          },
        );
        const data = await response.json();
        if (response.ok) {
          const updatedUser = { ...user, profile_picture: data.imagePath };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setProfilePreview(
            `https://oravista-server-474976105474.asia-southeast1.run.app/${data.imagePath}`,
          );
        } else {
          setProfilePreview(previousPreview);
          setUploadError(data.message || "Your photo could not be uploaded. Please try again.");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setProfilePreview(previousPreview);
        setUploadError("We could not upload your photo. Please check your connection and retry.");
      } finally {
        URL.revokeObjectURL(imageUrl);
        e.target.value = "";
        setIsUploading(false);
      }
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const handleDiscard = () => {
    loadUserData();
    setErrors({});
    setIsEditing(false);
    const user = JSON.parse(localStorage.getItem("user"));
    setProfilePreview(
      user?.profile_picture
        ? `https://oravista-server-474976105474.asia-southeast1.run.app/${user.profile_picture}`
        : null,
    );
  };

  const handleSaveClick = () => {
    const newErrors = {};
    let hasEmpty = false;
    Object.keys(userData).forEach((key) => {
      if (key === "age") return;
      const error = validate(key, userData[key]);
      if (error) {
        newErrors[key] = error;
        hasEmpty = true;
      }
    });
    if (hasEmpty) {
      setErrors(newErrors);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSave = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
      const response = await fetch(
        "https://oravista-server-474976105474.asia-southeast1.run.app/api/update-profile",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: user.id, ...userData }),
        },
      );
      if (response.ok) {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setIsEditing(false);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        alert("Failed to update profile. Check database connection.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Check your connection.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const closeMobileSidebar = () => setIsMobileOpen(false);

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

  const inputStyle = (hasError, isReadOnly = false) => ({
    padding: "12px 15px",
    borderRadius: "8px",
    border: hasError ? "2px solid #ff4d4d" : "none",
    backgroundColor: isEditing && !isReadOnly ? "white" : "#e0e0e0",
    fontSize: "14px",
    fontFamily: "'Manrope', sans-serif",
    width: "100%",
    boxSizing: "border-box",
    cursor: isEditing && !isReadOnly ? "text" : "not-allowed",
    color: "#333",
    outline: "none",
  });

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3000,
    backdropFilter: "blur(4px)",
    padding: "20px",
    boxSizing: "border-box",
  };

  const modalContentStyle = {
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
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* Modals */}
      {showConfirmModal && (
        <PatientDialog onClose={() => setShowConfirmModal(false)} style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <AlertTriangle
              size={50}
              color="#087F8C"
              style={{ marginBottom: "15px", margin: "0 auto" }}
            />
            <h3
              style={{
                color: "#087F8C",
                marginBottom: "10px",
                fontWeight: "800",
              }}
            >
              Confirm Changes?
            </h3>
            <p
              style={{ color: "#666", fontSize: "14px", marginBottom: "25px" }}
            >
              Are you sure you want to save these updates to your profile?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                style={{ "--ov-on-color": "var(--ov-ink)",
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "var(--ov-primary)",
                  color: "var(--ov-on-color, #fff)",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </PatientDialog>
      )}

      {showSuccessModal && (
        <PatientDialog onClose={() => setShowSuccessModal(false)} style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <CheckCircle2
              size={50}
              color="#28a745"
              style={{ marginBottom: "15px", margin: "0 auto" }}
            />
            <h3
              style={{
                color: "#087F8C",
                marginBottom: "10px",
                fontWeight: "800",
              }}
            >
              Success!
            </h3>
            <p
              style={{ color: "#666", fontSize: "14px", marginBottom: "25px" }}
            >
              Profile updated successfully!
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{ "--ov-on-color": "var(--ov-ink)",
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "var(--ov-primary)",
                color: "var(--ov-on-color, #fff)",
                cursor: "pointer",
                fontWeight: "600",
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Close
            </button>
          </div>
        </PatientDialog>
      )}

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

        <div style={{ padding: isMobile ? "20px 16px" : "40px" }}>
          <h1
            style={{
              color: "#087F8C",
              fontSize: isMobile ? "28px" : "42px",
              fontWeight: "800",
              marginBottom: "24px",
            }}
          >
            Profile
          </h1>

          <div className="ov-panel"
            style={{ "--ov-on-color": "var(--ov-ink)",
              backgroundColor: "var(--ov-primary)",
              borderRadius: "24px",
              padding: isMobile ? "24px 16px" : "50px",
              color: "var(--ov-on-color, #fff)",
            }}
          >
            {/* Profile Header */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "center" : "center",
                gap: isMobile ? "16px" : "30px",
                marginBottom: "32px",
                textAlign: isMobile ? "center" : "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  role="img"
                  aria-label="Profile photo"
                  style={{
                    width: isMobile ? "90px" : "120px",
                    height: isMobile ? "90px" : "120px",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    backgroundImage: profilePreview
                      ? `url(${profilePreview})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "3px solid #fff",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                >
                  {!profilePreview && (
                    <User
                      size={isMobile ? 36 : 50}
                      color="#087F8C"
                      opacity={0.3}
                    />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  disabled={!isEditing}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <button
                  className="ov-photo-upload"
                  onClick={triggerFileInput}
                  disabled={!isEditing || isUploading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 15px",
                    borderRadius: "15px",
                    border: "none",
                    backgroundColor: "var(--ov-on-wash, rgba(255,255,255,0.2))",
                    color: "var(--ov-on-color, #fff)",
                    fontSize: "12px",
                    cursor: isEditing ? "pointer" : "not-allowed",
                    opacity: isEditing ? 1 : 0.5,
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <Upload size={14} /> {isUploading ? "Uploading..." : "Update Photo"}
                </button>
                {!isEditing && <p className="ov-availability-note" style={{ maxWidth: "200px", textAlign: "center", margin: "8px 0 0" }}>Select Edit Information to update your photo.</p>}
                {uploadError && <p className="ov-inline-error" role="alert">{uploadError}</p>}
                {isEditing && <p className="ov-availability-note" style={{ maxWidth: "220px", textAlign: "center" }}>Photo uploads save immediately. Discard Changes applies to the form fields.</p>}
              </div>

              <div>
                <h2
                  style={{
                    fontSize: isMobile ? "22px" : "36px",
                    fontWeight: "700",
                    margin: 0,
                  }}
                >
                  Personal Information
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    marginTop: "10px",
                    padding: "8px 20px",
                    borderRadius: "20px",
                    border: "none",
                    backgroundColor: "white",
                    color: "#087F8C",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <Pencil size={14} /> Edit Information
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Row 1 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? "12px" : "25px",
                }}
              >
                {[
                  { name: "firstName", label: "First Name", type: "text" },
                  { name: "lastName", label: "Last Name", type: "text" },
                  { name: "email", label: "Email", type: "email" },
                ].map(({ name, label, type }) => (
                  <div
                    key={name}
                    style={{
                      flex: 1,
                      minHeight: isMobile ? "auto" : "110px",
                      marginBottom: isMobile ? "4px" : 0,
                    }}
                  >
                    <label
                      style={{
                        color: "var(--ov-on-color, #fff)",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      {label}
                    </label>
                    <input aria-label={label}
                      name={name}
                      style={inputStyle(errors[name])}
                      type={type}
                      value={userData[name]}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                    {errors[name] && (
                      <span
                        style={{
                          color: "#ff4d4d",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {errors[name]}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Row 2 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? "12px" : "25px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minHeight: isMobile ? "auto" : "110px",
                    marginBottom: isMobile ? "4px" : 0,
                  }}
                >
                  <label
                    style={{
                      color: "var(--ov-on-color, #fff)",
                      fontSize: "13px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Sex
                  </label>
                  <select aria-label="sex"
                    name="sex"
                    style={inputStyle()}
                    value={userData.sex}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div
                  style={{
                    flex: 1,
                    minHeight: isMobile ? "auto" : "110px",
                    marginBottom: isMobile ? "4px" : 0,
                  }}
                >
                  <label
                    style={{
                      color: "var(--ov-on-color, #fff)",
                      fontSize: "13px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Date of Birth
                  </label>
                  <input aria-label="dob"
                    name="dob"
                    style={inputStyle()}
                    type="date"
                    value={userData.dob}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    minHeight: isMobile ? "auto" : "110px",
                    marginBottom: isMobile ? "4px" : 0,
                  }}
                >
                  <label
                    style={{
                      color: "var(--ov-on-color, #fff)",
                      fontSize: "13px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Age
                  </label>
                  <input aria-label="Auto-computed"
                    name="age"
                    style={inputStyle(false, true)}
                    type="text"
                    value={userData.age}
                    readOnly
                    disabled
                    placeholder="Auto-computed"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? "12px" : "25px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minHeight: isMobile ? "auto" : "110px",
                    marginBottom: isMobile ? "4px" : 0,
                  }}
                >
                  <label
                    style={{
                      color: "var(--ov-on-color, #fff)",
                      fontSize: "13px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Phone Number
                  </label>
                  <input aria-label="phone"
                    name="phone"
                    style={inputStyle()}
                    type="text"
                    value={userData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    minHeight: isMobile ? "auto" : "110px",
                    marginBottom: isMobile ? "4px" : 0,
                  }}
                >
                  <label
                    style={{
                      color: "var(--ov-on-color, #fff)",
                      fontSize: "13px",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    Occupation
                  </label>
                  <input aria-label="Enter your occupation"
                    name="occupation"
                    style={inputStyle(errors.occupation)}
                    type="text"
                    value={userData.occupation}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your occupation"
                  />
                  {errors.occupation && (
                    <span
                      style={{
                        color: "#ff4d4d",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {errors.occupation}
                    </span>
                  )}
                </div>
                {!isMobile && <div style={{ flex: 1 }} />}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                <button
                  disabled={!isEditing}
                  onClick={handleDiscard}
                  style={{
                    padding: "12px 30px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: isEditing ? "white" : "#ccc",
                    color: "#087F8C",
                    fontWeight: "700",
                    cursor: isEditing ? "pointer" : "not-allowed",
                    fontFamily: "'Manrope', sans-serif",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Discard Changes
                </button>
                <button
                  disabled={!isEditing}
                  onClick={handleSaveClick}
                  style={{
                    padding: "12px 30px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: isEditing ? "white" : "#ccc",
                    color: "#087F8C",
                    fontWeight: "700",
                    cursor: isEditing ? "pointer" : "not-allowed",
                    fontFamily: "'Manrope', sans-serif",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
