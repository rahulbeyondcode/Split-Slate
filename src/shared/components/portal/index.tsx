import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type PropsType = {
  id: string;
  children: React.ReactNode;
};

const PortalComponent = ({ id, children }: PropsType) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Resolve the portal target after it has been committed to the DOM.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContainer(document.getElementById(id));
  }, [id]);

  if (!container) return null;

  return createPortal(children, container);
};

export default PortalComponent;
