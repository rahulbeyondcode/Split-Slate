import { useId, useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";

import type { DateTimeParts } from "@/shared/utils/date-time-input";
import { composeLocalDateTime, parseLocalDateTime } from "@/shared/utils/date-time-input";

interface PropsType {
  defaultDate: string;
}

const WhenPicker = ({ defaultDate }: PropsType) => {
  const { control } = useFormContext<{ when: string }>();
  const { field, fieldState } = useController({ name: "when", control });
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const timeLabelId = useId();
  const [parts, setParts] = useState(() => {
    const initial = parseLocalDateTime(field.value);
    return { ...initial, date: field.value ? initial.date : defaultDate };
  });

  const updateParts = (patch: Partial<DateTimeParts>) => {
    const next = { ...parts, ...patch };
    setParts(next);
    field.onChange(composeLocalDateTime(next));
  };
  const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hour = event.target.value;
    updateParts({ hour });
    if (/^[2-9]$/.test(hour) || /^(0[1-9]|1[0-2])$/.test(hour)) minuteRef.current?.focus();
  };
  const handleMinuteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateParts({ minute: event.target.value });
  };
  const handleMinuteKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace" || event.currentTarget.value !== "") return;
    event.preventDefault();
    const hour = hourRef.current;
    if (!hour) return;
    hour.focus();
    const end = hour.value.length;
    hour.setSelectionRange(end, end);
  };
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateParts({ date: event.target.value });
  };
  const handleHourBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const hour = event.currentTarget.value;
    if (/^\d{1,2}$/.test(hour) && Number(hour) >= 1 && Number(hour) <= 12)
      updateParts({ hour: hour.padStart(2, "0") });
    field.onBlur();
  };
  const handleMinuteBlur = () => {
    if (/^\d{1,2}$/.test(parts.minute) && Number(parts.minute) <= 59)
      updateParts({ minute: parts.minute.padStart(2, "0") });
    field.onBlur();
  };
  const handleAM = () => updateParts({ period: "AM" });
  const handlePM = () => updateParts({ period: "PM" });
  const handleUseCurrentTime = () => {
    const now = new Date();
    updateParts({
      hour: String(now.getHours() % 12 || 12).padStart(2, "0"),
      minute: String(now.getMinutes()).padStart(2, "0"),
      period: now.getHours() < 12 ? "AM" : "PM",
    });
  };

  return (
    <fieldset className="min-w-0">
      <legend className="field-label">Date and time</legend>
      <div className="when-picker">
        <label className="when-picker-field">
          <span className="when-picker-caption">Date</span>
          <input
            type="date"
            value={parts.date}
            onChange={handleDateChange}
            onBlur={field.onBlur}
            aria-invalid={fieldState.error ? true : undefined}
            data-empty={!parts.date ? true : undefined}
            className="form-input when-picker-date"
          />
        </label>
        <div className="when-picker-field">
          <div className="flex items-center justify-between gap-2">
            <span className="when-picker-caption" id={timeLabelId}>
              Time
            </span>
            <button
              type="button"
              onClick={handleUseCurrentTime}
              className="text-xs font-bold text-[var(--brand-ink)] hover:underline"
            >
              Use current time
            </button>
          </div>
          <div className="when-picker-time" role="group" aria-labelledby={timeLabelId}>
            <input
              ref={hourRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={parts.hour}
              onChange={handleHourChange}
              onBlur={handleHourBlur}
              aria-label="Hour"
              aria-invalid={fieldState.error ? true : undefined}
              placeholder="hh"
              className="when-picker-number"
            />
            <span aria-hidden="true" className="when-picker-colon">
              :
            </span>
            <input
              ref={minuteRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={parts.minute}
              onChange={handleMinuteChange}
              onKeyDown={handleMinuteKeyDown}
              onBlur={handleMinuteBlur}
              aria-label="Minute"
              aria-invalid={fieldState.error ? true : undefined}
              placeholder="mm"
              className="when-picker-number"
            />
            <span className="when-picker-period" aria-label="AM or PM">
              <button
                type="button"
                onClick={handleAM}
                aria-pressed={parts.period === "AM"}
                className="when-picker-period-button"
              >
                AM
              </button>
              <button
                type="button"
                onClick={handlePM}
                aria-pressed={parts.period === "PM"}
                className="when-picker-period-button"
              >
                PM
              </button>
            </span>
          </div>
        </div>
      </div>
      {fieldState.error && (
        <p role="alert" className="mt-1 text-xs money-negative">
          {fieldState.error.message}
        </p>
      )}
    </fieldset>
  );
};

export default WhenPicker;
