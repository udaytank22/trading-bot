import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder,
  className = "",
  labelClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const calendarRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const selectedDate = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  useEffect(() => {
    if (isOpen) {
      setViewDate(selectedDate || new Date());
    }
  }, [isOpen, value]);

  const updateCoords = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const calendarHeight = calendarRef.current
      ? calendarRef.current.offsetHeight
      : 230;

    const calendarWidth = Math.max(rect.width, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldOpenUpward =
      spaceBelow < calendarHeight && spaceAbove > spaceBelow;

    let left = rect.left;

    if (left + calendarWidth > window.innerWidth) {
      left = rect.right - calendarWidth;
    }

    if (left < 4) {
      left = 4;
    }

    setCoords({
      top: shouldOpenUpward
        ? rect.top - calendarHeight - 4
        : rect.bottom + 4,
      left,
      width: calendarWidth,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) updateCoords();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedContainer =
        containerRef.current && containerRef.current.contains(event.target);

      const clickedCalendar =
        calendarRef.current && calendarRef.current.contains(event.target);

      if (!clickedContainer && !clickedCalendar) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
    );
  };

  const handleSelectDay = (day, isCurrentMonth, offset) => {
    let targetYear = viewDate.getFullYear();
    let targetMonth = viewDate.getMonth();

    if (!isCurrentMonth) {
      targetMonth += offset;
    }

    const newDate = new Date(targetYear, targetMonth, day);
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, "0");
    const dd = String(newDate.getDate()).padStart(2, "0");

    onChange({
      target: {
        name,
        value: `${yyyy}-${mm}-${dd}`,
      },
    });

    setIsOpen(false);
  };

  const formatDateDisplay = (date) => {
    if (!date) return "";

    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const gridCells = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    gridCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      offset: -1,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push({
      day: i,
      isCurrentMonth: true,
      offset: 0,
    });
  }

  const remainingCells = 42 - gridCells.length;

  for (let i = 1; i <= remainingCells; i++) {
    gridCells.push({
      day: i,
      isCurrentMonth: false,
      offset: 1,
    });
  }

  const defaultLabelClass =
    "block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2";

  const inputClass =
    "w-full h-[35px] rounded-lg px-3.5 pr-10 text-sm bg-white dark:bg-[#0f1117] border border-gray-300 dark:border-[#2f3441] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-[#464c5c] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-left flex items-center justify-between cursor-pointer";

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className={twMerge(defaultLabelClass, labelClassName)}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={twMerge(inputClass, className)}
      >
        <span
          className={
            !selectedDate
              ? "text-gray-400 dark:text-gray-500 font-normal"
              : ""
          }
        >
          {selectedDate
            ? formatDateDisplay(selectedDate)
            : placeholder || "Select date"}
        </span>

        <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={calendarRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
            className="
              z-[999999]
              bg-white dark:bg-[#1a1d23]
              border border-gray-200 dark:border-[#2a2d33]
              rounded-xl shadow-xl
              p-2.5
              select-none
              animate-in fade-in zoom-in-95 duration-100
            "
          >
            <div className="flex items-center justify-between mb-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="
                  p-1 rounded-md
                  text-gray-500 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-[#242830]
                  transition-colors
                "
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                {MONTHS[month]} {year}
              </h4>

              <button
                type="button"
                onClick={handleNextMonth}
                className="
                  p-1 rounded-md
                  text-gray-500 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-[#242830]
                  transition-colors
                "
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center mb-0.5">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-[10px] font-bold text-gray-400 dark:text-gray-500 py-0.5"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {gridCells.map((cell, idx) => {
                const cellDate = new Date(
                  year,
                  month + cell.offset,
                  cell.day
                );

                const isSelected =
                  selectedDate &&
                  selectedDate.getFullYear() === cellDate.getFullYear() &&
                  selectedDate.getMonth() === cellDate.getMonth() &&
                  selectedDate.getDate() === cellDate.getDate();

                const today = new Date();

                const isToday =
                  today.getFullYear() === cellDate.getFullYear() &&
                  today.getMonth() === cellDate.getMonth() &&
                  today.getDate() === cellDate.getDate();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      handleSelectDay(
                        cell.day,
                        cell.isCurrentMonth,
                        cell.offset
                      )
                    }
                    className={twMerge(
                      "h-8 text-xs font-semibold rounded-md flex items-center justify-center transition-colors cursor-pointer",
                      cell.isCurrentMonth
                        ? "text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#242830]"
                        : "text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-[#1f222b]",
                      isToday &&
                      !isSelected &&
                      "border border-purple-500/50 text-purple-600 dark:text-purple-400",
                      isSelected &&
                      "bg-purple-600 hover:bg-purple-500 text-white font-bold"
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}