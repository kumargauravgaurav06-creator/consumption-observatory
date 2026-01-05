'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Lazy Load the Globe
const GlobeViz = dynamic(() => import('../components/GlobeViz'), { 
  ssr: false,
  loading: () => <div className="text-emerald-500">Loading Core...</div>
});

export default function Home() {
  const [year, setYear] = useState(2023);
  const [activeMode, setActiveMode] = useState('ENERGY');
  const [isPlaying, setIsPlaying] = useState(false);

  // --- AUTO-PLAY ENGINE ---
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setYear((prev) => {
          if (prev >= 2023) return 2000; // Loop back to start
          return prev + 1;
        });
      }, 500); // Speed: 0.5 seconds per year
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden font-sans">
      
      {/* --- HEADER --- */}
      <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
            <h1 className="text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                PULSE.IO
            </h1>
            <p className="text-[10px] text-emerald-500/80 tracking-[0.3em] mt-1 font-mono">TEMPORAL ANALYTICS ENGINE</p>
        </div>

        {/* MODE SWITCHER */}
        <div className="flex gap-2 pointer-events-auto bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
            {['ENERGY', 'WEALTH', 'CARBON'].map((mode) => (
                <button 
                    key={mode} 
                    onClick={() => setActiveMode(mode)}
                    className={`px-6 py-2 text-xs font-bold transition-all rounded-md uppercase tracking-widest ${
                        activeMode === mode 
                        ? mode === 'CARBON' ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                          mode === 'WEALTH' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' :
                          'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {mode}
                </button>
            ))}
        </div>
      </div>

      {/* --- LEFT PANEL --- */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 z-40 pointer-events-none">
        <div className="glass-panel p-6 rounded-2xl w-72 pointer-events-auto">
            <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Target Locked</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            
            <h2 className="text-5xl font-bold mb-1 text-white">USA</h2>
            
            <div className="space-y-4 mt-6">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Active Metric</p>
                    <div className={`text-2xl font-mono text-shadow-glow ${
                        activeMode === 'CARBON' ? 'text-red-400' : 
                        activeMode === 'WEALTH' ? 'text-cyan-400' : 'text-emerald-400'
                    }`}>
                        {activeMode}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Year Focus</p>
                    <div className="text-xl text-white font-mono">{year}</div>
                </div>
            </div>
        </div>
      </div>

      {/* --- RIGHT PANEL (Leaderboard) --- */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 z-40 pointer-events-none">
        <div className="glass-panel p-6 rounded-2xl w-64 pointer-events-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                Top Leaders ({year})
            </h3>
            <div className="space-y-3">
                 {/* Placeholder Data - In Phase 3 we make this real */}
                {[
                    { c: 'United States', v: '14.32', color: 'text-emerald-400' },
                    { c: 'China', v: '11.92', color: 'text-cyan-400' },
                    { c: 'Russia', v: '8.56', color: 'text-blue-400' },
                ].map((item, i) => (
                    <div key={item.c} className="flex justify-between items-center text-sm group cursor-pointer hover:bg-white/5 p-1 rounded">
                        <span className="text-slate-300 font-medium">
                            <span className="text-slate-600 mr-2 font-mono">0{i+1}</span>
                            {item.c}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* --- TIMELINE CONTROL --- */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 pointer-events-auto px-4">
        <div className="glass-panel p-4 rounded-full flex items-center gap-4 bg-black/80">
            {/* Play Button */}
            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    isPlaying ? 'bg-red-500 hover:bg-red-400' : 'bg-emerald-500 hover:bg-emerald-400'
                }`}
            >
                {isPlaying ? (
                    <div className="w-3 h-3 bg-black rounded-sm" /> // Pause Icon
                ) : (
                    <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> // Play Icon
                )}
            </button>
            
            {/* Range Slider */}
            <div className="flex-1 relative flex items-center">
                <input 
                    type="range" 
                    min="2000" 
                    max="2023" 
                    value={year}
                    onChange={(e) => {
                        setIsPlaying(false); // Stop auto-play if user drags
                        setYear(parseInt(e.target.value));
                    }}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                />
            </div>

            {/* Year Display */}
            <div className="font-mono text-2xl font-bold text-emerald-400 w-20 text-right">
                {year}
            </div>
        </div>
      </div>

      {/* --- 3D ENGINE (Connected!) --- */}
      <GlobeViz year={year} mode={activeMode} />
      
    </main>
  );
}
