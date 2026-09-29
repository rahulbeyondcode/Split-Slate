import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import Icon from "@/shared/ui/icon";

interface PropsType {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: PropsType) => (
  <div className="surface empty-state">
    <div className="empty-icon" aria-hidden="true">
      <Icon icon={icon} size={30} />
    </div>
    <h2>{title}</h2>
    <p>{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
