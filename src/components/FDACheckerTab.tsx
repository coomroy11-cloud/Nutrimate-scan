import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Info,
  Pill,
  Utensils,
  AlertOctagon,
  Sparkles,
  MapPin,
  Building2,
  Calendar,
  Hash,
  Calculator,
  Camera,
  Upload,
  Scan,
  Loader2,
  X,
} from 'lucide-react';
import { checkFDAFormat, FdaCheckResult } from '../utils/fdaChecker';
import { ScanResult, UserProfile } from '../types';
import { assessImageQuality, ImageQualityReport } from '../utils/imageQuality';

interface FDACheckerTabProps {
  onScanComplete?: (result: ScanResult) => void;
  userProfile?: UserProfile;
}

// Client-side compression for fast mobile upload
function compressImage(dataUrl: string, maxDim = 1600, quality = 0.88): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const FDACheckerTab: React.FC<FDACheckerTabProps> = ({
  onScanComplete,
  userProfile,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [result, setResult] = useState<FdaCheckResult | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'food' | 'drug' | 'tips'>('food');

  // Image Scan States for FDA Tab
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCheck = async (codeToCheck?: string) => {
    const code = codeToCheck !== undefined ? codeToCheck : inputCode;
    if (!code.trim()) return;
    // Immediate client-side evaluation
    const localRes = checkFDAFormat(code);
    setResult(localRes);

    // Server-side verification via /api/check-fda-format
    try {
      console.log('[FDACheckerTab] Verifying code via /api/check-fda-format:', code);
      const res = await fetch('/api/check-fda-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[FDACheckerTab] Server verified code result:', data);
        if (data && typeof data.isValid === 'boolean') {
          setResult(data);
        }
      } else {
        console.warn('[FDACheckerTab] Server check responded with status:', res.status);
      }
    } catch (err) {
      console.warn('[FDACheckerTab] Server check fallback to client check:', err);
    }
  };

  const handleTestExample = (exampleCode: string) => {
    setInputCode(exampleCode);
    handleCheck(exampleCode);
  };

  // Handle Image Upload / Camera in FDA tab
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      try {
        const compressed = await compressImage(rawBase64, 1600, 0.88);
        setPreviewImage(compressed);
        setPreviewMime('image/jpeg');
        setScanError(null);
        setIsCheckingQuality(true);
        const report = await assessImageQuality(compressed);
        setQualityReport(report);
      } catch (err) {
        setPreviewImage(rawBase64);
        setPreviewMime(file.type || 'image/jpeg');
      } finally {
        setIsCheckingQuality(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Perform AI scan on previewed image
  const handleAnalyzeFDAImage = async () => {
    if (!previewImage) return;
    setIsScanning(true);
    setScanError(null);

    try {
      console.log('[FDACheckerTab] Sending scan request to /api/scan-label');
      const res = await fetch('/api/scan-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: previewImage,
          mimeType: previewMime,
          userProfile,
        }),
      });

      console.log('[FDACheckerTab] Response status:', res.status, res.statusText);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[FDACheckerTab] Server returned non-JSON:', {
          status: res.status,
          statusText: res.statusText,
          contentType,
          snippet: text.slice(0, 300),
        });
        throw new Error(`เซิร์ฟเวอร์ส่งการตอบกลับที่ไม่ถูกต้อง (HTTP ${res.status}: ${res.statusText || 'Non-JSON'})`);
      }

      const json = await res.json();
      console.log('[FDACheckerTab] Response JSON:', json);

      if (json.success && json.data) {
        const fullResult: ScanResult = {
          ...json.data,
          id: `scan-${Date.now()}`,
          timestamp: Date.now(),
          imageUrl: previewImage,
        };
        setPreviewImage(null);
        setQualityReport(null);
        if (onScanComplete) {
          onScanComplete(fullResult);
        }
      } else {
        console.warn('[FDACheckerTab] API error:', json.error);
        setScanError(json.error || 'ไม่สามารถวิเคราะห์ฉลากได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      console.error('[FDACheckerTab] FDA Scan failed:', {
        message: err.message,
        stack: err.stack,
        endpoint: '/api/scan-label',
      });
      setScanError(
        err.message?.includes('HTTP')
          ? `เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ (${err.message}) กรุณาลองใหม่อีกครั้ง`
          : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Feature 1: "สแกน อย." ด้วยกล้อง/รูปภาพ (Requirement 1 & 2: ปุ่ม "สแกน อย." สามารถเปิดตัวเลือกอัปโหลด/ถ่ายภาพได้) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 rounded-3xl p-5 text-white shadow-md space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold">
              <Scan className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold leading-tight">
                สแกน อย. ด้วยภาพถ่าย
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                AI อ่านเลข อย. และวิเคราะห์ความปลอดภัยอัตโนมัติ
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-bold tracking-wider uppercase">
            AI Scan
          </span>
        </div>

        {/* Image Preview inside FDA Tab if selected */}
        {previewImage ? (
          <div className="bg-white rounded-2xl p-4 text-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700">
                ตัวอย่างภาพฉลาก/เลข อย.
              </span>
              <button
                onClick={() => {
                  setPreviewImage(null);
                  setQualityReport(null);
                  setScanError(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full aspect-16/9 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
              <img
                src={previewImage}
                alt="ภาพ อย."
                className="w-full h-full object-contain"
              />
            </div>

            {isCheckingQuality ? (
              <div className="p-2 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>กำลังประเมินคุณภาพภาพ...</span>
              </div>
            ) : qualityReport && !qualityReport.isQualityGood ? (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>“ภาพอาจไม่ชัดพอสำหรับการวิเคราะห์ กรุณาถ่ายภาพใหม่”</span>
              </div>
            ) : null}

            {scanError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            <button
              onClick={handleAnalyzeFDAImage}
              disabled={isScanning}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังอ่านฉลาก...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>วิเคราะห์เลข อย. และฉลากนี้</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="py-3 px-3 rounded-2xl bg-white text-emerald-800 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-emerald-50 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4 text-emerald-600 stroke-[2.4]" />
              <span>ถ่ายภาพฉลาก</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 border border-white/30 active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4 text-white stroke-[2.4]" />
              <span>อัปโหลดภาพ</span>
            </button>
          </div>
        )}
      </div>

      {/* Feature 2: ตรวจสอบโครงสร้างเลข อย. ด้วยการพิมพ์เลข */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              พิมพ์ตรวจสอบโครงสร้างเลข อย.
            </h3>
            <p className="text-[11px] text-emerald-700/80 font-medium">
              (คำนวณ Checksum 13 หลัก & ทะเบียนยา)
            </p>
          </div>
        </div>

        {/* Input & Search Form */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="เช่น 10-1-04741-1-0234 หรือ 1A 234/50"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <button
            onClick={() => handleCheck()}
            disabled={!inputCode.trim()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-xs transition-all active:scale-[0.99]"
          >
            ตรวจสอบรูปแบบ
          </button>
        </div>

        {/* Clickable Test Examples */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-600 mb-1.5">
            ตัวอย่างทดสอบ:
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            <button
              onClick={() => handleTestExample('10-1-04741-1-0234')}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors"
            >
              อาหาร: 10-1-04741-1-0234 (ถูก)
            </button>
            <button
              onClick={() => handleTestExample('10-1-04741-1-0239')}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 transition-colors"
            >
              อาหาร: Checksum ไม่ตรง
            </button>
            <button
              onClick={() => handleTestExample('1A 234/50')}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors"
            >
              ยาเดี่ยว: 1A 234/50
            </button>
            <button
              onClick={() => handleTestExample('G 123/45')}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors"
            >
              ยาแผนโบราณ: G 123/45
            </button>
          </div>
        </div>
      </div>

      {/* Result Display Card if Checked */}
      {result && (
        <div
          className={`rounded-3xl p-5 border shadow-sm animate-in fade-in duration-150 ${
            result.isValid
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-rose-50/70 border-rose-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                result.isValid
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {result.isValid ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div
                className={`text-xs font-bold uppercase tracking-wider ${
                  result.isValid ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {result.isValid
                  ? '✓ ผ่านการตรวจสอบโครงสร้าง'
                  : '⚠️ ไม่ผ่านการตรวจสอบโครงสร้าง'}
              </div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5 font-mono">
                {result.code}
              </div>
              <p
                className={`text-xs font-medium mt-1 leading-relaxed ${
                  result.isValid ? 'text-emerald-950' : 'text-rose-950'
                }`}
              >
                {result.explanation}
              </p>
            </div>
          </div>

          {/* Breakdown Items */}
          {result.breakdown && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-800">
                {result.breakdown.title}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                {result.breakdown.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-700">
                        {item.label}
                      </div>
                      {item.desc && (
                        <div className="text-[11px] text-slate-500">
                          {item.desc}
                        </div>
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FDA Knowledge & Structure Guide */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4">
        {/* Title Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                คู่มือวิธีอ่านเลข อย. และ ทะเบียนยา
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                สรุปเข้าใจง่าย แยกตามกลุ่มผลิตภัณฑ์
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher buttons for easy reading */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveGuideTab('food')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeGuideTab === 'food'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>เลข อย. อาหาร</span>
          </button>
          <button
            onClick={() => setActiveGuideTab('drug')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeGuideTab === 'drug'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>ทะเบียนยา</span>
          </button>
          <button
            onClick={() => setActiveGuideTab('tips')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeGuideTab === 'tips'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>เช็กเลขสวม</span>
          </button>
        </div>

        {/* 1. Food Serial Guide Tab (13 Digits) */}
        {activeGuideTab === 'food' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-green-800 rounded-2xl p-4 text-white shadow-sm text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 mb-1">
                โครงสร้างเลขสารบบอาหาร 13 หลัก
              </div>
              <div className="font-mono font-extrabold text-base sm:text-lg tracking-wider bg-black/25 py-2 px-3 rounded-xl border border-white/20 inline-block">
                XX - X - XXXXX - X - XXXX
              </div>
              <p className="text-[11px] text-emerald-100 mt-1.5">
                ประกอบด้วย 5 ส่วนสำคัญที่บอกแหล่งกำเนิดและลำดับสินค้า
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                  XX
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2 หลักแรก: รหัสจังหวัดสถานที่ผลิต/นำเข้า</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    เช่น <span className="font-semibold text-emerald-800">10</span> = กรุงเทพมหานคร, <span className="font-semibold text-emerald-800">11</span> = สมุทรปราการ, <span className="font-semibold text-emerald-800">50</span> = เชียงใหม่, <span className="font-semibold text-emerald-800">73</span> = นครปฐม
                  </p>
                </div>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                  X
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>1 หลักถัดมา: สถานะของสถานที่</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="bg-white px-2 py-0.5 rounded-lg border border-teal-200 text-teal-900 font-semibold">
                      เลข 1 = ผลิตในไทย
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded-lg border border-teal-200 text-teal-900 font-semibold">
                      เลข 2 = นำเข้าจากนอก
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                  XXXXX
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-sky-600" />
                    <span>5 หลักถัดมา: เลขสถานที่ผลิตหรือนำเข้า</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    เลขรหัสประจำตัวโรงงานที่ได้รับอนุญาตจาก อย.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                  X
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>1 หลักถัดมา: รหัสปี พ.ศ. ที่อนุญาต</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    เลขท้ายปี พ.ศ. เช่น เลข <span className="font-semibold text-amber-800">1</span> = ปี พ.ศ. 2561
                  </p>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                  XXXX
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    <span>4 หลักสุดท้าย: ลำดับอาหาร + เลขตรวจสอบ</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    ลำดับผลิตภัณฑ์ที่โรงงานนั้นได้รับอนุญาต โดยหลักที่ 13 สุดท้ายเป็นตัวเลข Checksum (สูตร Mod-11) เพื่อป้องกันการมั่วตัวเลข
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Drug Registration Guide Tab */}
        {activeGuideTab === 'drug' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 rounded-2xl p-4 text-white shadow-sm text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-200 mb-1">
                โครงสร้างเลขทะเบียนยา อย.
              </div>
              <div className="font-mono font-extrabold text-base sm:text-lg tracking-wider bg-black/25 py-2 px-3 rounded-xl border border-white/20 inline-block">
                [ หมวดยา ] [ ลำดับที่ ] / [ สองหลักท้าย พ.ศ. ]
              </div>
              <div className="text-[11px] text-teal-100 mt-1.5 font-mono">
                ตัวอย่าง: 1A 234/50 หรือ G 123/45
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                <div className="font-extrabold text-emerald-900 flex items-center justify-between">
                  <span>1A และ 2A</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                    ยาแผนปัจจุบัน (ไทย)
                  </span>
                </div>
                <p className="text-slate-600 leading-snug">
                  ยาผลิตในประเทศ (มนุษย์)<br />
                  • <span className="font-semibold text-emerald-800">1A</span> = ยาเดี่ยว (เช่น พาราเซตามอล)<br />
                  • <span className="font-semibold text-emerald-800">2A</span> = ยาสูตรผสม
                </p>
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1">
                <div className="font-extrabold text-sky-900 flex items-center justify-between">
                  <span>1B และ 2B</span>
                  <span className="text-[10px] bg-sky-200 text-sky-900 px-1.5 py-0.2 rounded font-semibold">
                    ยาแผนปัจจุบัน (นำเข้า)
                  </span>
                </div>
                <p className="text-slate-600 leading-snug">
                  ยานำเข้าจากต่างประเทศ<br />
                  • <span className="font-semibold text-sky-800">1B</span> = ยาเดี่ยวนำเข้า<br />
                  • <span className="font-semibold text-sky-800">2B</span> = ยาสูตรผสมนำเข้า
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                <div className="font-extrabold text-amber-950 flex items-center justify-between">
                  <span>G และ K</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-semibold">
                    ยาแผนโบราณ / สมุนไพร
                  </span>
                </div>
                <p className="text-slate-600 leading-snug">
                  ยาสมุนไพรและยาแผนโบราณ<br />
                  • <span className="font-semibold text-amber-900">G</span> = ยาแผนโบราณ ผลิตในไทย (เช่น ฟ้าทะลายโจร)<br />
                  • <span className="font-semibold text-amber-900">K</span> = ยาแผนโบราณ นำเข้า
                </p>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                <div className="font-extrabold text-purple-950 flex items-center justify-between">
                  <span>N และ P</span>
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-semibold">
                    ยาสำหรับสัตว์
                  </span>
                </div>
                <p className="text-slate-600 leading-snug">
                  ยาที่ใช้กับสัตว์เลี้ยงหรือปศุสัตว์<br />
                  • <span className="font-semibold text-purple-900">N</span> = ผลิตในประเทศ<br />
                  • <span className="font-semibold text-purple-900">P</span> = นำเข้า
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Safety Tips Guide Tab */}
        {activeGuideTab === 'tips' && (
          <div className="space-y-3 animate-in fade-in duration-200 text-xs">
            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-900 text-sm">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>1. มีเลข อย. ไม่ได้แปลว่าปลอดภัย 100%</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                มิจฉาชีพอาจนำเลข อย. ของสินค้าอื่น (เช่น นำเลข อย. ของน้ำปลาหรือขนม) มาสวมบนกล่องผลิตภัณฑ์ลดน้ำหนักหรือยาเสริมอาหารปลอม
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-900 text-sm">
                <Search className="w-4 h-4 text-amber-600" />
                <span>2. ตรวจสอบชื่อผลิตภัณฑ์ให้ตรงกัน</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                ชื่อตราสินค้า และชื่อผลิตภัณฑ์บนกล่องจริง ต้องตรงกับข้อมูลผู้ผลิตและชนิดอาหารที่ได้รับอนุญาตในฐานข้อมูลของ อย.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3. สังเกตการแสดงสรรพคุณโอ้อวดเกินจริง</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                อาหารและผลิตภัณฑ์เสริมอาหาร <span className="font-bold text-emerald-900">ไม่มีผลในการรักษาโรค</span> หากฉลากใดอ้างว่า "รักษาเบาหวาน ความดัน หรือมะเร็งหายขาด" ถือว่าผิดกฎหมายและหลอกลวงผู้บริโภค
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
