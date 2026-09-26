import type { ReactNode } from "react";

interface PropsType {
  children: ReactNode;
  className?: string;
}

const Surface = ({ children, className = "" }: PropsType) => (
  <div className={`surface ${className}`}>{children}</div>
);

export default Surface;
