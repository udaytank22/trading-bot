import React, { useEffect } from "react";

const modalBg = "bg-white dark:bg-[#1b1d24]";
const panelBg = "bg-gray-50 dark:bg-[#1f222b]";
const fieldBg = "bg-white dark:bg-[#0f1117]";
const borderColor = "border-gray-200 dark:border-[#2f3441]";

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  onSubmit,
  submitLabel = "Confirm",
  cancelLabel = "Discard",
  onExcelUpload,
  maxWidthClass = "max-w-7xl",
  children,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <>
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[100] transition-all duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 ${
          isOpen ? "" : "pointer-events-none"
        }`}
      >
        <form
          onSubmit={handleSubmit}
          className={`
            w-full ${maxWidthClass} h-full max-h-[92vh]
            ${modalBg}
            rounded-2xl border ${borderColor}
            shadow-2xl flex flex-col overflow-hidden
            transition-all duration-300
            ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          `}
        >
          {/* HEADER */}
          <div
            className={`
              px-8 py-3 border-b ${borderColor}
              ${panelBg}
              flex justify-between items-center gap-4
            `}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`
                  inline-flex items-center justify-center w-10 h-10 rounded-lg
                  ${fieldBg}
                  border border-gray-300 dark:border-[#2f3441]
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-[#171922]
                  transition
                `}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {onExcelUpload && (
              <label
                className="
                  flex items-center gap-2 px-4 py-2
                  bg-green-50 dark:bg-green-600/10
                  border border-green-200 dark:border-green-500/25
                  rounded-lg text-green-700 dark:text-green-400
                  text-xs font-bold uppercase cursor-pointer
                  hover:bg-green-600 hover:text-white
                  transition
                "
              >
                Import Excel
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={onExcelUpload}
                />
              </label>
            )}
          </div>

          {/* SCROLLABLE BODY */}
          <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${modalBg}`}>
            {children}
          </div>

          {/* FOOTER */}
          <div
            className={`
              px-8 py-3 border-t ${borderColor}
              ${panelBg}
              flex gap-3 justify-end items-center
            `}
          >
            <button
              type="button"
              onClick={onClose}
              className={`
                px-5 py-2 rounded-lg
                ${fieldBg}
                border border-gray-300 dark:border-[#2f3441]
                text-gray-700 dark:text-gray-300
                font-semibold
                hover:bg-gray-100 dark:hover:bg-[#171922]
                transition
              `}
            >
              {cancelLabel}
            </button>

            <button
              type="submit"
              className="
                rounded-lg px-5 py-2
                bg-purple-600 hover:bg-purple-500
                text-white font-bold
                transition shadow-lg shadow-purple-900/30
              "
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
