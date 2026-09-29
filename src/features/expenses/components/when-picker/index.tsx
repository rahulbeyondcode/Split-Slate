import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";

import type { ExpenseTimeParts } from "@/features/expenses/utils/expense-time";
import { composeExpenseTime, parseExpenseTime } from "@/features/expenses/utils/expense-time";

import type { ExpenseFormValues } from "@/features/expenses/types/expenses.types";

interface PropsType {
  defaultDate: string;
}

const WhenPicker = ({ defaultDate }: PropsType) => {
  const { control } = useFormContext<ExpenseFormValues>();
  const { field, fieldState } = useController({ name: "when", control });
  const [parts, setParts] = useState(() => {
    const initial = parseExpenseTime(field.value);
    return { ...initial, date: field.value ? initial.date : defaultDate };
  });

  const updateParts = (patch: Partial<ExpenseTimeParts>) => {
    const next = { ...parts, ...patch };
    setParts(next);
    field.onChange(composeExpenseTime(next));
  };
  const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateParts({ hour: event.target.value });
  };
  const handleMinuteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateParts({ minute: event.target.value });
  };
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateParts({ date: event.target.value });
  };
  const handleHourBlur = () => {
    if (/^\d{1,2}$/.test(parts.hour) && Number(parts.hour) >= 1 && Number(parts.hour) <= 12)
      updateParts({ hour: parts.hour.padStart(2, "0") });
    field.onBlur();
  };
  const handleMinuteBlur = () => {
    if (/^\d{1,2}$/.test(parts.minute) && Number(parts.minute) <= 59)
      updateParts({ minute: parts.minute.padStart(2, "0") });
    field.onBlur();
  };
  const handleAM = () => updateParts({ period: "AM" });
  const handlePM = () => updateParts({ period: "PM" });

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
            className="form-input when-picker-date"
          />
        </label>
        <div className="when-picker-field">
          <span className="when-picker-caption" id="expense-time-label">
            Time
          </span>
          <div className="when-picker-time" role="group" aria-labelledby="expense-time-label">
            <input
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
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={parts.minute}
              onChange={handleMinuteChange}
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
