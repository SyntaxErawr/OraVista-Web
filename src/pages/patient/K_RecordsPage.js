import React, { useState, useEffect, useCallback } from "react";
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
  ChevronDown,
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

const DENTISTS_BY_BRANCH = {
  "Gil Puyat, Pasay": [
    "Dra. Theresa Madrid",
    "Dra. Ruth Bozar",
    "Dr. Vicente Epres",
    "Dra. Queenie Balmedina",
  ],
  "Sta. Ana, Manila": ["Dra. Queenie Balmedina", "Dr. Vicente Epres"],
  "Angeles, Pampanga": ["Dra. Paulette Maliit", "Dr. Vicente Epres"],
};

function RecordsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState("");

  const [userData, setUserData] = useState({
    id: null,
    firstName: "User",
    lastName: "",
    branch: "",
  });
  const dentistsList = DENTISTS_BY_BRANCH[userData.branch] || [];
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [finalDiagnoses, setFinalDiagnoses] = useState([]);
  const [isDiagnosesLoading, setIsDiagnosesLoading] = useState(true);
  const [diagnosesError, setDiagnosesError] = useState("");

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
    setIsDataLoading(true);
    try {
      const [analyticsRes, riskRes] = await Promise.all([
        fetch(
          `https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/patient/get/${userId}/analytics`,
        ),
        fetch(
          `https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/patient/get/${userId}/oral-health-risk`,
        ),
      ]);
      if (analyticsRes.ok) setAnalyticsData(await analyticsRes.json());
      if (riskRes.ok) setRiskData(await riskRes.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsDataLoading(false);
    }
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
      const [analyticsRes, riskRes, savedDiagnoses] = await Promise.all([
        fetch(
          `https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/patient/get/${userData.id}/analytics`,
        ),
        fetch(
          `https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/patient/get/${userData.id}/oral-health-risk`,
        ),
        fetchFinalDiagnoses(userData.id),
      ]);
      let aData = {};
      let rData = {};
      if (analyticsRes.ok) aData = await analyticsRes.json();
      if (riskRes.ok) rData = await riskRes.json();

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
      backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
      fontWeight: isActive ? "700" : "400",
      borderLeft: isActive ? "4px solid white" : "4px solid transparent",
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
                color: "#001166",
                fontSize: isMobile ? "28px" : "42px",
                fontWeight: "800",
                margin: 0,
              }}
            >
              Records
            </h1>
            <p
              style={{
                color: "#001166",
                fontSize: "14px",
                fontWeight: "600",
                margin: 0,
              }}
            >
              Active User: {userData.firstName}
            </p>
          </div>

          {/* Search & Filter row */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                position: "relative",
                flex: isMobile ? "unset" : "0 0 auto",
                width: isMobile ? "100%" : "auto",
              }}
            >
              <Search
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "13px",
                  color: "#666",
                }}
                size={18}
              />
              <input
                type="text"
                placeholder="Search records here..."
                style={{
                  padding: "12px 15px 12px 42px",
                  borderRadius: "25px",
                  border: "none",
                  backgroundColor: "#f0f2f5",
                  width: isMobile ? "100%" : "280px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: "140px" }}>
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
              <button
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#001166",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                Apply
              </button>
            </div>
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
                color: "#001166",
                fontSize: isMobile ? "18px" : "22px",
                fontWeight: "800",
                marginBottom: "20px",
                marginTop: 0,
              }}
            >
              Analytics & Health Risk Score
            </h2>

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
                      color: "#001166",
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
                        <tr
                          style={{ backgroundColor: "#001166", color: "white" }}
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
                              Data Not Available
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
                      color: "#001166",
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
                        <tr
                          style={{ backgroundColor: "#001166", color: "white" }}
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
                              Data Not Available
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
            <h2 style={{ color: "#001166", fontSize: isMobile ? "18px" : "22px", fontWeight: "800", margin: "0 0 20px" }}>Dentist-Saved Final Diagnoses</h2>
            {isDiagnosesLoading ? (
              <p role="status" style={{ color: "#666" }}>Loading final diagnoses...</p>
            ) : diagnosesError ? (
              <p role="alert" style={{ color: "#b91c1c" }}>{diagnosesError}</p>
            ) : finalDiagnoses.length === 0 ? (
              <p style={{ color: "#666" }}>No dentist-saved final diagnoses are available yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {finalDiagnoses.map((record) => (
                  <article key={record.id} style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", overflowWrap: "anywhere" }}>
                    <h3 style={{ color: "#001166", fontSize: "17px", margin: "0 0 6px" }}>Final Diagnosis #{record.id}</h3>
                    <p style={{ color: "#666", fontSize: "13px", margin: "0 0 16px" }}>Scan date: {formatDiagnosticDate(record.scan_date)}</p>
                    <h4 style={{ color: "#001166", margin: "0 0 10px" }}>Final Findings</h4>
                    <ul style={{ color: "#333", paddingLeft: "22px", lineHeight: 1.7 }}>
                      {getFinalFindingRows(record).map(([finding], index) => <li key={index} style={{ whiteSpace: "pre-wrap" }}>{finding}</li>)}
                    </ul>
                    <h4 style={{ color: "#001166", margin: "18px 0 10px" }}>Dentist’s Clinical Notes</h4>
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#001166",
                color: "white",
                fontWeight: "700",
                cursor: isDownloadingReport ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                opacity: isDownloadingReport ? 0.7 : 1,
                fontFamily: "'Poppins', sans-serif",
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
