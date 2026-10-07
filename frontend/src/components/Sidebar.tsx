import React from 'react';
import { 
  Home, 
  Video, 
  AlertTriangle, 
  LayoutGrid, 
  Settings,
  ShieldCheck
} from 'lucide-react';

export type NavTab = 'overview' | 'demo' | 'incidents' | 'cameras' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeIncidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeIncidentsCount,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }> = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'demo', label: 'AI Demo', icon: Video },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined },
    { id: 'cameras', label: 'Cameras', icon: LayoutGrid },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-52 bg-oat-50/70 border-r border-oat-300 min-h-[calc(100vh-53px)] p-3.5 flex flex-col justify-between select-none">
      
      {/* Navigation List */}
      <div className="space-y-2">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-purple-100/90 text-purple-700 shadow-xs'
                    : 'text-gray-600 hover:bg-oat-200/60 hover:text-gray-950'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-700 stroke-[2.3]' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center ${
                    isActive ? 'bg-purple-600 text-white' : 'bg-tangerine-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom System Status Card (as shown in reference image: "● System Online / All cameras operational") */}
      <div className="p-3 bg-white rounded-2xl border border-oat-300 shadow-xs space-y-1">
        <div className="flex items-center space-x-1.5 text-xs font-black text-safety-700">
          <span className="w-2 h-2 rounded-full bg-safety-500 animate-pulse" />
          <span>System Online</span>
        </div>
        <p className="text-[10px] text-gray-400 font-medium">
          All cameras operational
        </p>
      </div>

    </aside>
  );
};
