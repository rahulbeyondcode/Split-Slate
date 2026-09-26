import { Link } from "react-router-dom";

const AppLogo = () => (
  <Link
    to="/dashboard"
    aria-label="Split Slate dashboard"
    className="inline-flex items-center gap-2"
  >
    <span className="brand-mark" aria-hidden="true">
      ╱
    </span>
    <span className="brand-name">
      Split<span>Slate</span>
    </span>
  </Link>
);

export default AppLogo;
