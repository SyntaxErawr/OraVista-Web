import React from 'react';

function AboutPage() {
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '60px auto',
      padding: '0 40px',
      fontFamily: "'Manrope', sans-serif",
      color: '#087F8C',
    },
    topSection: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '50px',
      marginBottom: '40px'
    },
    textContent: {
      flex: 1,
    },
    header: {
      fontSize: '42px',
      fontWeight: '900',
      marginBottom: '25px',
      marginTop: 0,
      color: '#087F8C'
    },
    paragraph: {
      fontSize: '16px',
      lineHeight: '1.7',
      color: '#333',
      marginBottom: '20px',
      maxWidth: '550px'
    },
    imageContainer: {
      flex: 1.2,
    },
    image: {
      width: '100%', // Increased the width (length)
      height: '500px', // Kept the height exactly the same
      borderRadius: '8px',
      objectFit: 'cover',
      marginTop: '25px', 
      display: 'block',
      marginLeft: 'auto' 
    },
    whyChooseSection: {
      marginTop: '40px',
      marginBottom: '60px'
    },
    whyChooseHeaderContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '30px'
    },
    blueLine: { "--ov-on-color": "var(--ov-ink)",
      flex: 1,
      height: '3px',
      backgroundColor: "var(--ov-primary)",
      marginTop: '10px'
    },
    bottomGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '40px',
      marginTop: '50px',
      alignItems: 'center'
    },
    ratingsCard: { "--ov-on-color": "var(--ov-ink)",
      backgroundColor: "var(--ov-primary)",
      color: "var(--ov-on-color, #fff)",
      padding: '45px',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '30px'
    },
    ratingsLabel: {
      fontSize: '48px',
      fontWeight: '900',
      margin: 0
    },
    starsContainer: {
      textAlign: 'left'
    },
    stars: {
      color: '#FFD700',
      fontSize: '20px',
      marginBottom: '5px'
    },
    reviewsSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      paddingLeft: '20px'
    },
    reviewTitle: {
      fontWeight: '800',
      fontSize: '18px',
      marginBottom: '5px',
      color: '#000'
    },
    quote: {
      fontStyle: 'normal',
      color: '#333',
      fontSize: '15px',
      margin: 0,
      lineHeight: '1.6'
    }
  };

  return (
    <div className="ov-public-page" style={styles.container}>
      {/* Top Section: About Us */}
      <div className="about-top" style={styles.topSection}>
        <div style={styles.textContent}>
          <h1 style={styles.header}>About Us</h1>
          <p style={styles.paragraph}>
            At King Epres Dental Clinic, we are dedicated to providing top-quality dental care in a comfortable and friendly environment.
          </p>
          <p style={styles.paragraph}>
            Our experienced team of dentists and staff are committed to ensuring your oral health and giving you a confident smile. From routine check-ups to advanced treatments, we use modern technology to deliver safe and effective dental services.
          </p>
        </div>
        <div style={styles.imageContainer}>
          <img className="about-img"
            src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=2070&auto=format&fit=crop" 
            alt="Dental Team" 
            style={styles.image} 
          />
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div style={styles.whyChooseSection}>
        <div style={styles.whyChooseHeaderContainer}>
          <h2 style={{ ...styles.header, marginBottom: 0, fontSize: '38px' }}>Why Choose Us</h2>
          <div style={styles.blueLine}></div>
        </div>
        <p style={{...styles.paragraph, maxWidth: 'none'}}>
          King Epres Dental Clinic, combine expertise, technology, and care to give you the best dental experience possible. Our team of highly trained professionals ensures that every patient receives safe, effective, and personalized treatments. Using state-of-the-art equipment, we provide accurate diagnostics and modern dental solutions.
        </p>
        <p style={{...styles.paragraph, maxWidth: 'none'}}>
          We prioritize your comfort and satisfaction, offering a clean, welcoming environment and convenient scheduling options. With transparent pricing and a patient-centered approach, we aim to make quality dental care accessible, efficient, and stress-free.
        </p>
      </div>

      {/* Bottom Grid: Ratings and Reviews */}
      <div className="about-bottom-grid" style={styles.bottomGrid}>
        <div className="ov-feature ratings-card" style={styles.ratingsCard}>
          <h2 style={styles.ratingsLabel}>Ratings</h2>
          <div style={styles.starsContainer}>
            <div style={styles.stars}>★★★★★ <span style={{ color: "var(--ov-on-color, #fff)", fontSize: '18px', marginLeft: '5px' }}>4.9/5</span></div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>(Based on 250+ reviews)</p>
          </div>
        </div>

        <div className="reviews-section" style={styles.reviewsSection}>
          <h3 style={styles.reviewTitle}>Recent Reviews:</h3>
          <p style={styles.quote}>
            "The staff made me feel at ease, and my treatment was quick and painless!" – Maria S.
          </p>
          <p style={styles.quote}>
            "Highly recommend! Their diagnostic tools are impressive, and the team is very professional." – John D.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;