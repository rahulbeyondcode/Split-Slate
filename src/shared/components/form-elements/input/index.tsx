import { useController, useFormContext } from "react-hook-form";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  wrapperClass?: string;
}

const Input = ({ name, wrapperClass = "", className = "", ...props }: InputProps) => {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });

  return (
    <div className={`flex flex-col gap-1 ${wrapperClass}`}>
      <input
        {...props}
        {...field}
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
