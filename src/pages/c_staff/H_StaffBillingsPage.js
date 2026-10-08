import { RoleNotifications } from '../../components/ClinicPortalTools';
import ClinicPageTitle from '../../components/ClinicPageTitle';
import PaginatedList from '../../components/PaginatedList';
import React, { useCallback, useEffect, useState, useRef } from "react";
import { User, ReceiptText, Save, CheckCircle2 } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

const API_BASE = "https://oravista-server-474976105474.asia-southeast1.run.app";

const parseReceiptDetails = (details) => {
  if (!details) return {};
  if (typeof details === "object") return details;
  try {
    return JSON.parse(details) || {};
  } catch {
    return {};
  }
};

function StaffBillingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadError, setLoadError] = useState("");
  const [dirty, setDirty] = useState(false);
  const savingRef = useRef(false);
  const receiptForm = useRef(null);
  const clinicUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [billings, setBillings] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [receipt, setReceipt] = useState({
    procedure: "",
    charge: "",
    paid: "",
    balance: "0.00",
    nextVisit: "",
    paymentMethod: '', paymentReference: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchBillings = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`${API_BASE}/api/staff/billings`);
      if (!response.ok) throw new Error("Unable to load billing records.");
      const records = await response.json();
      setBillings(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error("Staff billing fetch error:", error);
      setLoadError("Unable to load billing records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const selectBilling = (billing) => {
    if (savingRef.current) return;
    if (dirty && !window.confirm("Discard unsaved receipt changes and open this bill?")) return;
    setDirty(false);
    const savedDetails = parseReceiptDetails(billing.receipt_details);
    setSelectedBilling(billing);
    setReceipt({
      procedure: savedDetails.procedure || billing.service_type || "",
      charge: savedDetails.charge ?? String(billing.amount || ""),
      paid: savedDetails.paid ?? (billing.billing_status === "Paid" ? String(billing.amount || "") : ""),
      balance: savedDetails.balance ?? (billing.billing_status === "Paid" ? "0.00" : String(billing.amount || "0.00")),
      nextVisit: savedDetails.nextVisit || "",
      paymentMethod: '', paymentReference: '',
    });
    setMessage("");
  };

  const saveBilling = async (billingStatus) => {
    if (!selectedBilling || savingRef.current) return;
    if (!receiptForm.current.reportValidity()) return;
    if (Number(receipt.paid) > Number(receipt.charge)) { setMessage("Paid amount cannot exceed the charge."); return; }
    if (billingStatus === "Paid" && Number(receipt.paid) < Number(receipt.charge)) { setMessage("Enter the full payment amount before marking this bill as paid."); return; }
    savingRef.current = true;
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
          expected_paid: parseReceiptDetails(selectedBilling.receipt_details).paid ?? (selectedBilling.billing_status === 'Paid' ? selectedBilling.amount : 0),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save billing.");

      const updatedBilling = { ...selectedBilling, billing_status: billingStatus, amount: receipt.charge, service_type: receipt.procedure, receipt_details: receipt, ...data.appointment };
      setDirty(false);
      setSelectedBilling(updatedBilling);
      setBillings((current) => current.map((billing) => (
        billing.id === updatedBilling.id ? { ...billing, ...updatedBilling } : billing
      )));
      setMessage(billingStatus === "Paid"
        ? "Payment recorded. The receipt is now in the patient's Payment Records."
        : billingStatus === "Denied"
          ? "Billing was not approved and is excluded from the patient's outstanding balance."
          : "Bill approved. It is now visible in the patient's Pending Transactions.");
    } catch (error) {
      console.error("Staff billing update error:", error);
      setMessage(error.message || "Unable to save billing.");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const filteredBillings = billings.filter(billing => {
    const text = [billing.first_name, billing.last_name, billing.service_type, billing.booking_ref, billing.id, billing.appointment_date].join(" ").toLowerCase();
    return text.includes(search.trim().toLowerCase()) && (!statusFilter || (billing.billing_status || "Awaiting billing approval") === statusFilter);
  });
  const updateReceipt = (field, value) => {
    setDirty(true);
    setMessage("");
    setReceipt(current => {
      const next = { ...current, [field]: value };
      if (field === "charge" || field === "paid") next.balance = Math.max(0, Number(next.charge || 0) - Number(next.paid || 0)).toFixed(2);
      return next;
    });
  };

  return (
    <AdminLayout>
      <header className="dashboard-page-header ov-header">
        <ClinicPageTitle />
        <div className="header-actions"><RoleNotifications /><div className="header-profile">
          <div className="header-profile-text"><strong>{clinicUser.firstName || clinicUser.first_name || "Staff"} {clinicUser.lastName || clinicUser.last_name || ""}</strong><small style={{display:"block"}}>Staff</small></div>
          <User size={24} aria-hidden="true" />
        </div></div>
      </header>
      <div className="ov-workspace-content ov-clinic-billing">
        <div className="ov-clinic-billing-layout">
          <section className="ov-billing-queue" aria-label="Patient billing queue">
            <h2 style={styles.sectionTitle}>Patient billing queue</h2>
            <div className="ov-billing-filters">
              <label>Search bills<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Patient, service or reference" /></label>
              <label>Status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {[...new Set(billings.map(bill => bill.billing_status || "Awaiting billing approval"))].sort().map(status => <option key={status}>{status}</option>)}
              </select></label>
            </div>
            <p className="ov-billing-count" role="status">{filteredBillings.length} bills ? Select a row to view its receipt.</p>
            {loadError && <div role="alert" className="ov-inline-error">{loadError} <button type="button" onClick={fetchBillings}>Retry</button></div>}
            {isLoading ? <p>Loading billing records...</p> : filteredBillings.length === 0 ? (
              <p style={styles.muted}>{search || statusFilter ? "No bills match your filters." : "No billable appointments found."}</p>
            ) : <PaginatedList pageSize={20} resetKey={search + "|" + statusFilter} label="Billing pages">{filteredBillings.map((billing) => (
              <button
                type="button"
                key={billing.id}
                className="ov-billing-row"
                disabled={isSaving}
                aria-pressed={selectedBilling?.id === billing.id}
                onClick={() => selectBilling(billing)}
                style={styles.billingRow}
              >
                <span className="ov-billing-patient" style={styles.patientName}>{billing.first_name} {billing.last_name}</span>
                <span className="ov-billing-service" style={styles.service}>{billing.service_type}<small>{billing.booking_ref || "Bill #" + billing.id}</small></span>
                <span style={styles.amount}>PHP {Number(billing.amount || 0).toLocaleString()}</span>
                <span className="ov-billing-status" style={{ ...styles.status, ...(billing.billing_status === "Paid" ? styles.paid : styles.pending) }}>
                  {billing.billing_status || "Awaiting billing approval"}
                </span>
              </button>
            ))}</PaginatedList>}
          </section>

          <section className="ov-billing-receipt" aria-label="Selected receipt">
            <div style={styles.receiptHeader}>
              <ReceiptText size={28} color="#087F8C" />
              <div>
                <h2 style={styles.sectionTitle}>Treatment record receipt</h2>
                <p style={styles.muted}>Customize the details before publishing to the patient.</p>
              </div>
            </div>

            {selectedBilling ? (
              <form ref={receiptForm} onSubmit={event => event.preventDefault()}>
                <fieldset disabled={isSaving}>
                <div style={styles.patientLine}>
                  <strong>Name:</strong> {selectedBilling.first_name} {selectedBilling.last_name}
                  <span><strong>Age:</strong> {selectedBilling.age || "—"}</span>
                  <span><strong>Gender:</strong> {selectedBilling.sex || "—"}</span>
                </div>
                <div style={styles.recordTitle}>TREATMENT RECORD</div>
                <div style={styles.formGrid}>
                  <label style={styles.label}>Procedure / service
                    <input style={styles.input} required value={receipt.procedure} onChange={(event) => updateReceipt("procedure", event.target.value)} />
                  </label>
                  <label style={styles.label}>Charge (PHP)
                    <input style={styles.input} type="number" min="0" step="0.01" required value={receipt.charge} onChange={(event) => updateReceipt("charge", event.target.value)} />
                  </label>
                  <label style={styles.label}>Paid (PHP)
                    <input style={styles.input} type="number" min="0" step="0.01" value={receipt.paid} onChange={(event) => updateReceipt("paid", event.target.value)} />
                  </label>
                  <label style={styles.label}>Balance (PHP)
                    <input style={styles.input} type="number" min="0" step="0.01" value={receipt.balance} readOnly />
                  </label>
                  <label style={styles.label}>Next visit
                    <input style={styles.input} type="date" value={receipt.nextVisit} onChange={(event) => updateReceipt("nextVisit", event.target.value)} />
                  </label>
                  <label style={styles.label}>Payment method (for new payments)
                    <select style={styles.input} value={receipt.paymentMethod} onChange={event => updateReceipt('paymentMethod', event.target.value)}><option value="">Select method</option><option>Cash</option><option>E-wallet</option></select>
                  </label>
                  <label style={styles.label}>Payment reference (required for e-wallet)
                    <input style={styles.input} maxLength={200} value={receipt.paymentReference} onChange={event => updateReceipt('paymentReference', event.target.value)} />
                  </label>
                </div>
                <div className="ov-receipt-totals">
                  <span>{selectedBilling.appointment_date ? new Date(selectedBilling.appointment_date).toLocaleDateString() : "—"}</span>
                  <span>{receipt.procedure || "Procedure / service"}</span>
                  <span>Charge: PHP {receipt.charge || "0.00"}</span>
                  <span>Paid: PHP {receipt.paid || "0.00"}</span>
                  <span>Balance: PHP {receipt.balance || "0.00"}</span>
                </div>
                {dirty && <p className="ov-billing-count">Unsaved receipt changes</p>}
                {message && <p role="status" style={styles.message}>{message}</p>}
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
                </fieldset>
              </form>
            ) : <p style={styles.muted}>Select a billing record to edit its receipt.</p>}
          </section>
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
  layout: { display: "grid", gridTemplateColumns: "minmax(300px, .9fr) minmax(460px, 1.4fr)", gap: "24px", alignItems: "start" },
  recordsCard: { background: "white", borderRadius: "18px", padding: "22px", boxShadow: "0 4px 18px rgba(8, 127, 140,.08)" },
  receiptCard: { background: "white", borderRadius: "18px", padding: "26px", boxShadow: "0 4px 18px rgba(8, 127, 140,.08)" },
  sectionTitle: { margin: 0, color: "#087F8C", fontSize: "18px" },
  muted: { color: "#65738a", fontSize: "13px" },
  billingRow: { width: "100%", border: "1px solid #e4e9f2", background: "white", borderRadius: "10px", marginTop: "10px", padding: "13px", textAlign: "left", cursor: "pointer", display: "grid", gap: "5px" },
  selectedRow: { borderColor: "#087F8C", background: "#eef1ff" },
  patientName: { color: "#087F8C", fontWeight: 700 }, service: { color: "#536176", fontSize: "13px" }, amount: { fontWeight: 700, fontSize: "13px" },
  status: { width: "fit-content", borderRadius: "12px", padding: "3px 8px", fontSize: "11px", fontWeight: 700 }, pending: { color: "#815f00", background: "#fff3cd" }, paid: { color: "#09663b", background: "#d9f5e7" },
  receiptHeader: { display: "flex", gap: "12px", alignItems: "center", borderBottom: "1px solid #dce2ec", paddingBottom: "15px", marginBottom: "18px" },
  patientLine: { display: "flex", flexWrap: "wrap", gap: "20px", borderBottom: "1px solid #222", paddingBottom: "6px", fontSize: "13px" },
  recordTitle: { textAlign: "center", fontSize: "13px", color: "#087F8C", fontWeight: 800, margin: "17px 0 12px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "13px" },
  label: { color: "#33415c", display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700 },
  input: { border: "1px solid #cdd6e4", borderRadius: "7px", padding: "9px", font: "inherit", fontSize: "13px" },
  previewRow: { display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: "2px", marginTop: "20px", border: "1px solid #087F8C", fontSize: "11px" },
  actions: { display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "10px", marginTop: "18px" },
  primaryButton: { "--ov-on-color": "var(--ov-ink)", display: "inline-flex", gap: "7px", alignItems: "center", border: 0, borderRadius: "8px", padding: "11px 14px", background: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", fontWeight: 700, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", gap: "7px", alignItems: "center", border: "1px solid #087F8C", borderRadius: "8px", padding: "11px 14px", background: "white", color: "#087F8C", fontWeight: 700, cursor: "pointer" },
  rejectButton: { border: "1px solid #b42318", borderRadius: "8px", padding: "11px 14px", background: "white", color: "#b42318", fontWeight: 700, cursor: "pointer" },
  message: { color: "#09663b", background: "#eaf8f0", padding: "10px", borderRadius: "7px", fontSize: "13px", marginBottom: 0 },
};

export default StaffBillingsPage;
