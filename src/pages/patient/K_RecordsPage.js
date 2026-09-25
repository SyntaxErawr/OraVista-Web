import { fetchPatientHealth } from '../../utils/patientHealth';
import BrandWordmark from "../../components/BrandWordmark";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE_URL } from "../../config/api";

const fetchFinalDiagnoses = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/patient-final-diagnoses/${encodeURIComponent(userId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("Unable to load saved final diagnoses. Please try again.");
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Unexpected final diagnosis response.");
  return data.filter((record) => record.ai_findings?.human_verified === true);
};

const getFinalFindingRows = (record) => {
  // An empty annotations array is intentional: never restore removed AI predictions.
  const annotations = record.ai_findings?.annotations;
  if (!Array.isArray(annotations)) return [["Final finding details are unavailable."]];
  if (!annotations.length) return [["No findings retained in the saved final diagnosis."]];
  return annotations.map((finding) => [
    typeof finding?.name === "string" && finding.name.trim()
      ? finding.name
      : "Unnamed saved finding",
  ]);
};

const formatDiagnosticDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila",
  });
};

function RecordsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [recordSearch, setRecordSearch] = useState("");

  const [userData, setUserData] = useState({
    id: null,
    firstName: "User",
    lastName: "",
    branch: "",
  });
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [healthFailures, setHealthFailures] = useState({ analytics: false, risk: false });
  const healthRequest = useRef(0);
  useEffect(() => { const invalidate = () => { healthRequest.current++; }; return invalidate; }, []);
  const [finalDiagnoses, setFinalDiagnoses] = useState([]);
  const [isDiagnosesLoading, setIsDiagnosesLoading] = useState(true);
  const [diagnosesError, setDiagnosesError] = useState("");

  const visibleDiagnoses = finalDiagnoses.filter(record =>
    [record.id, formatDiagnosticDate(record.scan_date), record.clinical_notes,
      ...getFinalFindingRows(record).flat()].join(" ").toLowerCase().includes(recordSearch.trim().toLowerCase())
  );

  useEffect(() => {
    if (!userData.id) return undefined;
    let active = true;
    setIsDiagnosesLoading(true);
    setDiagnosesError("");
    fetchFinalDiagnoses(userData.id)
      .then((data) => { if (active) setFinalDiagnoses(data); })
      .catch((error) => {
        if (active) {
          setFinalDiagnoses([]);
          setDiagnosesError(error.message);
        }
      })
      .finally(() => { if (active) setIsDiagnosesLoading(false); });
    return () => { active = false; };
  }, [userData.id]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchData = useCallback(async (userId) => {
    const request = ++healthRequest.current;
    setIsDataLoading(true);
    setDataError('');
    const [analytics, risk] = await Promise.allSettled([
      fetchPatientHealth(userId, 'analytics'),
      fetchPatientHealth(userId, 'oral-health-risk'),
    ]);
    if (request !== healthRequest.current) return;
    setAnalyticsData(analytics.status === 'fulfilled' ? analytics.value : null);
    setRiskData(risk.status === 'fulfilled' ? risk.value : null);
    setHealthFailures({ analytics: analytics.status === 'rejected', risk: risk.status === 'rejected' });
    setDataError([analytics, risk].filter(result => result.status === 'rejected').map(result => result.reason.message).join(' '));
    setIsDataLoading(false);
  }, []);

  const loadUser = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        id: user.id,
        firstName: user.firstName || "User",
        lastName: user.lastName || "",
        branch: user.selectedBranch || user.branch || "",
      });
      fetchData(user.id);
    }
  }, [fetchData]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const addStamp = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    const text = "FOR PERSONAL USE ONLY";
    const angleDeg = 30;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.18 }));
      doc.setTextColor(76, 175, 80);
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      const pdfWidth = doc.internal.pageSize.width;
      const pdfHeight = doc.internal.pageSize.height;
      doc.text(text, pdfWidth / 2, pdfHeight / 2, {
        angle: angleDeg,
        align: "center",
        baseline: "middle",
      });
      doc.restoreGraphicsState();
    }
  };

  const handleDownloadReport = async () => {
    if (!userData.id) {
      alert("User data not loaded yet.");
      return;
    }
    setIsDownloadingReport(true);
    try {
      const patientName = [userData.firstName, userData.lastName]
        .filter(Boolean)
        .join(" ");
      const [analytics, risk, savedDiagnoses] = await Promise.all([
        fetchPatientHealth(userData.id, 'analytics'),
        fetchPatientHealth(userData.id, 'oral-health-risk'),
        fetchFinalDiagnoses(userData.id),
      ]);
      const aData = analytics || {};
      const rData = risk || {};

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(0, 17, 102);
      doc.text("OraVista Clinic", 14, 20);
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Patient Report: ${patientName}`, 14, 30);
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

      let currentY = 50;

      doc.setFontSize(14);
      doc.setTextColor(0, 17, 102);
      doc.text("Health Context & Lifestyle", 14, currentY);
      currentY += 5;

      const lifestyleBody = [];
      if (aData && Object.keys(aData).length > 0) {
        Object.entries(aData).forEach(([key, value]) => {
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            const label = key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
            lifestyleBody.push([label, String(value)]);
          }
        });
      }
      if (lifestyleBody.length === 0)
        lifestyleBody.push(["Data", "Not Available"]);

      autoTable(doc, {
        startY: currentY,
        head: [["Indicator", "Value"]],
        body: lifestyleBody,
        theme: "striped",
        headStyles: { fillColor: [0, 17, 102] },
      });
      currentY = doc.lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.setTextColor(0, 17, 102);
      doc.text("AI Assessment", 14, currentY);
      currentY += 5;

      const assessmentBody = [];
      if (rData && Object.keys(rData).length > 0) {
        assessmentBody.push([
          "Risk Score",
          String(rData.risk_score ?? rData.score ?? "N/A"),
        ]);
        assessmentBody.push([
          "Risk Grade",
          String(rData.risk_grade ?? rData.grade ?? "N/A"),
        ]);
        assessmentBody.push([
          "Risk Level",
          String(rData.risk_level ?? rData.level ?? "N/A"),
        ]);
      } else {
        assessmentBody.push(["Data", "Not Available"]);
      }

      autoTable(doc, {
        startY: currentY,
        head: [["Metric", "Assessment"]],
        body: assessmentBody,
        theme: "striped",
        headStyles: { fillColor: [0, 17, 102] },
      });
      currentY = doc.lastAutoTable.finalY + 15;

      const forecastText =
        rData?.disease_progression_forecast ??
        rData?.forecast ??
        "No forecast available.";
      const actionsText =
        rData?.recommended_action ??
        rData?.recommended_actions ??
        rData?.actions ??
        "No actions recommended at this time.";

      doc.setFontSize(14);
      doc.setTextColor(0, 17, 102);
      doc.text("Analysis", 14, currentY);
      currentY += 8;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Disease Progression Forecast:", 14, currentY);
      currentY += 6;
      doc.setFont("helvetica", "normal");
      const splitForecast = doc.splitTextToSize(String(forecastText), 180);
      doc.text(splitForecast, 14, currentY);
      currentY += splitForecast.length * 5 + 8;
      doc.setFont("helvetica", "bold");
      doc.text("Recommended Actions:", 14, currentY);
      currentY += 6;
      doc.setFont("helvetica", "normal");
      const splitActions = doc.splitTextToSize(String(actionsText), 180);
      doc.text(splitActions, 14, currentY);

      // Keep the existing checkup report and append finalized diagnosis pages.
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 17, 102);
      doc.text("Dentist-Saved Final Diagnoses", 14, 20);
      if (!savedDiagnoses.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("No dentist-saved final diagnoses are available yet.", 14, 32);
      }
      savedDiagnoses.forEach((record, index) => {
        if (index > 0) doc.addPage();
        autoTable(doc, {
          startY: index === 0 ? 30 : 20,
          head: [[`Final Diagnosis #${record.id}`]],
          body: [
            [`Scan date: ${formatDiagnosticDate(record.scan_date)}`],
            ["Final findings saved by the dentist"],
            ...getFinalFindingRows(record),
            ["Dentist's Clinical Notes"],
            [typeof record.clinical_notes === "string" && record.clinical_notes.trim()
              ? record.clinical_notes
              : "No clinical notes were entered for this saved diagnosis."],
          ],
          theme: "striped",
          headStyles: { fillColor: [0, 17, 102] },
          styles: { overflow: "linebreak", cellPadding: 4, fontSize: 11 },
          margin: { top: 20, bottom: 20, left: 14, right: 14 },
        });
      });

      addStamp(doc);
      doc.save(`${patientName.replace(/\s+/g, "_")}_OraVista_Report.pdf`);
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate report.");
    } finally {
      setIsDownloadingReport(false);
    }
  };

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
      backgroundColor: isActive ? "var(--ov-on-wash, rgba(255,255,255,0.2))" : "transparent",
      fontWeight: isActive ? "700" : "400",
      borderLeft: isActive ? "4px solid #21B9C8" : "4px solid transparent",
    };
  };

  const thStyle = {
    padding: isMobile ? "10px 12px" : "15px",
    textAlign: "left",
    fontSize: isMobile ? "13px" : "14px",
  };
  const tdStyle = (extra = {}) => ({
    padding: isMobile ? "10px 12px" : "12px 15px",
    fontSize: isMobile ? "13px" : "14px",
    ...extra,
  });

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
          {/* Header row */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            <h1
              style={{
                color: "#087F8C",
                fontSize: isMobile ? "28px" : "42px",
                fontWeight: "800",
                margin: 0,
              }}
            >
              Records
            </h1>
            <p
              style={{
                color: "#087F8C",
                fontSize: "14px",
                fontWeight: "600",
                margin: 0,
              }}
            >
              Active User: {userData.firstName}
            </p>
          </div>

          {/* Analytics & Risk Tables */}
          <div
            style={{
              backgroundColor: "#f0f2f5",
              borderRadius: "20px",
              padding: isMobile ? "20px 16px" : "30px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                color: "#087F8C",
                fontSize: isMobile ? "18px" : "22px",
                fontWeight: "800",
                marginBottom: "20px",
                marginTop: 0,
              }}
            >
              Analytics & Health Risk Score
            </h2>

            {dataError && <div className="ov-inline-error" role="alert">{dataError} <button type="button" className="ov-ui-button ov-text-link" onClick={() => fetchData(userData.id)}>Retry</button></div>}
            {isDataLoading ? (
              <p
                style={{
                  color: "#666",
                  textAlign: "center",
                  padding: "50px 0",
                }}
              >
                Loading data...
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "28px",
                }}
              >
                {/* Table 1: Analytics */}
                <div>
                  <h3
                    style={{
                      color: "#087F8C",
                      fontSize: isMobile ? "15px" : "17px",
                      marginBottom: "12px",
                      marginTop: 0,
                    }}
                  >
                    Health Context & Lifestyle
                  </h3>
                  <div style={{ overflowX: "auto", borderRadius: "10px" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left",
                        backgroundColor: "white",
                        minWidth: isMobile ? "300px" : "unset",
                      }}
                    >
                      <thead>
                        <tr className="ov-color-surface"
                          style={{ "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)" }}
                        >
                          <th style={thStyle}>Indicator</th>
                          <th style={thStyle}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData &&
                        Object.keys(analyticsData).length > 0 ? (
                          Object.entries(analyticsData).map(
                            ([key, value], index) => {
                              if (
                                typeof value !== "string" &&
                                typeof value !== "number" &&
                                typeof value !== "boolean"
                              )
                                return null;
                              const label = key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase());
                              return (
                                <tr
                                  key={key}
                                  style={{ borderBottom: "1px solid #eee" }}
                                >
                                  <td
                                    style={tdStyle({
                                      fontWeight: "600",
                                      color: "#333",
                                    })}
                                  >
                                    {label}
                                  </td>
                                  <td style={tdStyle({ color: "#666" })}>
                                    {String(value)}
                                  </td>
                                </tr>
                              );
                            },
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan="2"
                              style={tdStyle({
                                textAlign: "center",
                                color: "#666",
                              })}
                            >
                              {healthFailures.analytics ? 'Health history could not be loaded.' : 'No health history has been recorded yet.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 2: AI Assessment */}
                <div>
                  <h3
                    style={{
                      color: "#087F8C",
                      fontSize: isMobile ? "15px" : "17px",
                      marginBottom: "12px",
                      marginTop: 0,
                    }}
                  >
                    AI Assessment
                  </h3>
                  <div style={{ overflowX: "auto", borderRadius: "10px" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left",
                        backgroundColor: "white",
                        minWidth: isMobile ? "300px" : "unset",
                      }}
                    >
                      <thead>
                        <tr className="ov-color-surface"
                          style={{ "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)" }}
                        >
                          <th style={thStyle}>Metric</th>
                          <th style={thStyle}>Assessment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riskData && Object.keys(riskData).length > 0 ? (
                          <>
                            <tr style={{ borderBottom: "1px solid #eee" }}>
                              <td
                                style={tdStyle({
                                  fontWeight: "600",
                                  color: "#333",
                                })}
                              >
                                Risk Score
                              </td>
                              <td style={tdStyle({ color: "#666" })}>
                                {String(
                                  riskData.risk_score ??
                                    riskData.score ??
                                    "N/A",
                                )}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #eee" }}>
                              <td
                                style={tdStyle({
                                  fontWeight: "600",
                                  color: "#333",
                                })}
                              >
                                Risk Grade
                              </td>
                              <td style={tdStyle({ color: "#666" })}>
                                {String(
                                  riskData.health_grade ??
                                    riskData.risk_grade ??
                                    riskData.grade ??
                                    "N/A",
                                )}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #eee" }}>
                              <td
                                style={tdStyle({
                                  fontWeight: "600",
                                  color: "#333",
                                })}
                              >
                                Risk Level
                              </td>
                              <td style={tdStyle({ color: "#666" })}>
                                {String(
                                  riskData.risk_level ??
                                    riskData.level ??
                                    "N/A",
                                )}
                              </td>
                            </tr>
                            {(riskData.disease_progression_forecast ||
                              riskData.forecast) && (
                              <tr style={{ borderBottom: "1px solid #eee" }}>
                                <td
                                  style={tdStyle({
                                    fontWeight: "600",
                                    color: "#333",
                                  })}
                                >
                                  Disease Progression Forecast
                                </td>
                                <td
                                  style={tdStyle({
                                    color: "#666",
                                    whiteSpace: "pre-wrap",
                                  })}
                                >
                                  {String(
                                    riskData.disease_progression_forecast ??
                                      riskData.forecast,
                                  )}
                                </td>
                              </tr>
                            )}
                            {(riskData.recommended_action ||
                              riskData.recommended_actions ||
                              riskData.actions) && (
                              <tr>
                                <td
                                  style={tdStyle({
                                    fontWeight: "600",
                                    color: "#333",
                                  })}
                                >
                                  Recommended Action
                                </td>
                                <td
                                  style={tdStyle({
                                    color: "#666",
                                    whiteSpace: "pre-wrap",
                                  })}
                                >
                                  {String(
                                    riskData.recommended_action ??
                                      riskData.recommended_actions ??
                                      riskData.actions,
                                  )}
                                </td>
                              </tr>
                            )}
                          </>
                        ) : (
                          <tr>
                            <td
                              colSpan="2"
                              style={tdStyle({
                                textAlign: "center",
                                color: "#666",
                              })}
                            >
                              {healthFailures.risk ? 'Risk assessment could not be loaded.' : 'No risk assessment has been saved yet.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Only diagnoses finalized with Save Final Diagnosis are shown here. */}
          <section style={{ backgroundColor: "#f0f2f5", borderRadius: "20px", padding: isMobile ? "20px 16px" : "30px", marginBottom: "24px" }}>
            <h2 style={{ color: "#087F8C", fontSize: isMobile ? "18px" : "22px", fontWeight: "800", margin: "0 0 20px" }}>Dentist-Saved Final Diagnoses</h2>
            <label className="ov-field-label" htmlFor="record-search">Search saved diagnoses</label>
            <div className="ov-search-field">
              <Search size={18} aria-hidden="true" />
              <input id="record-search" type="search" value={recordSearch} onChange={event => setRecordSearch(event.target.value)} placeholder="Search findings, notes, date or diagnosis number" />
            </div>
            {isDiagnosesLoading ? (
              <p role="status" style={{ color: "#666" }}>Loading final diagnoses...</p>
            ) : diagnosesError ? (
              <p role="alert" style={{ color: "#b91c1c" }}>{diagnosesError}</p>
            ) : finalDiagnoses.length === 0 ? (
              <p style={{ color: "#666" }}>No dentist-saved final diagnoses are available yet.</p>
            ) : visibleDiagnoses.length === 0 ? (
              <p role="status">No saved diagnoses match your search. Try another keyword.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {visibleDiagnoses.map((record) => (
                  <article key={record.id} style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", overflowWrap: "anywhere" }}>
                    <h3 style={{ color: "#087F8C", fontSize: "17px", margin: "0 0 6px" }}>Final Diagnosis #{record.id}</h3>
                    <p style={{ color: "#666", fontSize: "13px", margin: "0 0 16px" }}>Scan date: {formatDiagnosticDate(record.scan_date)}</p>
                    <h4 style={{ color: "#087F8C", margin: "0 0 10px" }}>Final Findings</h4>
                    <ul style={{ color: "#333", paddingLeft: "22px", lineHeight: 1.7 }}>
                      {getFinalFindingRows(record).map(([finding], index) => <li key={index} style={{ whiteSpace: "pre-wrap" }}>{finding}</li>)}
                    </ul>
                    <h4 style={{ color: "#087F8C", margin: "18px 0 10px" }}>Dentist’s Clinical Notes</h4>
                    <p style={{ color: "#333", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
                      {typeof record.clinical_notes === "string" && record.clinical_notes.trim()
                        ? record.clinical_notes
                        : "No clinical notes were entered for this saved diagnosis."}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Download Button */}
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              onClick={handleDownloadReport}
              disabled={isDownloadingReport}
              style={{ "--ov-on-color": "var(--ov-ink)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "var(--ov-primary)",
                color: "var(--ov-on-color, #fff)",
                fontWeight: "700",
                cursor: isDownloadingReport ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                opacity: isDownloadingReport ? 0.7 : 1,
                fontFamily: "'Manrope', sans-serif",
                fontSize: "14px",
                width: isMobile ? "100%" : "auto",
                justifyContent: isMobile ? "center" : "flex-start",
              }}
            >
              <FileText size={18} />{" "}
              {isDownloadingReport ? "Generating..." : "Download Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecordsPage;
