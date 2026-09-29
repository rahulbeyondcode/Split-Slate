import { CircleHelp } from "lucide-react";

import Icon from "@/shared/ui/icon";

interface PropsType {
  icon?: string;
  name?: string;
  square?: boolean;
  className?: string;
}

const Avatar = ({ icon, name, square = false, className = "" }: PropsType) => (
  <span className={`avatar ${square ? "avatar-square" : ""} ${className}`} aria-hidden="true">
    {icon || name?.slice(0, 1).toUpperCase() || <Icon icon={CircleHelp} size={22} />}
  </span>
);

export default Avatar;
