import EmojiImage from "@/shared/ui/emoji-image";

interface PropsType {
  icon?: string;
  name?: string;
  square?: boolean;
  className?: string;
}

const Avatar = ({ icon, name, square = false, className = "" }: PropsType) => (
  <span className={`avatar ${square ? "avatar-square" : ""} ${className}`} aria-hidden="true">
    <EmojiImage icon={icon} kind={square ? "other" : "profile"} alt={name ?? ""} />
  </span>
);

export default Avatar;
