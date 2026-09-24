import { Facebook, Phone } from "lucide-react";

// Official page URLs supplied by the clinic. Do not invent phone/email details.
const pages = {
  pasay: [
    ["Pasay clinic Facebook", "https://www.facebook.com/kedentalclinic"],
    ["Pasay branch Facebook", "https://www.facebook.com/profile.php?id=100093099934992"],
  ],
  balibago: [["Balibago branch Facebook", "https://www.facebook.com/profile.php?id=100092032605169"]],
  manila: [["Sta. Ana branch Facebook", "https://www.facebook.com/profile.php?id=100063646346210"]],
};

// Public listing sources and verification limits are recorded in the owner's UI-AUDIT.md notes.
const phones = {
  pasay: { display: "0977 373 0874", href: "tel:+639773730874" },
  manila: { display: "0995 437 1540", href: "tel:+639954371540" },
};

export default function BranchContactLinks({ branch }) {
  return (
    <div className="ov-branch-contacts">
      {phones[branch] && <a className="ov-text-link" href={phones[branch].href}><Phone size={16} aria-hidden="true" /> {phones[branch].display}</a>}
      {pages[branch].map(([label, href]) => (
        <a key={href} className="ov-text-link" href={href} target="_blank" rel="noopener noreferrer">
          <Facebook size={16} aria-hidden="true" /> {label}<span className="ov-sr-only"> (opens in a new tab)</span>
        </a>
      ))}
      <p>{phones[branch] ? "Message the branch for clinic hours and inquiries." : "Message the branch for its phone number, clinic hours and inquiries."}</p>
    </div>
  );
}
