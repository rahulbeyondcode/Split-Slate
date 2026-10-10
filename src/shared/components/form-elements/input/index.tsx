import type { ChangeEvent, KeyboardEvent } from "react";
import { useLayoutEffect, useRef } from "react";
import { useController, useFormContext } from "react-hook-form";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  wrapperClass?: string;
  sanitize?: (value: string) => string;
  formatValue?: (value: string) => string;
  suffix?: string;
  onValueChange?: (value: string) => void;
}

interface InputSelection {
  start: number;
  end: number;
  direction: "forward" | "backward" | "none";
}

const Input = ({
  name,
  wrapperClass = "",
  className = "",
  sanitize,
  formatValue,
  suffix,
  onValueChange,
  ...props
}: InputProps) => {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingSelection = useRef<InputSelection | null>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const selection = pendingSelection.current;
    if (input && selection && document.activeElement === input)
      input.setSelectionRange(selection.start, selection.end, selection.direction);
    pendingSelection.current = null;
  });

  const handleRef = (input: HTMLInputElement | null) => {
    inputRef.current = input;
    field.ref(input);
  };
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const raw = input.value;
    const value = sanitize ? sanitize(raw) : raw;
    if (formatValue) {
      const formatted = formatValue(value);
      const getPosition = (offset: number) => {
        const prefix = raw.slice(0, offset);
        const length = (sanitize ? sanitize(prefix) : prefix).length;
        if (!length) return 0;
        for (let index = 1; index <= formatted.length; index += 1) {
          const prefix = formatted.slice(0, index);
          if ((sanitize ? sanitize(prefix) : prefix).length >= length) return index;
        }
        return formatted.length;
      };
      if (input.selectionStart !== null && input.selectionEnd !== null) {
        pendingSelection.current = {
          start: getPosition(input.selectionStart),
          end: getPosition(input.selectionEnd),
          direction: input.selectionDirection ?? "none",
        };
      }
      input.value = formatted;
      const selection = pendingSelection.current;
      if (selection) input.setSelectionRange(selection.start, selection.end, selection.direction);
    }
    field.onChange(sanitize || formatValue ? value : event);
    onValueChange?.(value);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    props.onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      !formatValue ||
      !sanitize ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      (event.key !== "Backspace" && event.key !== "Delete")
    )
      return;
    const input = event.currentTarget;
    const start = input.selectionStart;
    if (start === null || start !== input.selectionEnd) return;
    const offset = event.key === "Backspace" ? start - 1 : start;
    const separator = input.value[offset];
    if (!separator || sanitize(separator)) return;
    // Skip display-only separators so native deletion removes the adjacent digit.
    const position = event.key === "Backspace" ? start - 1 : start + 1;
    input.setSelectionRange(position, position);
  };

  const input = (
    <input
      {...props}
      {...field}
      ref={handleRef}
      value={formatValue ? formatValue(String(field.value ?? "")) : field.value}
      disabled={props.disabled ?? field.disabled}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      aria-invalid={fieldState.error ? true : undefined}
      data-empty={props.type === "date" && !field.value ? true : undefined}
      className={`form-input ${suffix ? "!pr-6" : ""} ${className}`}
    />
  );

  return (
    <div className={`flex flex-col gap-1 ${wrapperClass}`}>
      {suffix ? (
        <div className="relative min-w-0">
          {input}
          <span
            data-input-suffix
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none text-sm text-[var(--ink)]"
          >
            {suffix}
          </span>
        </div>
      ) : (
        input
      )}
      {fieldState.error && (
        <p role="alert" className="text-xs money-negative">
          {fieldState.error.message}
        </p>
      )}
    </div>
  );
};

export default Input;
