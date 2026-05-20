import React from "react";
import Label from "./Label";

interface Option {
  value: string | number;
  label: string;
}

interface SelectInputProps {
  name: string;
  options: Option[];
  placeholder?: string;
  defaultValue?: string | number;
  className?: string;
  required?: boolean;
  error?: boolean;
  hint?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SelectInput: React.FC<SelectInputProps> = ({
  name,
  options,
  placeholder = "Select an option",
  defaultValue = "",
  className = "",
  required = false,
  error = false,
  hint,
  value,
  onChange,
}) => {
  const selectClasses = `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
    error
      ? "border-error-500 focus:border-error-500 focus:ring-error-500/10 text-error-800 dark:text-error-400 dark:border-error-500"
      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 text-gray-800 dark:border-gray-700 dark:focus:border-brand-800"
  } ${className}`;

  return (
    <div className="relative">
      <select
        name={name}
        className={selectClasses}
        defaultValue={defaultValue !== "" && defaultValue !== undefined ? String(defaultValue) : undefined}
        value={value !== undefined ? String(value) : undefined}
        onChange={onChange}
        required={required}
      >
        <option value="" disabled className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>
      {/* Dropdown arrow icon */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          className="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {/* Hint text */}
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error ? "text-error-500" : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default SelectInput;

