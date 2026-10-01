import { useState } from "react";

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
}: PropsType) => {
  const [failedUrl, setFailedUrl] = useState("");
  const url = emojiUrl(icon, kind);
  if (failedUrl === url) {
    return (
      <span
        role="img"
        aria-label={alt || "Icon unavailable offline"}
        className={`emoji-image rounded-full bg-[var(--brand-soft)] ${className}`}
      />
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      loading={loading}
      decoding="async"
      className={`emoji-image ${className}`}
      onError={() => setFailedUrl(url)}
    />
  );
};

export default EmojiImage;
