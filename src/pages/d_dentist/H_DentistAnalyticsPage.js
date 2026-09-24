import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  User, X,
  TrendingUp, ChevronRight, BrainCircuit,
  CalendarX, ActivitySquare, Users
} from 'lucide-react';


function DentistAnalyticsPage() {
  // --- DYNAMIC STATE (Requirements 1, 2 & 3) ---
  const [highRiskQueue, setHighRiskQueue] = useState([]);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [treatmentOutcomes, setTreatmentOutcomes] = useState([]);
  const [isOutcomesLoading, setIsOutcomesLoading] = useState(true);
  const [currentRiskIndex, setCurrentRiskIndex] = useState(0);

  const [diagnosticFindings, setDiagnosticFindings] = useState(null);
  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activePatient, setActivePatient] = useState(null);

  const [riskStratification, setRiskStratification] = useState(null);
  const [isStratLoading, setIsStratLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("Main Branch");

  const [stratPatientsModal, setStratPatientsModal] = useState({ isOpen: false, riskLevel: "", patients: [], loading: false });

  const [noShowPredictions, setNoShowPredictions] = useState([]);
  const [isNoShowLoading, setIsNoShowLoading] = useState(true);
  const [predictingAppts, setPredictingAppts] = useState({});

  // --- DYNAMIC FETCH LOGIC ---
  const fetchRiskQueue = useCallback(async () => {
    setIsQueueLoading(true);
    try {
      // Get the logged-in dentist info from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const dentistId = user?.dentistId || 93; // Fallback for testing

      // GET request to our new dynamic endpoint
      const response = await fetch(
        `https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/dentist/dashboard/predict-risk-queue/${dentistId}`
      );

      if (response.ok) {
        const data = await response.json();
        setHighRiskQueue(data.patients);
      }
    } catch (error) {
      console.error("Failed to fetch dentist dashboard analytics:", error);
    } finally {
      setIsQueueLoading(false);
    }
  }, []);

  const fetchTreatmentOutcomes = useCallback(async (patient) => {
    if (!patient) return;
    setIsOutcomesLoading(true);
    try {
      let pid = String(patient.patient_id || patient.id || "");
      let rawId = pid;
      if (pid.includes('-')) {
        const parts = pid.split('-');
        if (parts.length > 1) {
          rawId = parts[1].substring(2);
        }
      }

      // Fetch the analytics data just like Review Record
      const analyticsRes = await fetch(`https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/patient/get/${rawId}/analytics`);
      if (!analyticsRes.ok) throw new Error("Failed to fetch analytics");
      const analyticsData = await analyticsRes.json();

      // Send the POST request to generate the treatment outcome prediction
      const predictRes = await fetch("https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/dentist/dashboard/predict-treatment-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyticsData)
      });

      if (predictRes.ok) {
        const data = await predictRes.json();
        setTreatmentOutcomes([data]);
      }
    } catch (error) {
      console.error("Failed to generate treatment outcome prediction:", error);
    } finally {
      setIsOutcomesLoading(false);
    }
  }, []);

  const fetchPatientDiagnostics = useCallback(async (patient) => {
    if (!patient) return;
    setIsDiagnosticsLoading(true);
    setDiagnosticFindings(null);
    try {
      let pid = String(patient.patient_id || patient.id || "");
      let rawId = pid;
      if (pid.includes('-')) {
        const parts = pid.split('-');
        if (parts.length > 1) {
          rawId = parts[1].substring(2);
        }
      }

      const response = await fetch(`https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/diagnostic-imaging/patient/${rawId}/latest`);
      if (response.ok) {
        const data = await response.json();
        setDiagnosticFindings(data);
      }
    } catch (error) {
      console.error("Failed to fetch patient diagnostic findings:", error);
    } finally {
      setIsDiagnosticsLoading(false);
    }
  }, []);

  // -- REVIEW RECORD FETCH --
  const handleReviewRecord = async (patient) => {
    setActivePatient(patient);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalData(null);

    try {
      let pid = String(patient.patient_id || patient.id || "");
      let rawId = pid;

      if (pid.includes('-')) {
        const parts = pid.split('-');
        if (parts.length > 1) {
          rawId = parts[1].substring(2);
        }
      }

      const response = await fetch(`https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/patient/get/${rawId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setModalData(data);
      }
    } catch (error) {
      console.error("Error fetching patient analytics:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleReviewOutcome = async (outcome) => {
    setActivePatient({ name: `Prediction for Patient ${outcome.patient_id}`, issue: outcome.procedure_name });
    setIsModalOpen(true);
    setModalLoading(true);
    setModalData(null);

    try {
      const response = await fetch(`https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/dentist/dashboard/${outcome.patient_id}/predict-treatment-outcome/${outcome.id}`);
      if (response.ok) {
        const data = await response.json();
        setModalData(data);
      }
    } catch (error) {
      console.error("Error fetching outcome analytics:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchRiskStratification = useCallback(async (branchName) => {
    setIsStratLoading(true);
    try {
      const response = await fetch("https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/dentist/dashboard/risk-stratification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: branchName, timeframe_days: 30 })
      });
      if (response.ok) {
        const data = await response.json();
        setRiskStratification(data);
      }
    } catch (error) {
      console.error("Failed to fetch risk stratification:", error);
    } finally {
      setIsStratLoading(false);
    }
  }, []);

  const handleStratBarClick = async (riskLevel) => {
    if (!riskStratification || !riskStratification.id) return;
    setStratPatientsModal({ isOpen: true, riskLevel, patients: [], loading: true });
    try {
      const response = await fetch(`https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/dentist/dashboard/risk-stratification/${riskStratification.id}/patients?risk_level=${riskLevel}`);
      if (response.ok) {
        const data = await response.json();
        setStratPatientsModal(prev => ({ ...prev, patients: data, loading: false }));
      } else {
        setStratPatientsModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Failed to fetch strat patients:", error);
      setStratPatientsModal(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchRiskQueue();
  }, [fetchRiskQueue]);

  const fetchNoShowQueue = useCallback(async (branchName) => {
    setIsNoShowLoading(true);
    try {
      const response = await fetch(`https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/dentist/dashboard/no-show-queue?branch=${encodeURIComponent(branchName)}`);
      if (response.ok) {
        const data = await response.json();
        setNoShowPredictions(data);
      }
    } catch (error) {
      console.error("Failed to fetch no-show queue:", error);
    } finally {
      setIsNoShowLoading(false);
    }
  }, []);

  const handlePredictNoShow = async (appointmentId) => {
    setPredictingAppts(prev => ({ ...prev, [appointmentId]: true }));
    try {
      const response = await fetch(`https://oravista-ai-engine-474976105474.asia-southeast1.run.app/api/dentist/dashboard/predict-no-show/${appointmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        const updatedData = await response.json();
        setNoShowPredictions(prev => prev.map(appt => appt.appointment_id === appointmentId ? updatedData : appt));
      } else {
        alert("Failed to run prediction.");
      }
    } catch (error) {
      console.error("Prediction error:", error);
      alert("Error running prediction.");
    } finally {
      setPredictingAppts(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  useEffect(() => {
    fetchRiskStratification(selectedBranch);
    fetchNoShowQueue(selectedBranch);
  }, [fetchRiskStratification, fetchNoShowQueue, selectedBranch]);

  useEffect(() => {
    if (highRiskQueue.length > 0 && highRiskQueue[currentRiskIndex]) {
      fetchTreatmentOutcomes(highRiskQueue[currentRiskIndex]);
      fetchPatientDiagnostics(highRiskQueue[currentRiskIndex]);
    }
  }, [highRiskQueue, currentRiskIndex, fetchTreatmentOutcomes, fetchPatientDiagnostics]);

  const styleSheet = document.createElement("style");
styleSheet.innerText = `
  /* GRID & RESPONSIVENESS */
  .analytics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    align-items: stretch;
  }

  /* --- ADD THESE NEW HEADER STYLES --- */
  @media (max-width: 768px) {
    .dashboard-header-row {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 15px;
      margin-bottom: 20px !important;
    }
    
    .responsive-title {
      font-size: 24px !important;
      line-height: 1.2;
      margin-bottom: 8px !important;
    }
  }
  /* ----------------------------------- */

  .analytics-col-left, .analytics-col-right {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  @media (min-width: 1025px) {
    .analytics-col-left, .analytics-col-right {
      min-height: 800px;
    }
  }

  .card-diagnostic-findings {
    grid-column: 1 / -1; 
  }

  .diagnostic-internal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 1024px) {
    .analytics-grid {
      grid-template-columns: 1fr; 
    }
    .card-diagnostic-findings {
      grid-column: span 1;
    }
    .analytics-col-left, .analytics-col-right {
      min-height: auto; 
    }
  }

  @media (max-width: 768px) {
    .diagnostic-internal-grid {
      grid-template-columns: 1fr; 
    }
  }

  .clinical-notes-scrollbar::-webkit-scrollbar,
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .clinical-notes-scrollbar::-webkit-scrollbar-track,
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .clinical-notes-scrollbar::-webkit-scrollbar-thumb,
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(8, 127, 140, 0.15);
    border-radius: 3px;
  }
  .clinical-notes-scrollbar::-webkit-scrollbar-thumb:hover,
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(8, 127, 140, 0.3);
  }
`;
document.head.appendChild(styleSheet);
  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* ... HEADER CODE REMAINS SAME ... */}

        <div className="ov-workspace-content" style={styles.content}>
 <div className="dashboard-header-row" style={styles.topRow}>
            <div>
              <h1 className="responsive-title" style={styles.pageTitle}>Preventative & Predictive Analytics</h1>
              <p style={styles.pageSubtitle}>Machine Learning forecasts for clinical outcomes and clinic operations</p>
            </div>
            <div style={styles.aiBadge}>
              <BrainCircuit size={18} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap' }}>OraVista ML Engine Active</span>
            </div>
          </div>

          <div className="analytics-grid">
            {/* LEFT COLUMN: Predictive Risk & Treatment Outcomes */}
            <div className="analytics-col-left">

              {/* 1 & 3. Predictive Risk Queue (DYNAMIC) */}
              <div className="card-risk-queue" style={styles.queueCard}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitleBlack}>1 & 3. Predictive Risk Queue</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={styles.viewAll} onClick={fetchRiskQueue}>
                      Refresh <ChevronRight size={14} />
                    </span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        disabled={highRiskQueue.length === 0 || currentRiskIndex === 0}
                        onClick={() => setCurrentRiskIndex(i => i - 1)}
                        style={{ ...styles.navButton, opacity: (highRiskQueue.length === 0 || currentRiskIndex === 0) ? 0.5 : 1 }}
                      >Back</button>
                      <button
                        disabled={highRiskQueue.length === 0 || currentRiskIndex >= highRiskQueue.length - 1}
                        onClick={() => setCurrentRiskIndex(i => i + 1)}
                        style={{ ...styles.navButton, opacity: (highRiskQueue.length === 0 || currentRiskIndex >= highRiskQueue.length - 1) ? 0.5 : 1 }}
                      >Next</button>
                    </div>
                  </div>
                </div>

                <p style={styles.queueDesc}>High Risk Scores and severe disease progression forecasts in your branch.</p>

                <div style={styles.queueList}>
                  {isQueueLoading ? (
                    <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>Loading Risk Queue...</p>
                  ) : highRiskQueue.length > 0 ? (
                    (() => {
                      const patient = highRiskQueue[currentRiskIndex];
                      return (
                        <div style={styles.queueItem}>
                          <div style={styles.queueTop}>
                            <div style={styles.queueInfo}>
                              <div style={styles.queueAvatar}><User size={16} color="#087F8C" /></div>
                              <div>
                                <p style={styles.queueName}>{patient.name} <span style={styles.queueId}>({patient.patient_id})</span></p>
                                <p style={styles.queueIssue}>Current Path: <strong>{patient.issue}</strong></p>
                              </div>
                            </div>
                            <div style={styles.scoreCircle}>
                              {patient.score}%
                            </div>
                          </div>

                          <div style={styles.queueMiddle}>
                            <TrendingUp size={16} color="#ef4444" style={{ marginTop: '2px' }} />
                            <div>
                              <span style={styles.actionLabel}>Disease Progression Forecast:</span>
                              <span style={styles.progressionText}>{patient.progression}</span>
                            </div>
                          </div>

                          <div style={styles.queueBottom}>
                            <div style={styles.aiActionBox}>
                              <BrainCircuit size={14} color="#078493" style={{ marginTop: '2px' }} />
                              <div>
                                <span style={styles.actionLabel}>Preventive Action:</span>
                                <span style={styles.actionText}>{patient.action}</span>
                              </div>
                            </div>
                            <button
                              style={styles.reviewBtn}
                              onClick={() => handleReviewRecord(patient)}
                            >
                              Review Record
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>No high-risk patients detected in your branch.</p>
                  )}
                </div>
              </div>

              {/* 2. Treatment Outcome Predictions (DYNAMIC) */}
              <div
                className="card-treatment-outcome ov-panel"
                style={{ ...styles.insightsCard, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s', width: '100%' }}
                onClick={() => {
                  if (treatmentOutcomes && treatmentOutcomes.length > 0) {
                    handleReviewOutcome(treatmentOutcomes[0]);
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ActivitySquare size={20} color="#27B8C7" />
                    <h3 style={styles.cardTitleWhite}>2. Treatment Outcome Predictions</h3>
                  </div>
                </div>

                {isOutcomesLoading ? (
                  <p style={{ color: "var(--ov-on-color, #fff)", textAlign: 'center', margin: 'auto' }}>Loading predictions...</p>
                ) : treatmentOutcomes && treatmentOutcomes.length > 0 ? (
                  (() => {
                    const outcome = treatmentOutcomes[0];
                    return (
                      <div style={{ ...styles.insightItem, flexGrow: 1, margin: 0, padding: 0, background: 'transparent' }}>
                        <div style={styles.scoreCircleSmall}>{outcome.success_probability}%</div>
                        <div>
                          <h4 style={styles.insightTitle}>{outcome.procedure_name}</h4>
                          <p style={styles.insightText}><strong>Key Factors:</strong> {outcome.key_factors}</p>
                          <p style={{ ...styles.insightText, fontSize: '11px', marginTop: '5px', color: '#93c5fd' }}>
                          </p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p style={{ color: "var(--ov-on-color, #fff)", textAlign: 'center', margin: 'auto' }}>No outcomes available.</p>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Clinic Operations & Population Group */}
            <div className="analytics-col-right">

              {/* 5. Clinic Risk Stratification */}
              <div className="card-risk-stratification" style={styles.whiteCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={20} color="#087F8C" />
                    <h3 style={styles.cardTitleBlack}>5. Clinic Risk Stratification</h3>
                  </div>
                </div>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#f9fafb', fontSize: '13px', color: '#333', outline: 'none', cursor: 'pointer', width: '100%', marginBottom: '15px' }}
                >
                  <option value="Main Branch">Main Branch</option>
                  <option value="Gil Puyat, Pasay">Gil Puyat</option>
                  <option value="Pasay, Sta. Ana, Manila">Pasay, Sta. Ana, Manila</option>
                  <option value="Angeles, Pampanga">Angeles, Pampanga</option>
                </select>
                {isStratLoading ? (
                  <p style={{ color: '#666', textAlign: 'center', margin: 'auto' }}>Loading stratification...</p>
                ) : riskStratification ? (
                  <div style={styles.barChartContainer}>
                    <div style={{ ...styles.barRow, cursor: 'pointer' }} onClick={() => handleStratBarClick('Low')}>
                      <span style={styles.barLabel}>Low Risk ({riskStratification.low_risk_pct.toFixed(1)}%) - {riskStratification.low_risk_count} patients</span>
                      <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${riskStratification.low_risk_pct}%`, background: '#10b981' }}></div></div>
                    </div>
                    <div style={{ ...styles.barRow, cursor: 'pointer' }} onClick={() => handleStratBarClick('Medium')}>
                      <span style={styles.barLabel}>Medium Risk ({riskStratification.medium_risk_pct.toFixed(1)}%) - {riskStratification.medium_risk_count} patients</span>
                      <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${riskStratification.medium_risk_pct}%`, background: '#f59e0b' }}></div></div>
                    </div>
                    <div style={{ ...styles.barRow, cursor: 'pointer' }} onClick={() => handleStratBarClick('High')}>
                      <span style={styles.barLabel}>High Risk ({riskStratification.high_risk_pct.toFixed(1)}%) - {riskStratification.high_risk_count} patients</span>
                      <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${riskStratification.high_risk_pct}%`, background: '#ef4444' }}></div></div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#666', textAlign: 'center', margin: 'auto' }}>No stratification data available.</p>
                )}
              </div>

              {/* 6. No-Show Flight Risk */}
              <div className="card-no-show" style={{ ...styles.whiteCard, borderLeft: '4px solid #f59e0b' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'white',
                  padding: '0 0 15px 0',
                  zIndex: 10,
                  borderBottom: '1px solid #f0f2f5',
                  marginBottom: '15px'
                }}>
                  <CalendarX size={20} color="#f59e0b" />
                  <h3 style={{ ...styles.cardTitleBlack, margin: 0 }}>6. No-Show Flight Risk</h3>
                </div>
                {isNoShowLoading ? (
                  <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Loading Schedule...</p>
                ) : noShowPredictions.length > 0 ? (
                  <div className="no-show-list-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {noShowPredictions.map((appt) => (
                      <div key={appt.appointment_id} style={styles.noShowItem}>
                        <div style={{ flex: 1 }}>
                          <p style={styles.noShowName}>{appt.patient}</p>
                          <p style={styles.noShowTime}>{appt.time}</p>
                          {appt.status !== "No Prediction Run" && (
                            <p style={styles.noShowReason}><strong>AI Flag:</strong> {appt.reason}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', minWidth: '110px' }}>
                          {appt.status === "No Prediction Run" ? (
                            <button
                              onClick={() => handlePredictNoShow(appt.appointment_id)}
                              disabled={predictingAppts[appt.appointment_id]}
                              style={{ ...styles.reminderBtn, backgroundColor: '#078493', opacity: predictingAppts[appt.appointment_id] ? 0.7 : 1 }}
                            >
                              {predictingAppts[appt.appointment_id] ? "Processing..." : "Predict Risk"}
                            </button>
                          ) : (
                            <>
                              <span style={{
                                ...styles.probBadge,
                                color: appt.probability > 70 ? '#dc2626' : (appt.probability > 40 ? '#f59e0b' : '#10b981'),
                                backgroundColor: appt.probability > 70 ? '#fef2f2' : (appt.probability > 40 ? '#fffbeb' : '#ecfdf5'),
                                borderColor: appt.probability > 70 ? '#fecaca' : (appt.probability > 40 ? '#fde68a' : '#a7f3d0')
                              }}>
                                {appt.probability}% Risk
                              </span>
                              <button
                                disabled={appt.status === "Reminder Sent"}
                                style={{ ...styles.reminderBtn, opacity: appt.status === "Reminder Sent" ? 0.6 : 1, cursor: appt.status === "Reminder Sent" ? 'default' : 'pointer' }}
                              >
                                {appt.status === "Reminder Sent" ? "✓ Reminded" : "Send Reminder"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No upcoming appointments found.</p>
                )}
              </div>

            </div>

            {/* 4. Patient Diagnostic Findings */}
            <div className="card-diagnostic-findings" style={styles.whiteCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ActivitySquare size={20} color="#087F8C" />
                  <h3 style={styles.cardTitleBlack}>4. Patient Diagnostic Findings</h3>
                </div>
              </div>

              {isDiagnosticsLoading ? (
                <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>Loading Diagnostic Findings...</p>
              ) : diagnosticFindings ? (
                <div className="diagnostic-internal-grid">
                  
                  {/* Left Column: Detected Pathologies / Annotations */}
                  <div className="col-left">
                    <span style={styles.actionLabel}>Detected Pathologies / Annotations:</span>
                    {(() => {
                      const findings = (diagnosticFindings.ai_findings?.annotations && diagnosticFindings.ai_findings.annotations.length > 0)
                        ? diagnosticFindings.ai_findings.annotations
                        : (diagnosticFindings.ai_findings?.predictions || []);
                      const humanVerified = diagnosticFindings.ai_findings?.human_verified;
                      
                      if (findings.length === 0) {
                        return <p style={{ fontSize: '13px', color: '#666', margin: '5px 0 0 0' }}>No findings detected.</p>;
                      }
                      
                      return (
                        <div className="annotations-list-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                          {findings.map((item, idx) => {
                            const conf = item.confidence <= 1 ? Math.round(item.confidence * 100) : Math.round(item.confidence);
                            return (
                              <div 
                                key={idx} 
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px 14px',
                                  borderRadius: '10px',
                                  backgroundColor: '#fafbfc',
                                  border: '1px solid #f0f2f5',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#333'
                                }}
                              >
                                <span>{item.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    color: humanVerified ? '#10b981' : '#ef4444',
                                    backgroundColor: humanVerified ? '#ecfdf5' : '#fef2f2',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '700'
                                  }}>
                                    {conf}%
                                  </span>
                                  <span style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: humanVerified ? '#10b981' : '#6b7280',
                                    color: "var(--ov-on-color, #fff)",
                                    fontWeight: '700'
                                  }}>
                                    {humanVerified ? 'Verified' : 'AI'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Column: Clinical Notes */}
                  <div className="col-right">
                  <span style={styles.actionLabel}>Clinical Notes:</span>
                    {diagnosticFindings.clinical_notes && (
                      <div>
                        <div 
                          className="clinical-notes-scrollbar"
                          style={{
                            maxHeight: '180px',
                            overflowY: 'auto',
                            backgroundColor: '#fafbfc',
                            border: '1px solid #f0f2f5',
                            borderRadius: '10px',
                            padding: '12px',
                            marginTop: '6px',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: '#444'
                          }}
                        >
                          {diagnosticFindings.clinical_notes}
                        </div>
                      </div>
                    )} {(
                      <div className='clinical-notes-scrollbar' style={{ fontSize: '13px', color: '#666', margin: '5px 0 0 0' }}>No clinical notes available.</div>
                    )}
                    {/* Scan date / metadata */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '15px' }}>
                      <span style={{ fontSize: '11px', color: '#888' }}>
                        Scan Date: {diagnosticFindings.scan_date ? new Date(diagnosticFindings.scan_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No diagnostic records found for this patient.</p>
              )}
            </div>

          </div>
        </div>

        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              {/* Header */}
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={{ margin: 0, color: "#087F8C" }}>{activePatient?.name}</h2>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    Current Path: <strong>{activePatient?.issue}</strong>
                  </p>
                </div>
                <X
                  size={24}
                  style={{ cursor: "pointer", color: "#666" }}
                  onClick={() => setIsModalOpen(false)}
                />
              </div>

              {/* Body */}
              <div style={styles.modalBody}>
                {modalLoading ? (
                  <p style={{ textAlign: "center", padding: "40px" }}>Loading Clinical Records...</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr className="ov-color-surface" style={{ "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)" }}>
                        <th style={{ padding: "12px 15px" }}>Indicator</th>
                        <th style={{ padding: "12px 15px" }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData && Object.keys(modalData).length > 0 ? (
                        Object.entries(modalData).map(([key, value], index) => {
                          if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return null;
                          const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                          return (
                            <tr key={key} style={{ borderBottom: index < Object.keys(modalData).length - 1 ? "1px solid #eee" : "none" }}>
                              <td style={{ padding: "12px 15px", fontWeight: "600", color: "#333" }}>{label}</td>
                              <td style={{ padding: "12px 15px", color: "#666" }}>{String(value)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="2" style={{ padding: "15px", textAlign: "center", color: "#666" }}>
                            Data Not Available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stratification Patients Modal */}
        {stratPatientsModal.isOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={{ margin: 0, color: "#087F8C" }}>{stratPatientsModal.riskLevel} Risk Patients</h2>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    Patients assessed as {stratPatientsModal.riskLevel} risk level
                  </p>
                </div>
                <X
                  size={24}
                  style={{ cursor: "pointer", color: "#666" }}
                  onClick={() => setStratPatientsModal({ isOpen: false, riskLevel: "", patients: [], loading: false })}
                />
              </div>

              <div style={styles.modalBody}>
                {stratPatientsModal.loading ? (
                  <p style={{ textAlign: "center", padding: "40px" }}>Loading Patients...</p>
                ) : stratPatientsModal.patients.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr className="ov-color-surface" style={{ "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)" }}>
                        <th style={{ padding: "12px 15px" }}>ID</th>
                        <th style={{ padding: "12px 15px" }}>Patient Name</th>
                        <th style={{ padding: "12px 15px" }}>Risk Score</th>
                        <th style={{ padding: "12px 15px" }}>Last Visit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stratPatientsModal.patients.map((patient, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "12px 15px", color: "#333", fontWeight: "600" }}>{patient.patient_id}</td>
                          <td style={{ padding: "12px 15px", color: "#087F8C", fontWeight: "600" }}>{patient.full_name}</td>
                          <td style={{ padding: "12px 15px" }}>
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "700",
                              backgroundColor: patient.risk_score > 60 ? "#fef2f2" : patient.risk_score > 30 ? "#fffbeb" : "#ecfdf5",
                              color: patient.risk_score > 60 ? "#ef4444" : patient.risk_score > 30 ? "#f59e0b" : "#10b981"
                            }}>
                              {patient.risk_score}
                            </span>
                          </td>
                          <td style={{ padding: "12px 15px", color: "#666" }}>
                            {patient.last_visit_date ? new Date(patient.last_visit_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: "center", padding: "40px", color: "#666" }}>No patients found for this risk level.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: "'Manrope', sans-serif" },
  header: { "--ov-on-color": "var(--ov-ink)", height: '80px', background: "var(--ov-primary)", display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 },
  searchBox: { display: 'flex', alignItems: 'center', background: "var(--ov-on-wash, rgba(255,255,255,0.1))", padding: '10px 20px', borderRadius: '12px', width: '300px' },
  searchInput: { border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%', color: "var(--ov-on-color, #fff)" },
  headerActions: { display: 'flex', alignItems: 'center', gap: '25px' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '15px', borderLeft: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))", paddingLeft: '20px' },
  profileText: { textAlign: 'right' },
  userName: { margin: 0, fontWeight: 'bold', fontSize: '14px', color: "var(--ov-on-color, #fff)" },
  userRole: { margin: 0, fontSize: '12px', color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },
  avatar: { width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  content: { padding: '40px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { fontSize: '28px', fontWeight: '800', color: '#087F8C', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#666' },
  aiBadge: { backgroundColor: '#DDF5F7', color: '#078493', padding: '10px 20px', borderRadius: '30px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #c7d2fe' },

  mainLayout: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' },
  sectionContainer: { display: 'flex', flexDirection: 'column', gap: '20px', margin: "20px" },
  sectionHeading: { fontSize: '20px', fontWeight: '800', color: '#087F8C', marginTop: "20px", display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #DDF5F7', paddingBottom: '10px' },
  rowGridClinical: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' },
  rowGridOperations: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  navButton: { padding: '5px 12px', borderRadius: '5px', border: '1px solid #DDF5F7', background: 'white', color: '#087F8C', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },

  whiteCard: { background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', height: '100%' },
  cardTitleBlack: { fontSize: '18px', fontWeight: '700', color: '#087F8C', margin: 0 },

  barChartContainer: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' },
  barRow: { display: 'flex', flexDirection: 'column', gap: '6px' },
  barLabel: { fontSize: '13px', fontWeight: '600', color: '#444' },
  barTrack: { width: '100%', height: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '5px' },

  insightsCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '20px', padding: '25px', color: "var(--ov-on-color, #fff)", boxShadow: '0 10px 30px rgba(8, 127, 140,0.1)', height: '100%' },
  cardTitleWhite: { fontSize: '18px', fontWeight: '700', margin: 0 },
  insightItem: { display: 'flex', gap: '15px', marginBottom: '15px', background: "var(--ov-on-wash, rgba(255,255,255,0.05))", padding: '15px', borderRadius: '15px', alignItems: 'center' },
  scoreCircleSmall: { width: '45px', height: '45px', borderRadius: '50%', border: '3px solid #27B8C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#27B8C7', flexShrink: 0 },
  insightTitle: { margin: '0 0 5px 0', fontSize: '15px', fontWeight: '700' },
  insightText: { margin: 0, fontSize: '12px', opacity: 0.8, lineHeight: '1.4' },

  noShowItem: { display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #f0f0f0', borderRadius: '12px', backgroundColor: '#fafbfc' },
  noShowName: { fontSize: '15px', fontWeight: '700', color: '#087F8C', margin: '0 0 5px 0' },
  noShowTime: { fontSize: '13px', color: '#444', margin: '0 0 8px 0', fontWeight: '600' },
  noShowReason: { fontSize: '12px', color: '#dc2626', margin: 0 },
  probBadge: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #fecaca' },
  reminderBtn: { "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },

  queueCard: { background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', height: '100%' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  viewAll: { fontSize: '13px', color: '#078493', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  queueDesc: { fontSize: '13px', color: '#666', marginBottom: '25px' },

  queueList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  queueItem: { border: '1px solid #eee', borderRadius: '15px', padding: '20px', backgroundColor: '#fafbfc' },
  queueTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
  queueInfo: { display: 'flex', gap: '15px' },
  queueAvatar: { width: '40px', height: '40px', backgroundColor: '#DDF5F7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  queueName: { margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#087F8C' },
  queueId: { fontSize: '12px', color: '#888', fontWeight: '500' },
  queueIssue: { margin: 0, fontSize: '13px', color: '#dc2626' },
  scoreCircle: { width: '45px', height: '45px', borderRadius: '50%', border: '3px solid #dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: '#dc2626' },

  queueMiddle: { display: 'flex', gap: '10px', alignItems: 'flex-start', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '10px', marginBottom: '15px' },
  progressionText: { display: 'block', fontSize: '13px', color: '#dc2626', fontWeight: '600' },

  queueBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' },
  aiActionBox: { display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 },
  actionLabel: { display: 'block', fontSize: '11px', color: '#078493', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' },
  actionText: { display: 'block', fontSize: '13px', color: '#333', fontWeight: '500' },
  reviewBtn: { "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "20px",
    width: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    borderBottom: "1px solid #eee",
    paddingBottom: "15px",
  },
  modalBody: {
    marginTop: "10px",
  },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .clinical-notes-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .clinical-notes-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .clinical-notes-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(8, 127, 140, 0.15);
    border-radius: 3px;
  }
  .clinical-notes-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(8, 127, 140, 0.3);
  }
`;
document.head.appendChild(styleSheet);

export default DentistAnalyticsPage;