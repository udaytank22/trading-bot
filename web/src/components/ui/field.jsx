import React from "react";
import { twMerge } from "tailwind-merge";

export default function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  className = "",
  labelClassName = "",
  ...props
}) {
  const defaultLabelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2";
  const defaultInputClass = "w-full h-[35px] rounded-lg px-3.5 text-sm bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-[#464c5c] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20";

  return (
    <div>
      {label && (
        <label className={twMerge(defaultLabelClass, labelClassName)}>
          {label}
        </label>
      )}

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder !== undefined ? placeholder : (label ? `Enter ${label}` : "")}
        className={twMerge(defaultInputClass, className)}
        {...props}
      />
    </div>
  );
}
