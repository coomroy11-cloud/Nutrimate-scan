import React, { useState } from 'react';
import {
  X,
  LogIn,
  LogOut,
  Heart,
  User,
  Sparkles,
  Store,
  Microscope,
  Check,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
} from 'lucide-react';
import { UserProfile } from '../types';
import { DEMO_PROFILES } from '../data/mockData';
import { AppIconBadge } from './AppLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (profile: UserProfile) => void;
  onLogout?: () => void;
  currentProfile?: UserProfile;
  isLoggedIn?: boolean;
}

// Google Multi-Color SVG Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// Facebook Brand Blue SVG Icon
const FacebookIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onLogout,
  currentProfile,
  isLoggedIn = false,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'facebook' | null>(null);

  if (!isOpen) return null;

  // Google Login Handler
  const handleGoogleLogin = () => {
    setIsSocialLoading('google');
    setTimeout(() => {
      const googleProfile: UserProfile = {
        name: 'ผู้ใช้ Google Account',
        email: 'user.google@gmail.com',
        role: 'ผู้ใช้งาน Google',
        elderlyMode: false,
        fontSize: 'normal',
        diseases: ['ความดันโลหิตสูง (Hypertension)'],
        allergies: [],
        medications: ['Amlodipine 5mg'],
      };
      onLogin(googleProfile);
      setIsSocialLoading(null);
      onClose();
    }, 400);
  };

  // Facebook Login Handler
  const handleFacebookLogin = () => {
    setIsSocialLoading('facebook');
    setTimeout(() => {
      const facebookProfile: UserProfile = {
        name: 'ผู้ใช้ Facebook Account',
        email: 'user.facebook@facebook.com',
        role: 'ผู้ใช้งาน Facebook',
        elderlyMode: false,
        fontSize: 'normal',
        diseases: [],
        allergies: ['กุ้ง/อาหารทะเล (Seafood)'],
        medications: [],
      };
      onLogin(facebookProfile);
      setIsSocialLoading(null);
      onClose();
    }, 400);
  };

  const handleDemoLogin = (profileKey: keyof typeof DEMO_PROFILES) => {
    const selected = DEMO_PROFILES[profileKey];
    onLogin(selected);
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Create or login user
    const profile: UserProfile = {
      name: name.trim() || email.split('@')[0],
      email: email.trim(),
      role: 'ผู้ใช้งานทั่วไป',
      elderlyMode: false,
      fontSize: 'normal',
      diseases: ['ความดันโลหิตสูง (Hypertension)'],
      allergies: [],
      medications: [],
    };
    onLogin(profile);
    onClose();
  };

  const isCurrentDemo = (profileKey: keyof typeof DEMO_PROFILES) => {
    if (!isLoggedIn || !currentProfile) return false;
    return currentProfile.email === DEMO_PROFILES[profileKey].email;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4 border border-emerald-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2.5">
            <AppIconBadge size="xs" />
            <div>
              <h2 className="font-extrabold text-slate-900 text-base leading-tight">
                เข้าสู่ระบบ NutriMed Scan AI
              </h2>
              <p className="text-[11px] text-emerald-700/80">
                เลือกวิธีเข้าสู่ระบบเพื่อบันทึกประวัติสุขภาพของคุณ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Status Banner if already logged in */}
        {isLoggedIn && currentProfile && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-500 font-medium">เข้าสู่ระบบในชื่อ: </span>
                <span className="font-bold text-slate-900">{currentProfile.name}</span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <LogOut className="w-3 h-3" />
                <span>ออกจากระบบ</span>
              </button>
            )}
          </div>
        )}

        {/* 1. Tab switcher (ตรงตามในภาพที่ผู้ใช้ส่งมา) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'signin'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เข้าสู่ระบบ (Sign In)
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สมัครสมาชิกใหม่ (Register)
          </button>
        </div>

        {/* 2. ช่องใส่อีเมลกับรหัสอยู่รองจากฟีเจอร์ในภาพ (Email & Password Form directly underneath) */}
        <form onSubmit={handleFormSubmit} className="space-y-3 pt-0.5">
          {activeTab === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                ชื่อ-นามสกุล หรือ ชื่อเรียก
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สมชาย ใจภักดี"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              อีเมล (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com หรือ patient@nutrimed.th"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.99]"
          >
            {activeTab === 'signin' ? 'เข้าสู่ระบบด้วยอีเมล' : 'สร้างบัญชีผู้ใช้ใหม่'}
          </button>
        </form>

        {/* 3. Social Login Options: Google & Facebook */}
        <div className="space-y-2 pt-1">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[10px] text-slate-400 font-medium absolute">
              หรือเข้าสู่ระบบด้วยโซเชียลมีเดีย
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isSocialLoading !== null}
              className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            >
              <GoogleIcon />
              <span>{isSocialLoading === 'google' ? 'กำลังเชื่อมต่อ...' : 'Google'}</span>
            </button>

            {/* Facebook Login Button */}
            <button
              onClick={handleFacebookLogin}
              disabled={isSocialLoading !== null}
              className="w-full py-2.5 px-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <FacebookIcon />
              </div>
              <span>{isSocialLoading === 'facebook' ? 'กำลังเชื่อมต่อ...' : 'Facebook'}</span>
            </button>
          </div>
        </div>

        {/* 4. 1-Click Demo Login Persona Options */}
        <div className="space-y-2 pt-1">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[10px] text-slate-400 font-medium absolute">
              หรือเข้าสู่ระบบด้วยบัญชีทดสอบ 1-Click
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {/* Chronic Patient */}
            <button
              onClick={() => handleDemoLogin('chronic')}
              className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between group ${
                isCurrentDemo('chronic')
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Heart className="w-3.5 h-3.5 fill-rose-100" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    ผู้ป่วยโรคเรื้อรัง
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    เบาหวาน/ไต/แพ้กุ้ง
                  </div>
                </div>
              </div>
              {isCurrentDemo('chronic') && (
                <span className="text-[9px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                  กำลังใช้งาน
                </span>
              )}
            </button>

            {/* Elderly (72 yo) */}
            <button
              onClick={() => handleDemoLogin('elderly')}
              className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between group ${
                isCurrentDemo('elderly')
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    ผู้สูงอายุ (72 ปี)
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    แพ้ NSAIDs/เสี่ยงล้ม/ความดัน
                  </div>
                </div>
              </div>
              {isCurrentDemo('elderly') && (
                <span className="text-[9px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                  กำลังใช้งาน
                </span>
              )}
            </button>

            {/* Pharmacist */}
            <button
              onClick={() => handleDemoLogin('pharmacist')}
              className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between group ${
                isCurrentDemo('pharmacist')
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Microscope className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    เภสัชกรชำนาญการ
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    ตรวจฉลากละเอียด/โครงสร้าง อย.
                  </div>
                </div>
              </div>
              {isCurrentDemo('pharmacist') && (
                <span className="text-[9px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                  กำลังใช้งาน
                </span>
              )}
            </button>

            {/* SME Owner */}
            <button
              onClick={() => handleDemoLogin('sme')}
              className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between group ${
                isCurrentDemo('sme')
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    ผู้ประกอบการ SME
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    ตรวจฉลากก่อนวางขาย
                  </div>
                </div>
              </div>
              {isCurrentDemo('sme') && (
                <span className="text-[9px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                  กำลังใช้งาน
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
