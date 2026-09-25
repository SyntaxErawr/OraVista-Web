import { PortalSearch, RoleNotifications } from '../../components/ClinicPortalTools';
import React, { useState, useRef, useEffect } from 'react';

import { useSearchParams } from 'react-router-dom';

import AdminLayout from '../../components/AdminLayout';

import { Search, User, ZoomIn, RotateCw, UploadCloud, CheckCircle, X, Activity, ChevronDown, ChevronUp } from 'lucide-react';



const NODE_API_BASE = "https://oravista-server-474976105474.asia-southeast1.run.app";

const FASTAPI_API_BASE = "https://oravista-ai-engine-474976105474.asia-southeast1.run.app";



// Format X-ray advisory text for display only; keep the saved response unchanged.
function getXrayFindingBullets(text) {
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('en', { granularity: 'sentence' })
    : null;
  return String(text).split(/\r?\n/).flatMap((line) => {
    const content = line.trim().replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, '');
    if (!content) return [];
    return segmenter
      ? Array.from(segmenter.segment(content), ({ segment }) => segment.trim()).filter(Boolean)
      : [content];
  });
}

function DentistDiagnostics() {

  const [imageUploaded, setImageUploaded] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [analysisComplete, setAnalysisComplete] = useState(false);

  const [showAI, setShowAI] = useState(true);

  const [findings, setFindings] = useState([]);

  const [clinicalNotes, setClinicalNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const [isDiagnosisSaved, setIsDiagnosisSaved] = useState(false);

  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);

  const [diagnosisModal, setDiagnosisModal] = useState({

    show: false, type: 'success', title: '', message: ''

  });

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const [isCheckUpModalOpen, setIsCheckUpModalOpen] = useState(false);

  const [checkUpData, setCheckUpData] = useState({

    age: "", sex: "", blood_type: "", allergies: "", occupation: "",

    sugar_intake_score: 0, brushing_frequency: 0, flossing_frequency: 0,

    smoking: false, alcohol_use: false, previous_cavities: 0, previous_extractions: 0,

    family_history_dental_disease: false, last_dental_visit_months_ago: "", medical_history_notes: ""

  });

  const [isSubmittingCheckUp, setIsSubmittingCheckUp] = useState(false);

  const [checkUpResponseData, setCheckUpResponseData] = useState(null);



  const fileInputRef = useRef(null);



  const [searchQuery, setSearchQuery] = useState("");

  const [searchResults, setSearchResults] = useState([]);

  const [isSearchingPatients, setIsSearchingPatients] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [hoveredItemId, setHoveredItemId] = useState(null);



  const searchTimeoutRef = useRef(null);

  const dropdownRef = useRef(null);



  const [searchParams] = useSearchParams();

  const patientIdParam = searchParams.get('patient_id') || searchParams.get('id');

  const isUploadDisabled = !selectedPatient && !patientIdParam;



  useEffect(() => {

    function handleClickOutside(event) {

      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {

        setShowDropdown(false);

      }

    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => { document.removeEventListener("mousedown", handleClickOutside); };

  }, []);



  useEffect(() => {

    if (patientIdParam) {

      const fetchPatient = async () => {

        try {

          const cleanId = patientIdParam.toString().replace('PT-100', '').trim();

          const response = await fetch(`${NODE_API_BASE}/api/patients`);

          if (response.ok) {

            const allPatients = await response.json();

            const patient = allPatients.find(p =>

              p.id.toString() === cleanId ||

              p.id.toString() === patientIdParam.toString()

            );

            if (patient) {

              setSelectedPatient(patient);

              setSearchQuery(`${patient.first_name} ${patient.last_name}`);

            }

          }

        } catch (err) {

          console.error("Error fetching patient by param:", err);

        }

      };

      fetchPatient();

    }

  }, [patientIdParam]);



  useEffect(() => {

    if (!selectedPatient?.id) return undefined;

    let active = true;

    const loadLatestSavedDiagnosis = async () => {

      setIsDiagnosisSaved(false);

      setIsEditingDiagnosis(false);

      setClinicalNotes("");

      setDiagnosticData(null);

      setAnnotations([]);

      setFindings([]);

      setAnalysisComplete(false);

      setImageUploaded(false);

      setSelectedFile(null);

      try {

        const response = await fetch(`${FASTAPI_API_BASE}/api/diagnostic-imaging/patient/${selectedPatient.id}/latest`, { cache: 'no-store' });

        if (response.status === 404) return;

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const savedDiagnostic = await response.json();

        if (!active || savedDiagnostic?.ai_findings?.human_verified !== true) return;

        const savedAnnotations = Array.isArray(savedDiagnostic.ai_findings?.annotations)

          ? savedDiagnostic.ai_findings.annotations

          : [];

        const savedPredictions = Array.isArray(savedDiagnostic.ai_findings?.predictions)

          ? savedDiagnostic.ai_findings.predictions

          : [];

        setClinicalNotes(savedDiagnostic.clinical_notes || "");

        setAnnotations(savedAnnotations);

        setFindings(savedAnnotations.map((annotation, index) => ({

          id: index + 1,

          title: annotation.name || "Saved Finding",

          confidence: Math.round((annotation.confidence || 0) * 100),

          status: 'verified',

          isDoctorCreated: true,

          class_id: annotation.class_id,

          coordinates: annotation.box ? {

            top: `${annotation.box.y_min * 100}%`,

            left: `${annotation.box.x_min * 100}%`,

            width: `${annotation.box.width * 100}%`,

            height: `${annotation.box.height * 100}%`

          } : null

        })));

        setDiagnosticData({

          diagnostic_id: savedDiagnostic.id,

          patient_id: savedDiagnostic.patient_id,

          file_path: null,

          clinical_notes: "",

          predictions: savedPredictions,

          scan_date: savedDiagnostic.scan_date

        });

        setAnalysisComplete(true);

        setIsDiagnosisSaved(true);

        setIsEditingDiagnosis(false);

      } catch (error) {

        console.error("Error loading saved final diagnosis:", error);

      }

    };

    loadLatestSavedDiagnosis();

    return () => { active = false; };

  }, [selectedPatient?.id]);



  const handleSearchChange = (e) => {

    const query = e.target.value;

    setSearchQuery(query);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim() === "") {

      setSearchResults([]);

      setShowDropdown(false);

      return;

    }

    setShowDropdown(true);

    setIsSearchingPatients(true);

    searchTimeoutRef.current = setTimeout(async () => {

      try {

        const response = await fetch(`${NODE_API_BASE}/api/patients/search?q=${encodeURIComponent(query)}`);

        const data = await response.json();

        setSearchResults(data);

      } catch (err) {

        console.error("Error searching patients:", err);

      } finally {

        setIsSearchingPatients(false);

      }

    }, 300);

  };



  const handleSelectPatient = (patient) => {

    setSelectedPatient(patient);

    setSearchQuery(`${patient.first_name} ${patient.last_name}`);

    setShowDropdown(false);

  };



  const handleOpenCheckUp = () => {

    if (!selectedPatient) return;

    setCheckUpData({

      age: selectedPatient.age || "", sex: selectedPatient.sex || "",

      blood_type: selectedPatient.blood_type || "", allergies: selectedPatient.allergies || "",

      occupation: selectedPatient.occupation || "", sugar_intake_score: 0,

      brushing_frequency: 0, flossing_frequency: 0, smoking: false, alcohol_use: false,

      previous_cavities: 0, previous_extractions: 0, family_history_dental_disease: false,

      last_dental_visit_months_ago: "", medical_history_notes: ""

    });

    setCheckUpResponseData(null);

    setIsCheckUpModalOpen(true);

  };



  const handleCheckUpSubmit = async () => {

    if (!selectedPatient) return;

    setIsSubmittingCheckUp(true);

    try {

      const payload = {

        patient_id: parseInt(selectedPatient.id),

        age: checkUpData.age ? parseInt(checkUpData.age) : null,

        sex: checkUpData.sex || null, blood_type: checkUpData.blood_type || null,

        allergies: checkUpData.allergies || null, occupation: checkUpData.occupation || null,

        sugar_intake_score: parseInt(checkUpData.sugar_intake_score) || 0,

        brushing_frequency: parseInt(checkUpData.brushing_frequency) || 0,

        flossing_frequency: parseInt(checkUpData.flossing_frequency) || 0,

        smoking: Boolean(checkUpData.smoking), alcohol_use: Boolean(checkUpData.alcohol_use),

        previous_cavities: parseInt(checkUpData.previous_cavities) || 0,

        previous_extractions: parseInt(checkUpData.previous_extractions) || 0,

        family_history_dental_disease: Boolean(checkUpData.family_history_dental_disease),

        last_dental_visit_months_ago: checkUpData.last_dental_visit_months_ago ? parseInt(checkUpData.last_dental_visit_months_ago) : null,

        medical_history_notes: checkUpData.medical_history_notes || ""

      };

      const res = await fetch(`${FASTAPI_API_BASE}/api/dentist/check-up`, {

        method: "POST", headers: { "Content-Type": "application/json" },

        body: JSON.stringify(payload)

      });

      if (res.ok) { setCheckUpResponseData(await res.json()); }

      else { alert("Failed to submit check-up data."); }

    } catch (err) {

      console.error("Check-up submit error:", err);

      alert("Server error during check-up submission.");

    } finally { setIsSubmittingCheckUp(false); }

  };



  const [diagnosticData, setDiagnosticData] = useState(null);

  const [isDragging, setIsDragging] = useState(false);



  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };

  const handleDragLeave = () => { setIsDragging(false); };



  const uploadFileAndAnalyze = async (file) => {

    const activePatientId = selectedPatient ? selectedPatient.id : (patientIdParam ? patientIdParam.toString().replace('PT-100', '').trim() : null);

    if (!activePatientId) { alert("No patient selected or patient ID parameter found. Cannot upload."); return; }

    setIsAnalyzing(true);

    setAnalysisComplete(false);

    const formData = new FormData();

    formData.append('patient_id', activePatientId);

    formData.append('file', file);

    let responseData = null;

    const delayPromise = new Promise(resolve => setTimeout(resolve, 5000));

    try {

      const uploadPromise = fetch(`${FASTAPI_API_BASE}/api/diagnostic-imaging/upload`, {

        method: 'POST', body: formData

      }).then(res => {

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        return res.json();

      });

      const [result] = await Promise.all([

        uploadPromise.catch(err => { console.warn("FastAPI server offline or error. Using mock response.", err); return null; }),

        delayPromise

      ]);

      responseData = result;

    } catch (error) { console.error("Upload error:", error); }

    if (!responseData) {

      const localUrl = URL.createObjectURL(file);

      responseData = {

        diagnostic_id: Math.floor(Math.random() * 1000) + 1,

        patient_id: activePatientId, file_path: localUrl,

        clinical_notes: "AI Recommended Advisory: Indication of localized caries on the lower left premolars and moderate horizontal bone loss on the posterior region. Clinical validation suggested.",

        predictions: [

          { class_id: 1, name: "Caries (Cavities)", confidence: 0.94, box: { x_min: 0.15, y_min: 0.25, width: 0.12, height: 0.10 } },

          { class_id: 2, name: "Bone Loss (Periodontitis)", confidence: 0.82, box: { x_min: 0.45, y_min: 0.55, width: 0.18, height: 0.15 } }

        ],

        scan_date: new Date().toISOString()

      };

    }

    setDiagnosticData(responseData);

    setAnnotations(responseData.predictions || []);

    const compatFindings = (responseData.predictions || []).map((pred, index) => ({

      id: index + 1, title: pred.name, confidence: Math.round(pred.confidence * 100),

      status: 'pending', class_id: pred.class_id,

      coordinates: pred.box ? {

        top: `${pred.box.y_min * 100}%`, left: `${pred.box.x_min * 100}%`,

        width: `${pred.box.width * 100}%`, height: `${pred.box.height * 100}%`

      } : null

    }));

    setFindings(compatFindings);

    setAnalysisComplete(true);

    setIsAnalyzing(false);

  };



  const processFile = (file) => {

    if (!file) return;

    if (isUploadDisabled) { alert("Please select a patient or make sure a patient ID is provided before uploading."); return; }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!validTypes.includes(file.type)) { alert("Invalid file type. Please upload a .jpg, .jpeg, or .png file."); return; }

    setSelectedFile(file);

    setImageUploaded(true);

    setClinicalNotes("");

    setIsDiagnosisSaved(false);

    setIsEditingDiagnosis(false);

    uploadFileAndAnalyze(file);

  };



  const handleFileChange = (event) => { processFile(event.target.files[0]); };

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); };



  const [isZoomed, setIsZoomed] = useState(false);

  const [rotation, setRotation] = useState(0);

  const handleZoom = () => { setIsZoomed(!isZoomed); };

  const handleRotate = () => { setRotation((prev) => (prev + 90) % 360); };



  const [annotations, setAnnotations] = useState([]);

  const [isDrawingBox, setIsDrawingBox] = useState(false);

  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

  const [currentDraw, setCurrentDraw] = useState(null);

  const [pendingAnnotation, setPendingAnnotation] = useState(null);

  const [annotationText, setAnnotationText] = useState("");

  const containerRef = useRef(null);



  const getRelativeCoords = (clientX, clientY) => {

    const rect = containerRef.current.getBoundingClientRect();

    return {

      x: (clientX - rect.left) / rect.width,

      y: (clientY - rect.top) / rect.height

    };

  };



  const handleMouseDown = (e) => {

    if (!analysisComplete || isAnalyzing || pendingAnnotation) return;

    e.preventDefault();

    const { x, y } = getRelativeCoords(e.clientX, e.clientY);

    setIsDrawingBox(true);

    setDrawStart({ x, y });

    setCurrentDraw({ x, y, w: 0, h: 0 });

  };



  const handleMouseMove = (e) => {

    if (!isDrawingBox) return;

    const { x: pctX, y: pctY } = getRelativeCoords(e.clientX, e.clientY);

    setCurrentDraw({

      x: Math.min(drawStart.x, pctX), y: Math.min(drawStart.y, pctY),

      w: Math.abs(drawStart.x - pctX), h: Math.abs(drawStart.y - pctY)

    });

  };



  const handleTouchStart = (e) => {

    if (!analysisComplete || isAnalyzing || pendingAnnotation) return;

    const touch = e.touches[0];

    const { x, y } = getRelativeCoords(touch.clientX, touch.clientY);

    setIsDrawingBox(true);

    setDrawStart({ x, y });

    setCurrentDraw({ x, y, w: 0, h: 0 });

  };



  const handleTouchMove = (e) => {

    if (!isDrawingBox) return;

    e.preventDefault();

    const touch = e.touches[0];

    const { x: pctX, y: pctY } = getRelativeCoords(touch.clientX, touch.clientY);

    setCurrentDraw({

      x: Math.min(drawStart.x, pctX), y: Math.min(drawStart.y, pctY),

      w: Math.abs(drawStart.x - pctX), h: Math.abs(drawStart.y - pctY)

    });

  };



  const handleTouchEnd = () => {

    if (!isDrawingBox) return;

    setIsDrawingBox(false);

    if (currentDraw && currentDraw.w > 0.01 && currentDraw.h > 0.01) {

      setPendingAnnotation({ x_min: currentDraw.x, y_min: currentDraw.y, width: currentDraw.w, height: currentDraw.h });

      setAnnotationText("");

    } else { setCurrentDraw(null); }

  };



  const handleMouseUp = () => {

    if (!isDrawingBox) return;

    setIsDrawingBox(false);

    if (currentDraw && currentDraw.w > 0.01 && currentDraw.h > 0.01) {

      setPendingAnnotation({ x_min: currentDraw.x, y_min: currentDraw.y, width: currentDraw.w, height: currentDraw.h });

      setAnnotationText("");

    } else { setCurrentDraw(null); }

  };



  const handleSaveAnnotation = () => {

    if (!annotationText.trim()) { handleCancelAnnotation(); return; }

    const doctorClassStart = 5;

    const existingClassIds = annotations.map(ann => ann.class_id);

    const maxClassId = existingClassIds.length > 0 ? Math.max(...existingClassIds) : 0;

    const newClassId = Math.max(doctorClassStart, maxClassId + 1);

    const newAnnotation = {

      class_id: newClassId, name: annotationText.trim(), confidence: 0.99,

      box: { x_min: pendingAnnotation.x_min, y_min: pendingAnnotation.y_min, width: pendingAnnotation.width, height: pendingAnnotation.height }

    };

    const updatedAnnotations = [...annotations, newAnnotation];

    setAnnotations(updatedAnnotations);

    const newFindingId = findings.length > 0 ? Math.max(...findings.map(f => f.id)) + 1 : 1;

    const newFinding = {

      id: newFindingId, title: newAnnotation.name, confidence: 99, status: 'verified',

      isDoctorCreated: true, class_id: newClassId,

      coordinates: {

        top: `${newAnnotation.box.y_min * 100}%`, left: `${newAnnotation.box.x_min * 100}%`,

        width: `${newAnnotation.box.width * 100}%`, height: `${newAnnotation.box.height * 100}%`

      }

    };

    setFindings([...findings, newFinding]);

    setPendingAnnotation(null);

    setCurrentDraw(null);

    setAnnotationText("");

  };



  const handleCancelAnnotation = () => { setPendingAnnotation(null); setCurrentDraw(null); setAnnotationText(""); };



  const handleValidate = (id, action) => {

    const targetFinding = findings.find(f => f.id === id);

    if (!targetFinding) return;

    if (targetFinding.isDoctorCreated && action === 'rejected') {

      setFindings(findings.filter(f => f.id !== id));

      setAnnotations(annotations.filter(ann => ann.class_id !== targetFinding.class_id));

      return;

    }

    setFindings(findings.map(f => f.id === id ? { ...f, status: action } : f));

    if (action === 'rejected') {

      setAnnotations(annotations.filter(ann => ann.class_id !== targetFinding.class_id));

    } else if (action === 'verified') {

      const isAlreadyIn = annotations.some(ann => ann.class_id === targetFinding.class_id);

      if (!isAlreadyIn) {

        const origPred = diagnosticData?.predictions?.find(p => p.class_id === targetFinding.class_id);

        if (origPred) setAnnotations([...annotations, origPred]);

      }

    }

  };



  const handleSaveDiagnosis = async () => {

    if (!diagnosticData || !diagnosticData.diagnostic_id) {

      setDiagnosisModal({

        show: true, type: 'error', title: 'Unable to Save Final Diagnosis',

        message: 'No active diagnosis record to update. Please upload an image first.'

      });

      return;

    }

    const wasAlreadySaved = isDiagnosisSaved;

    setIsSaving(true);

    try {

      const payload = {

        clinical_notes: clinicalNotes,

        human_verified_findings: {

          predictions: diagnosticData.predictions || [],

          annotations: annotations, human_verified: true

        }

      };

      const response = await fetch(`${FASTAPI_API_BASE}/api/diagnostic-imaging/${diagnosticData.diagnostic_id}/annotate`, {

        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)

      });

      const data = await response.json();

      if (response.ok) {

        setIsDiagnosisSaved(true);

        setIsEditingDiagnosis(false);

        setDiagnosisModal({

          show: true,

          type: 'success',

          title: wasAlreadySaved ? 'Final Diagnosis Updated' : 'Final Diagnosis Saved',

          message: wasAlreadySaved

            ? 'The clinical notes have been updated successfully.'

            : 'The final diagnosis, verified findings, and clinical notes have been saved successfully.'

        });

      } else {

        setDiagnosisModal({

          show: true, type: 'error', title: 'Unable to Save Final Diagnosis',

          message: data.message || data.detail || 'Failed to update annotations.'

        });

      }

    } catch (error) {

      console.error("Save Failed:", error);

      setDiagnosisModal({

        show: true, type: 'error', title: 'Unable to Save Final Diagnosis',

        message: 'Could not connect to the FastAPI server. Please try again.'

      });

    } finally { setIsSaving(false); }

  };



  return (

    <AdminLayout>

      <style>{`

        .dd-container { display: flex; flex-direction: column; width: 100%; }



        /* HEADER */

        .dd-header { height: 80px; background: #087F8C; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; position: sticky; top: 0; z-index: 10; }

        .dd-search-wrapper { display: flex; align-items: center; }

        .dd-search-box { display: flex; align-items: center; background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 12px; width: 350px; transition: all 0.3s ease; box-sizing: border-box; }

        .dd-search-input { border: none; background: transparent; margin-left: 10px; outline: none; width: 100%; color: var(--ov-on-color, #fff); }

        .dd-search-input::placeholder { color: var(--ov-on-muted, rgba(255,255,255,0.75)); }

        .dd-mobile-toggle { display: none; }

        .dd-header-actions { display: flex; align-items: center; gap: 25px; margin-left: auto; }

        .dd-profile { display: flex; align-items: center; gap: 15px; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 20px; }

        .dd-profile-text { text-align: right; }

        .dd-user-name { margin: 0; font-weight: bold; font-size: 14px; color: var(--ov-on-color, #fff); }

        .dd-user-role { margin: 0; font-size: 12px; color: var(--ov-on-muted, rgba(255,255,255,0.75)); }

        .dd-avatar { width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }



        /* CONTENT */

        .dd-content { padding: 40px; background-color: #F3F9FA; min-height: calc(100vh - 80px); }

        .dd-main-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 25px; }

        .dd-info-bar { display: grid; background: #087F8C; border-radius: 15px; padding: 20px; margin-bottom: 25px; color: var(--ov-on-color, #fff); }

        .dd-info-col { border-right: 1px solid rgba(255,255,255,0.1); padding: 0 20px; text-align: center; }



        /* MOBILE */

        @media (max-width: 768px) {

          .dd-header { padding: 0 15px; justify-content: flex-end; position: relative; }



          .dd-search-wrapper { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); z-index: 20; }

          .dd-search-box { width: 44px; height: 44px; padding: 0; justify-content: center; cursor: pointer; border-radius: 50%; }

          .dd-search-box.expanded { width: calc(100vw - 30px); background: #066875; border: 1px solid rgba(255,255,255,0.2); padding: 0 15px; justify-content: space-between; border-radius: 12px; }

          .dd-search-input { display: none; }

          .dd-search-box.expanded .dd-search-input { display: block; }

          .dd-search-box:not(.expanded) .dd-search-icon { display: none; }

          .dd-mobile-toggle { display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--ov-on-color, #fff); padding: 0; cursor: pointer; flex-shrink: 0; }

          .dd-search-box:not(.expanded) .dd-mobile-toggle { display: flex; }

          .dd-header-actions { gap: 15px; transition: opacity 0.3s ease; }

          .dd-header-actions.hidden { opacity: 0; pointer-events: none; }

          .dd-profile { padding-left: 10px; gap: 10px; border-left: none; }

          .dd-profile-text { display: none; }



          .dd-content { padding: 15px; }

          .dd-main-grid { grid-template-columns: 1fr; }

          .dd-info-bar { grid-template-columns: 1fr 1fr !important; gap: 12px; padding: 15px; }

          .dd-info-col { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 10px 8px; text-align: left; }

          .dd-info-col:nth-child(odd) { border-right: 1px solid rgba(255,255,255,0.1); }

          .dd-insight-image-container { width: 100% !important; height: 280px !important; }

          .dd-xray-area { height: 300px !important; }

          .dd-simulated-xray { width: 100% !important; height: 100% !important; }

        }

      `}</style>



      <div className="dd-container">

        {/* HEADER */}

        <header className="dd-header">

          <div className="dd-search-wrapper">

            <div className={`dd-search-box ${isSearchExpanded ? 'expanded' : ''}`}>

              <Search className="dd-search-icon" size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />

              <PortalSearch className="dd-search-input" />

              <button className="dd-mobile-toggle" onClick={() => setIsSearchExpanded(!isSearchExpanded)}>

                {isSearchExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}

              </button>

            </div>

          </div>

          <div className={`dd-header-actions ${isSearchExpanded ? 'hidden' : ''}`}>

            <RoleNotifications />



            <div className="dd-profile">

              <div className="dd-profile-text">

                <p className="dd-user-name">Dr. Smith</p>

                <p className="dd-user-role">Dentist</p>

              </div>

              <div className="dd-avatar"><User size={20} color="#087F8C" /></div>

            </div>

          </div>

        </header>



        {/* CONTENT */}

        <div className="dd-content">

          <div style={styles.titleSection}>

            <h1 style={styles.pageTitle}>Diagnostics</h1>

            <p style={styles.pageSubtitle}>AI-Assisted Imaging & Clinical Findings</p>

          </div>



          {/* Patient Search */}

          <div style={styles.searchBarContainer} ref={dropdownRef}>

            <div style={styles.patientSearchBox}>

              <Search size={18} color="#087F8C" style={{ opacity: 0.6, flexShrink: 0 }} />

              <input

                type="text" placeholder="Search patient by name or email..."

                value={searchQuery} onChange={handleSearchChange}

                onFocus={() => { if (searchQuery.trim() !== "") setShowDropdown(true); }}

                style={styles.patientSearchInput}

              />

              {searchQuery && (

                <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowDropdown(false); }} style={styles.clearSearchBtn}>

                  <X size={16} color="#087F8C" />

                </button>

              )}

            </div>

            {showDropdown && (

              <div style={styles.patientDropdown}>

                {isSearchingPatients ? (

                  <div style={styles.dropdownMessage}>Searching patients...</div>

                ) : searchResults.length === 0 ? (

                  <div style={styles.dropdownMessage}>No patient found.</div>

                ) : (

                  searchResults.map((patient) => (

                    <div key={patient.id} onClick={() => handleSelectPatient(patient)}

                      onMouseEnter={() => setHoveredItemId(patient.id)}

                      onMouseLeave={() => setHoveredItemId(null)}

                      style={{ ...styles.dropdownItem, backgroundColor: hoveredItemId === patient.id ? 'rgba(8, 127, 140,0.05)' : 'white' }}>

                      <div style={styles.patientAvatar}>

                        {patient.profile_picture ? (

                          <img src={`https://oravista-server-474976105474.asia-southeast1.run.app/${patient.profile_picture}`} alt="" style={styles.avatarImg} />

                        ) : <User size={16} color="#087F8C" />}

                      </div>

                      <div style={styles.patientInfo}>

                        <p style={styles.patientNameText}>{patient.first_name} {patient.last_name}</p>

                        <p style={styles.patientEmailText}>{patient.email}</p>

                      </div>

                    </div>

                  ))

                )}

              </div>

            )}

          </div>



          {/* Info Bar */}

          <div className="dd-info-bar" style={{

            gridTemplateColumns: selectedPatient ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)',

            alignItems: 'center'

          }}>

            <div className="dd-info-col">

              <p style={styles.infoLabel}>Patient Name</p>

              <p style={styles.infoVal}>{selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "N/A"}</p>

            </div>

            <div className="dd-info-col">

              <p style={styles.infoLabel}>Patient ID</p>

              <p style={styles.infoVal}>{selectedPatient ? `PT-${selectedPatient.id}` : "N/A"}</p>

            </div>

            <div className="dd-info-col">

              <p style={styles.infoLabel}>Case Type</p>

              <p style={styles.infoVal}>Panoramic X-Ray</p>

            </div>

            <div className="dd-info-col" style={{ border: selectedPatient ? "1px solid var(--ov-on-line, rgba(255,255,255,0.1))" : 'none', borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }}>

              <p style={styles.infoLabel}>Scan Date</p>

              <p style={styles.infoVal}>Feb 15, 2026</p>

            </div>

            {selectedPatient && (

              <div className="dd-info-col" style={{ border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                <p style={styles.infoLabel}>Action</p>

                <button onClick={handleOpenCheckUp} style={styles.checkUpBtn}>

                  <Activity size={16} /> Dental Check Up

                </button>

              </div>

            )}

          </div>



          {/* Main Grid */}

          <div className="dd-main-grid">

            {/* LEFT COLUMN */}

            <div style={styles.leftPanel}>

              <div className="ov-panel" style={styles.viewerCard}>

                <div style={styles.viewerHeader}>

                  <h3 style={styles.sectionTitle}>Image Analysis</h3>

                </div>

                <div className="dd-xray-area" style={styles.xrayImageArea}>

                  <input type="file" accept="image/png, image/jpeg, image/jpg" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />

                  {!imageUploaded ? (

                    <div style={{

                      ...styles.uploadArea,

                      backgroundColor: isUploadDisabled ? "var(--ov-on-wash, rgba(255,255,255,0.02))" : (isDragging ? "var(--ov-on-wash, rgba(255,255,255,0.1))" : 'transparent'),

                      borderColor: isUploadDisabled ? "var(--ov-on-line, rgba(255,255,255,0.1))" : (isDragging ? '#10b981' : "var(--ov-on-line, rgba(255,255,255,0.2))"),

                      opacity: isUploadDisabled ? 0.5 : 1,

                      cursor: isUploadDisabled ? 'not-allowed' : 'pointer'

                    }}

                      onClick={() => { if (isUploadDisabled) return; fileInputRef.current.click(); }}

                      onDragOver={(e) => { if (isUploadDisabled) return; handleDragOver(e); }}

                      onDragLeave={() => { if (isUploadDisabled) return; handleDragLeave(); }}

                      onDrop={(e) => { if (isUploadDisabled) return; handleDrop(e); }}

                    >

                      <UploadCloud size={48} color={isUploadDisabled ? "rgba(255,255,255,0.2)" : (isDragging ? '#10b981' : "rgba(255,255,255,0.4)")} style={{ marginBottom: '15px' }} />

                      <p style={{ color: isUploadDisabled ? "var(--ov-on-muted, rgba(255,255,255,0.75))" : "#fff", fontWeight: 'bold', fontSize: '16px', textAlign: 'center' }}>

                        {isUploadDisabled ? "Upload Disabled" : "Upload X-Ray or Intraoral Scan"}

                      </p>

                      <p style={{ color: isUploadDisabled ? "var(--ov-on-muted, rgba(255,255,255,0.75))" : "var(--ov-on-muted, rgba(255,255,255,0.75))", fontSize: '13px', marginTop: '5px', textAlign: 'center', padding: '0 10px' }}>

                        {isUploadDisabled ? "Select a patient from search or via URL parameters to enable upload" : "Drag & Drop or Click to browse (JPG, JPEG, PNG)"}

                      </p>

                    </div>

                  ) : (

                    <div className="dd-simulated-xray" style={styles.simulatedXray}>

                      {selectedFile && (

                        <img src={URL.createObjectURL(selectedFile)} alt="Patient X-Ray Preview"

                          style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: '10px' }} />

                      )}

                      {selectedFile && (

                        <button onClick={() => {

                          setImageUploaded(false); setSelectedFile(null); setAnalysisComplete(false);

                          setFindings([]); setDiagnosticData(null); setIsZoomed(false); setRotation(0);

                        }} style={styles.closePreviewBtn} title="Remove image and upload another">

                          <X size={16} color="var(--ov-on-color, #fff)" />

                        </button>

                      )}

                      {isAnalyzing && <div style={styles.scannerLine}></div>}

                    </div>

                  )}

                </div>

              </div>



              {/* AI Insights Card */}

              <div className="ov-panel" style={styles.insightsCard}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>

                  <h3 style={styles.sectionTitle}>AI Insight Analysis</h3>

                  {analysisComplete && (

                    <div style={styles.viewerActions}>

                      <button style={styles.vBtn} onClick={handleZoom}><ZoomIn size={14} /> {isZoomed ? "Zoom Out" : "Zoom In"}</button>

                      <button style={styles.vBtn} onClick={handleRotate}><RotateCw size={14} /> Rotate</button>

                    </div>

                  )}

                </div>

                {!imageUploaded ? (

                  <p style={{ color: "var(--ov-on-muted, rgba(255,255,255,0.75))", fontSize: '14px', marginTop: '20px' }}>Upload an image to begin the CNN analysis.</p>

                ) : isAnalyzing ? (

                  <div style={{ marginTop: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>

                    <div style={styles.loadingSpinner}></div>

                    <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>Uploading & Analyzing Visual Data (CNN Model)...</p>

                  </div>

                ) : (

                  <div style={{ marginTop: '15px' }}>

                    <div className="dd-insight-image-container" style={styles.insightImageContainer}>

                      <div

                        ref={containerRef}

                        onMouseDown={handleMouseDown}

                        onMouseMove={handleMouseMove}

                        onMouseUp={handleMouseUp}

                        onTouchStart={handleTouchStart}

                        onTouchMove={handleTouchMove}

                        onTouchEnd={handleTouchEnd}

                        style={{

                          width: '100%', height: '100%', position: 'relative',

                          transform: `rotate(${rotation}deg) scale(${isZoomed ? 1.3 : 1})`,

                          transition: 'transform 0.3s ease',

                          cursor: "crosshair",

                          touchAction: 'none'

                        }}

                      >

                        {diagnosticData && diagnosticData.file_path && (

                          <img src={diagnosticData.file_path} alt="AI Analyzed Scan" style={styles.insightImage} />

                        )}

                        {showAI && findings && findings.map(finding => {

                          if (!finding.coordinates) return null;

                          return (

                            <div key={finding.id} style={{

                              ...styles.boundingBox,

                              top: finding.coordinates.top, left: finding.coordinates.left,

                              width: finding.coordinates.width, height: finding.coordinates.height,

                              borderColor: finding.status === 'rejected' ? 'transparent' : (finding.status === 'verified' ? '#10b981' : '#ef4444')

                            }}>

                              {(finding.status === 'pending' || finding.status === 'verified') && (

                                <span style={{ ...styles.boxLabel, backgroundColor: finding.status === 'verified' ? '#10b981' : '#ef4444' }}>

                                  {finding.title} ({finding.confidence}%)

                                </span>

                              )}

                            </div>

                          );

                        })}

                        {currentDraw && (

                          <div style={{

                            position: 'absolute', border: '2px dashed #10b981',

                            top: `${currentDraw.y * 100}%`, left: `${currentDraw.x * 100}%`,

                            width: `${currentDraw.w * 100}%`, height: `${currentDraw.h * 100}%`,

                            pointerEvents: 'none', zIndex: 10

                          }} />

                        )}

                        {pendingAnnotation && (

                          <div className="ov-color-surface" style={{ "--ov-on-color": "var(--ov-ink)",

                            position: 'absolute',

                            top: `${pendingAnnotation.y_min * 100}%`, left: `${pendingAnnotation.x_min * 100}%`,

                            transform: 'translateY(-105%)', zIndex: 20, background: "var(--ov-primary)",

                            border: '1px solid #10b981', borderRadius: '6px', padding: '4px 8px',

                            display: 'flex', gap: '5px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', pointerEvents: 'auto'

                          }}>

                            <input type="text" placeholder="Pathology Name..." value={annotationText}

                              onChange={(e) => setAnnotationText(e.target.value)}

                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAnnotation(); if (e.key === 'Escape') handleCancelAnnotation(); }}

                              autoFocus

                              style={{ background: 'transparent', border: 'none', outline: 'none', color: "var(--ov-on-color, #fff)", fontSize: '12px', width: '120px' }} />

                            <button onClick={handleSaveAnnotation}

                              style={{ background: '#10b981', border: 'none', borderRadius: '3px', color: "var(--ov-on-color, #fff)", fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', cursor: 'pointer' }}>OK</button>

                            <button onClick={handleCancelAnnotation}

                              style={{ background: '#ef4444', border: 'none', borderRadius: '3px', color: "var(--ov-on-color, #fff)", fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', cursor: 'pointer' }}>Cancel</button>

                          </div>

                        )}

                      </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>

                      <span style={{ fontSize: '12px', color: "var(--ov-on-muted, rgba(255,255,255,0.75))" }}>{findings.length} findings detected</span>

                      <button style={styles.toggleBtn} onClick={() => setShowAI(!showAI)}>

                        {showAI ? 'Hide AI Overlays' : 'Show AI Overlays'}

                      </button>

                    </div>

                    <div style={styles.findingsGrid}>

                      {findings.map((insight) => (

                        <div key={insight.id} style={{

                          ...styles.insightBox, opacity: insight.status === 'rejected' ? 0.4 : 1,

                          borderLeft: insight.status === 'verified' ? '3px solid #10b981' : (insight.status === 'rejected' ? '3px solid #6b7280' : 'none')

                        }}>

                          <p style={styles.insightText}>{insight.title ? insight.title.replace(/YOLO Detection/gi, "AI Finding") : "AI Finding"}</p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                            <span style={{ ...styles.confBadge, backgroundColor: insight.status === 'verified' ? '#10b981' : (insight.status === 'rejected' ? '#6b7280' : '#f59e0b') }}>

                              {insight.confidence}% Confidence

                            </span>

                            {insight.status === 'pending' && (

                              <div style={{ display: 'flex', gap: '8px' }}>

                                <button style={styles.actionBtnCheck} onClick={() => handleValidate(insight.id, 'verified')}><CheckCircle size={14} color="#10b981" /></button>

                                <button style={styles.actionBtnCross} onClick={() => handleValidate(insight.id, 'rejected')}><X size={14} color="#ef4444" /></button>

                              </div>

                            )}

                            {insight.status === 'verified' && <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>Verified</span>}

                            {insight.status === 'rejected' && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>Rejected</span>}

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                )}

              </div>

            </div>



            {/* RIGHT COLUMN */}

            <div style={styles.sidePanel}>

              <div className="ov-panel" style={styles.notesCard}>

                <h3 style={styles.sectionTitle}>Clinical Notes</h3>

                {analysisComplete && diagnosticData && diagnosticData.clinical_notes && (

                  <div style={styles.aiFindingsCard} className="ai-findings-scrollbar">

                    <h4 style={styles.aiFindingsHeader}>AI Generated Findings</h4>

                    <ul style={{ ...styles.aiFindingsText, paddingLeft: '20px', listStyleType: 'disc' }}>
                      {getXrayFindingBullets(diagnosticData.clinical_notes).map((finding, index, items) => (
                        <li key={index} style={{ marginBottom: index < items.length - 1 ? '8px' : 0 }}>
                          {finding}
                        </li>
                      ))}
                    </ul>

                  </div>

                )}

                <textarea placeholder="Enter final diagnosis and recommendations here. AI findings are supportive only."

                  style={{ ...styles.textarea, opacity: isDiagnosisSaved && !isEditingDiagnosis ? 0.75 : 1 }}

                  disabled={!analysisComplete || (isDiagnosisSaved && !isEditingDiagnosis)}

                  value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} />

                {isDiagnosisSaved && !isEditingDiagnosis && (

                  <button

                    style={{ ...styles.saveBtn, background: '#10b981', color: "var(--ov-on-color, #fff)", cursor: 'pointer' }}

                    onClick={() => setIsEditingDiagnosis(true)}>

                    Edit Clinical Notes

                  </button>

                )}

                <button style={{

                  ...styles.saveBtn,

                  opacity: analysisComplete && !isSaving && (!isDiagnosisSaved || isEditingDiagnosis) ? 1 : 0.5,

                  cursor: analysisComplete && !isSaving && (!isDiagnosisSaved || isEditingDiagnosis) ? 'pointer' : 'not-allowed'

                }}

                  disabled={!analysisComplete || isSaving || (isDiagnosisSaved && !isEditingDiagnosis)} onClick={handleSaveDiagnosis}>

                  {isSaving ? "Saving..." : "Save Final Diagnosis"}

                </button>

              </div>

            </div>

          </div>

        </div>

      </div>



      {/* Final Diagnosis Save / Update Modal */}

      {diagnosisModal.show && (

        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: '15px', boxSizing: 'border-box' }}>

          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "15px", width: "100%", maxWidth: "430px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", color: "#333", textAlign: 'center' }}>

            <div style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', backgroundColor: diagnosisModal.type === 'success' ? '#e8f5e9' : '#fee2e2' }}>

              {diagnosisModal.type === 'success'

                ? <CheckCircle size={32} color="#10b981" />

                : <X size={32} color="#dc2626" />}

            </div>

            <h2 style={{ color: '#087F8C', margin: '0 0 12px', fontSize: '22px' }}>{diagnosisModal.title}</h2>

            <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.6, margin: '0 0 22px' }}>{diagnosisModal.message}</p>

            <button

              onClick={() => setDiagnosisModal(current => ({ ...current, show: false }))}

              style={{ "--ov-on-color": "var(--ov-ink)", width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", cursor: 'pointer', fontWeight: '700' }}>

              Okay

            </button>

          </div>

        </div>

      )}



      {/* Dental Check Up Modal */}

      {isCheckUpModalOpen && (

        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: '15px', boxSizing: 'border-box' }}>

          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "15px", width: "100%", maxWidth: "600px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", color: "#333" }}>

            {isSubmittingCheckUp ? (

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>

                <div style={styles.loadingSpinner}></div>

                <p style={{ color: '#087F8C', fontWeight: 'bold', fontSize: '16px', marginTop: '20px' }}>Analyzing Oral Health Risk...</p>

                <p style={{ color: '#666', fontSize: '13px', marginTop: '5px' }}>Processing lifestyle metrics and clinical history via AI model</p>

              </div>

            ) : checkUpResponseData ? (

              <div style={{ textAlign: "center", padding: "10px" }}>

                <div style={{ backgroundColor: "#e8f5e9", width: "60px", height: "60px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 20px auto" }}>

                  <Activity size={30} color="#2e7d32" />

                </div>

                <h2 style={{ color: "#087F8C", marginBottom: "15px", marginTop: 0 }}>Assessment Complete!</h2>

                <p style={{ color: "#666", marginBottom: "20px" }}>The check-up data has been successfully processed by the AI.</p>

                <div style={{ backgroundColor: "#f0f2f5", padding: "20px", borderRadius: "10px", marginBottom: "25px", textAlign: "left" }}>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>

                    <span style={{ fontWeight: "600", color: "#333" }}>Risk Score:</span>

                    <span style={{ fontWeight: "700", color: "#087F8C" }}>{checkUpResponseData.risk_score}/100</span>

                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>

                    <span style={{ fontWeight: "600", color: "#333" }}>Health Grade:</span>

                    <span style={{ fontWeight: "700", color: checkUpResponseData.risk_score > 60 ? "#d32f2f" : "#2e7d32" }}>{checkUpResponseData.health_grade}</span>

                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>

                    <span style={{ fontWeight: "600", color: "#333" }}>Risk Level:</span>

                    <span style={{ fontWeight: "700", color: checkUpResponseData.risk_score > 60 ? "#d32f2f" : "#2e7d32" }}>{checkUpResponseData.risk_level}</span>

                  </div>

                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "15px", marginBottom: "15px" }}>

                    <span style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "5px" }}>Disease Progression Forecast:</span>

                    <span style={{ color: "#555", fontSize: "14px", lineHeight: "1.5", display: "block" }}>{checkUpResponseData.disease_progression_forecast}</span>

                  </div>

                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "15px" }}>

                    <span style={{ fontWeight: "600", color: "#333", display: "block", marginBottom: "5px" }}>Recommended Action:</span>

                    <span style={{ color: "#555", fontSize: "14px", lineHeight: "1.5", display: "block" }}>{checkUpResponseData.recommended_action}</span>

                  </div>

                </div>

                <button onClick={() => { setIsCheckUpModalOpen(false); setCheckUpResponseData(null); }}

                  style={{ "--ov-on-color": "var(--ov-ink)", padding: "12px 30px", borderRadius: "8px", border: "none", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", cursor: "pointer", fontWeight: "700", width: "100%" }}>Close</button>

              </div>

            ) : (

              <>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>

                  <h2 style={{ color: "#087F8C", margin: 0 }}>Dental Check Up</h2>

                  <X size={24} style={{ cursor: "pointer", color: "#666" }} onClick={() => setIsCheckUpModalOpen(false)} />

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Age</label>

                    <input type="number" value={checkUpData.age} onChange={e => setCheckUpData({ ...checkUpData, age: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Sex</label>

                    <select value={checkUpData.sex} onChange={e => setCheckUpData({ ...checkUpData, sex: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}>

                      <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>

                    </select></div>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Blood Type</label>

                    <input type="text" value={checkUpData.blood_type} onChange={e => setCheckUpData({ ...checkUpData, blood_type: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Occupation</label>

                    <input type="text" value={checkUpData.occupation} onChange={e => setCheckUpData({ ...checkUpData, occupation: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div style={{ gridColumn: "span 2" }}><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Allergies</label>

                    <input type="text" value={checkUpData.allergies} onChange={e => setCheckUpData({ ...checkUpData, allergies: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Sugar Intake Score (0-10)</label>

                    <input type="number" min="0" max="10" value={checkUpData.sugar_intake_score} onChange={e => setCheckUpData({ ...checkUpData, sugar_intake_score: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Brushing Freq (per day, 0-5)</label>

                    <input type="number" min="0" max="5" value={checkUpData.brushing_frequency} onChange={e => setCheckUpData({ ...checkUpData, brushing_frequency: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Flossing Freq (per day, 0-3)</label>

                    <input type="number" min="0" max="3" value={checkUpData.flossing_frequency} onChange={e => setCheckUpData({ ...checkUpData, flossing_frequency: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Last Visit (months ago)</label>

                    <input type="number" min="0" value={checkUpData.last_dental_visit_months_ago} onChange={e => setCheckUpData({ ...checkUpData, last_dental_visit_months_ago: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Previous Cavities</label>

                    <input type="number" min="0" value={checkUpData.previous_cavities} onChange={e => setCheckUpData({ ...checkUpData, previous_cavities: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Previous Extractions</label>

                    <input type="number" min="0" value={checkUpData.previous_extractions} onChange={e => setCheckUpData({ ...checkUpData, previous_extractions: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} /></div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

                    <input type="checkbox" checked={checkUpData.smoking} onChange={e => setCheckUpData({ ...checkUpData, smoking: e.target.checked })} id="smokeCb" />

                    <label htmlFor="smokeCb" style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>Currently Smokes</label>

                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

                    <input type="checkbox" checked={checkUpData.alcohol_use} onChange={e => setCheckUpData({ ...checkUpData, alcohol_use: e.target.checked })} id="alcoholCb" />

                    <label htmlFor="alcoholCb" style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>Alcohol Use</label>

                  </div>

                  <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "10px" }}>

                    <input type="checkbox" checked={checkUpData.family_history_dental_disease} onChange={e => setCheckUpData({ ...checkUpData, family_history_dental_disease: e.target.checked })} id="historyCb" />

                    <label htmlFor="historyCb" style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>Family History of Dental Disease</label>

                  </div>

                  <div style={{ gridColumn: "span 2" }}><label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" }}>Medical History Notes</label>

                    <textarea rows="3" value={checkUpData.medical_history_notes} onChange={e => setCheckUpData({ ...checkUpData, medical_history_notes: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", fontFamily: "inherit" }}></textarea></div>

                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "25px" }}>

                  <button onClick={() => setIsCheckUpModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #ccc", backgroundColor: "white", cursor: "pointer", fontWeight: "600", color: "#333" }}>Close</button>

                  <button onClick={handleCheckUpSubmit} disabled={isSubmittingCheckUp} style={{ "--ov-on-color": "var(--ov-ink)", padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", cursor: isSubmittingCheckUp ? "not-allowed" : "pointer", fontWeight: "600" }}>

                    {isSubmittingCheckUp ? "Saving..." : "Save"}

                  </button>

                </div>

              </>

            )}

          </div>

        </div>

      )}

    </AdminLayout>

  );

}



const styles = {

  container: { display: 'flex', flexDirection: 'column', width: '100%' },

  searchBarContainer: { position: 'relative', marginBottom: '25px', width: '100%', maxWidth: '500px' },

  patientSearchBox: { display: 'flex', alignItems: 'center', background: 'white', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(8, 127, 140,0.05)', border: '1px solid rgba(8, 127, 140,0.1)' },

  patientSearchInput: { border: 'none', background: 'transparent', marginLeft: '12px', outline: 'none', width: '100%', color: '#087F8C', fontSize: '15px', fontWeight: '500' },

  clearSearchBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },

  patientDropdown: { position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', background: 'white', borderRadius: '12px', boxShadow: '0 8px 30px rgba(8, 127, 140,0.15)', border: '1px solid rgba(8, 127, 140,0.08)', zIndex: 100, overflow: 'hidden', maxHeight: '300px', overflowY: 'auto' },

  dropdownMessage: { padding: '15px 20px', color: '#666', fontSize: '14px', textAlign: 'center' },

  dropdownItem: { display: 'flex', alignItems: 'center', padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(8, 127, 140,0.05)', transition: 'background-color 0.2s' },

  patientAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(8, 127, 140,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', overflow: 'hidden', flexShrink: 0 },

  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },

  patientInfo: { display: 'flex', flexDirection: 'column' },

  patientNameText: { margin: 0, fontWeight: '600', fontSize: '14px', color: '#087F8C' },

  patientEmailText: { margin: 0, fontSize: '12px', color: '#666', marginTop: '2px' },

  titleSection: { marginBottom: '30px' },

  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#087F8C', margin: 0 },

  pageSubtitle: { fontSize: '14px', color: '#666', marginTop: '5px' },

  infoLabel: { fontSize: '11px', opacity: 0.6, margin: '0 0 5px 0' },

  infoVal: { fontSize: '15px', fontWeight: 'bold', margin: 0 },

  checkUpBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", border: "none", backgroundColor: "#10b981", color: "var(--ov-on-color, #fff)", fontWeight: "700", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", outline: "none" },

  leftPanel: { display: 'flex', flexDirection: 'column', gap: '25px' },

  sidePanel: { display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' },

  viewerCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '15px', padding: '25px', color: "var(--ov-on-color, #fff)" },

  viewerHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },

  sectionTitle: { fontSize: '16px', fontWeight: 'bold', margin: 0, color: "var(--ov-on-color, #fff)" },

  viewerActions: { display: 'flex', gap: '10px' },

  vBtn: { "--ov-on-color": "#087F8C", background: "var(--ov-on-wash, rgba(255,255,255,0.1))", border: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))", color: "var(--ov-on-color, #fff)", padding: '6px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },

  xrayImageArea: { height: '500px', background: "var(--ov-on-wash, rgba(255,255,255,0.02))", borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  uploadArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: "2px dashed var(--ov-on-line, rgba(255,255,255,0.2))", borderRadius: '12px', width: '90%', height: '90%', cursor: 'pointer', transition: 'background 0.2s' },

  simulatedXray: { width: '80%', height: '80%', backgroundColor: '#063E46', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 0 50px rgba(0,0,0,0.5)' },

  boundingBox: { position: 'absolute', border: '2px solid', zIndex: 5, borderRadius: '4px' },

  boxLabel: { position: 'absolute', top: '-22px', left: '-2px', color: "var(--ov-on-color, #fff)", fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' },

  scannerLine: { position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', backgroundColor: '#10b981', boxShadow: '0 0 15px #10b981', animation: 'scan 2s linear infinite' },

  insightsCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '15px', padding: '25px', color: "var(--ov-on-color, #fff)" },

  findingsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' },

  insightBox: { background: "var(--ov-on-wash, rgba(255,255,255,0.05))", borderRadius: '10px', padding: '15px', transition: 'all 0.3s' },

  insightText: { fontSize: '13px', margin: '0 0 12px 0', lineHeight: '1.4', color: "var(--ov-on-color, #fff)" },

  confBadge: { fontSize: '10px', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold', color: "var(--ov-on-color, #fff)" },

  toggleBtn: { "--ov-on-color": "#087F8C", background: "var(--ov-on-wash, rgba(255,255,255,0.1))", border: 'none', color: "var(--ov-on-color, #fff)", fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' },

  actionBtnCheck: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex' },

  actionBtnCross: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex' },

  notesCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '15px', padding: '25px', color: "var(--ov-on-color, #fff)", display: 'flex', flexDirection: 'column', flex: 1 },

  textarea: { width: '100%', flex: 1, minHeight: '300px', background: "var(--ov-on-wash, rgba(255,255,255,0.05))", border: 'none', borderRadius: '10px', padding: '15px', color: "var(--ov-on-color, #fff)", marginTop: '15px', outline: 'none', resize: 'none', boxSizing: 'border-box' },

  saveBtn: { width: '100%', marginTop: '15px', padding: '12px', background: 'white', color: '#087F8C', border: 'none', borderRadius: '10px', fontWeight: 'bold', transition: 'opacity 0.2s' },

  loadingSpinner: { border: "4px solid var(--ov-on-line, rgba(255,255,255,0.1))", width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#10b981', animation: 'spin 1s linear infinite' },

  insightImageContainer: { position: 'relative', width: '80%', height: '400px', margin: '0 auto 20px auto', backgroundColor: '#063E46', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 0 50px rgba(0,0,0,0.5)' },

  insightImage: { width: '100%', height: '100%', objectFit: 'fill' },

  closePreviewBtn: { position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 },

  aiFindingsCard: { background: "var(--ov-on-wash, rgba(255,255,255,0.05))", borderLeft: '4px solid #10b981', borderRadius: '8px', padding: '15px', marginTop: '15px', marginBottom: '15px', maxHeight: '530px', overflowY: 'auto' },

  aiFindingsHeader: { margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' },

  aiFindingsText: { margin: 0, fontSize: '13px', lineHeight: '1.5', color: "var(--ov-on-color, #fff)" }

};



const styleSheet = document.createElement("style");

styleSheet.innerText = `

  * { box-sizing: border-box; }

  @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }

  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

  .ai-findings-scrollbar::-webkit-scrollbar { width: 6px; }

  .ai-findings-scrollbar::-webkit-scrollbar-track { background: transparent; }

  .ai-findings-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }

  .ai-findings-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

`;

document.head.appendChild(styleSheet);



export default DentistDiagnostics;