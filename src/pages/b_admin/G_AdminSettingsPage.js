import { PortalSearch, RoleNotifications } from '../../components/ClinicPortalTools';
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Search, User, Shield, Lock, Briefcase, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

function AdminSettings() {
  // 1. Load User ID and Profile State
  const [adminId, setAdminId] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    // Grab the logged-in admin's data from localStorage on load
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setAdminId(user.id);
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, []);

  // 2. Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Real-time validation conditions
  const conditions = {
    length: newPassword.length >= 8,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword)
  };

  // 3. API Call: Update Profile
  const handleProfileUpdate = async () => {
    try {
      const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adminId,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
          // Sending empty strings for patient-specific fields so they don't break the SQL query
          sex: '', dob: '', age: '', occupation: '', blood_type: '', allergies: '', insurance: '', policy_number: ''
        })
      });

      if (response.ok) {
        alert("Profile updated successfully!");
        // Update local storage so the new name appears in the header
        const user = JSON.parse(localStorage.getItem("user"));
        localStorage.setItem("user", JSON.stringify({ ...user, firstName: profileData.firstName, lastName: profileData.lastName, email: profileData.email, phone: profileData.phone }));
        window.location.reload(); // Refresh to show changes
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      alert("Connection Error. Is the server running?");
    }
  };

  // 4. API Call: Update Password
  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      alert("Error: New passwords do not match!");
      return;
    }

    // Ensure all security requirements are met
    if (!conditions.length || !conditions.lowercase || !conditions.uppercase || !conditions.number || !conditions.special) {
      alert("Error: Please ensure the new password meets all security requirements.");
      return;
    }

    try {
      const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adminId,
          oldPassword: currentPassword,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Password changed successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data.message || "Failed to update password.");
      }
    } catch (err) {
      alert("Connection Error. Is the server running?");
    }
  };

  return (
    <AdminLayout>
      <div style={styles.container}>
        {/* HEADER */}
        <header style={styles.header} className="dashboard-page-header ov-header">
          <div style={styles.searchBox} className="header-search-box">
            <Search size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />
            <PortalSearch style={styles.searchInput} />
          </div>
          <div style={styles.headerActions} className="header-actions">
            <RoleNotifications />

            <div style={styles.profile} className="header-profile">
              <div style={styles.profileText} className="header-profile-text">
                <p style={styles.userName}>{profileData.firstName} {profileData.lastName}</p>
                <p style={styles.userRole}>Administrator</p>
              </div>
              <div style={styles.avatar}><User size={20} color="#087F8C" /></div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div style={styles.content} className="settings-content ov-workspace-content">
          <div style={styles.titleSection}>
            <h1 style={styles.pageTitle}>Settings</h1>
            <p style={styles.pageSubtitle}>Manage system preferences and configurations</p>
          </div>

          <div style={styles.mainGrid} className="settings-grid">
            {/* LEFT COLUMN: FORMS */}
            <div style={styles.leftCol}>
              {/* ACCOUNT SETTINGS CARD */}
              <div className="ov-panel" style={styles.formCard}>
                <div style={styles.cardHeader}>
                  <User size={18} style={{ marginRight: '10px' }} />
                  <h3 style={styles.cardTitle}>Account Settings</h3>
                </div>

                <div className="settings-form-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <button style={styles.saveBtn} onClick={handleProfileUpdate}>Save Changes</button>
              </div>

              {/* SECURITY CARD */}
              <div className="ov-panel" style={{ ...styles.formCard, marginTop: '25px' }}>
                <div style={styles.cardHeader}>
                  <Lock size={18} style={{ marginRight: '10px' }} />
                  <h3 style={styles.cardTitle}>Security</h3>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Current Password</label>
                  <div style={styles.inputWrapper}>
                    <input
                      type={showCurrent ? "text" : "password"}
                      placeholder="********"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={styles.input}
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                      {showCurrent ? <EyeOff size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" /> : <Eye size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />}
                    </button>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>New Password</label>
                  <div style={styles.inputWrapper}>
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="********"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={styles.input}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                      {showNew ? <EyeOff size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" /> : <Eye size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />}
                    </button>
                  </div>

                  {/* Real-time Validation UI */}
                  <div style={styles.validationContainer}>
                    <p style={{ ...styles.valItem, color: conditions.lowercase ? '#4ade80' : '#ff4d4d' }}>
                      {conditions.lowercase ? <CheckCircle2 size={12} /> : <XCircle size={12} />} At least one lowercase letter
                    </p>
                    <p style={{ ...styles.valItem, color: conditions.uppercase ? '#4ade80' : '#ff4d4d' }}>
                      {conditions.uppercase ? <CheckCircle2 size={12} /> : <XCircle size={12} />} At least one uppercase letter
                    </p>
                    <p style={{ ...styles.valItem, color: conditions.number ? '#4ade80' : '#ff4d4d' }}>
                      {conditions.number ? <CheckCircle2 size={12} /> : <XCircle size={12} />} At least one number
                    </p>
                    <p style={{ ...styles.valItem, color: conditions.special ? '#4ade80' : '#ff4d4d' }}>
                      {conditions.special ? <CheckCircle2 size={12} /> : <XCircle size={12} />} At least 1 special character
                    </p>
                    <p style={{ ...styles.valItem, color: conditions.length ? '#4ade80' : '#ff4d4d' }}>
                      {conditions.length ? <CheckCircle2 size={12} /> : <XCircle size={12} />} 8 characters minimum
                    </p>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm New Password</label>
                  <div style={styles.inputWrapper}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={styles.input}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                      {showConfirm ? <EyeOff size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" /> : <Eye size={18} color="var(--ov-on-muted, rgba(255,255,255,0.75))" />}
                    </button>
                  </div>
                </div>

                <button style={styles.saveBtn} onClick={handlePasswordUpdate}>Change Password</button>
              </div>
            </div>

            {/* RIGHT COLUMN: INFO CARDS */}
            <div style={styles.rightCol}>
              {/* ROLE-BASED ACCESS CARD */}
              <div className="ov-panel" style={styles.infoCard}>
                <div style={styles.cardHeader}>
                  <Shield size={18} style={{ marginRight: '10px' }} />
                  <h3 style={styles.cardTitle}>Role-Based Access</h3>
                </div>

                <div style={styles.roleBoxActive}>
                  <div style={styles.roleHeader}>
                    <Briefcase size={16} />
                    <p style={styles.roleName}>Clinic Owner (Current)</p>
                  </div>
                  <ul style={styles.roleList}>
                    <li>All system features</li>
                    <li>User management</li>
                    <li>Financial reports</li>
                    <li>System settings</li>
                  </ul>
                </div>

                <div style={styles.roleBoxInactive}>
                  <p style={styles.roleNameSmall}>Dentist</p>
                  <p style={styles.roleDesc}>Clinical tools, Patient records, Appointments</p>
                </div>

                <div style={styles.roleBoxInactive}>
                  <p style={styles.roleNameSmall}>Receptionist/Staff</p>
                  <p style={styles.roleDesc}>Billing, Scheduling, Patient registration</p>
                </div>
              </div>

              {/* CURRENT SESSION CARD */}
              <div className="ov-panel" style={{ ...styles.infoCard, marginTop: '25px' }}>
                <h3 style={{ ...styles.cardTitle, marginBottom: '15px' }}>Current Session</h3>
                <div style={styles.sessionItem}><p style={styles.sessionLabel}>Role</p><p style={styles.sessionVal}>Clinic Owner</p></div>
                <div style={styles.sessionItem}><p style={styles.sessionLabel}>Last Login</p><p style={styles.sessionVal}>Active Now</p></div>
                <div style={styles.sessionItem}><p style={styles.sessionLabel}>IP Address</p><p style={styles.sessionVal}>192.168.1.109</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

  content: { padding: '40px' },
  titleSection: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#087F8C', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#666', marginTop: '5px' },

  mainGrid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '25px' },
  formCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '15px', padding: '25px', color: "var(--ov-on-color, #fff)" },
  cardHeader: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: 'bold' },

  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '12px', marginBottom: '8px', opacity: 0.8 },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: { width: '100%', padding: '12px 45px 12px 12px', borderRadius: '8px', border: "1px solid var(--ov-on-line, rgba(255,255,255,0.1))", background: "var(--ov-on-wash, rgba(255,255,255,0.05))", color: "var(--ov-on-color, #fff)", outline: 'none', boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  saveBtn: { padding: '10px 25px', background: 'white', color: '#087F8C', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },

  validationContainer: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  valItem: { margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', transition: 'color 0.2s' },

  infoCard: { "--ov-on-color": "var(--ov-ink)", background: "var(--ov-primary)", borderRadius: '15px', padding: '25px', color: "var(--ov-on-color, #fff)" },
  roleBoxActive: { background: 'white', color: '#087F8C', borderRadius: '12px', padding: '15px', marginBottom: '15px' },
  roleHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  roleName: { margin: 0, fontWeight: 'bold', fontSize: '14px' },
  roleList: { margin: 0, paddingLeft: '20px', fontSize: '11px', lineHeight: '1.8' },

  roleBoxInactive: { background: "var(--ov-on-wash, rgba(255,255,255,0.05))", borderRadius: '12px', padding: '15px', marginBottom: '10px' },
  roleNameSmall: { margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' },
  roleDesc: { margin: 0, fontSize: '11px', opacity: 0.6 },

  sessionItem: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.05))", paddingBottom: '8px' },
  sessionLabel: { margin: 0, fontSize: '11px', opacity: 0.6 },
  sessionVal: { margin: 0, fontSize: '11px', fontWeight: '600' }
};

export default AdminSettings;