import React, { useState, useEffect } from 'react';
import { Shield, Bell, LogOut } from 'lucide-react';

interface HeaderProps {
  activeAlertsCount?: number;
  onLogout?: () => void;
  onOpenAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeAlertsCount = 2,
  onLogout,
  onOpenAlerts,
}) => {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // e.g. "08 Oct 2026"
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      // e.g. "10:24 AM"
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setFormattedDate(dateStr);
      setFormattedTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-oat-50/90 backdrop-blur-md border-b border-oat-300 px-6 py-2.5 sticky top-0 z-30 flex items-center justify-between shadow-xs select-none">
      
      {/* Left: Brand Icon + Brand Name + Welcome Warden title */}
      <div className="flex items-center space-x-6">
        
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4 stroke-[2.4]" />
          </div>
          <span className="text-base font-black text-gray-950 font-sans tracking-tight">
            HostelGuard AI
          </span>
        </div>

        {/* Divider */}
        <div className="hidden md:block h-6 w-px bg-oat-300" />

        {/* Welcome Text */}
        <div className="hidden sm:block">
          <h2 className="text-xs font-bold text-gray-900 leading-tight">
            Welcome, Warden 👋
          </h2>
          <p className="text-[11px] text-gray-500 font-medium leading-none mt-0.5">
            Hostel Safety Command Center
          </p>
        </div>

      </div>

      {/* Right: Notifications, Date/Time & Warden Profile */}
      <div className="flex items-center space-x-4">
        
        {/* Live Date & Time Display (as in reference image: "08 Oct 2026 10:24 AM") */}
        <div className="hidden lg:flex items-center space-x-2 text-xs font-mono font-bold text-gray-500 bg-white px-3 py-1 rounded-xl border border-oat-300">
          <span>{formattedDate || '08 Oct 2026'}</span>
          <span className="text-gray-300">•</span>
          <span className="text-purple-900">{formattedTime || '10:24 AM'}</span>
        </div>

        {/* Notification Bell with Badge */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-oat-200/60 transition-colors"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-emergency-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Warden Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-xl hover:bg-oat-200/60 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
              W
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-gray-900 block leading-tight">
                Warden
              </span>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl border border-oat-300 shadow-xl py-2 z-50 animate-fade-in text-xs font-semibold">
              <div className="px-3.5 py-1.5 border-b border-oat-200">
                <p className="font-bold text-gray-900">Chief Warden</p>
                <p className="text-[10px] text-gray-500">On Duty • Admin</p>
              </div>
              
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  if (onLogout) onLogout();
                }}
                className="w-full px-3.5 py-2 text-left text-emergency-600 hover:bg-emergency-50 flex items-center space-x-2 font-bold transition-colors mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
