import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Smile, SmilePlus } from 'lucide-react';
import serviceImage from '../../assets/dentimage.jpg'; 

function ServicesPage() {
  const navigate = useNavigate();

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '60px auto',
      padding: '0 40px',
      fontFamily: "'Manrope', sans-serif",
      textAlign: 'center',
    },
    headerSection: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '15px'
    },
    blueLine: { "--ov-on-color": "var(--ov-ink)",
      flex: 1,
      height: '3px',
      backgroundColor: "var(--ov-primary)",
    },
    title: {
      fontSize: '42px',
      fontWeight: '900',
      color: '#087F8C',
      margin: 0,
      whiteSpace: 'nowrap'
    },
    subtitle: {
      fontSize: '18px',
      color: '#333',
      marginBottom: '60px',
      fontWeight: '500'
    },
    servicesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '30px',
      marginBottom: '80px'
    },
    serviceCard: { "--ov-on-color": "var(--ov-ink)",
      backgroundColor: "var(--ov-primary)",
      borderRadius: '25px',
      padding: '60px 30px',
      color: "var(--ov-on-color, #fff)",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      boxShadow: '0 10px 25px rgba(8, 127, 140, 0.1)'
    },
    cardTitle: {
      fontSize: '32px',
      fontWeight: '800',
      marginBottom: '40px',
      lineHeight: '1.2'
    },
    cardDescription: {
      fontSize: '16px',
      lineHeight: '1.6',
      opacity: 0.9,
      maxWidth: '250px'
    },
    bookingBanner: { "--ov-on-color": "var(--ov-ink)",
      display: 'flex',
      backgroundColor: "var(--ov-primary)",
      borderRadius: '4px',
      overflow: 'hidden',
      textAlign: 'left',
      color: "var(--ov-on-color, #fff)",
      marginTop: '40px',
      alignItems: 'stretch' // Ensures children (text and image) have equal height
    },
    bookingText: {
      flex: 1,
      padding: '50px'
    },
    bookingTitle: {
      fontSize: '22px',
      fontWeight: '800',
      marginBottom: '20px'
    },
    bookingPara: {
      fontSize: '14px',
      lineHeight: '1.6',
      marginBottom: '30px',
      opacity: 0.9
    },
    stepsTitle: {
      fontSize: '16px',
      fontWeight: '800',
      marginBottom: '15px'
    },
    stepsList: {
      listStyleType: 'decimal',
      paddingLeft: '20px',
      fontSize: '14px',
      lineHeight: '1.8'
    },
    bookBtn: {
      marginTop: '30px',
      backgroundColor: 'white',
      color: '#087F8C',
      border: 'none',
      padding: '12px 30px',
      borderRadius: '30px',
      fontWeight: '800',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px'
    },
    imageSection: {
      flex: 1,
      background: `url(${serviceImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100%' // Ensures the image container fills the vertical space
    }
  };

  return (
    <div className="ov-public-page" style={styles.container}>
      {/* Our Services Section */}
      <div style={styles.headerSection}>
        <div style={styles.blueLine}></div>
        <h1 style={styles.title}>Our Services</h1>
        <div style={styles.blueLine}></div>
      </div>
      
      <p style={styles.subtitle}>
        We offer a wide range of dental care to keep your smile healthy and beautiful
      </p>

      <div className="services-grid" style={styles.servicesGrid}>
        <div className="ov-panel ov-service-card" style={styles.serviceCard}>
          <span className="ov-service-icon"><Stethoscope size={26} aria-hidden="true" /></span>
          <h2 style={styles.cardTitle}>General Dentistry</h2>
          <p style={styles.cardDescription}>
            Routine check-ups, cleanings, and preventive care to maintain your oral health.
          </p>
        </div>

        <div className="ov-panel ov-service-card" style={styles.serviceCard}>
          <span className="ov-service-icon"><Smile size={26} aria-hidden="true" /></span>
          <h2 style={styles.cardTitle}>Orthodontics</h2>
          <p style={styles.cardDescription}>
            Braces, veneers, and other treatments to straighten and enhance your smile.
          </p>
        </div>

        <div className="ov-panel ov-service-card" style={styles.serviceCard}>
          <span className="ov-service-icon"><SmilePlus size={26} aria-hidden="true" /></span>
          <h2 style={styles.cardTitle}>Restorative Treatments</h2>
          <p style={styles.cardDescription}>
            Implants, crowns, and bridges to restore function and appearance.
          </p>
        </div>
      </div>

      {/* Book an Appointment Banner */}
      <div className="ov-feature booking-banner" style={styles.bookingBanner}>
        <div className="booking-text" style={styles.bookingText}>
          <h3 style={styles.bookingTitle}>Book an Appointment</h3>
          <p style={styles.bookingPara}>
            Scheduling your dental visit is quick and easy. At King Epres Dental Clinic, we offer flexible appointment times to fit your schedule. Whether it's a routine check-up, orthodontic consultation, or restorative treatment, you can book online or call us directly. Our friendly staff will guide you through the process and ensure your visit is smooth, efficient, and comfortable.
          </p>
          
          <h4 style={styles.stepsTitle}>Steps to Book:</h4>
          <ol style={styles.stepsList}>
            <li>Choose your preferred date and time.</li>
            <li>Select the service you need.</li>
            <li>Confirm your appointment online or over the phone.</li>
            <li>Receive a reminder before your visit.</li>
          </ol>

          {/* Updated navigation to return to the landing page */}
          <button style={styles.bookBtn} onClick={() => navigate('/')}>
            Book Now →
          </button>
        </div>
        <div className="booking-img" style={styles.imageSection}></div>
      </div>
    </div>
  );
}

export default ServicesPage;
