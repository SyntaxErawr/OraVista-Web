import React, { useState } from 'react';
import { X, ZoomIn, RotateCw, CheckCircle, FileText, Cpu } from 'lucide-react';

function AIDiagnosticModal({ isOpen, onClose, record }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showAI, setShowAI] = useState(true);
  const [activeTab, setActiveTab] = useState('image'); // mobile tabs: 'image' | 'findings' | 'notes'

  if (!isOpen || !record) return null;

  const getImageUrl = (filePath) => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    return `https://oravista-server-474976105474.asia-southeast1.run.app/${filePath}`;
  };

  let parsedFindings = null;
  if (record.ai_findings) {
    if (typeof record.ai_findings === 'string') {
      try { parsedFindings = JSON.parse(record.ai_findings); }
      catch (e) { console.error("Error parsing ai_findings:", e); }
    } else {
      parsedFindings = record.ai_findings;
    }
  }

  const annotations = parsedFindings?.annotations || parsedFindings?.predictions || [];
  const isVerified = parsedFindings?.human_verified === true;
  const imageUrl = getImageUrl(record.file_path);

  const handleZoom = () => setIsZoomed(!isZoomed);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Shared rendered sections
  const ImageSection = (
    <>
      <div style={styles.columnHeaderRow}>
        <h3 style={styles.columnTitle}>Scanned Diagnostic Imaging</h3>
        <div style={styles.viewerActions}>
          <button style={styles.vBtn} onClick={handleZoom} title={isZoomed ? "Zoom Out" : "Zoom In"}>
            <ZoomIn size={14} /> {isZoomed ? "1.0x" : "1.5x"}
          </button>
          <button style={styles.vBtn} onClick={handleRotate} title="Rotate 90°">
            <RotateCw size={14} /> Rotate
          </button>
          <button style={styles.toggleBtn} onClick={() => setShowAI(!showAI)}>
            {showAI ? 'Hide AI' : 'Show AI'}
          </button>
        </div>
      </div>
      <div style={styles.imageAreaContainer}>
        <div style={{
          position: 'relative',
          transform: `rotate(${rotation}deg) scale(${isZoomed ? 1.5 : 1})`,
          transition: 'transform 0.3s ease',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {imageUrl ? (
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <img src={imageUrl} alt="Diagnostic Scan Preview" style={styles.scanImage} />
              {showAI && annotations.map((ann, idx) => {
                const box = ann.box;
                if (!box) return null;
                const borderColor = isVerified ? '#10b981' : '#ef4444';
                const labelBgColor = isVerified ? '#10b981' : '#ef4444';
                const isNearTop = box.y_min < 0.08;
                return (
                  <div key={idx} style={{
                    position: 'absolute',
                    border: `2px solid ${borderColor}`,
                    borderRadius: '4px',
                    zIndex: 5,
                    top: `${box.y_min * 100}%`,
                    left: `${box.x_min * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                    pointerEvents: 'none',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '-2px',
                      color: "var(--ov-on-color, #fff)",
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      backgroundColor: labelBgColor,
                      ...(isNearTop ? { top: '2px' } : { top: '-22px' }),
                    }}>
                      {ann.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--ov-on-muted, rgba(255,255,255,0.75))" }}>No diagnostic image available</p>
          )}
        </div>
      </div>
    </>
  );

  const FindingsSection = (
    <>
      <h3 style={{ ...styles.columnTitle, marginBottom: '16px' }}>Dental Findings</h3>
      <div style={styles.scrollableContent}>
        {annotations.length > 0 ? (
          <div style={styles.findingsList}>
            {annotations.map((ann, idx) => (
              <div key={idx} style={styles.findingCard}>
                <p style={styles.findingName}>
                  {ann.name}{' '}
                  <span style={{
                    ...styles.confBadge,
                    backgroundColor: isVerified ? '#10b981' : '#f59e0b'
                  }}>
                    {Math.round(ann.confidence <= 1 ? ann.confidence * 100 : ann.confidence)}% Confidence
                  </span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyContainer}>
            <p style={styles.emptyText}>No dental findings annotated on this scan.</p>
          </div>
        )}
      </div>
    </>
  );

  const NotesSection = (
    <>
      <h3 style={{ ...styles.columnTitle, marginBottom: '16px' }}>Clinical Notes</h3>
      <div style={styles.scrollableContent}>
        {record.clinical_notes && record.clinical_notes.trim() !== "" ? (
          <div className="ov-panel" style={styles.notesCard}>
            <p style={styles.notesText}>{record.clinical_notes}</p>
          </div>
        ) : (
          <div style={styles.emptyContainer}>
            <FileText size={32} color="var(--ov-on-muted, rgba(255,255,255,0.75))" style={{ marginBottom: '10px' }} />
            <p style={styles.emptyText}>No clinical notes available for this patient document.</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .ai-modal-content {
          background: #123C45;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 30px;
          width: 1200px;
          height: 750px;
          max-width: 95vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          color: var(--ov-on-color, #fff);
          position: relative;
          box-shadow: 0 25px 50px rgba(0,0,0,0.6);
          box-sizing: border-box;
        }

        /* Desktop 3-column layout */
        .ai-columns-desktop {
          flex: 1;
          display: flex;
          gap: 25px;
          min-height: 0;
        }
        .ai-col-left  { flex: 2 1 0%; display: flex; flex-direction: column; min-height: 0; }
        .ai-col-mid   { flex: 1 1 0%; display: flex; flex-direction: column; min-height: 0; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 20px; }
        .ai-col-right { flex: 1 1 0%; display: flex; flex-direction: column; min-height: 0; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 20px; }

        /* Mobile tab bar — hidden on desktop */
        .ai-tab-bar   { display: none; }
        .ai-tab-panel { display: none; }

        /* Mobile title truncation */
        .ai-modal-title { font-size: 22px; font-weight: 700; color: var(--ov-on-color, #fff); margin: 0; }

        @media (max-width: 768px) {
          .ai-modal-content {
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            padding: 16px 14px 0 !important;
          }

          /* Hide desktop columns */
          .ai-columns-desktop { display: none !important; }

          /* Show tab bar */
          .ai-tab-bar {
            display: flex;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            margin-bottom: 0;
            gap: 0;
            flex-shrink: 0;
          }
          .ai-tab-btn {
            flex: 1;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            color: var(--ov-on-muted, rgba(255,255,255,0.75));
            font-size: 12px;
            font-weight: 600;
            padding: 10px 4px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
          }
          .ai-tab-btn.active {
            color: #10b981;
            border-bottom-color: #10b981;
          }

          /* Show active panel */
          .ai-tab-panel.active {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            padding: 14px 0 14px 0;
            overflow: hidden;
          }

          /* Shrink title on mobile */
          .ai-modal-title { font-size: 15px !important; }
          .ai-verified-badge span { display: none; }

          /* Header tighter on mobile */
          .ai-modal-header {
            padding-bottom: 12px !important;
            margin-bottom: 0 !important;
          }

          /* Image tab: let image fill */
          .ai-tab-panel.active .ai-image-area {
            flex: 1;
            min-height: 0;
          }

          /* Viewer action buttons smaller */
          .ai-viewer-actions-row {
            flex-wrap: wrap;
            gap: 6px !important;
          }
          .ai-vbtn {
            font-size: 11px !important;
            padding: 5px 8px !important;
          }
        }
      `}</style>

      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <header style={styles.modalHeader} className="ai-modal-header">
          <div style={styles.headerTitleGroup}>
            <Cpu size={20} color="#10b981" />
            <h2 className="ai-modal-title">AI Diagnostic Findings</h2>
            {isVerified && (
              <span style={styles.verifiedBadge} className="ai-verified-badge">
                <CheckCircle size={13} style={{ marginRight: '4px' }} />
                verified by dentist
              </span>
            )}
          </div>
          <button style={styles.closeHeaderBtn} onClick={onClose} title="Close Modal">
            <X size={22} color="var(--ov-on-color, #fff)" />
          </button>
        </header>

        {/* MOBILE TAB BAR */}
        <div className="ai-tab-bar">
          {[
            { key: 'image', label: 'Image' },
            { key: 'findings', label: `Findings (${annotations.length})` },
            { key: 'notes', label: 'Notes' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`ai-tab-btn${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MOBILE PANELS */}
        <div className={`ai-tab-panel${activeTab === 'image' ? ' active' : ''}`}>
          {ImageSection}
        </div>
        <div className={`ai-tab-panel${activeTab === 'findings' ? ' active' : ''}`}>
          {FindingsSection}
        </div>
        <div className={`ai-tab-panel${activeTab === 'notes' ? ' active' : ''}`}>
          {NotesSection}
        </div>

        {/* DESKTOP 3-COLUMN */}
        <div className="ai-columns-desktop">
          <div className="ai-col-left">{ImageSection}</div>
          <div className="ai-col-mid">{FindingsSection}</div>
          <div className="ai-col-right">{NotesSection}</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed', top: 0, left: 0,
    width: '100vw', height: '100vh',
    background: 'rgba(0,8,30,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 3000,
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.1))",
    paddingBottom: '20px', marginBottom: '20px', flexShrink: 0,
  },
  headerTitleGroup: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 },
  verifiedBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#10b981',
    padding: '4px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '700',
    display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
  },
  closeHeaderBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', borderRadius: '50%', flexShrink: 0,
  },
  columnHeaderRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px',
  },
  columnTitle: { fontSize: '14px', fontWeight: '700', color: "var(--ov-on-color, #fff)", margin: 0 },
  viewerActions: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  vBtn: { "--ov-on-color": "#087F8C",
    background: "var(--ov-on-wash, rgba(255,255,255,0.05))",
    border: "1px solid var(--ov-on-line, rgba(255,255,255,0.1))",
    color: "var(--ov-on-color, #fff)", padding: '5px 10px', borderRadius: '8px',
    fontSize: '12px', display: 'flex', alignItems: 'center',
    gap: '4px', cursor: 'pointer',
  },
  toggleBtn: { "--ov-on-color": "#087F8C",
    background: "var(--ov-on-wash, rgba(255,255,255,0.08))", border: 'none',
    color: "var(--ov-on-color, #fff)", fontSize: '11px', fontWeight: '600',
    padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
  },
  imageAreaContainer: {
    flex: 1, backgroundColor: '#06343C', borderRadius: '12px',
    border: "1px solid var(--ov-on-line, rgba(255,255,255,0.05))",
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'auto', padding: '10px', minHeight: 0,
  },
  scanImage: { width: '100%', height: 'auto', display: 'block', borderRadius: '8px' },
  scrollableContent: { flex: 1, overflowY: 'auto', paddingRight: '4px' },
  findingsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  findingCard: {
    background: "var(--ov-on-wash, rgba(255,255,255,0.03))",
    border: "1px solid var(--ov-on-line, rgba(255,255,255,0.05))",
    borderRadius: '10px', padding: '12px',
  },
  findingName: { fontSize: '13px', fontWeight: '600', margin: '0 0 6px 0', color: "var(--ov-on-color, #fff)" },
  confBadge: {
    fontSize: '10px', padding: '2px 7px', borderRadius: '10px',
    fontWeight: 'bold', color: "var(--ov-on-color, #fff)", display: 'inline-block',
  },
  notesCard: {
    background: "var(--ov-on-wash, rgba(255,255,255,0.03))",
    border: "1px solid var(--ov-on-line, rgba(255,255,255,0.05))",
    borderRadius: '10px', padding: '16px',
  },
  notesText: {
    fontSize: '13px', lineHeight: '1.6',
    color: "var(--ov-on-color, #fff)", margin: 0, whiteSpace: 'pre-wrap',
  },
  emptyContainer: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100%', minHeight: '160px', opacity: 0.6,
  },
  emptyText: { fontSize: '13px', color: "var(--ov-on-muted, rgba(255,255,255,0.75))", textAlign: 'center', margin: 0 },
};

export default AIDiagnosticModal;