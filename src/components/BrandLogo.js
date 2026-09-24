import React from 'react';

// Display the original PNG artwork inside its non-transparent bounds.
// The source files stay untouched; SVG viewBox removes only empty layout space.
const variants = {
  horizontal: { file: 'oravista-horizontal.png', viewBox: '200 524 2591 952', width: 3000, height: 2000 },
  stacked: { file: 'oravista-stacked.png', viewBox: '232 98 1534 1675', width: 2000, height: 2000 },
};

export default function BrandLogo({ variant = 'horizontal', className = '' }) {
  const logo = variants[variant];
  return (
    <svg className={`ov-logo ov-logo--${variant} ${className}`} viewBox={logo.viewBox} role="img" aria-label="OraVista" focusable="false">
      <image href={`${process.env.PUBLIC_URL}/brand/${logo.file}`} width={logo.width} height={logo.height} />
    </svg>
  );
}
