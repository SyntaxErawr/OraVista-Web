import StorePlaceholders from "../../components/StorePlaceholders";
import BranchContactLinks from "../../components/BranchContactLinks";
import BrandWordmark from "../../components/BrandWordmark";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { MapPin, ShieldCheck, Menu, X, Stethoscope, Smile, SmilePlus } from "lucide-react";
import serviceImage from '../../assets/dentimage.jpg'; 

function LandingPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("Select Branch");
  const navigate = useNavigate(); 

  // --- SCROLL REFERENCES ---
  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const servicesRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToSection = (elementRef) => {
    window.scrollTo({
      top: elementRef.current.offsetTop - 80, 
      behavior: "smooth",
    });
    setIsNavOpen(false); // Close mobile nav after clicking
  };

  const branches = [
    "Gil Puyat, Pasay",
    "Sta. Ana, Manila",
    "Angeles, Pampanga",
  ];

  const handleSelect = (branch) => {
    setSelectedBranch(branch);
    setIsOpen(false);
    localStorage.setItem("tempBranch", branch);
    navigate("/login");
  };

  // --- Management Portal Navigation Handler ---
  const handlePortalClick = () => {
    console.log("Navigating to Management Portal...");
    navigate("/management"); 
  };

  // ==========================================
  // STYLES: HERO / NAVBAR 
  // ==========================================
  const brandBlue = "#087F8C";

  const heroSectionStyle = {
    backgroundColor: "#F1FBFC",
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: "8%",
    paddingRight: "8%",
    boxSizing: "border-box",
  };

  const navLinkStyle = {
    cursor: "pointer",
    fontWeight: "600",
    color: brandBlue,
    fontSize: "15px",
    transition: "color 0.2s"
  };

  const portalBtnStyle = { "--ov-on-color": "var(--ov-ink)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--ov-primary)",
    color: "var(--ov-on-color, #fff)",
    border: "none",
    padding: "8px 18px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s, background-color 0.2s",
    fontFamily: "'Manrope', sans-serif"
  };

  // ==========================================
  // STYLES: ABOUT US
  // ==========================================
  const aboutStyles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 40px', fontFamily: "'Manrope', sans-serif", color: '#087F8C', boxSizing: 'border-box' },
    topSection: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '50px', marginBottom: '40px' },
    textContent: { flex: 1 },
    header: { fontSize: '42px', fontWeight: '900', marginBottom: '25px', marginTop: 0, color: '#087F8C' },
    paragraph: { fontSize: '16px', lineHeight: '1.7', color: '#333', marginBottom: '20px', maxWidth: '550px' },
    imageContainer: { flex: 1.2, width: '100%' },
    image: { width: '100%', height: '500px', borderRadius: '8px', objectFit: 'cover', marginTop: '25px', display: 'block', marginLeft: 'auto' },
    whyChooseSection: { marginTop: '40px', marginBottom: '60px' },
    whyChooseHeaderContainer: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' },
    blueLine: { "--ov-on-color": "var(--ov-ink)", flex: 1, height: '3px', backgroundColor: "var(--ov-primary)", marginTop: '10px' },
    bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '50px', alignItems: 'center' },
    ratingsCard: { "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", padding: '45px', borderRadius: '4px', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '30px' },
    ratingsLabel: { fontSize: '48px', fontWeight: '900', margin: 0 },
    starsContainer: { textAlign: 'left' },
    stars: { color: '#FFD700', fontSize: '20px', marginBottom: '5px' },
    reviewsSection: { display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '20px' },
    reviewTitle: { fontWeight: '800', fontSize: '18px', marginBottom: '5px', color: '#000' },
    quote: { fontStyle: 'normal', color: '#333', fontSize: '15px', margin: 0, lineHeight: '1.6' }
  };

  // ==========================================
  // STYLES: SERVICES
  // ==========================================
  const servicesStyles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 40px', fontFamily: "'Manrope', sans-serif", textAlign: 'center', boxSizing: 'border-box' },
    headerSection: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '15px' },
    blueLine: { "--ov-on-color": "var(--ov-ink)", flex: 1, height: '3px', backgroundColor: "var(--ov-primary)" },
    title: { fontSize: '42px', fontWeight: '900', color: '#087F8C', margin: 0, whiteSpace: 'nowrap' },
    subtitle: { fontSize: '18px', color: '#333', marginBottom: '60px', fontWeight: '500' },
    servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '80px' },
    serviceCard: { "--ov-on-color": "var(--ov-ink)", backgroundColor: "var(--ov-primary)", borderRadius: '25px', padding: '60px 30px', color: "var(--ov-on-color, #fff)", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', boxShadow: '0 10px 25px rgba(8, 127, 140, 0.1)' },
    cardTitle: { fontSize: '32px', fontWeight: '800', marginBottom: '40px', lineHeight: '1.2' },
    cardDescription: { fontSize: '16px', lineHeight: '1.6', opacity: 0.9, maxWidth: '250px' },
    bookingBanner: { "--ov-on-color": "var(--ov-ink)", display: 'flex', backgroundColor: "var(--ov-primary)", borderRadius: '4px', overflow: 'hidden', textAlign: 'left', color: "var(--ov-on-color, #fff)", marginTop: '40px', alignItems: 'stretch' },
    bookingText: { flex: 1, padding: '50px' },
    bookingTitle: { fontSize: '22px', fontWeight: '800', marginBottom: '20px' },
    bookingPara: { fontSize: '14px', lineHeight: '1.6', marginBottom: '30px', opacity: 0.9 },
    stepsTitle: { fontSize: '16px', fontWeight: '800', marginBottom: '15px' },
    stepsList: { listStyleType: 'decimal', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' },
    bookBtn: { marginTop: '30px', backgroundColor: 'white', color: '#087F8C', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '10px' },
    imageSection: { flex: 1, background: `url(${serviceImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', minHeight: '100%' }
  };

  // ==========================================
  // STYLES: CONTACT
  // ==========================================
  const contactStyles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 40px', fontFamily: "'Manrope', sans-serif", color: '#087F8C', textAlign: 'left', boxSizing: 'border-box' },
    header: { fontSize: '42px', fontWeight: '800', marginBottom: '40px' },
    grid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr 2fr', gap: '50px', marginBottom: '60px' },
    sectionTitle: { fontSize: '22px', fontWeight: '800', marginBottom: '25px' },
    description: { fontSize: '15px', lineHeight: '1.6', color: '#333', marginBottom: '30px' },
    socialLinks: { display: 'flex', gap: '15px', marginTop: '20px' },
    linkList: { listStyle: 'none', padding: 0, margin: 0 },
    linkItem: { fontSize: '16px', marginBottom: '15px', cursor: 'pointer', color: '#087F8C', fontWeight: '500' },
    contactInfo: { display: 'flex', flexDirection: 'column', gap: '30px' },
    locationGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    locationTitle: { fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' },
    infoItem: { fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', color: '#333' },
    footerLine: { borderTop: '3px solid #087F8C', paddingTop: '20px', marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#333' }
  };

  return (
    <div className="ov-home" style={{ width: "100%", overflowX: "hidden", backgroundColor: "#fafafa" }}>
      
      {/* --- RESPONSIVE CSS INJECTION --- */}
      <style>
        {`
          .mobile-nav-toggle { display: none; }
          
          @media (max-width: 900px) {
            .landing-nav { padding: 0 5% !important; }
            .mobile-nav-toggle { 
              display: block; 
              cursor: pointer; 
              color: #087F8C;
              background: none; 
              border: none; 
              z-index: 1001; 
            }
            .nav-links-container {
              position: fixed;
              top: 80px;
              left: -100%;
              width: 100%;
              height: calc(100vh - 80px);
              background: rgba(255, 255, 255, 0.98);
              flex-direction: column !important;
              justify-content: flex-start !important;
              align-items: center !important;
              padding-top: 40px;
              gap: 30px !important;
              transition: left 0.3s ease-in-out;
              z-index: 999;
            }
            .nav-links-container.open { left: 0; }
            
            .hero-section {
              align-items: center !important;
              text-align: center !important;
            }
            .hero-title {
              font-size: 38px !important;
              line-height: 1.2 !important;
              white-space: normal !important;
            }
            .hero-subtitle {
              font-size: 16px !important;
              white-space: normal !important;
            }
            .hero-promo {
              flex-direction: column !important;
              align-items: center !important;
              text-align: center !important;
            }

            .responsive-container { padding: 0 20px !important; }
            
            .about-top { flex-direction: column !important; gap: 30px !important; }
            .about-img { height: 300px !important; }
            .about-bottom-grid { grid-template-columns: 1fr !important; gap: 30px !important; }
            .ratings-card { flex-direction: column !important; padding: 30px !important; text-align: center !important; }
            .reviews-section { padding-left: 0 !important; text-align: center !important; }
            
            .services-grid { grid-template-columns: 1fr !important; }
            .services-title { font-size: 32px !important; white-space: normal !important; text-align: center !important; }
            .booking-banner { flex-direction: column !important; }
            .booking-text { padding: 30px !important; }
            .booking-img { min-height: 250px !important; width: 100% !important; }

            .contact-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
            .contact-locations-grid { grid-template-columns: 1fr !important; }
            .contact-footer { flex-direction: column !important; gap: 15px !important; text-align: center !important; }
          }
        `}
      </style>

      {/* ----------------- STICKY NAVBAR ----------------- */}
      <nav className="landing-nav" style={{ 
        position: "fixed", top: 0, left: 0, width: "100%", height: "80px", 
        backgroundColor: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)",
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "0 10%", boxShadow: "0 2px 15px rgba(0,0,0,0.05)", zIndex: 1000,
        boxSizing: "border-box", fontFamily: "'Manrope', sans-serif"
      }}>
        <button className="ov-ui-button" style={{ color: brandBlue, fontWeight: "800", fontSize: "28px", margin: 0, cursor: "pointer", zIndex: 1001 }} onClick={() => scrollToSection(homeRef)} type="button" aria-label="OraVista home"><BrandWordmark /></button>
        
        <button aria-label={isNavOpen ? "Close navigation" : "Open navigation"} aria-expanded={isNavOpen} className="mobile-nav-toggle" onClick={() => setIsNavOpen(!isNavOpen)}>
          {isNavOpen ? <X size={30} /> : <Menu size={30} />}
        </button>

        <div className={`nav-links-container ${isNavOpen ? "open" : ""}`} style={{ display: "flex", gap: "30px", alignItems: "center" }}>
          <button className="ov-ui-button" style={navLinkStyle} onClick={() => scrollToSection(homeRef)} type="button">Home</button>
          <button className="ov-ui-button" style={navLinkStyle} onClick={() => scrollToSection(aboutRef)} type="button">About Us</button>
          <button className="ov-ui-button" style={navLinkStyle} onClick={() => scrollToSection(servicesRef)} type="button">Services</button>
          <button className="ov-ui-button" style={navLinkStyle} onClick={() => scrollToSection(contactRef)} type="button">Contact</button>
          <button 
            style={portalBtnStyle} 
            onClick={handlePortalClick}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#25BED0")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = brandBlue)}
          >
            <ShieldCheck size={18} />
            Portal
          </button>
        </div>
      </nav>

      {/* ----------------- HOME / HERO SECTION ----------------- */}
      <div ref={homeRef} className="hero-section" style={heroSectionStyle}>
        <span className="ov-hero-eyebrow">King Epres Dental Clinic</span>
        <h1 className="hero-title" style={{ fontSize: "64px", fontWeight: "800", color: "#087F8C", marginBottom: "0px", lineHeight: "1.0", fontFamily: "'Manrope', sans-serif" }}>
          Your smile,<br />in good hands.
        </h1>
        <p className="hero-subtitle" style={{ fontSize: "26px", color: "#087F8C", marginTop: "10px", marginBottom: "30px", whiteSpace: "nowrap", maxWidth: "none", fontFamily: "'Manrope', sans-serif" }}>
          Feel at home with dental care made personal. Let's take the next step toward a healthier, happier smile.
        </p>

        <div style={{ position: "relative", display: "inline-block", fontFamily: "'Manrope', sans-serif", zIndex: 10 }}>
          <button 
            style={{ "--ov-on-color": "var(--ov-ink)", padding: "12px 24px", backgroundColor: "var(--ov-primary)", color: "var(--ov-on-color, #fff)", border: "none", borderRadius: "8px", fontSize: "18px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", minWidth: "220px", justifyContent: "space-between" }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedBranch} <span>{isOpen ? "▲" : "▼"}</span>
          </button>

          {isOpen && (
            <div className="ov-color-surface" style={{ "--ov-on-color": "var(--ov-ink)", position: "absolute", top: "100%", left: 0, backgroundColor: "var(--ov-primary)", borderRadius: "8px", marginTop: "5px", width: "100%", overflow: "hidden", boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}>
              {branches.map((branch) => (
                <button type="button" className="ov-ui-button"
                  key={branch}
                  style={{ display: "block", width: "100%", padding: "12px 20px", color: "var(--ov-on-color, #fff)", cursor: "pointer", fontSize: "16px", fontFamily: "'Manrope', sans-serif", borderBottom: "1px solid var(--ov-on-line, rgba(255,255,255,0.1))", transition: "background 0.2s" }}
                  onClick={() => handleSelect(branch)}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#25BED0")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                >
                  {branch}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="ov-branch-hint">Choose your preferred clinic to book a visit.</p>
        <div className="ov-hero-visual">
          <img src={serviceImage} alt="A welcoming aqua dental treatment room" />
          <div className="ov-hero-caption">
            <ShieldCheck size={30} />
            <div><strong>Care that feels personal.</strong><span>Three locations. One commitment to your smile.</span></div>
          </div>
        </div>

        {/* MOBILE PROMO */}
        <div className="hero-promo" style={{ marginTop: "60px", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "30px", fontFamily: "'Manrope', sans-serif", maxWidth: "800px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "15px", flex: 1 }}>
            <p style={{ fontSize: "19px", color: "#087F8C", margin: 0, fontWeight: "600", lineHeight: "1.4" }}>
              Your care, wherever you are. Manage appointments and dental records from your phone using this website.
            </p>
            <StorePlaceholders />
          </div>
        </div>
      </div>

      {/* ----------------- ABOUT US SECTION ----------------- */}
      <section className="ov-home-section" ref={aboutRef} style={{ width: '100%', paddingTop: '100px', paddingBottom: '60px', backgroundColor: 'white' }}>
        <div className="responsive-container" style={aboutStyles.container}>
          <div className="about-top" style={aboutStyles.topSection}>
            <div style={aboutStyles.textContent}>
              <h1 style={aboutStyles.header}>About Us</h1>
              <p style={aboutStyles.paragraph}>
                At King Epres Dental Clinic, we are dedicated to providing top-quality dental care in a comfortable and friendly environment.
              </p>
              <p style={aboutStyles.paragraph}>
                Our experienced team of dentists and staff are committed to ensuring your oral health and giving you a confident smile. From routine check-ups to advanced treatments, we use modern technology to deliver safe and effective dental services.
              </p>
            </div>
            <div style={aboutStyles.imageContainer}>
              <img 
                src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=2070&auto=format&fit=crop" 
                alt="Dental Team" 
                className="about-img"
                style={aboutStyles.image} 
              />
            </div>
          </div>

          <div style={aboutStyles.whyChooseSection}>
            <div style={aboutStyles.whyChooseHeaderContainer}>
              <h2 style={{ ...aboutStyles.header, marginBottom: 0, fontSize: '38px' }}>Why Choose Us</h2>
              <div style={aboutStyles.blueLine}></div>
            </div>
            <p style={{...aboutStyles.paragraph, maxWidth: 'none'}}>
              King Epres Dental Clinic, combine expertise, technology, and care to give you the best dental experience possible. Our team of highly trained professionals ensures that every patient receives safe, effective, and personalized treatments. Using state-of-the-art equipment, we provide accurate diagnostics and modern dental solutions.
            </p>
            <p style={{...aboutStyles.paragraph, maxWidth: 'none'}}>
              We prioritize your comfort and satisfaction, offering a clean, welcoming environment and convenient scheduling options. With transparent pricing and a patient-centered approach, we aim to make quality dental care accessible, efficient, and stress-free.
            </p>
          </div>

          <div className="about-bottom-grid" style={aboutStyles.bottomGrid}>
            <div className="ratings-card ov-feature" style={aboutStyles.ratingsCard}>
              <h2 style={aboutStyles.ratingsLabel}>Ratings</h2>
              <div style={aboutStyles.starsContainer}>
                <div style={aboutStyles.stars}>★★★★★ <span style={{ color: "var(--ov-on-color, #fff)", fontSize: '18px', marginLeft: '5px' }}>4.9/5</span></div>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>(Based on 250+ reviews)</p>
              </div>
            </div>
            <div className="reviews-section" style={aboutStyles.reviewsSection}>
              <h3 style={aboutStyles.reviewTitle}>Recent Reviews:</h3>
              <p style={aboutStyles.quote}>
                "The staff made me feel at ease, and my treatment was quick and painless!" – Maria S.
              </p>
              <p style={aboutStyles.quote}>
                "Highly recommend! Their diagnostic tools are impressive, and the team is very professional." – John D.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- SERVICES SECTION ----------------- */}
      <section className="ov-home-section" ref={servicesRef} style={{ width: '100%', paddingTop: '100px', paddingBottom: '60px', backgroundColor: '#F3FAFB' }}>
        <div className="responsive-container" style={servicesStyles.container}>
          <div style={servicesStyles.headerSection}>
            <div style={servicesStyles.blueLine}></div>
            <h1 className="services-title" style={servicesStyles.title}>Our Services</h1>
            <div style={servicesStyles.blueLine}></div>
          </div>
          
          <p style={servicesStyles.subtitle}>
            We offer a wide range of dental care to keep your smile healthy and beautiful
          </p>

          <div className="services-grid" style={servicesStyles.servicesGrid}>
            <div className="ov-panel ov-service-card" style={servicesStyles.serviceCard}>
              <span className="ov-service-icon"><Stethoscope size={26} aria-hidden="true" /></span>
              <h2 style={servicesStyles.cardTitle}>General Dentistry</h2>
              <p style={servicesStyles.cardDescription}>
                Routine check-ups, cleanings, and preventive care to maintain your oral health.
              </p>
            </div>

            <div className="ov-panel ov-service-card" style={servicesStyles.serviceCard}>
              <span className="ov-service-icon"><Smile size={26} aria-hidden="true" /></span>
              <h2 style={servicesStyles.cardTitle}>Orthodontics</h2>
              <p style={servicesStyles.cardDescription}>
                Braces, veneers, and other treatments to straighten and enhance your smile.
              </p>
            </div>

            <div className="ov-panel ov-service-card" style={servicesStyles.serviceCard}>
              <span className="ov-service-icon"><SmilePlus size={26} aria-hidden="true" /></span>
              <h2 style={servicesStyles.cardTitle}>Restorative Treatments</h2>
              <p style={servicesStyles.cardDescription}>
                Implants, crowns, and bridges to restore function and appearance.
              </p>
            </div>
          </div>

          <div className="booking-banner ov-feature" style={servicesStyles.bookingBanner}>
            <div className="booking-text" style={servicesStyles.bookingText}>
              <h3 style={servicesStyles.bookingTitle}>Book an Appointment</h3>
              <p style={servicesStyles.bookingPara}>
                Scheduling your dental visit is quick and easy. At King Epres Dental Clinic, we offer flexible appointment times to fit your schedule. Whether it's a routine check-up, orthodontic consultation, or restorative treatment, you can book online or call us directly. Our friendly staff will guide you through the process and ensure your visit is smooth, efficient, and comfortable.
              </p>
              <h4 style={servicesStyles.stepsTitle}>Steps to Book:</h4>
              <ol style={servicesStyles.stepsList}>
                <li>Choose your preferred date and time.</li>
                <li>Select the service you need.</li>
                <li>Confirm your appointment online or over the phone.</li>
                <li>Receive a reminder before your visit.</li>
              </ol>
              <button style={servicesStyles.bookBtn} onClick={() => scrollToSection(homeRef)}>
                Book Now →
              </button>
            </div>
            <div className="booking-img" style={servicesStyles.imageSection}></div>
          </div>
        </div>
      </section>

      {/* ----------------- CONTACT / FOOTER SECTION ----------------- */}
      <section className="ov-home-section" ref={contactRef} style={{ width: '100%', paddingTop: '100px', paddingBottom: '40px', backgroundColor: 'white' }}>
        <div className="responsive-container" style={contactStyles.container}>
          <h1 style={contactStyles.header}>Contact Us</h1>

          <div className="contact-grid" style={contactStyles.grid}>
            <div>
              <h2 style={contactStyles.sectionTitle}>King Epres Dental Clinic</h2>
              <p style={contactStyles.description}>
                At King Epres Dental Clinic, every smile matters. We provide modern, compassionate dental care across all our branches to keep you healthy, confident, and smiling.
              </p>

            </div>

            <div>
              <h2 style={contactStyles.sectionTitle}>Quick Links</h2>
              <ul style={contactStyles.linkList}>
                <li><button className="ov-ui-button" style={contactStyles.linkItem} onClick={() => scrollToSection(homeRef)} type="button">Home</button></li>
                <li><button className="ov-ui-button" style={contactStyles.linkItem} onClick={() => scrollToSection(aboutRef)} type="button">About Us</button></li>
                <li><button className="ov-ui-button" style={contactStyles.linkItem} onClick={() => scrollToSection(servicesRef)} type="button">Services</button></li>
                <li><button className="ov-ui-button" style={contactStyles.linkItem} onClick={() => navigate(localStorage.getItem('user') ? '/appointments' : '/login')} type="button">Appointment</button></li>
              </ul>
            </div>

            <div style={contactStyles.contactInfo}>
              <div className="contact-locations-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div style={contactStyles.locationGroup}>
                  <div style={contactStyles.locationTitle}><MapPin size={18} color="#ff4d4d" /> Gil Puyat, Pasay</div>
                  <BranchContactLinks branch="pasay" />
                </div>

                <div style={contactStyles.locationGroup}>
                  <div style={contactStyles.locationTitle}><MapPin size={18} color="#ff4d4d" /> Balibago, Angeles, Pampanga</div>
                  <BranchContactLinks branch="balibago" />
                </div>
              </div>

              <div style={contactStyles.locationGroup}>
                <div style={contactStyles.locationTitle}><MapPin size={18} color="#ff4d4d" /> Sta. Ana, Manila</div>
                <BranchContactLinks branch="manila" />
              </div>
            </div>
          </div>

          <div className="contact-footer" style={contactStyles.footerLine}>
            <div>© 2026 King Epres Dental Clinic. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <span>Policy information is not yet available online.</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default LandingPage;
