import React, { useCallback, useEffect, useState } from "react";
import { CreditCard, ReceiptText, Save, CheckCircle2 } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

const API_BASE = "https://oravista-server-474976105474.asia-southeast1.run.app";

const parseReceiptDetails = (details) => {
  if (!details) return {};
  if (typeof details === "object") return details;
  try {
    return JSON.parse(details);
  } catch {
    return {};
  }
};

function StaffBillingsPage() {
  const [billings, setBillings] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [receipt, setReceipt] = useState({
    procedure: "",
    charge: "",
    paid: "",
    balance: "0.00",
    nextVisit: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchBillings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/staff/billings`);
      if (!response.ok) throw new Error("Unable to load billing records.");
      const records = await response.json();
      setBillings(records);
    } catch (error) {
      console.error("Staff billing fetch error:", error);
      setMessage("Unable to load billing records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const selectBilling = (billing) => {
    const savedDetails = parseReceiptDetails(billing.receipt_details);
    setSelectedBilling(billing);
    setReceipt({
      procedure: savedDetails.procedure || billing.service_type || "",
      charge: savedDetails.charge || String(billing.amount || ""),
      paid: savedDetails.paid || (billing.billing_status === "Paid" ? String(billing.amount || "") : ""),
      balance: savedDetails.balance || (billing.billing_status === "Paid" ? "0.00" : String(billing.amount || "0.00")),
      nextVisit: savedDetails.nextVisit || "",
    });
    setMessage("");
  };

  const saveBilling = async (billingStatus) => {
    if (!selectedBilling) return;
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/api/staff/billings/${selectedBilling.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing_status: billingStatus,
          amount: receipt.charge,
          service_type: receipt.procedure,
          receipt_details: receipt,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save billing.");

      const updatedBilling = { ...selectedBilling, ...data.appointment, receipt_details: receipt };
      setSelectedBilling(updatedBilling);
      setBillings((current) => current.map((billing) => (
        billing.id === updatedBilling.id ? { ...billing, ...updatedBilling } : billing
      )));
      setMessage(billingStatus === "Paid"
        ? "Payment recorded. The receipt is now in the patient's Payment Records."
        : billingStatus === "Denied"
          ? "Billing was not approved and will not appear in the patient's billings."
          : "Bill approved. It is now visible in the patient's Pending Transactions.");
    } catch (error) {
      console.error("Staff billing update error:", error);
      setMessage(error.message || "Unable to save billing.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Billing & Receipts</h1>
            <p style={styles.subtitle}>Approve patient bills and prepare the treatment-record receipt.</p>
          </div>
          <CreditCard size={38} color="#001166" />
        </div>

        <div style={styles.layout}>
          <section style={styles.recordsCard}>
            <h2 style={styles.sectionTitle}>Patient billing queue</h2>
            {isLoading ? <p>Loading billing records...</p> : billings.length === 0 ? (
              <p style={styles.muted}>No billable appointments found.</p>
            ) : billings.map((billing) => (
              <button
                type="button"
                key={billing.id}
                onClick={() => selectBilling(billing)}
                style={{ ...styles.billingRow, ...(selectedBilling?.id === billing.id ? styles.selectedRow : {}) }}
              >
                <span style={styles.patientName}>{billing.first_name} {billing.last_name}</span>
                <span style={styles.service}>{billing.service_type}</span>
                <span style={styles.amount}>PHP {Number(billing.amount || 0).toLocaleString()}</span>
                <span style={{ ...styles.status, ...(billing.billing_status === "Paid" ? styles.paid : styles.pending) }}>
                  {billing.billing_status || "Awaiting billing approval"}
                </span>
              </button>
            ))}
          </section>

          <section style={styles.receiptCard}>
            <div style={styles.receiptHeader}>
              <ReceiptText size={28} color="#001166" />
              <div>
                <h2 style={styles.sectionTitle}>Treatment record receipt</h2>
                <p style={styles.muted}>Customize the details before publishing to the patient.</p>
              </div>
            </div>

            {selectedBilling ? (
              <>
                <div style={styles.patientLine}>
                  <strong>Name:</strong> {selectedBilling.first_name} {selectedBilling.last_name}
                  <span><strong>Age:</strong> {selectedBilling.age || "—"}</span>
                  <span><strong>Gender:</strong> {selectedBilling.sex || "—"}</span>
                </div>
                <div style={styles.recordTitle}>TREATMENT RECORD</div>
                <div style={styles.formGrid}>
                  <label style={styles.label}>Procedure / service
                    <input style={styles.input} value={receipt.procedure} onChange={(event) => setReceipt({ ...receipt, procedure: event.target.value })} />
                  </label>
                  <label style={styles.label}>Charge (PHP)
                    <input style={styles.input} type="number" min="0" step="0.01" value={receipt.charge} onChange={(event) => setReceipt({ ...receipt, charge: event.target.value })} />
                  </label>
                  <label style={styles.label}>Paid (PHP)
                    <input style={styles.input} type="number" min="0" step="0.01" value={receipt.paid} onChange={(event) => setReceipt({ ...receipt, paid: event.target.value })} />
                  </label>
                  <label style={styles.label}>Balance (PHP)
                    <input style={styles.input} type="number" min="0" step="0.01" value={receipt.balance} onChange={(event) => setReceipt({ ...receipt, balance: event.target.value })} />
                  </label>
                  <label style={styles.label}>Next visit
                    <input style={styles.input} type="date" value={receipt.nextVisit} onChange={(event) => setReceipt({ ...receipt, nextVisit: event.target.value })} />
                  </label>
                </div>
                <div style={styles.previewRow}>
                  <span>{selectedBilling.appointment_date ? new Date(selectedBilling.appointment_date).toLocaleDateString() : "—"}</span>
                  <span>{receipt.procedure || "Procedure / service"}</span>
                  <span>PHP {receipt.charge || "0.00"}</span>
                  <span>PHP {receipt.paid || "0.00"}</span>
                  <span>PHP {receipt.balance || "0.00"}</span>
                </div>
                {message && <p style={styles.message}>{message}</p>}
                <div style={styles.actions}>
                  <button type="button" disabled={isSaving} onClick={() => saveBilling("Approved")} style={styles.secondaryButton}>
                    <Save size={17} /> Approve Billing
                  </button>
                  <button type="button" disabled={isSaving} onClick={() => saveBilling("Denied")} style={styles.rejectButton}>
                    Do Not Bill
                  </button>
                  <button type="button" disabled={isSaving} onClick={() => saveBilling("Paid")} style={styles.primaryButton}>
                    <CheckCircle2 size={17} /> Mark as Paid
                  </button>
                </div>
              </>
            ) : <p style={styles.muted}>Select a billing record to edit its receipt.</p>}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  page: { padding: "32px", background: "#f4f7fe", minHeight: "100%", fontFamily: "Poppins, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  title: { margin: 0, color: "#001166", fontSize: "32px" },
  subtitle: { margin: "6px 0 0", color: "#526078" },
  layout: { display: "grid", gridTemplateColumns: "minmax(300px, .9fr) minmax(460px, 1.4fr)", gap: "24px", alignItems: "start" },
  recordsCard: { background: "white", borderRadius: "18px", padding: "22px", boxShadow: "0 4px 18px rgba(0,17,102,.08)" },
  receiptCard: { background: "white", borderRadius: "18px", padding: "26px", boxShadow: "0 4px 18px rgba(0,17,102,.08)" },
  sectionTitle: { margin: 0, color: "#001166", fontSize: "18px" },
  muted: { color: "#65738a", fontSize: "13px" },
  billingRow: { width: "100%", border: "1px solid #e4e9f2", background: "white", borderRadius: "10px", marginTop: "10px", padding: "13px", textAlign: "left", cursor: "pointer", display: "grid", gap: "5px" },
  selectedRow: { borderColor: "#001166", background: "#eef1ff" },
  patientName: { color: "#001166", fontWeight: 700 }, service: { color: "#536176", fontSize: "13px" }, amount: { fontWeight: 700, fontSize: "13px" },
  status: { width: "fit-content", borderRadius: "12px", padding: "3px 8px", fontSize: "11px", fontWeight: 700 }, pending: { color: "#815f00", background: "#fff3cd" }, paid: { color: "#09663b", background: "#d9f5e7" },
  receiptHeader: { display: "flex", gap: "12px", alignItems: "center", borderBottom: "1px solid #dce2ec", paddingBottom: "15px", marginBottom: "18px" },
  patientLine: { display: "flex", flexWrap: "wrap", gap: "20px", borderBottom: "1px solid #222", paddingBottom: "6px", fontSize: "13px" },
  recordTitle: { textAlign: "center", fontSize: "13px", color: "#001166", fontWeight: 800, margin: "17px 0 12px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "13px" },
  label: { color: "#33415c", display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700 },
  input: { border: "1px solid #cdd6e4", borderRadius: "7px", padding: "9px", font: "inherit", fontSize: "13px" },
  previewRow: { display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: "2px", marginTop: "20px", border: "1px solid #001166", fontSize: "11px" },
  actions: { display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "10px", marginTop: "18px" },
  primaryButton: { display: "inline-flex", gap: "7px", alignItems: "center", border: 0, borderRadius: "8px", padding: "11px 14px", background: "#001166", color: "white", fontWeight: 700, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", gap: "7px", alignItems: "center", border: "1px solid #001166", borderRadius: "8px", padding: "11px 14px", background: "white", color: "#001166", fontWeight: 700, cursor: "pointer" },
  rejectButton: { border: "1px solid #b42318", borderRadius: "8px", padding: "11px 14px", background: "white", color: "#b42318", fontWeight: 700, cursor: "pointer" },
  message: { color: "#09663b", background: "#eaf8f0", padding: "10px", borderRadius: "7px", fontSize: "13px", marginBottom: 0 },
};

export default StaffBillingsPage;
