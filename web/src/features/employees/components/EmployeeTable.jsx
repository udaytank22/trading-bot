/**
 * @file EmployeeTable.jsx (Rendered as a Grid now to match design)
 * @description Employee Grid for the Employees module.
 *
 * @author TradeMind Dev Team
 */

import React, { useState, useRef, useEffect } from "react";
import { StatusBadge } from '@components/ui';

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

function DotsIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

function EmployeeCard({ emp, onEdit, onDelete, onView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl p-6 relative flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
      
      {/* 3 Dots Menu */}
      {(onEdit || onDelete) && (
        <div className="absolute top-4 right-4" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2d33] transition-colors"
          >
            <DotsIcon />
          </button>
          
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-[#242830] border border-gray-100 dark:border-[#333842] shadow-xl rounded-xl z-20 py-1 overflow-hidden">
              {onEdit && (
                <button 
                  onClick={() => { setMenuOpen(false); onEdit(emp); }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2d33] hover:text-blue-600 transition-colors"
                >
                  <EditIcon /> Edit
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={() => { setMenuOpen(false); onDelete(emp.id); }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <DeleteIcon /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Avatar Circle */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-2xl shadow-inner mb-4 relative overflow-hidden border border-white dark:border-[#2a2d33] ring-4 ring-gray-50 dark:ring-[#16191f]">
        {emp.avatar}
      </div>

      {/* Name and Role */}
      <h3 
        onClick={() => onView(emp)}
        className="text-gray-900 dark:text-white font-bold text-sm text-center leading-tight cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        {emp.name}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-1 text-center font-medium">
        {emp.role}
      </p>

      {/* Badges */}
      <div className="mt-5 flex items-center justify-center gap-2">
        <StatusBadge status={emp.status} />
        <span className="px-2.5 py-1 bg-[#f4efff] dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
          {emp.department}
        </span>
      </div>

    </div>
  );
}

export default function EmployeeTable({ employees, onEdit, onDelete, onView }) {
  if (!employees || employees.length === 0) {
    return null; // Handled by empty state in parent
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-gray-50/30 dark:bg-transparent">
      {employees.map((emp) => (
        <EmployeeCard 
          key={emp.id} 
          emp={emp} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          onView={onView} 
        />
      ))}
    </div>
  );
}
