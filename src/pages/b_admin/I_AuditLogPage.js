import React, { useCallback, useEffect, useState } from "react";
import { ClipboardList, Search, Activity, Clock } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

const API_BASE = "https://oravista-server-474976105474.asia-southeast1.run.app";

function I_AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // NOTE: Ensure your backend has an endpoint to fetch these logs.
      // If it doesn't exist yet, this will catch the error and you can use mock data for testing.
      const response = await fetch(`${API_BASE}/api/admin/audit-logs`);
      if (!response.ok) throw new Error("Unable to load audit logs.");
      
      const records = await response.json();
      setAuditLogs(records);
    } catch (error) {
      console.error("Audit log fetch error:", error);
      setError("Unable to connect to the audit log database. Showing placeholder data for preview.");
      
      // Placeholder data to preview the UI if the endpoint isn't ready
      setAuditLogs([
        { id: 1, timestamp: new Date().toISOString(), action: "Approved", details: "Approved billing for patient John Doe - Procedure: Cleaning", amount: "1500.00", user: "Staff" },
        { id: 2, timestamp: new Date(Date.now() - 3600000).toISOString(), action: "Paid", details: "Marked billing as Paid for patient Jane Smith - Procedure: Extraction", amount: "2500.00", user: "Staff" },
        { id: 3, timestamp: new Date(Date.now() - 86400000).toISOString(), action: "Denied", details: "Denied billing for patient Mark Johnson", amount: "0.00", user: "Admin" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Filter logs based on the search term (checks action type, details, or user)
  const filteredLogs = auditLogs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(searchLower)) ||
      (log.details && log.details.toLowerCase().includes(searchLower)) ||
      (log.user && log.user.toLowerCase().includes(searchLower))
    );
  });

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Action Audit Log</h1>
            <p style={styles.subtitle}>Monitor staff actions, billing updates, and system records.</p>
          </div>
          <ClipboardList size={38} color="#087F8C" />
        </div>

        <div className="ov-panel" style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.headerTitleGroup}>
              <Activity size={24} color="#087F8C" />
              <h2 style={styles.sectionTitle}>System Activity</h2>
            </div>
            
            <div style={styles.searchContainer}>
              <Search size={18} color="#65738a" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search logs (e.g., Paid, Denied, Patient Name)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {error && <p style={styles.errorMessage}>{error}</p>}

          <div style={styles.logContainer}>
            {isLoading ? (
              <p style={styles.mutedCenter}>Loading audit logs...</p>
            ) : filteredLogs.length === 0 ? (
              <p style={styles.mutedCenter}>No audit logs match your search.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date & Time</th>
                      <th style={styles.th}>User / Role</th>
                      <th style={styles.th}>Action</th>
                      <th style={styles.th}>Details</th>
                      <th style={styles.th}>Amount (PHP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.timeGroup}>
                            <Clock size={14} color="#526078" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td style={styles.td}>{log.user || "System"}</td>
                        <td style={styles.td}>
                          <span style={{ 
                            ...styles.statusBadge, 
                            ...(log.action === "Paid" ? styles.paid : log.action === "Approved" ? styles.pending : log.action === "Denied" ? styles.denied : styles.defaultBadge) 
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={styles.tdDetail}>{log.details}</td>
                        <td style={styles.tdAmount}>
                          {log.amount && Number(log.amount) > 0 ? Number(log.amount).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  page: { padding: "32px", background: "#F3F9FA", minHeight: "100%", fontFamily: "Manrope, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  title: { margin: 0, color: "#087F8C", fontSize: "32px" },
  subtitle: { margin: "6px 0 0", color: "#526078" },
  card: { background: "white", borderRadius: "18px", padding: "26px", boxShadow: "0 4px 18px rgba(8, 127, 140,.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", borderBottom: "1px solid #dce2ec", paddingBottom: "20px", marginBottom: "20px" },
  headerTitleGroup: { display: "flex", alignItems: "center", gap: "10px" },
  sectionTitle: { margin: 0, color: "#087F8C", fontSize: "20px" },
  searchContainer: { position: "relative", width: "100%", maxWidth: "350px" },
  searchIcon: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" },
  searchInput: { width: "100%", padding: "10px 10px 10px 38px", border: "1px solid #cdd6e4", borderRadius: "8px", font: "inherit", fontSize: "13px", outline: "none", boxSizing: "border-box" },
  logContainer: { width: "100%" },
  mutedCenter: { color: "#65738a", fontSize: "14px", textAlign: "center", padding: "40px 0" },
  errorMessage: { color: "#b42318", background: "#fdeced", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" },
  th: { padding: "14px", color: "#33415c", fontWeight: 700, borderBottom: "2px solid #e4e9f2", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #e4e9f2", transition: "background 0.2s" },
  td: { padding: "14px", color: "#33415c", verticalAlign: "middle" },
  tdDetail: { padding: "14px", color: "#526078", maxWidth: "400px", lineHeight: "1.5" },
  tdAmount: { padding: "14px", color: "#087F8C", fontWeight: 700, whiteSpace: "nowrap" },
  timeGroup: { display: "flex", alignItems: "center", gap: "8px", color: "#526078", whiteSpace: "nowrap" },
  statusBadge: { borderRadius: "12px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, display: "inline-block" },
  pending: { color: "#815f00", background: "#fff3cd" },
  paid: { color: "#09663b", background: "#d9f5e7" },
  denied: { color: "#b42318", background: "#fdeced" },
  defaultBadge: { color: "#33415c", background: "#e4e9f2" },
};

export default I_AuditLogPage;