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
        className={`border rounded px-3 py-2 text-sm outline-none focus:border-gray-900 ${
          fieldState.error ? "border-red-400" : "border-gray-300"
        } ${className}`}
      />
      {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
    </div>
  );
};

export default Input;
