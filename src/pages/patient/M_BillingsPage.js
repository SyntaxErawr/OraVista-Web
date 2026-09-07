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
  CreditCard,
  Receipt,
  DollarSign,
  Download,
} from "lucide-react";
import { exportReceiptPDF } from "../../utils/exportReceiptPDF";

/* ─── Responsive styles injected once (Pruned for new sidebar layout) ──────── */
const STYLES = `
  * { box-sizing: border-box; }

  /* Billings Content Mobile Adjustments */
  @media (max-width: 768px) {
    .page-pad     { padding: 30px 20px !important; }
    .page-title   { font-size: 28px !important; }
    .summary-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
    .summary-card { padding: 20px !important; }
    .summary-amt  { font-size: 24px !important; }
    .table-head   { display: none !important; }
    .table-row    { grid-template-columns: 1fr !important; gap: 6px !important; padding: 16px !important; }
    .table-row > div::before { content: attr(data-label); display: block; font-size: 11px; color: #888; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
    .tab-btn      { padding: 10px 18px !important; font-size: 13px !important; }
    .table-wrap   { padding: 20px !important; border-radius: 20px !important; }
    .empty-state  { padding: 40px 0 !important; }
  }
`;

function BillingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [userData, setUserData] = useState({
    id: null,
    firstName: "User",
    lastName: "",
    selectedBranch: "",
    age: "",
    sex: "",
  });
  const [billings, setBillings] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");

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

  /* inject styles once */
  useEffect(() => {
    if (!document.getElementById("billings-responsive-styles")) {
      const tag = document.createElement("style");
      tag.id = "billings-responsive-styles";
      tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
  }, []);

  const fetchBillings = useCallback(async (userId) => {
    try {
      const response = await fetch(
        `https://oravista-server-474976105474.asia-southeast1.run.app/api/user-appointments/${userId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setBillings(data);
      }
    } catch (error) {
      console.error("Error fetching billings:", error);
    }
  }, []);

  const loadUser = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        id: user.id,
        firstName: user.firstName || "User",
        lastName: user.lastName || "",
        selectedBranch: user.selectedBranch || user.branch || "",
        age: user.age || "",
        sex: user.sex || "",
      });
      fetchBillings(user.id);
    }
  }, [fetchBillings]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const closeMobileSidebar = () => setIsMobileOpen(false);

  // Keep every appointment visible until it is paid. The billing state is
  // shown per row so patients can see Pending, Approved, or Denied bills.
  const pendingTransactions = billings.filter(
    (billing) => billing.billing_status !== "Paid",
  );
  const completedTransactions = billings.filter(
    (billing) => billing.billing_status === "Paid",
  );
  const totalOutstanding = pendingTransactions.reduce(
    (s, i) => s + (i.billing_status === "Approved" ? parseFloat(i.amount) || 0 : 0),
    0,
  );
  const totalPaid = completedTransactions.reduce(
    (s, i) => s + (parseFloat(i.amount) || 0),
    0,
  );

  const sidebarWidth = isCollapsed ? "80px" : "260px";

  const getBillingStatus = (billing) => {
    if (billing.billing_status === "Paid") return "Paid";
    if (billing.billing_status === "Approved") return "Approved";
    if (billing.billing_status === "Denied") return "Denied";
    return "Pending";
  };

  const getStatusStyle = (status) => {
    if (status === "Paid") return { backgroundColor: "#10b981", color: "white" };
    if (status === "Approved") return { backgroundColor: "#2563eb", color: "white" };
    if (status === "Denied") return { backgroundColor: "#dc2626", color: "white" };
    return { backgroundColor: "#ffc107", color: "#5f4500" };
  };

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

  const currentRows =
    activeTab === "pending" ? pendingTransactions : completedTransactions;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: "white",
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

        <div className="page-pad" style={{ padding: "60px 80px" }}>
          {/* Header */}
          <h1
            className="page-title"
            style={{
              color: "#001166",
              fontSize: "48px",
              fontWeight: "800",
              marginBottom: "10px",
            }}
          >
            {userData.firstName}'s Billing
          </h1>
          <p
            style={{
              color: "#001166",
              fontWeight: "600",
              marginBottom: "40px",
            }}
          >
            Manage your payments and transaction history.
          </p>

          {/* Summary Cards */}
          <div
            className="summary-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "30px",
              marginBottom: "40px",
            }}
          >
            <div
              className="summary-card"
              style={{
                backgroundColor: "#fff3cd",
                padding: "30px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                border: "1px solid #ffe69c",
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffc107",
                  padding: "15px",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              >
                <DollarSign size={30} color="white" />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#856404",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Total Outstanding Balance
                </p>
                <h2
                  className="summary-amt"
                  style={{
                    margin: "5px 0 0 0",
                    color: "#856404",
                    fontSize: "32px",
                    fontWeight: "800",
                  }}
                >
                  ₱{totalOutstanding.toLocaleString()}
                </h2>
              </div>
            </div>

            <div
              className="summary-card"
              style={{
                backgroundColor: "#d1e7dd",
                padding: "30px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                border: "1px solid #badbcc",
              }}
            >
              <div
                style={{
                  backgroundColor: "#198754",
                  padding: "15px",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              >
                <Receipt size={30} color="white" />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#0f5132",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Total Amount Paid
                </p>
                <h2
                  className="summary-amt"
                  style={{
                    margin: "5px 0 0 0",
                    color: "#0f5132",
                    fontSize: "32px",
                    fontWeight: "800",
                  }}
                >
                  ₱{totalPaid.toLocaleString()}
                </h2>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "30px",
              flexWrap: "wrap",
            }}
          >
            {[
              { key: "pending", label: "Pending Transactions" },
              { key: "history", label: "Payment Records" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className="tab-btn"
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "12px 30px",
                  borderRadius: "30px",
                  border: "none",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  backgroundColor: activeTab === key ? "#001166" : "#e8ebf5",
                  color: activeTab === key ? "white" : "#001166",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div
            className="table-wrap"
            style={{
              backgroundColor: "#e8ebf5",
              borderRadius: "30px",
              padding: "40px",
            }}
          >
            {/* Desktop header row */}
            <div
              className="table-head"
              style={{
                display: "grid",
                gridTemplateColumns:
                  activeTab === "history" ? "1fr 1.5fr 1.5fr 1fr 1fr 1.2fr" : "1fr 1.5fr 1.5fr 1fr 1fr",
                padding: "0 20px 15px 20px",
                color: "#001166",
                fontWeight: "800",
                borderBottom: "2px dashed #001166",
                marginBottom: "20px",
              }}
            >
              <div>Ref No.</div>
              <div>Date</div>
              <div>Service Description</div>
              <div>Amount</div>
              <div style={{ textAlign: "center" }}>Status</div>
              {activeTab === "history" && <div style={{ textAlign: "center" }}>Receipt</div>}
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {currentRows.length > 0 ? (
                currentRows.map((item) => (
                  <div
                    key={item.id}
                    className="table-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        activeTab === "history" ? "1fr 1.5fr 1.5fr 1fr 1fr 1.2fr" : "1fr 1.5fr 1.5fr 1fr 1fr",
                      backgroundColor: "white",
                      padding: "22px 20px",
                      borderRadius: "15px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      data-label="Ref No."
                      style={{
                        color: "#666",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {item.booking_ref}
                    </div>
                    <div
                      data-label="Date"
                      style={{ color: "#001166", fontWeight: "600" }}
                    >
                      {new Date(item.appointment_date).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </div>
                    <div data-label="Service" style={{ color: "#001166" }}>
                      {item.service_type}
                    </div>
                    <div
                      data-label="Amount"
                      style={{
                        color: activeTab === "history" ? "#28a745" : "#ff9800",
                        fontWeight: "800",
                        fontSize: "16px",
                      }}
                    >
                      ₱{parseFloat(item.amount || 0).toLocaleString()}
                    </div>
                    <div data-label="Status" style={{ textAlign: "center" }}>
                      <span
                        style={{
                          padding: "6px 15px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          ...getStatusStyle(getBillingStatus(item)),
                        }}
                      >
                        {getBillingStatus(item)}
                      </span>
                    </div>
                    {activeTab === "history" && (
                      <div data-label="Receipt" style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => exportReceiptPDF(userData, item)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            border: "none",
                            borderRadius: "8px",
                            padding: "9px 12px",
                            backgroundColor: "#001166",
                            color: "white",
                            cursor: "pointer",
                            fontWeight: "700",
                            fontSize: "12px",
                          }}
                        >
                          <Download size={15} /> Download
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div
                  className="empty-state"
                  style={{
                    textAlign: "center",
                    padding: "60px 0",
                    color: "#001166",
                  }}
                >
                  <Receipt
                    size={60}
                    style={{ opacity: 0.2, marginBottom: "15px" }}
                  />
                  <p style={{ fontSize: "18px", fontWeight: "600" }}>
                    {activeTab === "pending"
                      ? "No pending transactions found."
                      : "No payment records found."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingsPage;
