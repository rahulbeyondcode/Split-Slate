import { useEffect, useRef, useState } from "react";
import { useController } from "react-hook-form";

interface PropsType {
  name: string;
  emojis: string[];
}

const EmojiPicker = ({ name, emojis }: PropsType) => {
  const { field } = useController({ name });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change icon"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative text-2xl px-3 py-2 border rounded hover:bg-gray-50"
      >
        {field.value}
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border rounded-full flex items-center justify-center shadow-sm"
        >
          <svg
            className="w-2.5 h-2.5 text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-white border rounded shadow-md w-max">
          <div className="grid grid-cols-10 gap-1 p-2 max-h-32 overflow-y-auto">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  field.onChange(emoji);
                  setOpen(false);
                }}
                className={`text-xl p-1 rounded ${emoji === field.value ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
