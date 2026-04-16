import React, { useState, useEffect } from 'react';
import { 
  Upload, Image as ImageIcon, Sparkles, AlertCircle, 
  Target, Download, Pencil, Terminal, X, Lock, 
  Activity, Atom, Eye, Cloud 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

/**
 * [환경 설정]
 * GEMINI_API_KEY: 사용자가 제공한 Gemini API 키
 * firebaseConfig: 시스템 환경변수(__firebase_config)에서 동적으로 로드하여 API Key 오류 해결
 */
const GEMINI_API_KEY = "AQ.Ab8RN6JPQRB12h0JSbhXKsSEeQc0Pdy93tKrUjBYLqSRR2GbiA";

const rawConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "YOUR_FIREBASE_API_KEY", // 로컬 테스트 시 실제 키 필요
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project"
};

const app = initializeApp(rawConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : "ultra-studio-v17-pro";

const defaultPrompt = "첨부된 모든 피규어 이미지들을 하나의 고급스러운 어두운색 배경지 스튜디오 장면에 자연스럽게 배치하여 합성해줘. 배경만 바꾸고 피규어들의 원래 모습, 비율, 시점은 절대 변경하지 마. 여러 피사체가 조화롭게 배치되도록 구성해줘. 추가 영역 생성 금지. 흰색 바닥 금지.";

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthUnlocked, setIsAuthUnlocked] = useState(false);
  const [targets, setTargets] = useState([]); 
  const [resultImage, setResultImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState(defaultPrompt);

  // Firebase 인증 초기화 (커스텀 토큰 및 익명 로그인 대응)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("인증 시스템 오류:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 이미지 합성 프로토콜 실행
  const handleStartSynthesis = async () => {
    if (targets.length === 0 || isLoading) return;
    setIsLoading(true);
    try {
      const imageParts = targets.map(t => ({ 
        inlineData: { mimeType: "image/png", data: t.base64 } 
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, ...imageParts] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
        })
      });

      if (!response.ok) throw new Error("API 요청 실패");

      const result = await response.json();
      const base64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      
      if (base64) {
        setResultImage(`data:image/png;base64,${base64}`);
      }
    } catch (err) {
      console.error("합성 프로토콜 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 보안 잠금 화면
  if (!isAuthUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-6">
        <div className="bg-slate-900/50 backdrop-blur-xl p-12 rounded-[3rem] border border-slate-800 text-center shadow-2xl animate-in zoom-in duration-500">
          <Lock size={48} className="mx-auto mb-8 text-rose-500" />
          <h2 className="text-3xl font-black mb-8 italic uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">M78 SECURE</h2>
          <input 
            type="password" 
            placeholder="PIN" 
            autoFocus
            className="bg-transparent border-b-2 border-slate-700 text-center text-4xl tracking-[0.6em] outline-none w-40 pb-3 focus:border-rose-500 transition-all font-mono"
            onChange={(e) => e.target.value === '1324' && setIsAuthUnlocked(true)}
          />
          <p className="mt-10 text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">Authorized Personnel Only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-12 font-sans selection:bg-rose-500 selection:text-white">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* 헤더 섹션 */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-1.5 bg-rose-600/10 border border-rose-500/40 rounded-full text-rose-400 text-[11px] font-black tracking-[0.4em] uppercase mb-6 shadow-lg">
            <Cloud size={14} /> Quantum Cloud Active
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-4 drop-shadow-2xl">
            ULTRA <span className="text-rose-600">STUDIO</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.4em]">Advanced Figure Synthesis Protocol v17</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* 입력 패널 */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
              <h3 className="flex items-center gap-3 font-black italic uppercase text-slate-100 mb-6 border-l-4 border-rose-600 pl-4">
                <Target size={20} className="text-rose-500" /> 01. Specimen
              </h3>
              <input 
                type="file" 
                multiple 
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  files.forEach(f => {
                    const r = new FileReader();
                    r.onloadend = () => setTargets(prev => [...prev, { url: r.result, base64: r.result.split(',')[1] }]);
                    r.readAsDataURL(f);
                  });
                  e.target.value = null;
                }}
              />
              <div className="grid grid-cols-3 gap-3 mt-8">
                {targets.map((t, i) => (
                  <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-black/40">
                    <img src={t.url} className="w-full h-full object-contain p-2" alt="Uploaded" />
                    <button onClick={() => setTargets(p => p.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-rose-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
              <h3 className="flex items-center gap-3 font-black italic uppercase text-slate-100 mb-6 border-l-4 border-purple-500 pl-4">
                <Terminal size={20} className="text-purple-500" /> 02. Directive
              </h3>
              <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 bg-black/50 border border-slate-800 rounded-2xl p-5 text-sm font-medium text-slate-300 focus:outline-none focus:border-purple-500/50 transition-all resize-none shadow-inner"
              />
            </section>
          </div>

          {/* 결과 패널 */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex-grow bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden min-h-[500px]">
              <h3 className="flex items-center gap-3 font-black italic uppercase text-slate-100 mb-8 border-l-4 border-cyan-500 pl-4 relative z-10">
                <Sparkles size={20} className="text-cyan-500" /> 03. Visualization
              </h3>
              
              <div className="flex-grow flex items-center justify-center rounded-[2rem] bg-black/60 border border-slate-800/50 shadow-inner relative overflow-hidden group">
                {isLoading ? (
                  <div className="text-center animate-pulse">
                    <Atom size={64} className="text-cyan-400 animate-spin-slow mx-auto mb-6" />
                    <p className="text-xs font-black text-cyan-500 tracking-[0.5em] uppercase">Synthesizing Matter...</p>
                  </div>
                ) : resultImage ? (
                  <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                    <img src={resultImage} className="max-h-full max-w-full rounded-2xl shadow-2xl border border-white/5 animate-in zoom-in duration-700" alt="Synthesis Result" />
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = resultImage;
                        link.download = "ultra_studio_v17.png";
                        link.click();
                      }}
                      className="absolute bottom-8 px-8 py-3 bg-cyan-600/20 border border-cyan-500/50 rounded-full text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-600 hover:text-white transition-all backdrop-blur-md"
                    >
                      <Download size={16} className="inline mr-2" /> Extract Data
                    </button>
                  </div>
                ) : (
                  <div className="text-center opacity-20">
                    <ImageIcon size={80} className="mx-auto mb-6 text-slate-600" />
                    <p className="font-black text-[10px] uppercase tracking-[0.4em]">Awaiting Spatial Coordinates</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              disabled={isLoading || !targets.length} 
              onClick={handleStartSynthesis}
              className={`mt-8 w-full py-8 rounded-[2rem] font-black text-2xl italic uppercase tracking-[0.2em] transition-all relative overflow-hidden group shadow-2xl ${
                isLoading || !targets.length 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                : 'bg-gradient-to-r from-rose-700 to-rose-600 text-white border border-rose-400 hover:-translate-y-2 active:translate-y-0'
              }`}
            >
              <div className="relative z-10 flex items-center justify-center gap-5">
                {isLoading ? <Activity className="animate-bounce" size={28} /> : <Zap size={28} />}
                {isLoading ? 'Processing' : 'Engage Synthesis'}
              </div>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-20 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.5em] pb-10">
        &copy; M78 Nebula Defense Systems - Project Ultra
      </footer>
    </div>
  );
}
