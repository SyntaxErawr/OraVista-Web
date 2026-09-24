import React from 'react';
import BrandWordmark from './BrandWordmark';
import clinicImage from '../assets/dentimage.jpg';

export default function AuthIntro({ clinic = false }) {
  return (
    <div className="ov-auth-intro">
      <div className="ov-auth-brand"><BrandWordmark /></div>
      <span className="ov-eyebrow">{clinic ? 'Your clinic, connected' : 'King Epres Dental Clinic'}</span>
      <h1>{clinic ? 'Great care starts with your team.' : 'A little care. A brighter smile.'}</h1>
      <p>{clinic ? 'One familiar place for your patients, appointments, and everyday care.' : 'Your appointments, dental records, and next steps. All together, whenever you need them.'}</p>
      <img className="ov-auth-art" src={clinicImage} alt="A bright aqua dental treatment room" />
    </div>
  );
}
