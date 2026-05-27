import { useAuth, useUI, useData } from '@context';
import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  X, 
  Mic, 
  MicOff, 
  VideoOff, 
  Maximize2, 
  Minimize2,
  PhoneOff,
  User
} from 'lucide-react';


export default function CallOverlay() {
  const { activeCall, endCall } = useUI();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (activeCall) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  if (!activeCall) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed z-[100] transition-all duration-500 ease-in-out ${
      isExpanded 
        ? 'inset-4 bg-gray-900/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10' 
        : 'top-8 right-8 w-80 bg-white dark:bg-[#1c212c] rounded-[2rem] shadow-2xl border border-gray-200 dark:border-white/10 p-4 animate-in slide-in-from-top-4'
    }`}>
      
      {isExpanded ? (
        // Expanded View
        <div className="h-full flex flex-col relative">
          <div className="flex-1 flex items-center justify-center relative">
            {activeCall.type === 'video' && !isVideoOff ? (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                 {/* Video Stream Mock */}
                 <div className="text-white/20 text-9xl font-bold animate-pulse">VIDEO STREAM</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-500 border-4 border-purple-500/30">
                  <User size={64} />
                </div>
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-white mb-2">{activeCall.caller}</h2>
                  <p className="text-purple-400 text-xl font-medium tracking-widest uppercase">
                    {activeCall.type === 'video' ? 'Video Call' : 'Voice Call'}
                  </p>
                </div>
              </div>
            )}

            {/* Self View (Small overlay) */}
            {activeCall.type === 'video' && (
               <div className="absolute top-8 right-8 w-48 h-32 bg-black rounded-2xl border-2 border-white/20 overflow-hidden shadow-xl">
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">SELF VIEW</div>
               </div>
            )}
          </div>

          <div className="p-12 flex flex-col items-center gap-8 bg-gradient-to-t from-black/60 to-transparent">
             <div className="text-white text-2xl font-mono tracking-widest">{formatTime(timer)}</div>
             
             <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-6 rounded-full transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                
                {activeCall.type === 'video' && (
                  <button 
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-6 rounded-full transition-all ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {isVideoOff ? <VideoOff size={28} /> : <Video size={28} />}
                  </button>
                )}

                <button 
                  onClick={endCall}
                  className="p-8 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-90"
                >
                  <PhoneOff size={32} />
                </button>

                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-6 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
                >
                  <Minimize2 size={28} />
                </button>
             </div>
          </div>
        </div>
      ) : (
        // Small Popup View
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-600 font-bold border border-purple-500/20">
              <User size={28} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-[#1c212c] animate-pulse" />
          </div>
          
          <div className="flex-1 overflow-hidden">
            <h4 className="font-bold text-gray-900 dark:text-white truncate">{activeCall.caller}</h4>
            <div className="flex items-center gap-2 text-xs font-medium text-purple-500 uppercase tracking-widest mt-0.5">
              <span className="flex items-center gap-1">
                {activeCall.type === 'video' ? <Video size={12} /> : <Phone size={12} />}
                {formatTime(timer)}
              </span>
              <span className="opacity-50">•</span>
              <span className="animate-pulse">Active</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsExpanded(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl text-gray-400 transition-colors"
            >
              <Maximize2 size={18} />
            </button>
            <button 
              onClick={endCall}
              className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
            >
              <PhoneOff size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
