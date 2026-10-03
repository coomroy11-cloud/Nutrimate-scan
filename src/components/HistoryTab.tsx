import React from 'react';
import {
  History,
  Trash2,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  Pill,
  Utensils,
  Camera,
} from 'lucide-react';
import { ScanResult } from '../types';

interface HistoryTabProps {
  history: ScanResult[];
  onSelectResult: (result: ScanResult) => void;
  onClearHistory: () => void;
  onDeleteOne: (id: string) => void;
  onStartScan: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  onSelectResult,
  onClearHistory,
  onDeleteOne,
  onStartScan,
}) => {
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRiskTag = (level: string) => {
    switch (level) {
      case 'safe':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            ปลอดภัย
          </span>
        );
      case 'caution':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            มีข้อควรระวัง
          </span>
        );
      case 'danger':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
            อันตราย
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              ประวัติการสแกนฉลากยาและอาหาร ({history.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกการตรวจสอบไว้ในเครื่องของคุณ เพื่อเรียนรู้ย้อนหลัง
            </p>
          </div>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
            title="ล้างประวัติทั้งหมด"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* History Items or Empty State */}
      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-emerald-200/80 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <History className="w-8 h-8 opacity-60" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              ยังไม่มีประวัติการสแกน
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              เมื่อคุณสแกนฉลากยาหรืออาหาร ผลการตรวจสอบจะถูกจัดเก็บไว้ที่นี่อัตโนมัติ
            </p>
          </div>
          <button
            onClick={onStartScan}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>เริ่มสแกนฉลากแรก</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-3.5 border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 group shadow-2xs"
            >
              <button
                onClick={() => onSelectResult(item)}
                className="flex-1 text-left flex items-start gap-3 overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                  {item.productType === 'ยา' ? (
                    <Pill className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Utensils className="w-5 h-5 text-teal-600" />
                  )}
                </div>
                <div className="overflow-hidden space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getRiskTag(item.riskLevel)}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {item.productName}
                  </div>
                  <div className="text-xs text-slate-500 truncate flex items-center gap-1 font-mono">
                    {item.fdaNumber ? `อย. ${item.fdaNumber}` : item.genericName || item.brandName}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onDeleteOne(item.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                  title="ลบรายการนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectResult(item)}
                  className="p-1 text-slate-400 group-hover:text-emerald-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
