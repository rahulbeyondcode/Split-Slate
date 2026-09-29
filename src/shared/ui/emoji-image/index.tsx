import { type EmojiKind, emojiUrl } from "@/shared/constants/emoji-catalog";

interface PropsType {
  icon?: string;
  kind?: EmojiKind;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
}

const EmojiImage = ({
  icon,
  kind = "other",
  alt = "",
  className = "",
  loading = "lazy",
}: PropsType) => (
  <img
    src={emojiUrl(icon, kind)}
    alt={alt}
    loading={loading}
    decoding="async"
    className={`emoji-image ${className}`}
  />
);

export default EmojiImage;
