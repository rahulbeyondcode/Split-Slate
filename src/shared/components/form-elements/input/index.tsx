import type { ChangeEvent } from "react";
import { useController, useFormContext } from "react-hook-form";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  wrapperClass?: string;
  sanitize?: (value: string) => string;
  onValueChange?: (value: string) => void;
}

const Input = ({
  name,
  wrapperClass = "",
  className = "",
  sanitize,
  onValueChange,
  ...props
}: InputProps) => {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitize ? sanitize(event.target.value) : event.target.value;
    field.onChange(sanitize ? value : event);
    onValueChange?.(value);
  };

  return (
    <div className={`flex flex-col gap-1 ${wrapperClass}`}>
      <input
        {...props}
        {...field}
        disabled={props.disabled ?? field.disabled}
        onChange={handleChange}
        aria-invalid={fieldState.error ? true : undefined}
        data-empty={props.type === "date" && !field.value ? true : undefined}
        className={`form-input ${className}`}
      />
      {fieldState.error && (
        <p role="alert" className="text-xs money-negative">
          {fieldState.error.message}
        </p>
      )}
    </div>
  );
};

export default Input;
