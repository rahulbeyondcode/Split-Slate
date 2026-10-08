import type { ChangeEvent, InvalidEvent } from "react";
import { useState } from "react";
import { useController } from "react-hook-form";

interface PropsType {
  name: string;
  label?: string;
}

interface PresetColor {
  name: string;
  value: string;
}

interface HexDraftState {
  value: string;
  sourceColor: string;
  error: string | null;
}

const PRESET_COLORS: PresetColor[] = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7280" },
];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

const normalizeHexInput = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
};

const ColorPicker = ({ name, label = "Color" }: PropsType) => {
  const { field, fieldState } = useController({ name });
  const selectedColor = typeof field.value === "string" ? field.value.toLowerCase() : "";
  const nativePickerColor = HEX_COLOR_PATTERN.test(selectedColor) ? selectedColor : "#000000";
  const [hexDraft, setHexDraft] = useState<HexDraftState>({
    value: selectedColor,
    sourceColor: selectedColor,
    error: null,
  });

  if (hexDraft.sourceColor !== selectedColor) {
    setHexDraft({ value: selectedColor, sourceColor: selectedColor, error: null });
  }

  const handlePresetColor = (color: string) => {
    field.onChange(color);
    setHexDraft((current) => ({ ...current, value: color, error: null }));
  };

  const handleNativeColor = (event: ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value.toLowerCase();
    field.onChange(color);
    setHexDraft((current) => ({ ...current, value: color, error: null }));
  };

  const handleHexColor = (event: ChangeEvent<HTMLInputElement>) => {
    const color = normalizeHexInput(event.target.value);
    setHexDraft((current) => ({ ...current, value: color, error: null }));

    if (HEX_COLOR_PATTERN.test(color)) {
      field.onChange(color);
    }
  };

  const handleBlur = () => {
    const error = HEX_COLOR_PATTERN.test(hexDraft.value) ? null : "Enter a six-digit hex color";
    setHexDraft((current) => ({ ...current, error }));
    field.onBlur();
  };

  const handleInvalidHexColor = (event: InvalidEvent<HTMLInputElement>) => {
    event.preventDefault();
    setHexDraft((current) => ({ ...current, error: "Enter a six-digit hex color" }));
  };

  const errorMessage = hexDraft.error ?? fieldState.error?.message;

  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="field-label !mb-0">{label}</legend>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {PRESET_COLORS.map((color) => {
          const isSelected = selectedColor === color.value;
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => handlePresetColor(color.value)}
              aria-label={`${color.name} ${color.value}`}
              aria-pressed={isSelected}
              title={`${color.name} (${color.value})`}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border p-1.5 text-[0.625rem] font-semibold leading-tight transition-colors ${
                isSelected
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--brand-soft)]"
              }`}
            >
              <span
                className="h-6 w-6 rounded-full border border-black/10"
                style={{ backgroundColor: color.value }}
                aria-hidden="true"
              />
              {color.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${name}-native`} className="text-xs text-[var(--muted)]">
            Custom picker
          </label>
          <div className="relative h-11 w-16 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand-soft)]">
            <span
              className="block h-full w-full rounded-lg"
              style={{ backgroundColor: nativePickerColor }}
              aria-hidden="true"
            />
            <input
              id={`${name}-native`}
              type="color"
              value={nativePickerColor}
              onChange={handleNativeColor}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={`${name}-hex`} className="text-xs text-[var(--muted)]">
            Hex code
          </label>
          <input
            id={`${name}-hex`}
            name={name}
            type="text"
            value={hexDraft.value}
            onChange={handleHexColor}
            onBlur={handleBlur}
            onInvalid={handleInvalidHexColor}
            pattern="#[0-9a-fA-F]{6}"
            required
            maxLength={7}
            placeholder="#6366f1"
            autoComplete="off"
            spellCheck={false}
            className={`min-h-11 w-full min-w-0 rounded-xl border bg-[var(--surface)] px-3 py-2 font-mono text-sm uppercase text-[var(--ink)] outline-none focus:border-[var(--brand)] ${
              errorMessage ? "border-[var(--negative)]" : "border-[var(--line)]"
            }`}
          />
        </div>
      </div>

      {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
    </fieldset>
  );
};

export default ColorPicker;
