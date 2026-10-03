import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { ScanTab } from './components/ScanTab';
import { FDACheckerTab } from './components/FDACheckerTab';
import { HealthProfileModal } from './components/HealthProfileModal';
import { HistoryTab } from './components/HistoryTab';
import { HelpChatTab } from './components/HelpChatTab';
import { ScanResultModal } from './components/ScanResultModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AppIconBadge } from './components/AppLogo';
import { UserProfile, ScanResult } from './types';
import {
  subscribeToUserHistory,
  saveScanToFirestore,
  deleteScanFromFirestore,
  clearUserHistoryFromFirestore,
} from './services/historyService';

function AppContent() {
  const {
    currentUser,
    userProfile,
    isAuthLoading,
    updateUserProfile,
  } = useAuth();

  const [currentTab, setCurrentTab] = useState<TabType>('scan');

  // Real-time Scan History tied to authenticated Firebase user
  const [history, setHistory] = useState<ScanResult[]>([]);

  // Current Scanned Product
  const [activeScanResult, setActiveScanResult] = useState<ScanResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Modals
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);

  // Font Size
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>(
    userProfile.fontSize || 'normal'
  );

  const [isLoading, setIsLoading] = useState(false);

  // Sync font size when profile loads
  useEffect(() => {
    if (userProfile.fontSize) {
      setFontSize(userProfile.fontSize);
    }
  }, [userProfile.fontSize]);

  // Subscribe to user's private scan history in Firestore with local cache restore
  useEffect(() => {
    if (!currentUser) {
      console.log('[App] No user logged in. Clearing history state and listeners.');
      setHistory([]);
      return;
    }

    const userId = currentUser.uid;
    const cacheKey = `nutrimed_history_${userId}`;
    console.log('[App] Initializing history for user UID:', userId);

    // 1. Instant restore from local cache for this specific user (prevents empty flicker on refresh)
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[App] Instantly restored ${parsed.length} cached history items for user: ${userId}`);
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.warn('[App] Error reading cached history:', e);
    }

    // 2. Real-time synchronization with Cloud Firestore: users/{userId}/scanHistory
    const unsubscribe = subscribeToUserHistory(
      userId,
      (syncedHistory) => {
        console.log(`[App] Firestore real-time update: received ${syncedHistory.length} history items for user: ${userId}`);
        setHistory(syncedHistory);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(syncedHistory));
        } catch (e) {
          console.warn('[App] Error writing to history cache:', e);
        }
      },
      (err) => {
        console.error('[App] Real-time history sync error:', err);
      }
    );

    return () => {
      console.log(`[App] Cleaning up Firestore history listener for user: ${userId}`);
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Save Scan Result to History (both state and Firestore)
  const handleSaveToHistory = async (result: ScanResult) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== result.id);
      const updated = [result, ...filtered];
      if (currentUser) {
        try {
          localStorage.setItem(`nutrimed_history_${currentUser.uid}`, JSON.stringify(updated));
        } catch (e) {
          console.warn('Cache write error:', e);
        }
      }
      return updated;
    });

    if (currentUser) {
      try {
        console.log('[App] Saving scan to Firestore for user:', currentUser.uid, 'scanId:', result.id);
        await saveScanToFirestore(currentUser.uid, result);
      } catch (err) {
        console.error('[App] Failed to save scan to Firestore:', err);
      }
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (currentUser) {
        try {
          localStorage.setItem(`nutrimed_history_${currentUser.uid}`, JSON.stringify(updated));
        } catch (e) {
          console.warn('Cache write error:', e);
        }
      }
      return updated;
    });

    if (currentUser) {
      try {
        await deleteScanFromFirestore(currentUser.uid, id);
      } catch (err) {
        console.error('[App] Failed to delete scan from Firestore:', err);
      }
    }
  };

  const handleClearHistory = async () => {
    setHistory([]);
    if (currentUser) {
      try {
        localStorage.removeItem(`nutrimed_history_${currentUser.uid}`);
        await clearUserHistoryFromFirestore(currentUser.uid);
      } catch (err) {
        console.error('[App] Failed to clear history from Firestore:', err);
      }
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

  // Apply root font size and elderly mode globally across the application
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-normal', 'font-large', 'font-huge');

    if (fontSize === 'huge') {
      root.classList.add('font-huge');
      root.style.fontSize = '21.5px';
    } else if (fontSize === 'large') {
      root.classList.add('font-large');
      root.style.fontSize = '18.5px';
    } else {
      root.classList.add('font-normal');
      root.style.fontSize = '16px';
    }

    if (userProfile.elderlyMode) {
      root.classList.add('elderly-mode-active');
    } else {
      root.classList.remove('elderly-mode-active');
    }
  }, [fontSize, userProfile.elderlyMode]);

  // Handle Font Size Change
  const handleFontSizeChange = (size: 'normal' | 'large' | 'huge') => {
    setFontSize(size);
    updateUserProfile({ fontSize: size });
  };

  // Handle Quick Elderly Mode Toggle
  const handleToggleElderlyMode = () => {
    const nextElderly = !userProfile.elderlyMode;
    const nextFontSize = nextElderly && fontSize === 'normal' ? 'large' : fontSize;
    if (nextFontSize !== fontSize) {
      setFontSize(nextFontSize);
    }
    updateUserProfile({ elderlyMode: nextElderly, fontSize: nextFontSize });
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

  // 1. Loading splash screen while checking Firebase Auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-7 rounded-3xl shadow-xl shadow-slate-200/70 border border-emerald-100 flex flex-col items-center max-w-xs text-center space-y-4">
          <AppIconBadge size="lg" />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg text-slate-800 tracking-tight">
              Nutri<span className="text-emerald-600">Med</span>
            </span>
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              Scan AI
            </span>
          </div>
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  // 2. Private Route Protection: If not logged in, immediately show LoginPage
  if (!currentUser) {
    return <LoginPage />;
  }

  // 3. User is authenticated: Render main NutriMed Scan AI application
  return (
    <div
      className={`min-h-screen bg-slate-100/90 text-slate-800 ${getFontSizeClass()} flex flex-col selection:bg-emerald-500 selection:text-white`}
    >
      {/* Top Navbar */}
      <Navbar
        userProfile={userProfile}
        photoURL={currentUser.photoURL}
        onOpenProfile={() => setIsHealthModalOpen(true)}
        onOpenAuth={() => setIsUserProfileModalOpen(true)}
        isLoggedIn={true}
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
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-900">
                  ประวัติสุขภาพและสารก่อภูมิแพ้ของคุณ
                </h2>
                <button
                  onClick={() => setIsHealthModalOpen(true)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
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
        onSave={(updated) => updateUserProfile(updated)}
      />

      {/* Account / User Profile Modal */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        onFontSizeChange={handleFontSizeChange}
        currentFontSize={fontSize}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
