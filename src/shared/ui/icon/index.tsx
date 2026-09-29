import type { LucideIcon } from "lucide-react";

interface PropsType {
  icon: LucideIcon;
  size?: number;
  className?: string;
}

const Icon = ({ icon: Glyph, size = 20, className = "" }: PropsType) => (
  <Glyph
    aria-hidden="true"
    focusable="false"
    size={size}
    strokeWidth={2}
    className={`ui-icon ${className}`}
  />
);

export default Icon;
