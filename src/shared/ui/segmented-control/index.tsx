import { NavLink } from "react-router-dom";

interface PropsType {
  items: { label: string; to: string }[];
}

const SegmentedControl = ({ items }: PropsType) => (
  <nav aria-label="Group views" className="segmented">
    {items.map((item) => (
      <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
        {item.label}
      </NavLink>
    ))}
  </nav>
);

export default SegmentedControl;
