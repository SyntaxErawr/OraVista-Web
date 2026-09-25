import BrandWordmark from "./BrandWordmark";
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { ClinicPortalProvider } from './ClinicPortalTools';

const AdminLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <ClinicPortalProvider><div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F3F9FA', flexDirection: 'column' }}>
      {/* Mobile Top Bar */}
      <header className="mobile-top-bar">
        <button 
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle Menu"
        >
          <Menu size={24} />
        </button>
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}><BrandWordmark /></span>
        <div style={{ width: '24px' }}></div> {/* Spacer to center name */}
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Backdrop Overlay */}
        <div 
          className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`} 
          onClick={() => setIsMobileOpen(false)}
        />

        <Sidebar 
          onToggle={(val) => setIsCollapsed(val)} 
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
        
        <main 
          className="admin-main-content"
          style={{ 
            marginLeft: isCollapsed ? '80px' : '260px', 
            flex: 1, 
            transition: 'margin-left 0.3s ease',
            height: '100vh',
            overflowY: 'auto' 
          }}
        >
          {children}
        </main>
      </div>
    </div></ClinicPortalProvider>
  );
};

export default AdminLayout;
