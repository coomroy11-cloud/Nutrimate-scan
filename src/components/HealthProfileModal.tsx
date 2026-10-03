import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Sparkles,
  AlertTriangle,
  Pill,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  Calendar,
  User,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../types';

interface HealthProfileModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => void;
  isFirstSetup?: boolean;
}

const COMMON_DISEASES = [
  { id: 'เบาหวาน (Diabetes)', label: 'เบาหวาน (Diabetes - ควบคุมน้ำตาล)' },
  { id: 'ความดันโลหิตสูง (Hypertension)', label: 'ความดันโลหิตสูง (Hypertension - ควบคุมโซเดียม)' },
  { id: 'โรคไตเรื้อรัง (CKD)', label: 'โรคไตเรื้อรัง (CKD - จำกัดโซเดียม/โพแทสเซียม)' },
  { id: 'โรคกระเพาะอาหาร/แผลทางเดินอาหาร', label: 'โรคกระเพาะอาหาร/แผลทางเดินอาหาร (เลี่ยง NSAIDs)' },
  { id: 'โรคหัวใจและหลอดเลือด (Cardiovascular)', label: 'โรคหัวใจและหลอดเลือด (Cardiovascular)' },
  { id: 'โรคเกาต์ (Gout)', label: 'โรคเกาต์ (Gout)' },
  { id: 'กำลังตั้งครรภ์ หรือ ให้นมบุตร', label: 'กำลังตั้งครรภ์ หรือ ให้นมบุตร' },
];

const COMMON_ALLERGIES = [
  'ถั่วลิสง (Peanuts)',
  'นมวัว/แลกโตส (Dairy)',
  'กุ้ง/อาหารทะเล (Seafood)',
  'ไข่ (Eggs)',
  'แป้งสาลี/กลูเตน (Gluten/Wheat)',
  'ถั่วเหลือง (Soy)',
  'งาดำ/งาขาว (Sesame)',
  'ซัลไฟต์/วัตถุกันเสีย (Sulfites)',
  'ยาแอสไพริน/NSAIDs (Aspirin/NSAIDs)',
  'ยาเพนิซิลลิน (Penicillin)',
  'ยาซัลฟา (Sulfonamides)',
];

export const HealthProfileModal: React.FC<HealthProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
  isFirstSetup = false,
}) => {
  const [age, setAge] = useState<string | number>(profile.age ?? '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(
    (profile.gender as any) ?? ''
  );
  const [elderlyMode, setElderlyMode] = useState(profile.elderlyMode);
  const [diseases, setDiseases] = useState<string[]>(profile.diseases || []);
  const [allergies, setAllergies] = useState<string[]>(profile.allergies || []);
  const [medications, setMedications] = useState<string[]>(profile.medications || []);

  const [customAllergy, setCustomAllergy] = useState('');
  const [customMed, setCustomMed] = useState('');

  // Keep internal state synced when profile prop changes
  useEffect(() => {
    if (isOpen) {
      setAge(profile.age ?? '');
      setGender((profile.gender as any) ?? '');
      setElderlyMode(profile.elderlyMode);
      setDiseases(profile.diseases || []);
      setAllergies(profile.allergies || []);
      setMedications(profile.medications || []);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  // Handle Age change and auto-suggest elderly mode for age >= 60
  const handleAgeChange = (val: string) => {
    setAge(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 60) {
      setElderlyMode(true);
    }
  };

  const toggleDisease = (id: string) => {
    setDiseases((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleAllergy = (name: string) => {
    setAllergies((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    if (!allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
    }
    setCustomAllergy('');
  };

  const addCustomMed = () => {
    if (!customMed.trim()) return;
    if (!medications.includes(customMed.trim())) {
      setMedications([...medications, customMed.trim()]);
    }
    setCustomMed('');
  };

  const removeMed = (med: string) => {
    setMedications(medications.filter((m) => m !== med));
  };

  const handleSave = () => {
    onSave({
      ...profile,
      age: age ? Number(age) : undefined,
      gender,
      elderlyMode,
      diseases,
      allergies,
      medications,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-emerald-100" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                กรอกข้อมูลสุขภาพและประวัติการแพ้
              </h2>
              <p className="text-[11px] text-emerald-700/80">
                ระบบใช้ประเมินความปลอดภัยของยาและอาหารเฉพาะบุคคล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Welcoming Banner after login */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 p-3 px-5 flex items-start gap-2.5 text-xs text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">เข้าสู่ระบบสำเร็จ!</span> กรุณาระบุข้อมูล เช่น อายุ โรคประจำตัว และประวัติการแพ้ เพื่อให้ AI วิเคราะห์ฉลากยาและอาหารได้อย่างปลอดภัยสูงสุด
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Section 1: Basic Info (Age & Gender) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>ข้อมูลพื้นฐาน (อายุ และ เพศ)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Age Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  อายุ (ปี)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => handleAgeChange(e.target.value)}
                    placeholder="เช่น 55"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* Gender Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  เพศ
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 bg-white"
                >
                  <option value="">-- ไม่ระบุ --</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
            </div>

            {Number(age) >= 60 && (
              <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>อายุ 60 ปีขึ้นไป: ระบบเปิดโหมดผู้สูงอายุเพื่อคำอธิบายที่อ่านง่ายให้โดยอัตโนมัติ</span>
              </div>
            )}
          </div>

          {/* Section 2: Chronic Diseases Multi-select */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              โรคประจำตัว หรือ ภาวะสุขภาพ (เลือกได้มากกว่า 1 ข้อ)
            </label>
            <div className="space-y-1.5">
              {COMMON_DISEASES.map((item) => {
                const isChecked = diseases.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleDisease(item.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Allergies Chips Multi-select */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              ประวัติการแพ้อาหาร หรือ แพ้ยา
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGIES.map((allergy) => {
                const isSelected = allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-2xs font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5] text-rose-600" />}
                    <span>{allergy}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Allergy Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomAllergy()}
                placeholder="พิมพ์สารก่อภูมิแพ้อื่น เช่น ยาชา, แป้ง..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={addCustomAllergy}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0"
              >
                + เพิ่ม
              </button>
            </div>
          </div>

          {/* Section 4: Regular Medications */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              ยาที่รับประทานเป็นประจำ (เพื่อตรวจ Drug Interaction)
            </label>
            {medications.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {medications.map((med) => (
                  <span
                    key={med}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-medium"
                  >
                    <Pill className="w-3 h-3 text-emerald-600" />
                    <span>{med}</span>
                    <button
                      type="button"
                      onClick={() => removeMed(med)}
                      className="text-emerald-500 hover:text-rose-600 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={customMed}
                onChange={(e) => setCustomMed(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomMed()}
                placeholder="เช่น Amlodipine 5mg, Metformin..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={addCustomMed}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0"
              >
                + เพิ่ม
              </button>
            </div>
          </div>

          {/* Section 5: Elderly Assistance Mode Toggle */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>โหมดสำหรับผู้สูงอายุ (Elderly Assistance Mode)</span>
              </div>
              <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                AI จะเน้นสรุปวิธีใช้ง่ายๆ ป้ายชัดเจน ตัวหนังสือขนาดใหญ่ และปุ่มแตะฟังเสียง
              </p>
            </div>
            <button
              type="button"
              onClick={() => setElderlyMode(!elderlyMode)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 mt-0.5 ${
                elderlyMode ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  elderlyMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            ข้ามไปก่อน
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            บันทึกข้อมูลสุขภาพ
          </button>
        </div>
      </div>
    </div>
  );
};
