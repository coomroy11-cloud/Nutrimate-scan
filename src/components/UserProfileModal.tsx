import React, { useState } from 'react';
import {
  X,
  LogOut,
  Mail,
  Shield,
  Activity,
  Heart,
  AlertTriangle,
  Pill,
  Sparkles,
  Type,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHealthModal: () => void;
  onFontSizeChange: (size: 'normal' | 'large' | 'huge') => void;
  currentFontSize: 'normal' | 'large' | 'huge';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenHealthModal,
  onFontSizeChange,
  currentFontSize,
}) => {
  const { currentUser, userProfile, logout, authProviderName, updateUserProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    console.log('[UserProfileModal] User confirmed logout. Executing logout()...');
    setIsLoggingOut(true);
    try {
      await logout();
      console.log('[UserProfileModal] Logout succeeded. Closing modal...');
      onClose();
    } catch (e) {
      console.error('[UserProfileModal] Error during logout:', e);
    } finally {
      setIsLoggingOut(false);
      setShowConfirmLogout(false);
    }
  };

  const getProviderDisplay = () => {
    switch (authProviderName) {
      case 'google':
        return {
          name: 'Google Account',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'facebook':
        return {
          name: 'Facebook Account',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      default:
        return {
          name: 'Email & Password',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    }
  };

  const provider = getProviderDisplay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <h3 className="font-bold text-sm">ข้อมูลบัญชีผู้ใช้งาน</h3>
          </div>
          <button
            onClick={() => {
              setShowConfirmLogout(false);
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* User Profile Card */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={userProfile.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold text-base flex items-center justify-center ring-2 ring-emerald-200 shrink-0">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-900 truncate">
                {userProfile.name}
              </h4>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{userProfile.email || currentUser?.email || 'ไม่มีอีเมล'}</span>
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${provider.bg}`}
                >
                  {provider.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {userProfile.role}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Health Summary */}
          <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>ประวัติสุขภาพของคุณ</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenHealthModal();
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                แก้ไข
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-start gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>โรคประจำตัว:</strong>{' '}
                  {userProfile.diseases && userProfile.diseases.length > 0
                    ? userProfile.diseases.join(', ')
                    : 'ไม่มี'}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>แพ้ (อาหาร/ยา):</strong>{' '}
                  {userProfile.allergies && userProfile.allergies.length > 0
                    ? userProfile.allergies.join(', ')
                    : 'ไม่มี'}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <Pill className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong>ยาประจำ:</strong>{' '}
                  {userProfile.medications && userProfile.medications.length > 0
                    ? userProfile.medications.join(', ')
                    : 'ไม่มี'}
                </span>
              </div>
            </div>
          </div>

          {/* Elderly Mode Toggle */}
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">
                  โหมดผู้สูงอายุ {userProfile.elderlyMode && <span className="text-amber-700 font-extrabold">(เปิดอยู่)</span>}
                </div>
                <div className="text-[10px] text-slate-500">
                  AI อธิบายเข้าใจง่าย ตัวหนังสือชัดเจน พร้อมเสียงอ่าน
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextElderly = !userProfile.elderlyMode;
                const nextSize = nextElderly && currentFontSize === 'normal' ? 'large' : currentFontSize;
                if (nextSize !== currentFontSize) {
                  onFontSizeChange(nextSize);
                }
                updateUserProfile({ elderlyMode: nextElderly, fontSize: nextSize });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                userProfile.elderlyMode ? 'bg-amber-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  userProfile.elderlyMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Type className="w-3.5 h-3.5 text-slate-500" />
                <span>ขนาดตัวอักษรทั้งแอป</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700">
                {currentFontSize === 'huge' ? 'ใหญ่พิเศษ (21.5px)' : currentFontSize === 'large' ? 'ใหญ่ (18.5px)' : 'ปกติ (16px)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['normal', 'large', 'huge'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onFontSizeChange(s)}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    currentFontSize === s
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s === 'normal' ? 'ก (ปกติ)' : s === 'large' ? 'ก+ (ใหญ่)' : 'ก++ (ใหญ่มาก)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions (Direct in-app confirmation without native confirm dialog) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          {showConfirmLogout ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="text-xs font-bold">คุณต้องการออกจากระบบหรือไม่?</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmLogout(false)}
                  disabled={isLoggingOut}
                  className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{isLoggingOut ? 'กำลังออก...' : 'ยืนยันออกจากระบบ'}</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmLogout(true)}
              disabled={isLoggingOut}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
