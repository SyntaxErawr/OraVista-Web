import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <style>
        {`
          .landing-container {
            background-color: #087F8C;
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          .landing-card {
            background-color: white;
            width: 100%;
            max-width: 500px;
            height: auto;
            min-height: 450px;
            border-radius: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            padding: 40px 20px 80px 20px; /* Extra bottom padding for footer */
            position: relative;
            box-sizing: border-box;
          }

          .landing-logo-container {
            width: 80px;
            height: 80px;
            background-color: #e0e0e0;
            border-radius: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 20px;
          }

          .landing-logo-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #087F8C;
          }

          .landing-title {
            color: #087F8C;
            font-size: 48px;
            font-weight: 800;
            margin: 0 0 10px 0;
            letter-spacing: -1px;
          }

          .landing-subtitle {
            color: #666;
            font-size: 16px;
            font-weight: 400;
            margin: 0 0 40px 0;
          }

          .landing-button {
            padding: 12px 40px;
            background-color: white;
            border: 2px solid #087F8C;
            border-radius: 30px;
            color: #087F8C;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .landing-button:hover {
            background-color: #087F8C;
            color: var(--ov-on-color, #fff);
          }

          .landing-footer {
            position: absolute;
            bottom: 30px;
            color: #aaa;
            font-size: 12px;
            margin: 0;
            width: 100%;
            text-align: center;
          }

          /* Mobile Adjustments */
          @media (max-width: 480px) {
            .landing-card {
              min-height: 400px;
              padding: 30px 15px 70px 15px;
            }
            .landing-title {
              font-size: 36px;
            }
            .landing-subtitle {
              font-size: 14px;
              margin: 0 0 30px 0;
            }
          }
        `}
      </style>

      <div className="landing-container">
        <div className="landing-card">
          
          <h1 className="ov-clinic-brand"><BrandLogo variant="stacked" /></h1>
          <p className="landing-subtitle">Dental Clinic Management System</p>

          <button 
            onClick={() => navigate('/clinic/login')} 
            className="landing-button"
          >
            Click to Continue
          </button>

          <p className="landing-footer">King Epres Dental Clinic</p>
        </div>
      </div>
    </>
  );
}

export default LandingPage;
