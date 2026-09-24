import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, Bell, MessageSquare, User, AlertCircle, CheckCircle2, X, ChevronDown, ChevronUp } from 'lucide-react';

function AdminAccountCreation() {
  const [accountType, setAccountType] = useState('dentist');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    email: '',
    password: 'TempPassword123!',
    branch: 'Gil Puyat, Pasay', // Added default branch
    specialty: 'General Dentistry' // Added default specialty
  });

  // Modal State
  const [modal, setModal] = useState({ show: false, type: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const closeModal = () => setModal({ show: false, type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom Validation Modal
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setModal({
        show: true,
        type: 'error',
        message: 'Missing Information: Please fill in all required fields marked with an asterisk.'
      });
      return;
    }

    try {
      // UPDATED: Pointing to the new Admin Create User endpoint
      const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: accountType,
          phone: formData.phone,
          dob: formData.dob,
          branch: formData.branch, // Added branch payload
          specialty: accountType === 'dentist' ? formData.specialty : null // Added specialty payload conditionally
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModal({
          show: true,
          type: 'success',
          message: `Success! The ${accountType} account has been created and a temporary password was generated.`
        });
        setFormData({ firstName: '', lastName: '', phone: '', dob: '', email: '', password: 'TempPassword123!', branch: 'Gil Puyat, Pasay', specialty: 'General Dentistry' });
      } else {
        setModal({ show: true, type: 'error', message: data.message || "Request Failed." });
      }
    } catch (err) {
      setModal({ show: true, type: 'error', message: "Connection Error: Could not reach the server." });
    }
  };

  return (
    <AdminLayout>
      <style>
        {`
          .aac-container { display: flex; flex-direction: column; width: 100%; font-family: sans-serif; }
          .aac-header { height: 80px; background: #087F8C; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; position: sticky; top: 0; z-index: 10; }
          
          .aac-search-wrapper { display: flex; align-items: center; }
          .aac-search-box { display: flex; align-items: center; background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 12px; width: 350px; transition: all 0.3s ease; box-sizing: border-box; }
          .aac-search-icon { flex-shrink: 0; }
          .aac-search-input { border: none; background: transparent; margin-left: 10px; outline: none; width: 100%; color: var(--ov-on-color, #fff); }
          .aac-search-input::placeholder { color: var(--ov-on-muted, rgba(255,255,255,0.75)); }
          .aac-mobile-toggle { display: none; }

          .aac-header-actions { display: flex; align-items: center; gap: 25px; margin-left: auto; }
          .aac-profile { display: flex; align-items: center; gap: 15px; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 20px; }
          .aac-profile-text { text-align: right; }
          .aac-user-name { margin: 0; font-weight: bold; font-size: 14px; color: var(--ov-on-color, #fff); }
          .aac-user-role { margin: 0; font-size: 12px; color: var(--ov-on-muted, rgba(255,255,255,0.75)); }
          .aac-avatar { width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

          .aac-content { padding: 40px; background-color: #F3F9FA; min-height: calc(100vh - 80px); }
          .aac-title-section { margin-bottom: 30px; }
          .aac-page-title { font-size: 28px; font-weight: 700; color: #087F8C; margin: 0; }
          .aac-page-subtitle { font-size: 14px; color: #666; margin-top: 5px; }

          .aac-form-card { background: #087F8C; padding: 30px; border-radius: 15px; color: var(--ov-on-color, #fff); margin-bottom: 30px; }
          .aac-field-label { font-size: 13px; font-weight: 600; margin-bottom: 10px; display: block; }
          .aac-field-label span { color: #ff4d4d; }
          
          .aac-type-toggle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .aac-type-option { padding: 20px; border-radius: 12px; cursor: pointer; text-align: center; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.2); background: transparent; }
          .aac-type-option.active { border: 2px solid white; background: rgba(255,255,255,0.1); }
          .aac-type-title { margin: 0 0 5px 0; font-size: 16px; font-weight: bold; }
          .aac-type-desc { margin: 0; font-size: 12px; opacity: 0.7; }

          .aac-section-heading { font-size: 18px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 20px; margin-top: 30px; }
          
          .aac-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .aac-input-group { display: flex; flex-direction: column; }
          .aac-input { padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: var(--ov-on-color, #fff); outline: none; appearance: auto; box-sizing: border-box; width: 100%; }
          .aac-email-input { width: calc(50% - 10px); }

          .aac-form-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 40px; }
          .aac-cancel-btn { padding: 10px 30px; border-radius: 8px; border: 1px solid white; background: transparent; color: var(--ov-on-color, #fff); font-weight: bold; cursor: pointer; transition: 0.2s; }
          .aac-cancel-btn:hover { background: rgba(255,255,255,0.1); }
          .aac-create-btn { padding: 10px 30px; border-radius: 8px; border: none; background: white; color: #087F8C; font-weight: bold; cursor: pointer; transition: 0.2s; }
          .aac-create-btn:hover { background: #f0f0f0; }

          .aac-guidelines-card { background: #087F8C; padding: 30px; border-radius: 15px; color: var(--ov-on-color, #fff); }
          .aac-guideline-list { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; opacity: 0.9; }
          .aac-guideline-list strong { color: var(--ov-on-color, #fff); opacity: 1; }

          /* MODAL STYLES */
          .aac-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; box-sizing: border-box; }
          .aac-modal-content { background-color: white; padding: 40px; border-radius: 20px; width: 400px; max-width: 100%; text-align: center; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.2); box-sizing: border-box; }
          .aac-modal-close { position: absolute; top: 15px; right: 15px; border: none; background: transparent; cursor: pointer; color: #666; }
          .aac-modal-title { font-size: 20px; font-weight: bold; margin: 20px 0 10px; color: #087F8C; }
          .aac-modal-text { font-size: 14px; color: #666; line-height: 1.5; margin-bottom: 25px; }
          .aac-modal-btn { width: 100%; padding: 12px; border-radius: 10px; border: none; background: #087F8C; color: var(--ov-on-color, #fff); font-weight: bold; cursor: pointer; }

          /* Responsive Mobile View */
          @media (max-width: 768px) {
            .aac-header { padding: 0 20px; justify-content: flex-end; position: relative; }
            
            .aac-search-wrapper { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); z-index: 20; }
            .aac-search-box { width: 44px; height: 44px; padding: 0; justify-content: center; cursor: pointer; }
            .aac-search-box.expanded { width: calc(100vw - 40px); background: #066875; border: 1px solid rgba(255,255,255,0.2); padding: 0 15px; justify-content: space-between; }
            
            .aac-search-input { display: none; }
            .aac-search-box.expanded .aac-search-input { display: block; }
            
            .aac-search-box:not(.expanded) .aac-search-icon { display: none; }
            
            .aac-mobile-toggle { display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--ov-on-color, #fff); padding: 0; cursor: pointer; }
            .aac-search-box.expanded .aac-mobile-toggle { margin-left: 10px; }

            .aac-header-actions { gap: 15px; transition: opacity 0.3s ease; }
            .aac-header-actions.hidden { opacity: 0; pointer-events: none; }
            
            .aac-profile { padding-left: 15px; gap: 10px; border-left: none; }
            .aac-profile-text { display: none; }
            
            .aac-content { padding: 20px; }
            .aac-form-card, .aac-guidelines-card { padding: 20px; }
            
            .aac-type-toggle-grid { grid-template-columns: 1fr; gap: 15px; }
            .aac-form-grid { grid-template-columns: 1fr; gap: 15px; }
            
            .aac-email-input { width: 100%; }
            
            .aac-form-actions { flex-direction: column; width: 100%; gap: 10px; }
            .aac-cancel-btn, .aac-create-btn { width: 100%; text-align: center; }
            
            .aac-modal-content { padding: 30px 20px; }
          }
        `}
      </style>

      <div className="aac-container">
        {/* MODAL OVERLAY */}
        {modal.show && (
          <div className="aac-modal-overlay">
            <div className="aac-modal-content">
              <button onClick={closeModal} className="aac-modal-close"><X size={20} /></button>
              {modal.type === 'success' ? <CheckCircle2 size={48} color="#4ade80" /> : <AlertCircle size={48} color="#ff4d4d" />}
              <h3 className="aac-modal-title">{modal.type === 'success' ? 'Account Created' : 'Notice'}</h3>
              <p className="aac-modal-text">{modal.message}</p>
              <button onClick={closeModal} className="aac-modal-btn">Close</button>
            </div>
          </div>
        )}

        <header className="aac-header">
          <div className="aac-search-wrapper">
            <div className={`aac-search-box ${isSearchExpanded ? 'expanded' : ''}`}>
              <Search className="aac-search-icon" size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
              <input 
                type="text" 
                placeholder="Search patients, appointments..." 
                className="aac-search-input" 
              />
              <button 
                className="aac-mobile-toggle" 
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              >
                {isSearchExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
          
          <div className={`aac-header-actions ${isSearchExpanded ? 'hidden' : ''}`}>
            <Bell size={20} color="var(--ov-on-color, #fff)" />
            <MessageSquare size={20} color="var(--ov-on-color, #fff)" />
            <div className="aac-profile">
              <div className="aac-profile-text">
                <p className="aac-user-name">Admin User</p>
                <p className="aac-user-role">Administrator</p>
              </div>
              <div className="aac-avatar"><User size={20} color="#087F8C" /></div>
            </div>
          </div>
        </header>

        <div className="aac-content">
          <div className="aac-title-section">
            <h1 className="aac-page-title">Account Creation</h1>
            <p className="aac-page-subtitle">Create new accounts for dentists or staff members</p>
          </div>

          <form className="aac-form-card" onSubmit={handleSubmit}>
            <p className="aac-field-label">Account Type <span>*</span></p>
            <div className="aac-type-toggle-grid">
              <div
                onClick={() => setAccountType('dentist')}
                className={`aac-type-option ${accountType === 'dentist' ? 'active' : ''}`}
              >
                <p className="aac-type-title">Dentist</p>
                <p className="aac-type-desc">Medical professional account</p>
              </div>
              <div
                onClick={() => setAccountType('staff')}
                className={`aac-type-option ${accountType === 'staff' ? 'active' : ''}`}
              >
                <p className="aac-type-title">Receptionist/Staff</p>
                <p className="aac-type-desc">Limited access for front desk tasks</p>
              </div>
            </div>

            <h3 className="aac-section-heading">Personal Information</h3>

            <div className="aac-form-grid">
              <div className="aac-input-group">
                <label className="aac-field-label">First Name <span>*</span></label>
                <input name="firstName" value={formData.firstName} onChange={handleInputChange} type="text" placeholder="Enter first name" className="aac-input" />
              </div>
              <div className="aac-input-group">
                <label className="aac-field-label">Last Name <span>*</span></label>
                <input name="lastName" value={formData.lastName} onChange={handleInputChange} type="text" placeholder="Enter last name" className="aac-input" />
              </div>
              <div className="aac-input-group">
                <label className="aac-field-label">Mobile Phone Number <span>*</span></label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} type="text" placeholder="(555) 123-4567" className="aac-input" />
              </div>
              <div className="aac-input-group">
                <label className="aac-field-label">Birth Date <span>*</span></label>
                <input name="dob" value={formData.dob} onChange={handleInputChange} type="date" className="aac-input" />
              </div>
            </div>

            <div className="aac-input-group" style={{ marginTop: '20px' }}>
              <label className="aac-field-label">Email Address <span>*</span></label>
              <input name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="email@example.com" className="aac-input aac-email-input" />
            </div>

            {/* Branch and Specialty Selection */}
            <div className="aac-form-grid" style={{ marginTop: '20px' }}>
              <div className="aac-input-group">
                <label className="aac-field-label">Branch Location <span>*</span></label>
                <select name="branch" value={formData.branch} onChange={handleInputChange} className="aac-input">
                  <option value="Main Branch">Main Branch</option>
                  <option value="Gil Puyat, Pasay">Gil Puyat, Pasay</option>
                  <option value="Sta. Ana, Manila">Sta. Ana, Manila</option>
                  <option value="Angeles, Pampanga">Angeles, Pampanga</option>
                </select>
              </div>

              {accountType === 'dentist' && (
                <div className="aac-input-group">
                  <label className="aac-field-label">Dental Specialty <span>*</span></label>
                  <select name="specialty" value={formData.specialty} onChange={handleInputChange} className="aac-input">
                    <option value="General Dentistry">General Dentistry</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Restorative Treatment">Restorative Treatment</option>
                  </select>
                </div>
              )}
            </div>

            <div className="aac-form-actions">
              <button type="button" className="aac-cancel-btn" onClick={() => setFormData({ firstName: '', lastName: '', phone: '', dob: '', email: '', password: 'TempPassword123!', branch: 'Gil Puyat, Pasay', specialty: 'General Dentistry' })}>Cancel</button>
              <button type="submit" className="aac-create-btn">Create Account</button>
            </div>
          </form>

          <div className="aac-guidelines-card">
            <h3 className="aac-section-heading" style={{ marginTop: 0 }}>Account Creation Guidelines</h3>
            <ul className="aac-guideline-list">
              <li>All fields marked with <span>*</span> are required</li>
              <li><strong>Dentist accounts:</strong> Full access to patient records, treatment plans, and medical documentation</li>
              <li><strong>Staff accounts:</strong> Limited access to appointment scheduling, patient registration, billing, and basic reports</li>
              <li>A temporary password will be sent to the provided email address</li>
              <li>New users must change their password on first login</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminAccountCreation;