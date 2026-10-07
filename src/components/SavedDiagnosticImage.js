import React, { useEffect, useState } from 'react';
import { getDiagnosticImageSource, renderDiagnosticImage } from '../utils/diagnosticImage';

export default function SavedDiagnosticImage({ record }) {
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const source = getDiagnosticImageSource(record);
  useEffect(() => {
    let active = true;
    setImage(null);
    setError('');
    if (source) renderDiagnosticImage(record)
      .then(result => { if (active) setImage(result); })
      .catch(reason => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [record, source, attempt]);

  return (
    <figure style={{ margin: '0 0 20px' }}>
      <figcaption style={{ color: '#087F8C', fontWeight: 700, marginBottom: '10px' }}>Dentist-Saved Annotated X-ray</figcaption>
      {!source ? <p style={{ color: '#666' }}>The original X-ray is unavailable for this saved diagnosis.</p>
        : error ? <p role="alert">{error} <button type="button" className="ov-ui-button ov-text-link" onClick={() => setAttempt(value => value + 1)}>Retry X-ray</button></p>
        : !image ? <p role="status">Loading annotated X-ray...</p>
        : <img src={image.dataUrl} alt={`X-ray with dentist-saved annotations for final diagnosis ${record.id}`}
            style={{ display: 'block', width: '100%', maxHeight: '500px', objectFit: 'contain', backgroundColor: '#111827', borderRadius: '10px' }} />}
    </figure>
  );
}
