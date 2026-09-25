import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BrandMark from './BrandMark';
import BrandWordmark from './BrandWordmark';
import { 
  LayoutDashboard, Users, UserRound, Calendar, 
  Stethoscope, UserPlus, Settings, LogOut, ChevronLeft, ChevronRight, X, CreditCard,
  ActivitySquare
} from 'lucide-react';

const Sidebar = ({ onToggle, isMobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const user = JSON.parse(localStorage.getItem("user")) || { role: "" };
  const role = user.role.toLowerCase();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const collapsed = isMobile ? false : isCollapsed;

  useEffect(() => {
    onToggle(collapsed);
  }, [collapsed, onToggle]);

  const menuConfig = {
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20}/> },
      { name: 'Patient List', path: '/admin/patients', icon: <Users size={20}/> },
      { name: 'Dentist List', path: '/admin/dentists', icon: <UserRound size={20}/> },
      { name: 'Appointments', path: '/admin/appointments', icon: <Calendar size={20}/> },
      { name: 'Account Creation', path: '/admin/create-account', icon: <UserPlus size={20}/> },
      { name: 'Settings', path: '/admin/settings', icon: <Settings size={20}/> },
    ],
    staff: [
      { name: 'Dashboard', path: '/staff/dashboard', icon: <LayoutDashboard size={20}/> },
      { name: 'Patient List', path: '/staff/patients', icon: <Users size={20}/> },
      { name: 'Dentist List', path: '/staff/dentists', icon: <UserRound size={20}/> },
      { name: 'Appointments', path: '/staff/appointments', icon: <Calendar size={20}/> },
      { name: 'Billings', path: '/staff/billings', icon: <CreditCard size={20}/> },
      { name: 'Settings', path: '/staff/settings', icon: <Settings size={20}/> },
    ],
    dentist: [
      { name: 'Appointments', path: '/dentist/appointments', icon: <Calendar size={20}/> },
      { name: 'Dashboard', path: '/dentist/dashboard', icon: <LayoutDashboard size={20}/> },
      { name: 'Patient List', path: '/dentist/patients', icon: <Users size={20}/> },
      { name: 'Profile', path: '/dentist/profile', icon: <UserRound size={20}/> },
      { name: 'Diagnostics', path: '/dentist/diagnostics', icon: <Stethoscope size={20}/> },
      { name: 'Predictive Analytics', path: '/dentist/analytics', icon: <ActivitySquare size={20}/> },
      { name: 'Settings', path: '/dentist/settings', icon: <Settings size={20}/> },
    ]
  };

  const menuItems = menuConfig[role] || [];

  return (
    <div 
      style={{...styles.sidebar, width: collapsed ? '80px' : '260px'}} 
      className={`sidebar-container ${isMobileOpen ? 'sidebar-open' : ''}`}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        style={styles.toggleBtn}
        className="sidebar-desktop-toggle"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {isMobile && (
        <button 
          onClick={onMobileClose} 
          style={{
            position: 'absolute',
            right: '15px',
            top: '15px',
            background: 'none',
            border: 'none',
            color: "var(--ov-on-color, #fff)",
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      )}

      <div style={styles.logoSection}>
        {collapsed ? <BrandMark /> : <BrandWordmark />}
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button type="button" aria-current={isActive ? "page" : undefined} className="ov-nav-item"
              key={item.name} 
              onClick={() => {
                navigate(item.path);
                if (onMobileClose) onMobileClose();
              }}
              style={{
                ...styles.navItem,
                backgroundColor: isActive ? '#DDF6F8' : 'transparent',
                color: isActive ? '#087F8C' : '#526F77',
                justifyContent: collapsed ? 'center' : 'flex-start'
              }}
            >
              {item.icon}
              {!collapsed && <span style={styles.navText}>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      <div 
        style={styles.logoutSection} 
        onClick={() => { 
          localStorage.clear(); 
          window.location.href='/management'; 
          if (onMobileClose) onMobileClose();
        }}
      >
        <div style={{...styles.navItem, justifyContent: collapsed ? 'center' : 'flex-start', color: "var(--ov-on-color, #fff)"}}>
          <LogOut size={20} />
          {!collapsed && <span style={styles.navText}>Log Out</span>}
        </div>
      </div>
    </div>
  );
};

const styles = {
  sidebar: { "--ov-on-color": "var(--ov-ink)", height: '100vh', backgroundColor: "var(--ov-primary)", display: 'flex', flexDirection: 'column', position: 'fixed', transition: 'width 0.3s ease', zIndex: 1000 },
  toggleBtn: { position: 'absolute', right: '-12px', top: '35px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '50%', cursor: 'pointer', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoSection: { padding: '40px 20px', display: 'flex', alignItems: 'center', gap: '15px' },
  logoIcon: { width: '30px', height: '30px', backgroundColor: 'white', borderRadius: '8px' },
  logoText: { color: "var(--ov-on-color, #fff)", margin: 0, fontSize: '20px', fontWeight: 'bold' },
  nav: { flex: 1, padding: '0 15px' },
  navItem: { display: 'flex', alignItems: 'center', padding: '12px 15px', borderRadius: '10px 0 0 10px', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s', fontSize: '14px' },
  navText: { marginLeft: '12px', fontWeight: '500' },
  logoutSection: { padding: '20px 15px', borderTop: "1px solid var(--ov-on-line, rgba(255,255,255,0.1))" }
};

export default Sidebar;
