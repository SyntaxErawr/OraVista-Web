import { Smartphone } from "lucide-react";
import playIcon from "../assets/gpslogo.png";

export default function StorePlaceholders() {
  return (
    <div className="ov-store-placeholders" aria-label="Upcoming mobile apps">
      <button type="button" aria-disabled="true" className="ov-store-placeholder" title="Google Play download is not available yet">
        <img src={playIcon} alt="" />
        <span><strong>Google Play</strong><small>Coming soon</small></span>
      </button>
      <button type="button" aria-disabled="true" className="ov-store-placeholder" title="iOS App Store download is not available yet">
        <Smartphone size={23} aria-hidden="true" />
        <span><strong>iOS App Store</strong><small>Coming soon</small></span>
      </button>
    </div>
  );
}
