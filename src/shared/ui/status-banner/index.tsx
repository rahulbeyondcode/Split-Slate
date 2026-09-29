import { CircleAlert, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import Icon from "@/shared/ui/icon";

interface PropsType {
  variant: "error" | "warning";
  children: ReactNode;
  className?: string;
  id?: string;
}

const StatusBanner = ({ variant, children, className = "", id }: PropsType) => (
  <div
    id={id}
    role={variant === "error" ? "alert" : undefined}
    className={`status-banner status-banner--${variant} ${className}`.trim()}
  >
    <Icon icon={variant === "error" ? CircleAlert : TriangleAlert} size={20} />
    <div className="status-banner-content">{children}</div>
  </div>
);

export default StatusBanner;
