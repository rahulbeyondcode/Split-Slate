import { useController } from "react-hook-form";

interface PropsType {
  name: string;
  emojis: string[];
}

const EmojiPicker = ({ name, emojis }: PropsType) => {
  const { field } = useController({ name });
  return (
    <div role="group" aria-label="Choose icon" className="flex flex-wrap gap-2">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-label={`Icon ${emoji}`}
          aria-pressed={field.value === emoji}
          onClick={() => field.onChange(emoji)}
          className={`chip !h-11 !w-11 !justify-center !rounded-2xl !p-1 !text-xl ${field.value === emoji ? "chip-selected" : ""}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPicker;
