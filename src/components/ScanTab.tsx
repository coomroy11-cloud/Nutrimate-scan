import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  FileText,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Droplets,
  Flame,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Loader2,
  X,
  RotateCw,
  RefreshCw,
  Maximize2,
  Scan,
  AlertOctagon,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { UserProfile, ScanResult } from '../types';
import { SAMPLE_LABELS, HEALTH_CAMPAIGNS, SampleLabel } from '../data/mockData';
import { assessImageQuality, ImageQualityReport } from '../utils/imageQuality';
import { AppIconBadge } from './AppLogo';

interface ScanTabProps {
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onScanComplete: (result: ScanResult) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

// Client-side image compression to ensure fast and reliable uploads on mobile devices
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

export const ScanTab: React.FC<ScanTabProps> = ({
  userProfile,
  onOpenProfile,
  onScanComplete,
  isLoading,
  setIsLoading,
}) => {
  // Image Preview & Quality Check states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string>('image/jpeg');
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);

  // Modals & controls
  const [showScanOptionsModal, setShowScanOptionsModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [manualText, setManualText] = useState('');
  const [activeCampaignTab, setActiveCampaignTab] = useState<'661' | '5rights' | 'gda'>('661');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  // Animated loading messages
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    'กำลังอ่านฉลากและสกัดข้อความ OCR...',
    'กำลังตรวจสอบหมายเลข อย. และทะเบียนยา...',
    'กำลังประเมินสารอาหาร สารก่อภูมิแพ้ และความปลอดภัย...',
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 1800);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File Upload Handler (with compression)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      try {
        const compressed = await compressImage(rawBase64, 1600, 0.88);
        await handleImageSelected(compressed, 'image/jpeg');
      } catch (err) {
        await handleImageSelected(rawBase64, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Start Live Camera
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setShowScanOptionsModal(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing === 'environment' ? { ideal: 'environment' } : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error, fallback to native camera input:', err);
      setCameraActive(false);
      // Fallback: trigger file input with native camera capture
      if (cameraFallbackInputRef.current) {
        cameraFallbackInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture photo from live camera
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);

    stopCamera();
    const compressed = await compressImage(dataUrl, 1600, 0.88);
    handleImageSelected(compressed, 'image/jpeg');
  };

  // When image is captured or uploaded: run quality assessment & show preview
  const handleImageSelected = async (dataUrl: string, mimeType: string) => {
    setPreviewImage(dataUrl);
    setPreviewMimeType(mimeType);
    setErrorMessage(null);
    setIsCheckingQuality(true);

    try {
      const report = await assessImageQuality(dataUrl);
      setQualityReport(report);
    } catch (err) {
      console.warn('Quality assessment error:', err);
      setQualityReport({
        isQualityGood: true,
        brightnessScore: 75,
        sharpnessScore: 75,
        issue: 'none',
        details: 'พร้อมวิเคราะห์',
      });
    } finally {
      setIsCheckingQuality(false);
    }
  };

  // Trigger analysis for the currently previewed image
  const handleAnalyzeCurrentPreview = async () => {
    if (!previewImage) return;
    await processScan({
      imageBase64: previewImage,
      mimeType: previewMimeType,
    });
  };

  // Clear current preview
  const handleClearPreview = () => {
    setPreviewImage(null);
    setQualityReport(null);
    setErrorMessage(null);
  };

  // Process Scan API
  const processScan = async (payload: {
    imageBase64?: string;
    mimeType?: string;
    rawText?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log('[NutriMed Scan] Sending scan request to /api/scan-label', {
        hasImage: !!payload.imageBase64,
        imageSize: payload.imageBase64?.length || 0,
        hasRawText: !!payload.rawText,
      });

      const res = await fetch('/api/scan-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          userProfile,
        }),
      });

      console.log('[NutriMed Scan] Received response:', res.status, res.statusText);

      // Check if response is valid JSON (handle 404 / 500 HTML pages gracefully)
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[NutriMed Scan] Server returned non-JSON response:', {
          status: res.status,
          statusText: res.statusText,
          contentType,
          snippet: text.slice(0, 300),
        });
        throw new Error(
          `เซิร์ฟเวอร์ส่งการตอบกลับที่ไม่ถูกต้อง (HTTP ${res.status}: ${res.statusText || 'Non-JSON'})`
        );
      }

      const json = await res.json();
      console.log('[NutriMed Scan] Response JSON payload:', json);

      if (json.success && json.data) {
        const fullResult: ScanResult = {
          ...json.data,
          id: `scan-${Date.now()}`,
          timestamp: Date.now(),
          imageUrl: payload.imageBase64,
        };
        // Clear preview once analyzed
        setPreviewImage(null);
        setQualityReport(null);
        onScanComplete(fullResult);
      } else {
        console.warn('[NutriMed Scan] API error returned:', json.error);
        setErrorMessage(
          json.error ||
            'ไม่สามารถวิเคราะห์ฉลากได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือถ่ายภาพใหม่ในมุมที่ชัดเจนขึ้น'
        );
      }
    } catch (err: any) {
      console.error('[NutriMed Scan] Scan request failed:', {
        message: err.message,
        stack: err.stack,
        endpoint: '/api/scan-label',
      });
      setErrorMessage(
        err.message?.includes('HTTP')
          ? `เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ (${err.message}) กรุณาลองใหม่อีกครั้ง`
          : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่อีกครั้ง'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Manual Text Submit
  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    setShowTextModal(false);
    await processScan({ rawText: manualText });
    setManualText('');
  };

  // Sample Preset Select
  const handleSelectSample = (sample: SampleLabel) => {
    setShowSampleModal(false);
    setIsLoading(true);
    setTimeout(() => {
      onScanComplete(sample.result);
      setIsLoading(false);
    }, 400);
  };

  // Active Health Profile summary for banner
  const healthConditionsSummary = [
    ...(userProfile.diseases || []),
    ...(userProfile.allergies ? userProfile.allergies.map((a) => `แพ้${a}`) : []),
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Hidden Gallery Input (Strictly opens photo gallery/albums) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden Camera Fallback Input (Opens native camera on mobile) */}
      <input
        ref={cameraFallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Error Message Modal / Dialog (Requirement 10) */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-rose-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                ไม่สามารถวิเคราะห์ฉลากได้
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {previewImage && (
                <button
                  onClick={handleAnalyzeCurrentPreview}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>ลองใหม่อีกครั้ง</span>
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    startCamera('environment');
                  }}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  ถ่ายภาพใหม่
                </button>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setShowSampleModal(true);
                  }}
                  className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-colors"
                >
                  ใช้ฉลากตัวอย่าง
                </button>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="w-full py-1.5 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ปิดหน้าต่างนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview & Quality Check Card (Requirement 3: แสดง Preview ของภาพก่อนวิเคราะห์) */}
      {previewImage ? (
        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Scan className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  ตรวจสอบภาพตัวอย่างฉลาก
                </h3>
                <p className="text-[11px] text-emerald-700/80">
                  ตรวจสอบความชัดเจนก่อนส่งให้ AI วิเคราะห์
                </p>
              </div>
            </div>
            <button
              onClick={handleClearPreview}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="ยกเลิกภาพนี้"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image Preview Container */}
          <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center group shadow-inner">
            <img
              src={previewImage}
              alt="ภาพตัวอย่างฉลาก"
              className="w-full h-full object-contain"
            />
            {/* Overlay Grid lines for framing */}
            <div className="absolute inset-4 border border-dashed border-white/40 rounded-xl pointer-events-none" />
          </div>

          {/* Quality Assessment Result Banner */}
          {isCheckingQuality ? (
            <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
              <span>กำลังตรวจสอบความสว่างและความคมชัดของภาพ...</span>
            </div>
          ) : qualityReport ? (
            <div>
              {qualityReport.isQualityGood ? (
                /* Good Quality Badge */
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm">
                      ✓ ตรวจสอบคุณภาพภาพผ่าน
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      แสงสว่างและความคมชัดอยู่ในเกณฑ์ที่สามารถสกัดตัวหนังสือและเลข อย. ได้ดี
                    </div>
                  </div>
                </div>
              ) : (
                /* Quality Issue Alert (Requirement 11) */
                <div className="p-3.5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-2 text-amber-950">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm text-amber-900">
                        “ภาพอาจไม่ชัดพอสำหรับการวิเคราะห์ กรุณาถ่ายภาพใหม่”
                      </div>
                      <div className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                        {qualityReport.details}
                      </div>
                    </div>
                  </div>

                  {/* Quality metrics indicators */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                      <div className="text-slate-500 font-medium">ความสว่าง</div>
                      <div className="font-bold mt-0.5 flex items-center justify-between">
                        <span>{qualityReport.brightnessScore}%</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            qualityReport.issue === 'dark'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {qualityReport.issue === 'dark'
                            ? 'มืดเกินไป'
                            : qualityReport.issue === 'bright'
                            ? 'สว่างจ้า'
                            : 'ปกติ'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                      <div className="text-slate-500 font-medium">ความคมชัด</div>
                      <div className="font-bold mt-0.5 flex items-center justify-between">
                        <span>{qualityReport.sharpnessScore}%</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            qualityReport.issue === 'blurry'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {qualityReport.issue === 'blurry' ? 'เบลอ/ไม่ชัด' : 'ปกติ'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Action Buttons for Preview */}
          <div className="space-y-2 pt-1">
            {/* Analyze Button */}
            <button
              onClick={handleAnalyzeCurrentPreview}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังอ่านฉลาก...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>วิเคราะห์ฉลาก / ตรวจ อย.</span>
                </>
              )}
            </button>

            {/* Retake / Change Photo Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => startCamera('environment')}
                disabled={isLoading}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>ถ่ายภาพใหม่</span>
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={isLoading}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>เลือกภาพใหม่</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Primary Hero Card when no image is in preview */
        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/60 via-teal-50/40 to-transparent rounded-bl-full pointer-events-none" />

          <div className="text-center max-w-xs mx-auto mb-4">
            {/* App Icon Badge */}
            <div className="flex flex-col items-center justify-center mb-2.5">
              <AppIconBadge size="md" className="shadow-lg shadow-emerald-950/10 mb-1" />
              <div className="text-[11px] font-bold text-slate-700 tracking-tight">
                NutriMed Scan AI
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI ตรวจฉลากและสารก่อภูมิแพ้</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              ตรวจฉลากยาและอาหาร
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              เปิดกล้องถ่ายภาพฉลาก หรือเลือกภาพจากเครื่อง เพื่อตรวจ อย. และสารที่อาจแพ้
            </p>
          </div>

          {/* Primary Action Button: "สแกน อย." */}
          <div>
            <button
              onClick={() => setShowScanOptionsModal(true)}
              disabled={isLoading}
              className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <Scan className="w-6 h-6 stroke-[2.5]" />
              <span>สแกน อย.</span>
            </button>
          </div>

          {/* Quick Secondary Links */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setShowTextModal(true)}
              className="text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>พิมพ์ข้อความ</span>
            </button>

            <button
              onClick={() => setShowSampleModal(true)}
              className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 transition-colors group"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-12 transition-transform" />
              <span className="underline underline-offset-2">ลองจากตัวอย่าง</span>
            </button>
          </div>
        </div>
      )}

      {/* Choice Modal for "สแกน อย." (Requirement 1: เปิดตัวเลือกอัปโหลด/ถ่ายภาพได้) */}
      {showScanOptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Scan className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    สแกน อย. / ตรวจฉลาก
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    เลือกวิธีส่งภาพฉลากให้ AI วิเคราะห์
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScanOptionsModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: เปิดกล้องถ่ายฉลาก */}
              <button
                onClick={() => startCamera('environment')}
                className="w-full p-4 rounded-2xl border-2 border-emerald-500/40 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 transition-all flex items-center justify-between group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Camera className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      เปิดกล้องถ่ายฉลาก
                    </div>
                    <div className="text-xs text-emerald-800/80">
                      ถ่ายภาพฉลากยาหรืออาหารแบบเรียลไทม์
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 2: เลือกรูปจากอุปกรณ์ */}
              <button
                onClick={() => {
                  setShowScanOptionsModal(false);
                  galleryInputRef.current?.click();
                }}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white hover:bg-slate-50 transition-all flex items-center justify-between group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800 flex items-center justify-center shrink-0 transition-colors">
                    <Upload className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      เลือกรูปจากอุปกรณ์
                    </div>
                    <div className="text-xs text-slate-500">
                      เลือกรูปภาพฉลากที่มีอยู่ในคลังรูปภาพหรือไฟล์
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 3: พิมพ์ข้อความหรือเลข อย. เอง */}
              <button
                onClick={() => {
                  setShowScanOptionsModal(false);
                  setShowTextModal(true);
                }}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-between group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-xs">
                      พิมพ์ข้อความหรือเลข อย. เอง
                    </div>
                    <div className="text-[11px] text-slate-500">
                      วิเคราะห์จากข้อความโดยตรง
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Option 4: ลองจากตัวอย่าง */}
              <button
                onClick={() => {
                  setShowScanOptionsModal(false);
                  setShowSampleModal(true);
                }}
                className="w-full p-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 transition-all flex items-center justify-between group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-900 text-xs">
                      ลองจากฉลากตัวอย่าง
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      ทดสอบระบบด้วยยาและขนมตัวอย่างทันที
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Screening Profile Banner */}
      <div className="bg-white rounded-2xl p-3 border border-emerald-100/90 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="text-xs truncate">
            <span className="text-slate-500 font-medium">คัดกรอง: </span>
            <span className="font-bold text-slate-800">
              {healthConditionsSummary.length > 0
                ? healthConditionsSummary.slice(0, 2).join(', ') +
                  (healthConditionsSummary.length > 2 ? '...' : '')
                : 'ข้อมูลทั่วไป (ยังไม่ได้ระบุโรค/แพ้)'}
            </span>
          </div>
        </div>
        <button
          onClick={onOpenProfile}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg shrink-0 transition-colors"
        >
          แก้ไข
        </button>
      </div>

      {/* Educational & Health Campaigns Section */}
      <div className="bg-white rounded-3xl p-4 border border-emerald-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                ศูนย์ข้อมูลและแคมเปญสุขภาพ
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                ข้อมูลจากกระทรวงสาธารณสุข และ สสส.
              </p>
            </div>
          </div>
        </div>

        {/* Carousel Tabs in Green Tone */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setActiveCampaignTab('661')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              activeCampaignTab === '661'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ลดหวาน มัน เค็ม
          </button>
          <button
            onClick={() => setActiveCampaignTab('5rights')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              activeCampaignTab === '5rights'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            การใช้ยา 5 ถูก
          </button>
          <button
            onClick={() => setActiveCampaignTab('gda')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              activeCampaignTab === 'gda'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            วิธีอ่านฉลาก GDA
          </button>
        </div>

        {/* Campaign Tab Contents */}
        {activeCampaignTab === '661' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* 6:6:1 Hero Card in Emerald Tone */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-green-800 text-white p-4 rounded-2xl shadow-sm">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                แคมเปญสุขภาพผู้ป่วยโรคเรื้อรัง NCDs
              </div>
              <h4 className="text-base font-extrabold mt-1">
                สูตร 6 : 6 : 1 ลดเค็ม ลดหวาน
              </h4>
              <p className="text-xs font-medium text-emerald-100 mt-1 leading-relaxed">
                เพื่อไตและหัวใจแข็งแรง การบริโภคโซเดียมและน้ำตาลเกินเกณฑ์มาตรฐาน
                เป็นสาเหตุอันดับหนึ่งของโรคความดันโลหิตสูง โรคไตวาย
              </p>
            </div>

            {/* Sodium limit */}
            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    โซเดียม (SODIUM)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                    อันตรายต่อไต
                  </span>
                </div>
                <div className="text-base font-extrabold text-rose-700 mt-0.5">
                  ไม่เกิน 2,000 มก.
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  ต่อวัน (เทียบเท่าน้ำปลาไม่เกิน 1 ช้อนชา)
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" />
              </div>
            </div>

            {/* Sugar limit */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    น้ำตาล (SUGAR)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                    เสี่ยงเบาหวาน
                  </span>
                </div>
                <div className="text-base font-extrabold text-amber-700 mt-0.5">
                  ไม่เกิน 24 กรัม
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  ต่อวัน (ไม่เกิน 6 ช้อนชา)
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5" />
              </div>
            </div>

            {/* Fat limit */}
            <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    น้ำมัน / ไขมัน (FAT)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                    เสี่ยงหลอดเลือด
                  </span>
                </div>
                <div className="text-base font-extrabold text-sky-700 mt-0.5">
                  ไม่เกิน 65 กรัม
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  ต่อวัน (เทียบเท่าน้ำมันไม่เกิน 6 ช้อนชา)
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {activeCampaignTab === '5rights' && (
          <div className="space-y-2 animate-in fade-in duration-150">
            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="font-bold text-slate-800">
                หลัก 5 ถูก ของสภาเภสัชกรรม:
              </span>{' '}
              เพื่อป้องกันการใช้ยาผิดพลาดในผู้ป่วยโรคเรื้อรังและผู้สูงอายุ
            </div>
            {HEALTH_CAMPAIGNS[2].tips?.map((tip, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 flex items-start gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">
                  {tip.replace(/^[0-9]\.\s*/, '')}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeCampaignTab === 'gda' && (
          <div className="space-y-2 animate-in fade-in duration-150">
            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="font-bold text-slate-800">
                วิธีง่ายๆ ในการอ่านฉลาก หวาน มัน เค็ม:
              </span>{' '}
              ก่อนตัดสินใจซื้อสินค้าแปรรูป
            </div>
            {HEALTH_CAMPAIGNS[1].tips?.map((tip, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Camera View Modal */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-4 text-white">
          <div className="w-full max-w-sm flex items-center justify-between py-2 text-white">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm">จัดฉลากให้อยู่ในกรอบ</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={switchCameraFacing}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="สลับกล้องหน้า/หลัง"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={stopCamera}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="ปิดกล้อง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative w-full max-w-sm aspect-3/4 rounded-3xl overflow-hidden border-2 border-emerald-400/60 shadow-2xl flex items-center justify-center bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Aiming guidelines */}
            <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <div className="text-[11px] text-white/95 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md self-center font-medium">
                จัดให้เห็นตัวหนังสือและเลข อย. ชัดเจน
              </div>
              <div className="text-[10px] text-emerald-200/90 text-center bg-black/40 py-0.5 rounded">
                หลีกเลี่ยงแสงสะท้อนหรือมุมมืด
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm flex items-center justify-center py-4">
            <button
              onClick={capturePhoto}
              className="w-18 h-18 rounded-full bg-white border-4 border-emerald-600 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
              title="ถ่ายภาพ"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Manual Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">
                พิมพ์ข้อความบนฉลาก
              </h3>
              <button
                onClick={() => setShowTextModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              คัดลอกหรือพิมพ์ข้อความยา/อาหาร ส่วนประกอบสำคัญ เลข อย. หรือวิธีใช้
              เพื่อให้ AI วิเคราะห์
            </p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="ตัวอย่าง: Norvasc Amlodipine 5mg วันละ 1 เม็ด เลขทะเบียน 1A 234/50 หรือ มันฝรั่งทอดกรอบ โซเดียม 680 มก. อย. 10-1-04741-1-0234..."
              rows={5}
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none font-medium"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowTextModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!manualText.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                เริ่มวิเคราะห์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Demo Labels Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  เลือกฉลากตัวอย่างเพื่อทดสอบ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ทดสอบการแจ้งเตือนความเสี่ยงและโครงสร้าง อย. ทันที
                </p>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1">
              {SAMPLE_LABELS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800">
                      {sample.type}
                    </span>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {sample.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {sample.subtitle}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay (Requirement 12: Loading state ระหว่างกำลังวิเคราะห์ เช่น "กำลังอ่านฉลาก...") */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center max-w-xs space-y-3.5 border border-emerald-100">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                AI
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                NutriMed AI กำลังวิเคราะห์...
              </h3>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                {loadingMessages[loadingStep]}
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              กำลังสกัดข้อความ OCR ตรวจโครงสร้าง อย. และประเมินความปลอดภัยเฉพาะบุคคล
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
