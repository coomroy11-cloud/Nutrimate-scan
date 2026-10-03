import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppIconBadge } from './AppLogo';

type AuthMode = 'login' | 'register' | 'forgot';

export const LoginPage: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    sendPasswordReset,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Translate Firebase Auth error codes to helpful Thai messages
  const parseAuthError = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || '';

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบใหม่อีกครั้ง';
    }
    if (code === 'auth/email-already-in-use') {
      return 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว กรุณาเข้าสู่ระบบหรือใช้ตัวเลือกลืมรหัสผ่าน';
    }
    if (code === 'auth/weak-password') {
      return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรเพื่อความปลอดภัย';
    }
    if (code === 'auth/invalid-email') {
      return 'รูปแบบอีเมลไม่ถูกต้อง กรุณาระบุใหม่อีกครั้ง';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'หน้าต่างเข้าสู่ระบบถูกปิดก่อนทำรายการเสร็จสิ้น';
    }
    if (code === 'auth/cancelled-popup-request') {
      return 'มีการเปิดหน้าต่างเข้าสู่ระบบซ้ำ กรุณาลองใหม่อีกครั้ง';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'วิธีการเข้าสู่ระบบนี้ยังไม่เปิดใช้งานใน Firebase Console';
    }
    if (code === 'auth/account-exists-with-different-credential') {
      return 'อีเมลนี้เชื่อมต่อกับวิธีเข้าสู่ระบบอื่นไว้แล้ว กรุณาเข้าสู่ระบบด้วยวิธีเดิม';
    }
    if (code === 'auth/network-request-failed') {
      return 'การเชื่อมต่ออินเทอร์เน็ตขัดข้อง กรุณาตรวจสอบสัญญาณเน็ตแล้วลองใหม่';
    }
    if (code === 'auth/too-many-requests') {
      return 'มีการพยายามเข้าสู่ระบบหลายครั้งเกินไป ระบบถูกจำกัดชั่วคราวเพื่อความปลอดภัย กรุณารอสักครู่';
    }
    return msg || 'เกิดข้อผิดพลาดในการทำรายการ กรุณาลองใหม่อีกครั้ง';
  };

  // Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    try {
      setLoadingAction('กำลังเข้าสู่ระบบ...');
      await loginWithEmail(email, password);
      // Auth state listener in App will transition to Scan tab
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoadingAction(null);
    }
  };

  // Submit Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อของคุณ');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      setLoadingAction('กำลังสมัครสมาชิก...');
      await registerWithEmail(name, email, password);
      setSuccessMessage('สมัครสมาชิกสำเร็จ กำลังเข้าสู่ระบบ...');
    } catch (err: any) {
      console.error('Register error:', err);
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoadingAction(null);
    }
  };

  // Submit Google Login
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      setLoadingAction('กำลังเข้าสู่ระบบด้วย Google...');
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoadingAction(null);
    }
  };

  // Submit Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('กรุณาระบุอีเมลที่ถูกต้องเพื่อรับลิงก์รีเซ็ตรหัสผ่าน');
      return;
    }

    try {
      setLoadingAction('กำลังส่งลิงก์รีเซ็ตรหัสผ่าน...');
      await sendPasswordReset(email);
      setSuccessMessage(
        `ระบบได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยัง ${email.trim()} เรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายหรือโฟลเดอร์สแปม`
      );
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-slate-100 to-slate-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3">
            <AppIconBadge size="lg" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Nutri<span className="text-emerald-600">Med</span>
            </h1>
            <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              SCAN AI
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            ระบบวิเคราะห์ฉลากอาหารและยาอัจฉริยะ ตามมาตรฐาน อย. ไทย
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/70 border border-emerald-100/80">
          {/* Header Title */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'login' && 'เข้าสู่ระบบ'}
              {mode === 'register' && 'สมัครสมาชิกใหม่'}
              {mode === 'forgot' && 'รีเซ็ตรหัสผ่าน'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {mode === 'login' &&
                'เข้าสู่ระบบเพื่อใช้งาน NutriMed Scan AI และบันทึกประวัติการสแกนของคุณ'}
              {mode === 'register' &&
                'สมัครสมาชิกเพื่อเริ่มต้นใช้งานและบันทึกประวัติการสแกนฉลากยาและอาหารของคุณ'}
              {mode === 'forgot' &&
                'ระบุอีเมลที่คุณใช้ลงทะเบียนเพื่อรับคำแนะนำในการรีเซ็ตรหัสผ่าน'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมล
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    รหัสผ่าน
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!!loadingAction}
                className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/25 transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingAction ? (
                  <span>{loadingAction}</span>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ชื่อ-นามสกุลของคุณ"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมล
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยืนยันรหัสผ่าน
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!!loadingAction}
                className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/25 transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingAction ? (
                  <span>{loadingAction}</span>
                ) : (
                  <>
                    <span>สมัครสมาชิก</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ระบุอีเมลบัญชีของคุณ
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!!loadingAction}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingAction ? (
                  <span>{loadingAction}</span>
                ) : (
                  <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                ← ย้อนกลับไปหน้าเข้าสู่ระบบ
              </button>
            </form>
          )}

          {/* Social Logins */}
          {mode !== 'forgot' && (
            <div className="mt-5">
              <div className="relative flex py-2 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[11px] font-medium text-slate-400">
                  {mode === 'login'
                    ? 'หรือเข้าสู่ระบบด้วย'
                    : 'หรือสมัครสมาชิกด้วย'}
                </span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              <div className="mt-2">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={!!loadingAction}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>เข้าสู่ระบบด้วย Google</span>
                </button>
              </div>
            </div>
          )}

          {/* Toggle between Login and Register */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs">
            {mode === 'login' ? (
              <p className="text-slate-500">
                ยังไม่มีบัญชี?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('register');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-bold ml-1 cursor-pointer"
                >
                  สมัครสมาชิกใหม่
                </button>
              </p>
            ) : mode === 'register' ? (
              <p className="text-slate-500">
                มีบัญชีอยู่แล้ว?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('login');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-bold ml-1 cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            ) : null}
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="mt-5 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>ข้อมูลสุขภาพและประวัติการสแกนถูกเข้ารหัสและแยกบัญชีเฉพาะบุคคล</span>
        </div>
      </div>
    </div>
  );
};
