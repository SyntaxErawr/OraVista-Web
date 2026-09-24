import BrandWordmark from "./BrandWordmark";
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling on the body when the mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 🛑 CRITICAL FIX: Hide this global Navbar on the Landing Page ('/') 
  // This prevents the broken duplicate menu because LandingPage.js already has its own built-in navbar.
  if (location.pathname === '/') {
    return null;
  }

  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      textDecoration: 'none',
      fontSize: '18px',
      fontFamily: "'Manrope', sans-serif",
      color: '#087F8C',
      fontWeight: isActive ? '700' : '500',
      borderBottom: isActive ? '3px solid #087F8C' : '3px solid transparent',
      transition: 'all 0.3s ease',
      paddingBottom: '5px',
      width: 'max-content'
    };
  };

  return (
    <>
      {/* We use brand new "clean-nav" classes here to completely detach from the broken index.css rules */}
      <style>
        {`
          .clean-nav-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 3rem;
            width: 100%;
            box-sizing: border-box;
            position: absolute;
            top: 0;
            z-index: 2000;
            background-color: transparent;
          }

          .clean-nav-brand {
            font-size: 32px;
            font-weight: 700;
            color: #087F8C;
            text-decoration: none;
            font-family: 'Manrope', sans-serif;
            z-index: 2100;
          }

          .clean-nav-hamburger {
            display: none;
            background: none;
            border: none;
            cursor: pointer;
            color: #087F8C;
            z-index: 2100;
          }

          .clean-nav-menu {
            display: flex;
            align-items: center;
            gap: 40px;
            margin-left: auto;
          }

          .clean-nav-links-wrapper {
            display: flex;
            align-items: center;
            gap: 40px;
          }

          .clean-nav-profile {
            display: flex;
            align-items: center;
            gap: 15px;
            border-left: 2px solid rgba(8, 127, 140, 0.2);
            padding-left: 20px;
          }

          .clean-nav-user-text {
            text-align: right;
            color: #087F8C;
            font-family: 'Manrope', sans-serif;
          }

          .clean-nav-avatar {
            width: 40px;
            height: 40px;
            background: #087F8C;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          @media (max-width: 1024px) {
            .clean-nav-menu { gap: 20px; }
            .clean-nav-links-wrapper { gap: 20px; }
            .clean-nav-profile { padding-left: 15px; }
          }

          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .clean-nav-container {
              padding: 1rem 1.5rem !important;
              justify-content: space-between !important;
            }
            
            .clean-nav-brand {
              font-size: 26px !important;
            }

            .clean-nav-hamburger {
              display: block !important;
            }

            .clean-nav-menu {
              position: fixed;
              top: 0;
              left: -100%; /* Slides cleanly from the left now */
              width: 280px;
              height: 100vh;
              background-color: white;
              flex-direction: column;
              align-items: flex-start;
              justify-content: flex-start;
              padding: 90px 30px 30px 30px;
              transition: left 0.3s ease-in-out;
              z-index: 2050;
              box-shadow: 5px 0 15px rgba(0,0,0,0.1);
              margin-left: 0;
              gap: 30px;
            }

            .clean-nav-menu.open {
              left: 0 !important; 
            }

            .clean-nav-links-wrapper {
              flex-direction: column;
              align-items: flex-start;
              gap: 25px;
              width: 100%;
            }

            .clean-nav-profile {
              border-left: none;
              border-top: 1px solid rgba(8, 127, 140, 0.1);
              padding-left: 0;
              padding-top: 20px;
              width: 100%;
              justify-content: flex-start;
            }

            .clean-nav-user-text {
              text-align: left;
            }
          }
        `}
      </style>

      <nav className="clean-nav-container">
        {/* Hamburger Icon moved to the left for better mobile flow */}
        <button 
          className="clean-nav-hamburger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <Link to="/" className="clean-nav-brand"><BrandWordmark /></Link>

        <div className={`clean-nav-menu ${isOpen ? 'open' : ''}`}>
          <div className="clean-nav-links-wrapper">
            <Link to="/" style={getLinkStyle('/')} onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/about" style={getLinkStyle('/about')} onClick={() => setIsOpen(false)}>About Us</Link>
            <Link to="/services" style={getLinkStyle('/services')} onClick={() => setIsOpen(false)}>Services</Link>
            <Link to="/contact" style={getLinkStyle('/contact')} onClick={() => setIsOpen(false)}>Contact</Link>
          </div>

          <div className="clean-nav-profile">
            <div className="clean-nav-user-text">
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>Admin User</p>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Clinic Owner</p>
            </div>
            <div className="clean-nav-avatar">
              <User color="var(--ov-on-color, #fff)" size={20} />
            </div>
          </div>
        </div>
      </nav>

      {/* Dimmed Overlay when menu is open */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 2040,
          }}
        />
      )}
    </>
  );
}

export default Navbar;