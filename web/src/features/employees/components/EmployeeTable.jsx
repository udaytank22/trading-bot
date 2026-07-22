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

  // Determine colors for the status pill to match the mockup
  const getStatusColors = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'active') {
      return "bg-[#E4F2E6] dark:bg-[#3b7f43]/15 text-[#3B7F43] dark:text-[#88d991]";
    }
    // "On leave", "Inactive", etc.
    return "bg-[#FDF2E2] dark:bg-[#b26b22]/15 text-[#B26B22] dark:text-[#e9a45e]";
  };

  return (
    <div className="bg-white dark:bg-[#16191f] border border-[#E6DFD5] dark:border-[#2c303b] rounded-[20px] p-6 relative flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
      
      {/* 3 Dots Menu */}
      {(onEdit || onDelete) && (
        <div className="absolute top-4 right-4" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2c303b] transition-colors"
          >
            <DotsIcon />
          </button>
          
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-[#242830] border border-gray-100 dark:border-[#333842] shadow-xl rounded-xl z-20 py-1 overflow-hidden">
              {onEdit && (
                <button 
                  onClick={() => { setMenuOpen(false); onEdit(emp); }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2d33] hover:text-[#0b5e5f] transition-colors"
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

      {/* Avatar Circle - Styled as soft teal with darker text */}
      <div className="w-14 h-14 rounded-full bg-[#E5F2F2] dark:bg-[#0A5D5E]/20 flex items-center justify-center text-[#0B5E5F] dark:text-[#52c1c3] font-bold text-lg flex-shrink-0 select-none">
        {emp.avatar}
      </div>

      {/* Info & Badges */}
      <div className="flex-1 min-w-0 flex flex-col pr-4">
        <h3 
          onClick={() => onView(emp)}
          className="text-[#1e2229] dark:text-white font-bold text-[15px] hover:text-[#0b5e5f] dark:hover:text-[#52c1c3] transition-colors cursor-pointer truncate leading-snug"
        >
          {emp.name}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium truncate mt-0.5">
          {emp.role || 'Employee'}
        </p>

        {/* Badges Row */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Department Badge */}
          <span className="px-2.5 py-0.5 bg-[#FAF1E6] dark:bg-[#A67B5B]/15 text-[#9E6D3B] dark:text-[#dfb28e] rounded-md text-[10px] font-bold tracking-wide uppercase">
            {emp.department || 'Staff'}
          </span>
          {/* Status Badge */}
          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${getStatusColors(emp.status)}`}>
            {emp.status}
          </span>
        </div>
      </div>

    </div>
  );
}

export default function EmployeeTable({ employees, onEdit, onDelete, onView }) {
  if (!employees || employees.length === 0) {
    return null; // Handled by empty state in parent
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-2 bg-transparent">
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

