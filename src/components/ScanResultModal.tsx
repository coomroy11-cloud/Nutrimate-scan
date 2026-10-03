import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  HeartPulse,
  Pill,
  Utensils,
  Clock,
  BookmarkCheck,
  MessageCircle,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ScanResult, RiskLevel } from '../types';
import { speakText, stopSpeaking } from '../utils/audio';

interface ScanResultModalProps {
  result: ScanResult | null;
  onClose: () => void;
  onSaveToHistory: (result: ScanResult) => void;
  isSaved: boolean;
  onAskChat: (result: ScanResult) => void;
  elderlyMode?: boolean;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  result,
  onClose,
  onSaveToHistory,
  isSaved,
  onAskChat,
  elderlyMode,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!result) return null;

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      const textToRead = elderlyMode && result.elderlyTips
        ? `${result.productName}. ${result.elderlyTips}. วิธีใช้: ${result.directions}`
        : `${result.productName}. ${result.userFriendlySummary}. วิธีใช้: ${result.directions}. คำเตือน: ${
            result.warnings?.join(' ') || 'ไม่มีคำเตือนพิเศษ'
          }`;

      speakText(
        textToRead,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'safe':
        return {
          emoji: '🟢',
          bg: 'bg-emerald-600',
          text: 'text-white',
          lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          title: '🟢 ปลอดภัย / ปกติ',
          icon: CheckCircle2,
          desc: 'ฉลากอ่านชัดเจน โครงสร้างถูกต้อง และไม่พบความขัดแย้งกับประวัติสุขภาพของคุณ',
        };
      case 'caution':
        return {
          emoji: '🟡',
          bg: 'bg-amber-500',
          text: 'text-white',
          lightBg: 'bg-amber-50 border-amber-200 text-amber-800',
          title: '🟡 มีข้อควรระวัง',
          icon: AlertTriangle,
          desc: 'พบข้อควรระวัง เช่น โซเดียม/น้ำตาลสูง อาจทำให้ง่วงซึม ใกล้วันหมดอายุ หรืออ่านข้อมูลได้บางส่วน',
        };
      case 'danger':
        return {
          emoji: '🔴',
          bg: 'bg-rose-600',
          text: 'text-white',
          lightBg: 'bg-rose-50 border-rose-200 text-rose-800',
          title: '🔴 อันตราย / ห้ามบริโภค',
          icon: AlertOctagon,
          desc: 'ตรงกับประวัติการแพ้ มีข้อห้ามใช้รุนแรง รูปแบบ อย. ไม่ถูกต้อง หรือผลิตภัณฑ์หมดอายุแล้ว',
        };
      default:
        return {
          emoji: '🟢',
          bg: 'bg-emerald-600',
          text: 'text-white',
          lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          title: 'ข้อมูลผลิตภัณฑ์',
          icon: Info,
          desc: '',
        };
    }
  };

  const risk = getRiskBadge(result.riskLevel);
  const RiskIcon = risk.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className={`${risk.bg} ${risk.text} px-5 py-4 flex items-center justify-between relative`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <RiskIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold opacity-90">
                ผลการวิเคราะห์ความปลอดภัย
              </div>
              <div className="text-base sm:text-lg font-bold leading-tight">
                {risk.title}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Audio Button */}
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-full transition-all ${
                isPlayingAudio
                  ? 'bg-white text-slate-800 animate-pulse shadow-md'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={isPlayingAudio ? 'หยุดเสียง' : 'ฟังเสียงสรุป (สำหรับผู้สูงอายุ)'}
            >
              {isPlayingAudio ? (
                <VolumeX className="w-5 h-5 text-rose-600" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            {/* Close Button */}
            <button
              onClick={() => {
                stopSpeaking();
                setIsPlayingAudio(false);
                onClose();
              }}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Audio Indicator Banner when playing */}
          {isPlayingAudio && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>กำลังอ่านออกเสียงสรุปภาษาไทยให้ฟัง...</span>
              </div>
              <button
                onClick={handleToggleAudio}
                className="text-xs font-semibold text-emerald-700 underline"
              >
                หยุด
              </button>
            </div>
          )}

          {/* Unreadable Image Warning (Requirement 11: หากภาพเบลอหรืออ่านข้อมูลไม่ได้ ห้ามเดาข้อมูล ให้แจ้งผู้ใช้ว่าต้องถ่ายภาพใหม่) */}
          {result.isReadable === false && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3 text-amber-950">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-sm text-amber-900">
                    ไม่สามารถอ่านข้อมูลบนฉลากได้อย่างชัดเจน
                  </div>
                  <div className="text-xs text-amber-800 mt-1 leading-relaxed">
                    {result.unreadableMessage ||
                      'ไม่สามารถอ่านข้อมูลบนฉลากได้อย่างชัดเจน กรุณาถ่ายภาพใหม่โดยให้แสงสว่างเพียงพอ ภาพคมชัด และเห็นข้อความทั้งหมดบนฉลากอย่างครบถ้วน'}
                  </div>
                  <div className="text-[11px] text-amber-700/90 font-medium mt-1">
                    🛡️ ระบบไม่เดาหรือแต่งข้อมูลเพื่อความปลอดภัยสูงสุดในการบริโภค
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>ถ่ายภาพใหม่ทันที</span>
              </button>
            </div>
          )}

          {/* SECTION 1: 📌 สรุปข้อมูลหลักจากฉลาก */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <span>1. 📌 สรุปข้อมูลหลักจากฉลาก</span>
              </h4>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {result.productType}
              </span>
            </div>

            {/* Markdown Table equivalent for mobile */}
            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-50/60">
                <span className="font-bold text-slate-700 min-w-44">ชื่อผลิตภัณฑ์ / ชื่อยา</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {result.productName || 'ไม่พบข้อมูล'}
                  {result.genericName && (
                    <span className="block text-xs font-semibold text-emerald-700 mt-0.5">
                      (ชื่อสามัญ: {result.genericName})
                    </span>
                  )}
                  {result.brandName && (
                    <span className="block text-[11px] font-normal text-slate-500">
                      แบรนด์/ผู้ผลิต: {result.brandName}
                    </span>
                  )}
                </span>
              </div>

              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-slate-50/60">
                <span className="font-bold text-slate-700 min-w-44">หมายเลข อย. / ทะเบียนยา</span>
                <div className="text-left sm:text-right space-y-1">
                  <div className="flex flex-wrap items-center sm:justify-end gap-1.5">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {result.fdaNumber || 'ไม่พบข้อมูล'}
                    </span>
                    {result.fdaNumber && result.fdaNumber !== 'ไม่พบข้อมูล' && (
                      <span className="font-bold text-xs">
                        <span className="text-slate-400 mx-1">→</span>
                        {result.fdaValidation?.isValidFormat ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1 font-bold">
                            [ผลเช็กโครงสร้าง: โครงสร้างถูกต้อง]
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 inline-flex items-center gap-1 font-bold">
                            [ผลเช็กโครงสร้าง: โครงสร้างไม่ถูกต้อง]
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {result.fdaValidation && (
                    <div className="text-[11px] text-slate-600 font-medium">
                      <span>ประเภท: {result.fdaValidation.type}</span>
                      {result.fdaValidation.formatExplanation && (
                        <span className="block text-slate-500 mt-0.5">
                          {result.fdaValidation.formatExplanation}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-50/60">
                <span className="font-bold text-slate-700 min-w-44">วิธีใช้ / ขนาดรับประทาน</span>
                <span className="text-slate-800 font-medium sm:text-right leading-relaxed max-w-xs">
                  {result.directions || 'ไม่พบข้อมูล'}
                </span>
              </div>

              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-50/60">
                <span className="font-bold text-slate-700 min-w-44">วันหมดอายุ</span>
                <span className="font-semibold text-slate-900 sm:text-right">
                  {result.expiryDate || 'ไม่พบข้อมูล'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: ⚠️ ข้อควรระวังและเตือนความปลอดภัย (Highlight) */}
          <div className="border-2 border-amber-300 bg-amber-50/60 rounded-2xl p-4 space-y-3">
            <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>2. ⚠️ ข้อควรระวังและเตือนความปลอดภัย (Highlight)</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              {/* สารก่อภูมิแพ้ / สารต้องระวัง */}
              <div className="bg-white/95 p-3 rounded-xl border border-amber-200 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>สารก่อภูมิแพ้ / สารต้องระวัง:</span>
                </div>
                {result.allergensFound && result.allergensFound.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {result.allergensFound.map((item, idx) => (
                      <div key={idx} className="text-rose-900 pl-3.5">
                        • <span className="font-bold underline">{item.allergen}</span>: {item.note}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-600 pl-3.5">
                    ไม่พบสารก่อภูมิแพ้ที่ระบุชัดเจนบนฉลาก
                  </div>
                )}
              </div>

              {/* ข้อควรระวังพิเศษ */}
              <div className="bg-white/95 p-3 rounded-xl border border-amber-200 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>ข้อควรระวังพิเศษ:</span>
                </div>
                {result.warnings && result.warnings.length > 0 ? (
                  <div className="space-y-1 mt-1 text-slate-800 pl-3.5">
                    {result.warnings.map((w, idx) => (
                      <div key={idx}>• {w}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-600 pl-3.5">
                    ใช้ตามข้อบ่งใช้ปกติ ไม่พบคำเตือนพิเศษเพิ่มเติม
                  </div>
                )}
              </div>

              {/* การประเมินจากประวัติสุขภาพผู้ใช้ */}
              <div className="bg-white/95 p-3 rounded-xl border border-amber-200 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>การประเมินจากประวัติสุขภาพผู้ใช้:</span>
                </div>
                {((result.contraindications && result.contraindications.length > 0) ||
                  (result.drugInteractions && result.drugInteractions.length > 0)) ? (
                  <div className="space-y-1.5 mt-1 pl-3.5">
                    {result.contraindications?.map((c, idx) => (
                      <div key={`c-${idx}`} className="text-rose-900">
                        • <span className="font-bold">ภาวะ {c.condition}:</span> {c.reason}
                      </div>
                    ))}
                    {result.drugInteractions?.map((d, idx) => (
                      <div key={`d-${idx}`} className="text-purple-950">
                        • <span className="font-bold">ปฏิกิริยากับ {d.drug}:</span> {d.reason}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-800 font-medium pl-3.5">
                    ✓ ไม่พบข้อขัดแย้งหรือความเสี่ยงตรงกับประวัติสุขภาพที่คุณระบุไว้
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: 💡 คำแนะนำการปฏิบัติตน */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
            <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>3. 💡 คำแนะนำการปฏิบัติตน</span>
            </h4>
            <div className="space-y-1.5 text-xs text-emerald-950 font-medium leading-relaxed pl-1">
              {result.actionableGuidance && result.actionableGuidance.length > 0 ? (
                result.actionableGuidance.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))
              ) : (
                <p>{result.userFriendlySummary}</p>
              )}
            </div>

            {/* Elderly Tips if available */}
            {result.elderlyTips && (
              <div className="mt-3 pt-2.5 border-t border-emerald-200/80 text-xs">
                <span className="font-bold text-amber-900">👴 คำแนะนำสำหรับผู้สูงอายุ: </span>
                <span className="text-slate-800 font-medium">{result.elderlyTips}</span>
              </div>
            )}
          </div>

          {/* Nutrition Facts Table (if food/drink) */}
          {result.nutritionFacts && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                ข้อมูลโภชนาการ (ต่อ 1 หน่วยบริโภค)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {result.nutritionFacts.calories && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-500 font-medium">พลังงาน</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      {result.nutritionFacts.calories}
                    </div>
                  </div>
                )}
                {result.nutritionFacts.sugar && (
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                    <div className="text-[10px] text-amber-700 font-medium">น้ำตาล</div>
                    <div className="text-sm font-bold text-amber-900 mt-0.5">
                      {result.nutritionFacts.sugar}
                    </div>
                  </div>
                )}
                {result.nutritionFacts.sodium && (
                  <div className="bg-white p-2.5 rounded-xl border border-rose-200 text-center">
                    <div className="text-[10px] text-rose-700 font-medium">โซเดียม</div>
                    <div className="text-sm font-bold text-rose-900 mt-0.5">
                      {result.nutritionFacts.sodium}
                    </div>
                  </div>
                )}
                {result.nutritionFacts.fat && (
                  <div className="bg-white p-2.5 rounded-xl border border-sky-200 text-center">
                    <div className="text-[10px] text-sky-700 font-medium">ไขมัน</div>
                    <div className="text-sm font-bold text-sky-900 mt-0.5">
                      {result.nutritionFacts.fat}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: STRICT SAFETY RULES - VERBATIM MEDICAL DISCLAIMER */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-950 leading-relaxed font-medium">
            <span className="font-extrabold text-amber-900">🚨 ข้อควรระวัง:</span> ระบบนี้เป็นเพียงผู้ช่วยอ่านและคัดกรองข้อมูลเบื้องต้นจากฉลากเท่านั้น ไม่สามารถใช้ทดแทนคำแนะนำของแพทย์หรือเภสัชกรได้
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onSaveToHistory(result)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-emerald-600" />
            <span>{isSaved ? 'บันทึกในประวัติแล้ว' : 'บันทึกไว้ในประวัติ'}</span>
          </button>

          <button
            onClick={() => {
              stopSpeaking();
              onAskChat(result);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>ปรึกษาเจ้าหน้าที่ อย. 1556</span>
          </button>
        </div>
      </div>
    </div>
  );
};
