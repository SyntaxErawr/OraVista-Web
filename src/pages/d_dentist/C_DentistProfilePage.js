import { PortalSearch, RoleNotifications } from '../../components/ClinicPortalTools';
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, User, ChevronDown, ChevronUp } from 'lucide-react';

function DentistProfile() {
  const [dentistData, setDentistData] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    const fetchDentistProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const dentistId = user?.id;

        if (!dentistId) return;

        const response = await fetch(`https://oravista-server-474976105474.asia-southeast1.run.app/api/dentist-profile/${dentistId}`);
        const data = await response.json();

        setDentistData(data.profile);
        setAssignedPatients(data.patients || []);
        setSchedule(data.schedule || []);
      } catch (err) {
        console.error("Error fetching dentist profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDentistProfile();
  }, []);

  return (
    <AdminLayout>
      <style>
        {`
          .dp-container { display: flex; flex-direction: column; width: 100%; font-family: sans-serif; }
          .dp-header { height: 80px; background: #087F8C; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; position: sticky; top: 0; z-index: 10; }

          .dp-search-wrapper { display: flex; align-items: center; }
          .dp-search-box { display: flex; align-items: center; background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 12px; width: 350px; transition: all 0.3s ease; box-sizing: border-box; }
          .dp-search-icon { flex-shrink: 0; }
          .dp-search-input { border: none; background: transparent; margin-left: 10px; outline: none; width: 100%; color: var(--ov-on-color, #fff); }
          .dp-search-input::placeholder { color: var(--ov-on-muted, rgba(255,255,255,0.75)); }
          .dp-mobile-toggle { display: none; }

          .dp-header-actions { display: flex; align-items: center; gap: 25px; margin-left: auto; }
          .dp-profile { display: flex; align-items: center; gap: 15px; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 20px; }
          .dp-profile-text { text-align: right; }
          .dp-user-name { margin: 0; font-weight: bold; font-size: 14px; color: var(--ov-on-color, #fff); }
          .dp-user-role { margin: 0; font-size: 12px; color: var(--ov-on-muted, rgba(255,255,255,0.75)); }
          .dp-avatar { width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

          .dp-content { padding: 30px; background-color: #F3F9FA; min-height: calc(100vh - 80px); }
          .dp-page-header { margin-bottom: 30px; }
          .dp-page-title { font-size: 24px; font-weight: bold; color: #333; margin: 0; }
          .dp-page-subtitle { font-size: 14px; color: #666; margin-top: 5px; }

          .dp-dashboard-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 25px; align-items: start; }
          .dp-card { background-color: #087F8C; border-radius: 15px; padding: 30px; color: var(--ov-on-color, #fff); }

          .dp-profile-top { text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 25px; margin-bottom: 25px; }
          .dp-avatar-large { width: 100px; height: 100px; border-radius: 50%; background: #E8F6F7; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
          .dp-dentist-name { font-size: 18px; font-weight: bold; margin: 0; }
          .dp-dentist-id { font-size: 12px; opacity: 0.6; margin: 5px 0; }
          .dp-dentist-service { font-size: 14px; margin: 10px 0; }
          .dp-active-badge { background: rgba(255,255,255,0.1); padding: 4px 15px; border-radius: 20px; font-size: 11px; display: inline-block; }
          .dp-profile-bottom { display: flex; flex-direction: column; gap: 15px; }
          .dp-contact-item { display: flex; flex-direction: column; }
          .dp-contact-label { font-size: 11px; opacity: 0.6; margin: 0; }
          .dp-contact-value { font-size: 13px; margin: 3px 0; }

          .dp-card-title { font-size: 16px; font-weight: bold; margin-bottom: 25px; margin-top: 0; }
          .dp-table-container { overflow-x: auto; }
          .dp-table { width: 100%; border-collapse: collapse; min-width: 450px; }
          .dp-th { text-align: left; font-size: 11px; opacity: 0.6; padding-bottom: 15px; font-weight: normal; }
          .dp-td { font-size: 12px; padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.05); }
          .dp-view-btn { background: white; color: #087F8C; border: none; padding: 5px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }

          .dp-summary-item { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 15px; }
          .dp-summary-label { font-size: 11px; opacity: 0.6; margin: 0; }
          .dp-summary-value { font-size: 22px; font-weight: bold; margin: 5px 0 0 0; }

          .dp-schedule-list { display: flex; flex-direction: column; }
          .dp-schedule-row { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 15px; display: flex; align-items: center; gap: 20px; }
          .dp-schedule-time { font-size: 13px; font-weight: bold; width: 80px; flex-shrink: 0; }
          .dp-schedule-info { display: flex; flex-direction: column; }
          .dp-schedule-patient { font-size: 13px; font-weight: bold; margin: 0; }
          .dp-schedule-case { font-size: 11px; opacity: 0.6; margin: 3px 0 0 0; }

          /* Responsive Mobile View */
          @media (max-width: 768px) {
            .dp-header { padding: 0 20px; justify-content: flex-end; position: relative; }

            .dp-search-wrapper { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); z-index: 20; }
            .dp-search-box { width: 44px; height: 44px; padding: 0; justify-content: center; cursor: pointer; }
            .dp-search-box.expanded { width: calc(100vw - 40px); background: #066875; border: 1px solid rgba(255,255,255,0.2); padding: 0 15px; justify-content: space-between; }

            .dp-search-input { display: none; }
            .dp-search-box.expanded .dp-search-input { display: block; }

            .dp-search-box:not(.expanded) .dp-search-icon { display: none; }

            .dp-mobile-toggle { display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--ov-on-color, #fff); padding: 0; cursor: pointer; }
            .dp-search-box.expanded .dp-mobile-toggle { margin-left: 10px; }

            .dp-header-actions { gap: 15px; transition: opacity 0.3s ease; }
            .dp-header-actions.hidden { opacity: 0; pointer-events: none; }

            .dp-profile { padding-left: 15px; gap: 10px; border-left: none; }
            .dp-profile-text { display: none; }

            .dp-content { padding: 10px; }
            .dp-dashboard-grid { grid-template-columns: 1fr; gap: 10px; }

            .dp-card { padding: 10px; border-radius: 12px; }

            .dp-avatar-large { width: 70px; height: 70px; margin-bottom: 12px; }
            .dp-dentist-name { font-size: 15px; }
            .dp-dentist-service { font-size: 12px; }

            .dp-profile-top { padding-bottom: 16px; margin-bottom: 16px; }
            .dp-profile-bottom { gap: 10px; }

            .dp-summary-item { padding: 14px; border-radius: 10px; margin-bottom: 10px; }
            .dp-summary-value { font-size: 18px; }

            .dp-schedule-row { padding: 14px; gap: 12px; margin-bottom: 10px; border-radius: 10px; }
            .dp-schedule-time { font-size: 12px; width: 65px; }
            .dp-schedule-patient { font-size: 12px; }

            .dp-table { min-width: 360px; }
            .dp-td { padding: 10px 0; }
            .dp-view-btn { padding: 4px 10px; }
          }
        `}
      </style>

      <div className="dp-container">
        {/* HEADER */}
        <header className="dp-header">
          <div className="dp-search-wrapper">
            <div className={`dp-search-box ${isSearchExpanded ? 'expanded' : ''}`}>
              <Search className="dp-search-icon" size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
              <PortalSearch className="dp-search-input" />
              <button 
                className="dp-mobile-toggle" 
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              >
                {isSearchExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          <div className={`dp-header-actions ${isSearchExpanded ? 'hidden' : ''}`}>
            <RoleNotifications />

            <div className="dp-profile">
              <div className="dp-profile-text">
                <p className="dp-user-name">{dentistData ? `Dr. ${dentistData.last_name}` : 'Loading...'}</p>
                <p className="dp-user-role">Dentist</p>
              </div>
              <div className="dp-avatar">
                <User size={20} color="#087F8C" />
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="dp-content">
          <div className="dp-page-header">
            <h1 className="dp-page-title">Dentist Profile</h1>
            <p className="dp-page-subtitle">Detailed information and performance overview</p>
          </div>

          {loading ? (
            <p style={{ color: '#087F8C' }}>Loading data from database...</p>
          ) : (
            <div className="dp-dashboard-grid">
              {/* CARD 1: PROFILE */}
              <div className="dp-card">
                <div className="dp-profile-top">
                  <div className="dp-avatar-large">
                    <User size={50} color="#087F8C" />
                  </div>
                  <h2 className="dp-dentist-name">Dr. {dentistData?.first_name} {dentistData?.last_name}</h2>
                  <p className="dp-dentist-id">ID: DT-10{dentistData?.id}</p>
                  <p className="dp-dentist-service">{dentistData?.specialty}</p>
                  <span className="dp-active-badge">{dentistData?.status || 'Active'}</span>
                </div>
                <div className="dp-profile-bottom">
                  <div className="dp-contact-item">
                    <p className="dp-contact-label">Email</p>
                    <p className="dp-contact-value">{dentistData?.email}</p>
                  </div>
                  <div className="dp-contact-item">
                    <p className="dp-contact-label">Phone</p>
                    <p className="dp-contact-value">{dentistData?.phone || '+1 (555) 000-0000'}</p>
                  </div>
                </div>
              </div>

              {/* CARD 2: ASSIGNED PATIENTS */}
              <div className="dp-card">
                <h3 className="dp-card-title">Assigned Patients</h3>
                <div className="dp-table-container">
                  <table className="dp-table">
                    <thead>
                      <tr>
                        <th className="dp-th">Patient Name</th>
                        <th className="dp-th">Case Type</th>
                        <th className="dp-th">Last Visit</th>
                        <th className="dp-th">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedPatients.length > 0 ? assignedPatients.map((p, i) => (
                        <tr key={i}>
                          <td className="dp-td">{p.name}</td>
                          <td className="dp-td">{p.case_type}</td>
                          <td className="dp-td">{new Date(p.last_visit).toLocaleDateString()}</td>
                          <td className="dp-td">
                            <button className="dp-view-btn">View Profile</button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center', opacity: 0.5 }}>No assigned patients</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CARD 3: PERFORMANCE SUMMARY */}
              <div className="dp-card">
                <h3 className="dp-card-title">Performance Summary</h3>
                <div className="dp-summary-item">
                  <p className="dp-summary-label">Total Patients</p>
                  <p className="dp-summary-value">{dentistData?.patient_count || 0}</p>
                </div>
                <div className="dp-summary-item">
                  <p className="dp-summary-label">Procedures Completed</p>
                  <p className="dp-summary-value">{dentistData?.procedures_count || 0}</p>
                </div>
                <div className="dp-summary-item">
                  <p className="dp-summary-label">Upcoming Appointments</p>
                  <p className="dp-summary-value">{schedule.length}</p>
                </div>
              </div>

              {/* CARD 4: TODAY'S SCHEDULE */}
              <div className="dp-card">
                <h3 className="dp-card-title">Today's Schedule</h3>
                <div className="dp-schedule-list">
                  {schedule.length > 0 ? schedule.map((item, i) => (
                    <div key={i} className="dp-schedule-row">
                      <div className="dp-schedule-time">{item.time}</div>
                      <div className="dp-schedule-info">
                        <p className="dp-schedule-patient">{item.patientName}</p>
                        <p className="dp-schedule-case">{item.type || 'Consultation'}</p>
                      </div>
                    </div>
                  )) : (
                    <p style={{ opacity: 0.5, fontSize: '13px' }}>No appointments scheduled for today.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default DentistProfile;