import { useAuth, useUI } from '@context';
import React, { useState } from 'react';


export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'personal', label: 'Personal Info' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="flex flex-col w-full h-full pb-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">User Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Profile Card */}
        <div className="w-full lg:w-[350px] flex flex-col gap-6">
          {/* Main Card */}
          <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm overflow-hidden transition-colors duration-300">
            <div className="h-28 bg-gradient-to-r from-purple-500 to-indigo-600 relative">
              {/* Cover image bg or gradient */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            </div>
            <div className="px-6 pb-6 relative">
              <div className="w-24 h-24 bg-white dark:bg-[#1a1d23] rounded-full p-1 border border-gray-200 dark:border-[#2a2d33] shadow-md absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <div className="w-full h-full bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center overflow-hidden">
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {(currentUser?.name || 'A')[0]}
                  </span>
                </div>
              </div>
              
              <div className="pt-14 text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentUser?.name || 'Administrator'}
                </h2>
                <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-1.5 uppercase tracking-widest">
                  {currentUser?.role || 'Admin'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-[12px] font-bold py-2 rounded-lg transition-colors shadow-sm">
                  Message
                </button>
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-[12px] font-bold py-2 rounded-lg transition-colors">
                  Connect
                </button>
              </div>
            </div>
          </div>

          {/* About Card */}
          <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm p-6 transition-colors duration-300">
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-white mb-5 uppercase tracking-wider">About Me</h3>
            
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-medium text-[13px] mb-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Email
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 pl-[26px]">{currentUser?.email || 'admin@trademind.com'}</p>
              </div>

              <div>
                <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-medium text-[13px] mb-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Phone
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 pl-[26px]">+1 (555) 123-4567</p>
              </div>

              <div>
                <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-medium text-[13px] mb-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Location
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 pl-[26px]">San Francisco, CA</p>
              </div>

              <div>
                <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-medium text-[13px] mb-2.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Skills
                </div>
                <div className="flex flex-wrap gap-2 pl-[26px]">
                  {['Management', 'Trading', 'Analytics', 'Logistics'].map(skill => (
                    <span key={skill} className="bg-gray-100 dark:bg-[#2a2d33] text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm transition-colors duration-300 flex-1 flex flex-col">
            
            {/* Tabs Header */}
            <div className="flex overflow-x-auto border-b border-gray-200 dark:border-[#2a2d33] px-4 hide-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-4 py-4 text-[13px] font-bold tracking-wide transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-purple-600 dark:bg-purple-400 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 flex-1">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'personal' && <PersonalInfoTab currentUser={currentUser} />}
              {activeTab === 'security' && <SecurityTab />}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Tab Components ----

function OverviewTab() {
  const activities = [
    { id: 1, action: 'Approved Purchase Order #1042', time: '2 hours ago', icon: '📝', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 2, action: 'Added a new supplier: Global Traders Ltd.', time: '5 hours ago', icon: '🏢', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { id: 3, action: 'Changed settings for profit margins', time: '1 day ago', icon: '⚙️', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { id: 4, action: 'Logged in from new device', time: '2 days ago', icon: '💻', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  ];

  return (
    <div className="animate-fade-in">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Recent Activity</h3>
      <div className="relative border-l-2 border-gray-100 dark:border-[#2a2d33] ml-3 pl-6 space-y-7">
        {activities.map((act) => (
          <div key={act.id} className="relative">
            <span className={`absolute -left-[41px] flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-white dark:border-[#1a1d23] ${act.color} text-[14px] shadow-sm`}>
              {act.icon}
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                {act.action}
              </span>
              <span className="text-[11px] font-medium text-gray-500 mt-1">
                {act.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalInfoTab({ currentUser }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // In a real app, you would save the profile data here
    setIsEditing(false);
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Profile Information</h3>
        {!isEditing && (
          <button 
            type="button" 
            onClick={() => setIsEditing(true)}
            className="px-4 py-1.5 text-[12px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            Edit Info
          </button>
        )}
      </div>
      <form className="space-y-6" onSubmit={handleSave}>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="First Name">
            <input type="text" className={inputCls} disabled={!isEditing} defaultValue={currentUser?.name?.split(' ')[0] || 'Admin'} />
          </Field>
          <Field label="Last Name">
            <input type="text" className={inputCls} disabled={!isEditing} defaultValue={currentUser?.name?.split(' ')[1] || 'User'} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Email Address">
            <input type="email" className={inputCls} disabled={!isEditing} defaultValue={currentUser?.email || 'admin@trademind.com'} />
          </Field>
          <Field label="Phone Number">
            <input type="tel" className={inputCls} disabled={!isEditing} defaultValue="+1 (555) 123-4567" />
          </Field>
        </div>

        <Field label="Company / Organization">
          <input type="text" className={inputCls} disabled={!isEditing} defaultValue="TradeMind Inc." />
        </Field>

        <Field label="Bio">
          <textarea rows={4} className={textareaCls} disabled={!isEditing} defaultValue="Experienced administrator managing daily trading and logistics operations." />
        </Field>

        {isEditing && (
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 text-[12px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 text-[12px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors">
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="animate-fade-in max-w-xl">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Change Password</h3>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Field label="Current Password">
          <input type="password" className={inputCls} placeholder="••••••••" />
        </Field>
        
        <div className="h-px bg-gray-100 dark:bg-[#2a2d33] my-2" />

        <Field label="New Password">
          <input type="password" className={inputCls} placeholder="Enter new password" />
        </Field>
        <Field label="Confirm New Password">
          <input type="password" className={inputCls} placeholder="Confirm new password" />
        </Field>

        <div className="pt-2 flex justify-start">
          <button type="submit" className="px-6 py-2 text-[12px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors">
            Update Password
          </button>
        </div>
      </form>
      
      <div className="mt-12 border-t border-gray-100 dark:border-[#2a2d33] pt-8">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Two-Factor Authentication</h3>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
          Add an extra layer of security to your account by enabling 2FA. Once enabled, you will be prompted to enter a code from your authenticator app when signing in.
        </p>
        <button className="px-5 py-2 text-[12px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20 rounded border border-purple-200 dark:border-purple-500/20 transition-colors">
          Enable 2FA
        </button>
      </div>
    </div>
  );
}

// ---- Helpers ----

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-[40px] px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-white/5 disabled:cursor-not-allowed';
const textareaCls = 'w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg p-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50 resize-y disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-white/5 disabled:cursor-not-allowed';
