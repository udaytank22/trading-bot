import React, { useState } from 'react';
import { useToast } from '@hooks/useToast';
import { confirmAction } from '@utils/swal';
import Toast from '@components/ui/toast';
import { Shield, Lock, RotateCcw, Check, CheckSquare, Search } from 'lucide-react';
import { inputCls } from './shared';

const ROLES = [
  "Super Admin",
  "Admin",
  "Manager",
  "Sales Team",
  "Purchase Team",
  "Accounts Team",
  "Inventory Team",
  "HR Team",
  "Employee",
  "Viewer"
];

const MODULES = [
  "Dashboard",
  "Inquiry",
  "Quotation",
  "Purchase",
  "Sales",
  "Products",
  "Inventory / Stock",
  "Clients",
  "Vendors",
  "Employees",
  "Documents",
  "Reports",
  "Notifications",
  "Settings"
];

const ACTIONS = ["View", "Create", "Edit", "Delete", "Export", "Approve"];

// Helper to get default permissions mapping
const getDefaultPermissions = () => {
  const permissions = {};
  ROLES.forEach(role => {
    permissions[role] = {};
    MODULES.forEach(module => {
      permissions[role][module] = {
        View: false,
        Create: false,
        Edit: false,
        Delete: false,
        Export: false,
        Approve: false
      };

      if (role === "Super Admin" || role === "Admin") {
        ACTIONS.forEach(act => permissions[role][module][act] = true);
      } else if (role === "Viewer") {
        if (module !== "Settings") {
          permissions[role][module].View = true;
        }
      } else if (role === "Manager") {
        ACTIONS.forEach(act => {
          if (act !== "Delete") permissions[role][module][act] = true;
        });
      } else if (role === "Sales Team") {
        const salesModules = ["Dashboard", "Inquiry", "Quotation", "Sales", "Clients", "Products", "Documents", "Notifications"];
        if (salesModules.includes(module)) {
          permissions[role][module].View = true;
          if (module !== "Dashboard" && module !== "Notifications") {
            permissions[role][module].Create = true;
            permissions[role][module].Edit = true;
            permissions[role][module].Export = true;
          }
        }
      } else if (role === "Purchase Team") {
        const purchaseModules = ["Dashboard", "Purchase", "Vendors", "Products", "Documents", "Notifications"];
        if (purchaseModules.includes(module)) {
          permissions[role][module].View = true;
          if (module !== "Dashboard" && module !== "Notifications") {
            permissions[role][module].Create = true;
            permissions[role][module].Edit = true;
            permissions[role][module].Export = true;
          }
        }
      } else if (role === "Accounts Team") {
        const accountsModules = ["Dashboard", "Purchase", "Sales", "Clients", "Vendors", "Documents", "Reports", "Notifications"];
        if (accountsModules.includes(module)) {
          permissions[role][module].View = true;
          if (module !== "Dashboard" && module !== "Notifications") {
            permissions[role][module].Create = true;
            permissions[role][module].Edit = true;
            permissions[role][module].Export = true;
            permissions[role][module].Approve = true;
          }
        }
      } else if (role === "Inventory Team") {
        const invModules = ["Dashboard", "Inventory / Stock", "Products", "Documents", "Notifications"];
        if (invModules.includes(module)) {
          permissions[role][module].View = true;
          if (module !== "Dashboard" && module !== "Notifications") {
            permissions[role][module].Create = true;
            permissions[role][module].Edit = true;
            permissions[role][module].Export = true;
          }
        }
      } else if (role === "HR Team") {
        const hrModules = ["Dashboard", "Employees", "Documents", "Notifications"];
        if (hrModules.includes(module)) {
          permissions[role][module].View = true;
          if (module !== "Dashboard" && module !== "Notifications") {
            permissions[role][module].Create = true;
            permissions[role][module].Edit = true;
            permissions[role][module].Export = true;
            permissions[role][module].Approve = true;
          }
        }
      } else if (role === "Employee") {
        const empModules = ["Dashboard", "Notifications", "Documents"];
        if (empModules.includes(module)) {
          permissions[role][module].View = true;
          if (module === "Documents") {
            permissions[role][module].Create = true;
          }
        }
      }
    });
  });
  return permissions;
};

function PermissionSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${checked
          ? 'bg-emerald-500 dark:bg-emerald-600'
          : 'bg-gray-200 dark:bg-gray-800'
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'
          }`}
      />
    </button>
  );
}

export default function RolePermissionsTab() {
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('erp_role_permissions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved permissions", e);
      }
    }
    return getDefaultPermissions();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoles, setExpandedRoles] = useState(new Set(['Super Admin']));
  const { toast, showToast } = useToast(2500);

  const toggleRoleExpand = (role) => {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const handleTogglePermission = (role, module, action) => {
    if (role === 'Super Admin') return;
    setPermissions(prev => {
      const next = { ...prev };
      next[role] = { ...next[role] };
      next[role][module] = { ...next[role][module] };
      next[role][module][action] = !next[role][module][action];
      return next;
    });
  };

  const handleSelectAll = (role) => {
    if (role === 'Super Admin') return;
    setPermissions(prev => {
      const next = { ...prev };
      next[role] = { ...next[role] };
      MODULES.forEach(module => {
        next[role][module] = { ...next[role][module] };
        ACTIONS.forEach(action => {
          next[role][module][action] = true;
        });
      });
      return next;
    });
  };

  const handleResetRole = async (role) => {
    if (role === 'Super Admin') return;
    const isConfirmed = await confirmAction({
      title: `Reset ${role} Access?`,
      text: `Reset permissions for the "${role}" role back to default?`,
      confirmButtonText: 'Yes, reset it'
    });
    if (!isConfirmed) return;

    const defaults = getDefaultPermissions();
    setPermissions(prev => {
      const next = { ...prev };
      next[role] = defaults[role];
      return next;
    });
    showToast(`${role} access reset to default`, 'success');
  };

  const handleResetAll = async () => {
    const isConfirmed = await confirmAction({
      title: 'Reset All Roles?',
      text: 'Are you sure you want to reset all roles permissions to their defaults?',
      confirmButtonText: 'Yes, reset all!'
    });
    if (!isConfirmed) return;

    setPermissions(getDefaultPermissions());
    showToast('All role permissions reset to default', 'success');
  };

  const handleSaveChanges = () => {
    localStorage.setItem('erp_role_permissions', JSON.stringify(permissions));
    showToast('Permissions saved successfully!', 'success');
  };

  const getAllowedModulesCount = (role) => {
    let count = 0;
    MODULES.forEach(module => {
      const perms = permissions[role]?.[module] || {};
      if (ACTIONS.some(act => perms[act])) {
        count++;
      }
    });
    return count;
  };

  const filteredRoles = ROLES.filter(role => {
    const matchesRoleName = role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModuleName = MODULES.some(module =>
      module.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesRoleName || matchesModuleName;
  });

  return (
    <div className="flex flex-col w-full h-full pb-24 animate-fade-in">
      <Toast message={toast.message} type={toast.type} />

      {/* Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Role Access Control</h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            Configure system module permissions separately for each user role. Access includes view, create, edit, delete, export, and approve actions.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search roles or modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-xl h-10 pl-10 pr-4 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Reset All Global Action */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleResetAll}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All Roles Access
        </button>
      </div>

      {/* Accordion Cards */}
      <div className="flex flex-col gap-4">
        {filteredRoles.map(role => {
          const isExpanded = expandedRoles.has(role);
          const allowedCount = getAllowedModulesCount(role);

          const filteredModules = MODULES.filter(module => {
            const matchesRole = role.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesModule = module.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesRole || matchesModule;
          });

          let badgeText = "Custom Permissions";
          let badgeCls = "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";

          if (role === "Super Admin") {
            badgeText = "System Admin (Locked)";
            badgeCls = "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/60";
          } else if (role === "Admin") {
            badgeText = "Full Access";
            badgeCls = "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
          } else if (role === "Viewer") {
            badgeText = "Read Only default";
            badgeCls = "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
          }

          return (
            <div
              key={role}
              className={`bg-white dark:bg-[#1a1d23] border rounded-2xl shadow-sm transition-all duration-300 ${isExpanded
                  ? 'border-purple-500/40 dark:border-purple-500/30 ring-1 ring-purple-500/10'
                  : 'border-gray-200 dark:border-[#2a2d33] hover:border-gray-300 dark:hover:border-[#3a3d46]'
                }`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleRoleExpand(role)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left focus:outline-none"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${role === "Super Admin" ? "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400" :
                        role === "Admin" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" :
                          "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                      }`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white text-base">{role}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${badgeCls}`}>
                    {badgeText}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Access Summary</span>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{allowedCount} / {MODULES.length} Modules Allowed</span>
                  </div>
                  <div className={`transform transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Accordion Expanded Content */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden`}
                style={{
                  maxHeight: isExpanded ? '2000px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                  pointerEvents: isExpanded ? 'auto' : 'none',
                  transition: 'all 300ms ease-in-out'
                }}
              >
                <div className="px-6 pb-6 border-t border-gray-100 dark:border-[#2a2d33]/60 pt-4 flex flex-col gap-4">

                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#2a2d33]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">Quick Actions:</span>
                      <button
                        onClick={() => handleSelectAll(role)}
                        disabled={role === "Super Admin"}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors border border-purple-200 dark:border-purple-800/40 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Select All Permissions
                      </button>
                      <button
                        onClick={() => handleResetRole(role)}
                        disabled={role === "Super Admin"}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-red-200 dark:border-red-800/40 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Role Access
                      </button>
                    </div>
                    {role === "Super Admin" && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-3 py-1.5 rounded-lg border border-purple-200/50 dark:border-purple-800/20">
                        <Lock className="w-3.5 h-3.5" />
                        Permissions managed and locked by system
                      </div>
                    )}
                  </div>

                  {/* Modules permissions list */}
                  {filteredModules.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      No modules match the search filter inside this role.
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-[#2a2d33] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                              <th className="py-3 pl-2">Module Name</th>
                              {ACTIONS.map(action => (
                                <th key={action} className="py-3 text-center">{action}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredModules.map((module) => {
                              const modulePerms = permissions[role]?.[module] || {};

                              return (
                                <tr
                                  key={module}
                                  className={`border-b border-gray-50 dark:border-[#2a2d33]/50 hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors`}
                                >
                                  <td className="py-3.5 pl-2 font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                    {module}
                                  </td>
                                  {ACTIONS.map(action => {
                                    const checked = !!modulePerms[action];
                                    const disabled = role === "Super Admin";
                                    return (
                                      <td key={action} className="py-3.5 text-center">
                                        <div className="flex justify-center">
                                          <PermissionSwitch
                                            checked={checked}
                                            disabled={disabled}
                                            onChange={() => handleTogglePermission(role, module, action)}
                                          />
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards View */}
                      <div className="block md:hidden flex flex-col gap-3">
                        {filteredModules.map(module => {
                          const modulePerms = permissions[role]?.[module] || {};
                          return (
                            <div
                              key={module}
                              className="bg-gray-50 dark:bg-[#16191f] border border-gray-100 dark:border-[#2a2d33]/70 rounded-xl p-4 flex flex-col gap-3"
                            >
                              <div className="font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200/50 dark:border-gray-700/50 pb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                {module}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {ACTIONS.map(action => {
                                  const checked = !!modulePerms[action];
                                  const disabled = role === "Super Admin";
                                  return (
                                    <div key={action} className="flex items-center justify-between bg-white dark:bg-[#1a1d23] border border-gray-100 dark:border-[#2a2d33] rounded-lg p-2 px-3">
                                      <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{action}</span>
                                      <PermissionSwitch
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={() => handleTogglePermission(role, module, action)}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed bottom-right save bar */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={handleSaveChanges}
          className="h-11 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wide rounded-xl shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center gap-2 border border-purple-500 dark:border-purple-600/40"
        >
          <Check className="w-4 h-4" />
          Save Changes
        </button>
      </div>

    </div>
  );
}
