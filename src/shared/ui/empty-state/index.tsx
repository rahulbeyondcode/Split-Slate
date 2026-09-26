import type { ReactNode } from "react";

interface PropsType {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: PropsType) => (
  <div className="surface empty-state">
    <div className="empty-icon" aria-hidden="true">
      {icon}
    </div>
    <h2>{title}</h2>
    <p>{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
