import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { ScanTab } from './components/ScanTab';
import { FDACheckerTab } from './components/FDACheckerTab';
import { HealthProfileModal } from './components/HealthProfileModal';
import { HistoryTab } from './components/HistoryTab';
import { HelpChatTab } from './components/HelpChatTab';
import { ScanResultModal } from './components/ScanResultModal';
import { AuthModal } from './components/AuthModal';
import { UserProfile, ScanResult } from './types';
import { DEMO_PROFILES } from './data/mockData';

const STORAGE_KEY_PROFILE = 'nutrimed_user_profile';
const STORAGE_KEY_HISTORY = 'nutrimed_scan_history';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('scan');

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading stored profile:', e);
    }
    // Default to chronic disease patient persona (Diabetes + Hypertension)
    return DEMO_PROFILES.chronic;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Scan History
  const [history, setHistory] = useState<ScanResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading stored history:', e);
    }
    return [];
  });

  // Current Scanned Product
  const [activeScanResult, setActiveScanResult] = useState<ScanResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Modals
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Font Size
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>(
    userProfile.fontSize || 'normal'
  );

  const [isLoading, setIsLoading] = useState(false);

  // Save profile to local storage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }
  }, [userProfile]);

  // Save history to local storage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage:', e);
    }
  }, [history]);

  // Save Scan Result to History
  const handleSaveToHistory = (result: ScanResult) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== result.id);
      return [result, ...filtered];
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    if (confirm('คุณต้องการลบประวัติการสแกนทั้งหมดหรือไม่?')) {
      setHistory([]);
    }
  };

  // When scan completes
  const handleScanComplete = (result: ScanResult) => {
    setActiveScanResult(result);
    setIsResultModalOpen(true);
    // Auto-save to history
    handleSaveToHistory(result);
  };

  // Open Chat tab with this product in context
  const handleAskChat = (result: ScanResult) => {
    setActiveScanResult(result);
    setIsResultModalOpen(false);
    setCurrentTab('help');
  };

  // Handle Login from Auth Modal
  const handleLogin = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    setIsLoggedIn(true);
    if (newProfile.fontSize) {
      setFontSize(newProfile.fontSize);
    }
    // Automatically trigger health profile pop-up right after login!
    setTimeout(() => {
      setIsHealthModalOpen(true);
    }, 250);
  };

  const handleLogout = () => {
    setUserProfile({
      name: 'ผู้ใช้ทั่วไป',
      email: '',
      role: 'ผู้ใช้งานทั่วไป',
      elderlyMode: false,
      fontSize: 'normal',
      diseases: [],
      allergies: [],
      medications: [],
    });
    setIsLoggedIn(false);
  };

  // Handle Font Size Change
  const handleFontSizeChange = (size: 'normal' | 'large' | 'huge') => {
    setFontSize(size);
    setUserProfile((prev) => ({ ...prev, fontSize: size }));
  };

  // Font size class mapper
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'huge':
        return 'text-[17px]';
      case 'large':
        return 'text-[15.5px]';
      case 'normal':
      default:
        return 'text-[14px]';
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-100/90 text-slate-800 ${getFontSizeClass()} flex flex-col selection:bg-emerald-500 selection:text-white`}
    >
      {/* Top Navbar */}
      <Navbar
        userProfile={userProfile}
        onOpenProfile={() => setIsHealthModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isLoggedIn={isLoggedIn}
      />

      {/* Main Body Content Container (Mobile-first centered max-w-md) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-24">
        {currentTab === 'scan' && (
          <ScanTab
            userProfile={userProfile}
            onOpenProfile={() => setIsHealthModalOpen(true)}
            onScanComplete={handleScanComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        {currentTab === 'fda' && (
          <FDACheckerTab
            onScanComplete={handleScanComplete}
            userProfile={userProfile}
          />
        )}

        {currentTab === 'health' && (
          // In health tab, show profile editor directly or open modal
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-900">
                  ประวัติสุขภาพและสารก่อภูมิแพ้ของคุณ
                </h2>
                <button
                  onClick={() => setIsHealthModalOpen(true)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  แก้ไขข้อมูล
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-slate-500 font-medium">ชื่อผู้ใช้ / บทบาท</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {userProfile.name} ({userProfile.role})
                  </div>
                  {userProfile.age && (
                    <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2">
                      <span>อายุ: <strong className="text-slate-800">{userProfile.age} ปี</strong></span>
                      {userProfile.gender && (
                        <span>เพศ: <strong className="text-slate-800">{userProfile.gender === 'male' ? 'ชาย' : userProfile.gender === 'female' ? 'หญิง' : 'อื่นๆ'}</strong></span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-slate-500 font-medium mb-1">โรคประจำตัว</div>
                  <div className="flex flex-wrap gap-1">
                    {userProfile.diseases && userProfile.diseases.length > 0 ? (
                      userProfile.diseases.map((d) => (
                        <span
                          key={d}
                          className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-lg"
                        >
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">ไม่มีข้อมูล</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-slate-500 font-medium mb-1">สารที่แพ้ (อาหาร/ยา)</div>
                  <div className="flex flex-wrap gap-1">
                    {userProfile.allergies && userProfile.allergies.length > 0 ? (
                      userProfile.allergies.map((a) => (
                        <span
                          key={a}
                          className="bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded-lg"
                        >
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">ไม่มีข้อมูล</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-slate-500 font-medium mb-1">ยาประจำตัว</div>
                  <div className="flex flex-wrap gap-1">
                    {userProfile.medications && userProfile.medications.length > 0 ? (
                      userProfile.medications.map((m) => (
                        <span
                          key={m}
                          className="bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-lg"
                        >
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">ไม่มีข้อมูล</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
                  <div className="font-bold">โหมดผู้สูงอายุ (Elderly Assistance Mode)</div>
                  <div className="text-[11px] mt-0.5">
                    สถานะ: {userProfile.elderlyMode ? 'เปิดใช้งาน (AI เน้นอธิบายง่าย ตัวใหญ่ มีเสียงอ่าน)' : 'ปิดใช้งาน'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'history' && (
          <HistoryTab
            history={history}
            onSelectResult={(item) => {
              setActiveScanResult(item);
              setIsResultModalOpen(true);
            }}
            onClearHistory={handleClearHistory}
            onDeleteOne={handleDeleteHistoryItem}
            onStartScan={() => setCurrentTab('scan')}
          />
        )}

        {currentTab === 'help' && (
          <HelpChatTab
            userProfile={userProfile}
            currentScan={activeScanResult}
          />
        )}
      </main>

      {/* Bottom Fixed Navigation Bar (5 tabs) */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'health') {
            setIsHealthModalOpen(true);
          }
          setCurrentTab(tab);
        }}
        historyCount={history.length}
      />

      {/* Scan Result Modal */}
      {isResultModalOpen && activeScanResult && (
        <ScanResultModal
          result={activeScanResult}
          onClose={() => setIsResultModalOpen(false)}
          onSaveToHistory={handleSaveToHistory}
          isSaved={history.some((h) => h.id === activeScanResult.id)}
          onAskChat={handleAskChat}
          elderlyMode={userProfile.elderlyMode}
        />
      )}

      {/* Health Profile Modal */}
      <HealthProfileModal
        profile={userProfile}
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        onSave={(updated) => setUserProfile(updated)}
      />

      {/* Auth / Demo Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onLogout={handleLogout}
        currentProfile={userProfile}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
