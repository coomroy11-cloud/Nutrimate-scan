import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  PhoneCall,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  HelpCircle,
  BookOpen,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile, ScanResult, ChatMessage } from '../types';
import { HOTLINES, QUICK_QUESTIONS } from '../data/mockData';
import { speakText, stopSpeaking } from '../utils/audio';

interface HelpChatTabProps {
  userProfile: UserProfile;
  currentScan: ScanResult | null;
}

export const HelpChatTab: React.FC<HelpChatTabProps> = ({
  userProfile,
  currentScan,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'สวัสดีค่ะ เจ้าหน้าที่ให้คำปรึกษา ยินดีให้คำแนะนำด้านการใช้ยา ฉลากอาหาร และความปลอดภัย วันนี้มีข้อสงสัยเกี่ยวกับผลิตภัณฑ์สุขภาพใดให้ช่วยดูแลคะ?',
      timestamp: '11:39',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat-fda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentScan,
          userProfile,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'ขอบคุณสำหรับคำถามค่ะ หากต้องการคำแนะนำเพิ่มเติม สามารถสอบถามเจ้าหน้าที่ให้คำปรึกษาได้ตลอดเวลาค่ะ',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาสอบถามเจ้าหน้าที่ให้คำปรึกษาอีกครั้งในภายหลังค่ะ',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleSpeak = (msg: ChatMessage) => {
    if (playingId === msg.id) {
      stopSpeaking();
      setPlayingId(null);
    } else {
      stopSpeaking();
      setPlayingId(msg.id);
      speakText(
        msg.text,
        () => setPlayingId(msg.id),
        () => setPlayingId(null),
        () => setPlayingId(null)
      );
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Help Center Header */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-500/20">
              <MessageCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                ศูนย์ช่วยเหลือและปรึกษาเจ้าหน้าที่
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                แชทกับเจ้าหน้าที่ให้คำปรึกษา
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ออนไลน์</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={() => {
              const inputEl = document.querySelector('input[placeholder*="เจ้าหน้าที่"]') as HTMLInputElement;
              inputEl?.focus();
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>แชทคุยกับเจ้าหน้าที่ให้คำปรึกษา</span>
          </button>
        </div>
      </div>

      {/* Consultant Banner Card in Green Tone */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-green-800 text-white rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">เจ้าหน้าที่ให้คำปรึกษา</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
              ออนไลน์
            </span>
          </div>
          <p className="text-xs text-emerald-100">
            บริการให้คำแนะนำด้านการใช้ยา สารอาหาร และความปลอดภัย
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span>พร้อมให้บริการ</span>
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-4 space-y-3">
        <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            const isPlaying = playingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                {/* Speaker Label */}
                {isBot && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-bold text-slate-700">
                      เจ้าหน้าที่ให้คำปรึกษา
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                      พร้อมให้คำแนะนำ
                    </span>
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-2xs ${
                    isBot
                      ? 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-xs'
                      : 'bg-emerald-600 text-white rounded-tr-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] ${
                      isBot ? 'text-slate-400' : 'text-emerald-100'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {/* Audio TTS button for message */}
                    {isBot && (
                      <button
                        onClick={() => handleToggleSpeak(msg)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                          isPlaying
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : 'hover:text-slate-700'
                        }`}
                        title="ฟังเสียงพูด"
                      >
                        {isPlaying ? (
                          <>
                            <VolumeX className="w-3 h-3 text-rose-500" />
                            <span>หยุด</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>ฟังเสียง</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>เจ้าหน้าที่ให้คำปรึกษา กำลังพิมพ์คำตอบ...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions Carousel */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            คำถามยอดนิยม:
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isSending}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-medium shrink-0 border border-slate-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="พิมพ์คำถามถึงเจ้าหน้าที่ให้คำปรึกษาที่นี่..."
            disabled={isSending}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isSending}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Emergency Contacts Card */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            เบอร์โทรฉุกเฉินและบริการช่วยเหลือ (Emergency Contacts)
          </h3>
        </div>

        <div className="space-y-2">
          {HOTLINES.map((hotline) => (
            <div
              key={hotline.number}
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 bg-slate-50/50"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-xs">
                    {hotline.name}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-700 text-xs bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    {hotline.number}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {hotline.desc}
                </p>
              </div>
              <a
                href={`tel:${hotline.number}`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs shrink-0 flex items-center gap-1 active:scale-95 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>โทร</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
