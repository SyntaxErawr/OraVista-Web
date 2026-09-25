import { readClinicUser } from '../../utils/clinicAppointments';
import { PortalSearch, RoleNotifications } from '../../components/ClinicPortalTools';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from '../../components/AdminLayout';
import {
  Search, User, AlertTriangle, CheckCircle2, RotateCw, ChevronLeft, ChevronRight
} from "lucide-react";

function StaffBookingPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ id: null, firstName: "Staff" });
  const availabilityVersion = useRef(0);
  const saving = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityKey, setAvailabilityKey] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // NEW: Dynamic Data States
  const [dentists, setDentists] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [bookingData, setBookingData] = useState({
    patientId: "",
    mainService: "",
    specificService: "",
    dentist: "",
    date: "",
    time: ""
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- Dynamic Month Viewer Logic ---
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date());

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const currentMonthName = viewDate.toLocaleString('default', { month: 'long' });

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // --- Generate 3-Month Schedule ---
  const generateWeekdaySchedule = () => {
    const schedule = [];
    const startMonth = today.getMonth();

    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(today.getFullYear(), startMonth + i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const daysInThisMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInThisMonth; day++) {
        const date = new Date(year, month, day);
        if (date >= new Date(today.setHours(0, 0, 0, 0))) {
          schedule.push(formatDate(date));
        }
      }
    }
    return schedule;
  };

  const mockSchedule = generateWeekdaySchedule();

  // UPDATED: Services Data with Pricing
  const servicesData = {
    "General Dentistry": [
      { name: "Oral Prophylaxis", price: 1500, duration: "(30 mins)" },
      { name: "Restoration", price: 1200, duration: "(1hr)" },
      { name: "Extraction", price: 1000, duration: "(1hr)" }
    ],
    "Orthodontics": [
      { name: "Braces Installation", price: 35000, duration: "(1hr)" },
      { name: "Braces Adjustment", price: 1000, duration: "(30 mins)" },
      { name: "Veneers", price: 15000, duration: "(2hrs)" }
    ],
    "Restorative Treatment": [
      { name: "Root Canal (RCT)", price: 8000, duration: "(2hrs)" },
      { name: "Wisdom Tooth Surgery", price: 10000, duration: "(3hrs)" },
      { name: "Dentures", price: 5000, duration: "(30 mins)" },
      { name: "Fixed Bridge", price: 12000, duration: "(2hrs)" },
      { name: "Teeth Whitening", price: 7000, duration: "(1hr 30mins)" }
    ]
  };

  // NEW: Fetch Dentists & Branches Dynamically
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/dentists');
        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) throw new Error('Unable to load dentists. Reload the page to try again.');
        const formattedDentists = data.map(d => ({
          name: `Dr. ${d.first_name} ${d.last_name}`,
          branch: d.branch || "Main Branch",
          available: d.status !== 'Off Duty',
          schedule: mockSchedule
        }));

        setDentists(formattedDentists);

        // Extract unique branches
        const uniqueBranches = [...new Set(formattedDentists.map(d => d.branch))];
        setBranches(uniqueBranches);
      } catch (err) {
        setAvailabilityError(err.message || 'Unable to load booking options. Reload the page to try again.');
      }
    };
    fetchBookingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDentists = dentists.filter(d => d.branch === selectedBranch);

  const generateTimeSlots = (service, selectedDate) => {
    if (!selectedDate) return [];
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay();
    const slots = ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"];
    if (dayOfWeek === 0) slots.push("05:00 PM");
    return slots;
  };

  const loadUser = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({ id: user.id, firstName: user.firstName || "Staff" });
    }
  }, []);

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${modifier}`;
  };

  // UPDATED: Finds duration using objects
  const getDurationFromService = (serviceName) => {
    if (!serviceName) return 30;
    for (const key in servicesData) {
      const svc = servicesData[key].find(s => s.name === serviceName || `${s.name} ${s.duration}` === serviceName);
      if (svc) {
        const text = svc.duration.toLowerCase().replace(/[()]/g, '');
        if (text.includes('hr') && text.includes('30mins')) return 90;
        if (text.includes('hr')) return parseFloat(text) * 60;
        if (text.includes('min')) return parseFloat(text);
      }
    }
    const durationMatch = serviceName.match(/\(([^)]+)\)/);
    if (!durationMatch) return 30;
    const text = durationMatch[1].toLowerCase();
    if (text.includes('hr') && text.includes('30mins')) return 90;
    if (text.includes('hr')) return parseFloat(text) * 60;
    if (text.includes('min')) return parseFloat(text);
    return 30;
  };

  // NEW: Find price for the currently selected service
  const getSelectedServicePrice = () => {
    if (!bookingData.mainService || !bookingData.specificService) return 0;
    const svc = servicesData[bookingData.mainService].find(s => s.name === bookingData.specificService);
    return svc ? svc.price : 0;
  };

  const selectedServicePrice = getSelectedServicePrice();

  const fetchBookedSlots = useCallback(async () => {
    const version = ++availabilityVersion.current;
    setAvailabilityKey('');
    if (!bookingData.date || !bookingData.dentist) { setIsRefreshing(false); return; }
    setIsRefreshing(true);
    setAvailabilityError('');
    try {
      const response = await fetch(
        `https://oravista-server-474976105474.asia-southeast1.run.app/api/appointments/check-availability?date=${bookingData.date}&dentist=${encodeURIComponent(bookingData.dentist)}`
      );
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) throw new Error('Unable to check availability. Refresh before booking.');
      const allOccupiedMinutes = [];
      data.forEach(app => {
        const start = timeToMinutes(app.time);
        const duration = getDurationFromService(app.service);
        for (let i = 0; i < duration; i += 30) {
          allOccupiedMinutes.push(start + i);
        }
      });
      if (version === availabilityVersion.current) {
        setBookedSlots(allOccupiedMinutes);
        setAvailabilityKey(`${bookingData.dentist}|${bookingData.date}`);
      }
    } catch (error) {
      if (version === availabilityVersion.current) setAvailabilityError(error.message || 'Unable to check availability. Please refresh.');
    } finally {
      if (version === availabilityVersion.current) setIsRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.date, bookingData.dentist]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => { fetchBookedSlots(); }, [fetchBookedSlots]);

  const handleDiscard = () => {
    setBookingData({ patientId: "", mainService: "", specificService: "", dentist: "", date: "", time: "" });
    setSelectedBranch("");
  };

  const handleFinalSubmit = async () => {
    if (saving.current || !canBook) return;
    saving.current = true;
    setIsSubmitting(true);
    setBookingError('');
    const appointmentData = {
      user_id: bookingData.patientId.trim(),
      service_type: bookingData.specificService,
      dentist_name: bookingData.dentist,
      appointment_date: bookingData.date,
      appointment_time: bookingData.time,
      amount: selectedServicePrice, // Added to reflect price tracking
      branch: selectedBranch        // Added to reflect correct branch
    };

    try {
      const response = await fetch("https://oravista-server-474976105474.asia-southeast1.run.app/api/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Unable to save the booking. Please try again.');
      if (response.ok) {
        window.dispatchEvent(new Event('oravista:appointments-updated'));
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        handleDiscard();
        fetchBookedSlots();
      }
    } catch (error) {
      setBookingError(error.message || 'Unable to save the booking. Please try again.');
    } finally { saving.current = false; setIsSubmitting(false); }
  };

  const currentDentist = filteredDentists.find(d => d.name === bookingData.dentist);
  const timeSlots = generateTimeSlots(bookingData.specificService, bookingData.date);

  const selectedDuration = bookingData.specificService ? getDurationFromService(bookingData.specificService) : 0;
  const startTimeMins = timeToMinutes(bookingData.time);
  const endTimeStr = minutesToTime(startTimeMins + selectedDuration);

  const slotUnavailable = time => {
    const start = timeToMinutes(time);
    return Array.from({ length: Math.ceil(Math.max(selectedDuration, 30) / 30) }, (_, i) => start + i * 30).some(minute => bookedSlots.includes(minute));
  };
  const canBook = Boolean(bookingData.patientId.trim() && selectedBranch && bookingData.mainService && bookingData.specificService && currentDentist?.available && currentDentist.schedule.includes(bookingData.date) && bookingData.time && !slotUnavailable(bookingData.time) && !isRefreshing && !availabilityError && availabilityKey === `${bookingData.dentist}|${bookingData.date}`);

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* HEADER */}
        <header className="ov-header" style={styles.header}>
          <div style={styles.searchBox}>
            <Search size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
            <PortalSearch style={styles.searchInput} />
          </div>
          <div style={styles.headerActions}>
            <RoleNotifications />

            <div style={styles.profile}>
              <div style={styles.profileText}>
                <p style={styles.userName}>{userData.firstName}</p>
                <p style={styles.userRole}>{readClinicUser().role}</p>
              </div>
              <div style={styles.avatar}><User size={20} color="#087F8C" /></div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="ov-workspace-content" style={styles.content}>
          <div style={styles.titleSection}>
            <h1 style={styles.pageTitle}>Book Appointment</h1>
            <p style={styles.pageSubtitle}>Schedule a new visit on behalf of a patient</p>
          </div>

          <div style={{ backgroundColor: "#EAF5F6", borderRadius: "20px", padding: "clamp(16px, 3vw, 40px)" }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "20px", marginBottom: "40px" }}>
              <div>
                <label style={{ color: "#087F8C", fontWeight: "700", marginBottom: "10px", display: "block" }}>Patient ID</label>
                <input
                  type="text"
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  placeholder="e.g. 1" aria-label="Patient ID"
                  value={bookingData.patientId}
                  onChange={(e) => setBookingData({ ...bookingData, patientId: e.target.value })}
                />
              </div>

              <div>
                <label style={{ color: "#087F8C", fontWeight: "700", marginBottom: "10px", display: "block" }}>Select Branch</label>
                <select aria-label="Branch" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc" }} value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setBookingData({ ...bookingData, dentist: "", date: "", time: "" }); }}>
                  <option value="">Choose Branch</option>
                  {branches.map((b, index) => <option key={index} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: "#087F8C", fontWeight: "700", marginBottom: "10px", display: "block" }}>Services</label>
                <select aria-label="Service" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc" }} value={bookingData.mainService} onChange={(e) => setBookingData({ ...bookingData, mainService: e.target.value, specificService: "" })}>
                  <option value="">Select Service</option>
                  {Object.keys(servicesData).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: "#087F8C", fontWeight: "700", marginBottom: "10px", display: "block" }}>Dentist</label>
                <select aria-label="Dentist" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc" }} value={bookingData.dentist} onChange={(e) => setBookingData({ ...bookingData, dentist: e.target.value, date: "", time: "" })} disabled={!selectedBranch}>
                  <option value="">Select Dentist</option>
                  {filteredDentists.length > 0 ? (
                    filteredDentists.map(d => <option key={d.name} value={d.name} disabled={!d.available}>{d.name}</option>)
                  ) : (
                    <option disabled>No dentists for branch</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ color: "#087F8C", fontWeight: "700", marginBottom: "10px", display: "block" }}>Slot Date</label>
                <select aria-label="Date" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc" }} value={bookingData.date} onChange={(e) => setBookingData({ ...bookingData, date: e.target.value, time: "" })} disabled={!bookingData.dentist}>
                  <option value="">Select Date</option>
                  {currentDentist?.schedule.map(date => <option key={date} value={date}>{date}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "30px" }}>
              <div>
                <label style={{ color: "#087F8C", fontWeight: "700", marginBottom: "10px", display: "block" }}>Choose Type</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {bookingData.mainService && servicesData[bookingData.mainService].map(type => (
                    <button key={type.name} onClick={() => setBookingData({ ...bookingData, specificService: type.name })}
                      style={{ "--ov-on-color": "var(--ov-ink)",
                        padding: "15px", borderRadius: "12px", border: "none", textAlign: "left", cursor: "pointer", fontWeight: "600",
                        backgroundColor: bookingData.specificService === type.name ? "var(--ov-primary)" : "#EEF7F8",
                        color: bookingData.specificService === type.name ? "var(--ov-ink)" : "#087F8C",
                        display: "flex", justifyContent: "space-between"
                      }}>
                      <span>{type.name} {type.duration}</span>
                      <span>₱{type.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: "#087F8C", fontWeight: "700", marginBottom: "10px", display: "block" }}>Dentist Schedule</label>
                <div style={{ backgroundColor: "white", borderRadius: "15px", padding: "15px", border: "1px solid #ddd", width: "100%", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <button onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "#087F8C" }}><ChevronLeft size={18} /></button>
                    <p style={{ fontWeight: "800", textAlign: "center", margin: 0, fontSize: "14px" }}>{currentMonthName} {currentYear}</p>
                    <button onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "#087F8C" }}><ChevronRight size={18} /></button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center" }}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, index) => <div key={index} style={{ fontWeight: "700", fontSize: "11px", paddingBottom: "5px" }}>{d}</div>)}
                    {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`}></div>)}
                    {[...Array(daysInMonth)].map((_, i) => {
                      const currentDayDate = new Date(currentYear, currentMonth, i + 1);
                      const dayStr = formatDate(currentDayDate);
                      const isAvailable = currentDentist?.schedule.includes(dayStr);
                      const isSelected = bookingData.date === dayStr;
                      return (
                        <button type="button" className="ov-booking-day" disabled={!isAvailable} aria-pressed={isSelected} aria-label={dayStr} key={i} onClick={() => isAvailable && setBookingData({ ...bookingData, date: dayStr, time: "" })}
                          style={{ "--ov-on-color": "var(--ov-ink)",
                            border: "none", padding: "8px 0", borderRadius: "6px", fontSize: "12px", cursor: isAvailable ? "pointer" : "default",
                            backgroundColor: isSelected ? "var(--ov-primary)" : (isAvailable ? "#EAF5F6" : "transparent"),
                            color: isSelected ? "var(--ov-ink)" : (isAvailable ? "#087F8C" : "#476675")
                          }}>
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ color: "#087F8C", fontWeight: "700", margin: 0 }}>Choose Time</label>
                  <button
                    onClick={fetchBookedSlots}
                    disabled={!bookingData.date || !bookingData.dentist || isRefreshing}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#087F8C", fontSize: "12px", fontWeight: "600" }}
                  >
                    <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {bookingData.date ? timeSlots.map(t => {
                    const isTaken = slotUnavailable(t);
                    return (
                      <button key={t}
                        onClick={() => !isTaken && setBookingData({ ...bookingData, time: t })}
                        disabled={isTaken || isRefreshing || Boolean(availabilityError) || availabilityKey !== `${bookingData.dentist}|${bookingData.date}`}
                        style={{ "--ov-on-color": "var(--ov-ink)",
                          padding: "12px", borderRadius: "10px", border: "none", fontWeight: "600",
                          cursor: isTaken ? "not-allowed" : "pointer",
                          backgroundColor: isTaken ? "#ccc" : (bookingData.time === t ? "var(--ov-primary)" : "white"),
                          color: isTaken ? "#888" : (bookingData.time === t ? "var(--ov-ink)" : "#087F8C"),
                          opacity: isTaken ? 0.6 : 1
                        }}>
                        {t} {isTaken && "(Occupied)"}
                      </button>
                    );
                  }) : <p style={{ fontSize: "12px", color: "#666" }}>Please select a date first.</p>}
                </div>
              </div>
            </div>

            {availabilityError && <p className="ov-inline-error" role="alert">{availabilityError}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", marginTop: "40px" }}>
              <button onClick={handleDiscard} style={{ padding: "12px 30px", borderRadius: "10px", border: "none", backgroundColor: "#ff4d4d", color: "var(--ov-on-color, #fff)", fontWeight: "700", cursor: "pointer" }}>Clear Fields</button>
              <button onClick={() => setShowConfirmModal(true)} disabled={!canBook || isSubmitting}
                style={{ padding: "12px 30px", borderRadius: "10px", border: "none", backgroundColor: "#28a745", color: "var(--ov-on-color, #fff)", fontWeight: "700", cursor: "pointer", opacity: !bookingData.time ? 0.6 : 1 }}>
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showConfirmModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "20px", textAlign: "center", width: "min(400px, 94vw)" }}>
            <AlertTriangle size={50} color="#087F8C" style={{ marginBottom: "15px", margin: "0 auto" }} />
            <h3 style={{ color: "#087F8C", fontWeight: "800", marginBottom: "5px" }}>Confirm Appointment?</h3>
            {bookingError && <p className="ov-inline-error" role="alert">{bookingError}</p>}
            <div style={{ borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "15px 0", margin: "15px 0", textAlign: "left" }}>
              <p style={{ fontSize: "14px", margin: "5px 0" }}><strong>Patient ID:</strong> {bookingData.patientId}</p>
              <p style={{ fontSize: "14px", margin: "5px 0" }}><strong>Branch:</strong> {selectedBranch}</p>
              <p style={{ fontSize: "14px", margin: "5px 0" }}><strong>Service:</strong> {bookingData.specificService}</p>
              <p style={{ fontSize: "14px", margin: "5px 0" }}><strong>Dentist:</strong> {bookingData.dentist}</p>
              <p style={{ fontSize: "14px", margin: "5px 0" }}><strong>Date:</strong> {bookingData.date}</p>
              <p style={{ fontSize: "14px", margin: "5px 0" }}><strong>Time:</strong> {bookingData.time} - {endTimeStr}</p>
              <p style={{ fontSize: "15px", margin: "10px 0 0 0", color: "#28a745", fontWeight: "800" }}><strong>Base Price:</strong> ₱{selectedServicePrice.toLocaleString()}</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button disabled={isSubmitting} onClick={() => setShowConfirmModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #ccc", cursor: "pointer", background: "white" }}>Cancel</button>
              <button onClick={handleFinalSubmit} disabled={!canBook || isSubmitting} style={{ "--ov-on-color": "var(--ov-ink)", flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", cursor: "pointer" }}>{isSubmitting ? 'Saving...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2100 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "20px", textAlign: "center", width: "min(400px, 94vw)" }}>
            <CheckCircle2 size={50} color="#28a745" style={{ marginBottom: "15px", margin: "0 auto" }} />
            <h3 style={{ color: "#087F8C", fontWeight: "800" }}>Appointment Booked!</h3>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/${readClinicUser().role || 'staff'}/appointments`);
              }}
              style={{ "--ov-on-color": "var(--ov-ink)", width: "100%", padding: "12px", borderRadius: "10px", border: "none", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", cursor: "pointer", marginTop: "15px" }}
            >
              Return to Schedule
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </AdminLayout>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', width: '100%' },
  header: { "--ov-on-color": "var(--ov-ink)", height: '80px', background: "var(--ov-primary)", display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 },
  searchBox: { display: 'flex', alignItems: 'center', background: "var(--ov-on-wash, rgba(255,255,255,0.1))", padding: '10px 20px', borderRadius: '12px', width: '350px' },
  searchInput: { border: 'none', background: 'transparent', marginLeft: '10px', outline: 'none', width: '100%', color: "var(--ov-on-color, #fff)" },
  headerActions: { display: 'flex', alignItems: 'center', gap: '25px' },
  profile: { display: 'flex', alignItems: 'center', gap: '15px', borderLeft: "1px solid var(--ov-on-line, rgba(255,255,255,0.2))", paddingLeft: '20px' },
  profileText: { textAlign: 'right' },
  userName: { margin: 0, fontWeight: 'bold', fontSize: '14px', color: "var(--ov-on-color, #fff)" },
  userRole: { margin: 0, fontSize: '12px', color: "var(--ov-on-muted, rgba(255,255,255,0.75))" },
  avatar: { width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content: { padding: '40px', backgroundColor: '#F3F9FA', minHeight: 'calc(100vh - 80px)' },
  titleSection: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#087F8C', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#666', marginTop: '5px' }
};

export default StaffBookingPage;