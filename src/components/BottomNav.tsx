import React from 'react';
import { Camera, Search, Activity, History, MessageCircleQuestion } from 'lucide-react';

export type TabType = 'scan' | 'fda' | 'health' | 'history' | 'help';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  historyCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  historyCount,
}) => {
  const tabs = [
    {
      id: 'scan' as TabType,
      label: 'สแกน',
      icon: Camera,
    },
    {
      id: 'fda' as TabType,
      label: 'ตรวจ อย.',
      icon: Search,
    },
    {
      id: 'health' as TabType,
      label: 'สุขภาพ',
      icon: Activity,
    },
    {
      id: 'history' as TabType,
      label: 'ประวัติ',
      icon: History,
      badge: historyCount > 0 ? historyCount : undefined,
    },
    {
      id: 'help' as TabType,
      label: 'ช่วยเหลือ',
      icon: MessageCircleQuestion,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100/90 shadow-lg">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-emerald-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'text-emerald-600 font-bold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
