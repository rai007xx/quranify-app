import React from 'react';
import { Home, Mic2, ListMusic, BarChart2, Search } from 'lucide-react';

export type NavTab = 'home' | 'reciters' | 'playlists' | 'search' | 'insights';

interface BottomNavBarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  // Exactly 4 bottom tabs as required: Home, Reciters, Playlists, Search (no settings)
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'reciters' as NavTab, label: 'Reciters', icon: Mic2 },
    { id: 'playlists' as NavTab, label: 'Playlists', icon: ListMusic },
    { id: 'search' as NavTab, label: 'Search', icon: Search },
  ];

  return (
    <nav className="h-15 bg-[#090D18] border-t border-white/[0.08] px-2 flex items-center justify-around z-40 shrink-0 gpu-accelerated">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 group transition-all cursor-pointer relative"
          >
            {/* Active glow top pip */}
            {isActive && (
              <span className="absolute -top-1 w-8 h-[2px] bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            )}

            <Icon
              className={`w-5 h-5 transition-transform duration-200 ${
                isActive
                  ? 'text-emerald-400 scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
            <span
              className={`text-[10px] mt-1 font-medium tracking-tight transition-colors ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
