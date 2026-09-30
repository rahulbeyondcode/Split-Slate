import { Images, Search, X } from "lucide-react";
import { useState } from "react";
import { useController } from "react-hook-form";

import {
  EMOJI_CATEGORIES,
  type EmojiKind,
  emojiValue,
  OTHER_EMOJIS,
  PROFILE_EMOJIS,
} from "@/shared/constants/emoji-catalog";

import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";

interface PropsType {
  name: string;
  kind: EmojiKind;
  emojis: string[];
}

const EmojiPicker = ({ name, kind, emojis }: PropsType) => {
  const { field } = useController({ name });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const collection = kind === "profile" ? PROFILE_EMOJIS : OTHER_EMOJIS;
  const selected = emojiValue(field.value, kind);
  const selectedOption = collection.find((item) => item.value === selected);
  const featured = emojis
    .map((value) => collection.find((item) => item.value === value))
    .filter((item): item is (typeof collection)[number] => Boolean(item));
  const categories = [...new Set(collection.map((item) => item.category))];
  const query = search.trim().toLowerCase();
  const results = collection.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      (!query || item.label.toLowerCase().includes(query)),
  );

  const handleSelect = (value: string) => {
    field.onChange(value);
    setOpen(false);
  };
  const handleToggle = () => setOpen((value) => !value);
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(event.target.value);
  const handleCategory = (value: string) => setCategory(value);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") setOpen(false);
  };

  const tile = (option: (typeof collection)[number]) => (
    <button
      key={option.value}
      type="button"
      onClick={() => handleSelect(option.value)}
      aria-label={`Icon ${option.label}`}
      aria-pressed={selected === option.value}
      title={option.label}
      className="emoji-picker-tile"
    >
      <EmojiImage icon={option.value} kind={kind} />
    </button>
  );

  return (
    <div role="group" aria-label="Choose icon" className="emoji-picker" onKeyDown={handleKeyDown}>
      <div className="emoji-picker-heading">
        <span
          className="emoji-picker-selected"
          role="img"
          aria-label={`Selected icon: ${selectedOption?.label ?? "Unknown"}`}
          title={selectedOption?.label ?? "Choose an icon"}
        >
          <EmojiImage icon={selected} kind={kind} />
        </span>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={open}
          className="btn btn-secondary emoji-picker-browse"
        >
          <Icon icon={open ? X : Images} size={17} />
          {open ? "Close gallery" : "Browse more"}
        </button>
      </div>
      <div className="emoji-picker-featured" aria-label="Popular choices">
        {featured.map(tile)}
      </div>
      {open && (
        <div className="emoji-picker-gallery">
          <label className="emoji-picker-search">
            <Icon icon={Search} size={18} />
            <span className="sr-only">Search icons</span>
            <input
              type="search"
              value={search}
              onChange={handleSearch}
              placeholder="Search icons"
              autoFocus
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                <Icon icon={X} size={16} />
              </button>
            )}
          </label>
          {kind === "other" && (
            <div className="emoji-picker-categories" aria-label="Filter icons">
              {["all", ...categories].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={category === value}
                  onClick={() => handleCategory(value)}
                  className="emoji-picker-filter"
                >
                  {value === "all"
                    ? "All"
                    : EMOJI_CATEGORIES[value as keyof typeof EMOJI_CATEGORIES]}
                </button>
              ))}
            </div>
          )}
          <p className="soft-caption" aria-live="polite">
            {results.length} {results.length === 1 ? "icon" : "icons"}
          </p>
          <div className="emoji-picker-results" aria-label="All available icons">
            {results.map(tile)}
            {results.length === 0 && (
              <p className="soft-caption">No matching icons. Try another search.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
