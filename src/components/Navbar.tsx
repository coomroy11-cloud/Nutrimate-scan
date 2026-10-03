import React from 'react';
import { LogIn, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { AppIconBadge } from './AppLogo';

interface NavbarProps {
  userProfile: UserProfile;
  onOpenProfile?: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
  onFontSizeChange?: (size: 'normal' | 'large' | 'huge') => void;
  currentFontSize?: 'normal' | 'large' | 'huge';
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  onOpenAuth,
  isLoggedIn,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Logo and Brand with new Custom App Icon Badge */}
        <div className="flex items-center gap-2.5">
          <AppIconBadge size="sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-800 tracking-tight flex items-center">
                Nutri<span className="text-emerald-600">Med</span>
              </span>
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                Scan AI
              </span>
            </div>
            <div className="text-[10px] text-emerald-700/80 font-medium flex items-center gap-1">
              <span>มาตรฐาน อย. ไทย</span>
              {userProfile.elderlyMode && (
                <span className="bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold text-[9px] flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> โหมดสูงวัย
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right Login Feature (ฟีเจอร์เข้าสู่ระบบ) */}
        <div>
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs shadow-emerald-500/25 transition-all active:scale-95 group"
            title="เข้าสู่ระบบ / สลับบัญชีทดสอบ"
          >
            <LogIn className="w-3.5 h-3.5 stroke-[2.4] group-hover:translate-x-0.5 transition-transform" />
            <span className="tracking-tight">
              {isLoggedIn ? (
                <span className="flex items-center gap-1">
                  <span>เข้าสู่ระบบ</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
                </span>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
