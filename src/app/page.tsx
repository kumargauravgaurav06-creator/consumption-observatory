'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

// Lazy Load the Globe
const GlobeViz = dynamic(() => import('../components/GlobeViz'), { 
  ssr: false,
  loading: () => <div className="text-emerald-500 font-mono text-xs">INITIALIZING ORBITAL ENGINE...</div>
});

export default function Home() {
  const [year, setYear] = useState(2022);
  const [activeMode, setActiveMode] = useState('ENERGY');
  const [isPlaying, setIsPlaying] = useState(false);
  const [data, setData] = useState<any>(null);

  // 1. FETCH REAL DATA
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/kumargauravgaurav06-creator/consumption-observatory/main/public/global_data.json')
      .then(res => res.json())
      .then(json => setData(json.data || json))
      .catch(err => console.error("Data Load Failed:", err));
  }, []);

  // 2. CALCULATE "TARGET" (USA) VALUES
  const targetValue = useMemo(() => {
    if (!data) return "---";
    const country = data['USA'] || data['usa'];
    if (!country) return "---";
    
    // Map mode to data key
    const key = activeMode === 'ENERGY' ? 'energy' : activeMode === 'WEALTH' ? 'gdp' : 'co2';
    const unit = activeMode === 'ENERGY' ? 'kWh' : activeMode === 'WEALTH' ? 'USD' : 'Mt';
    
    const records = country[key];
    if (!records || !Array.isArray(records)) return "No Data";

    // Find closest year
    const entry = records.find((r: any) => parseInt(r.date) === year);
    return entry ? `${parseFloat(entry.value).toLocaleString()} ${unit}` : "N/A";
  }, [data, year, activeMode]);

  // 3. CALCULATE LEADERBOARD
  const leaders = useMemo(() => {
    if (!data) return [];
    const key = activeMode === 'ENERGY' ? 'energy' : activeMode === 'WEALTH' ? 'gdp' : 'co2';
    
    const list = Object.entries(data).map(([code, country]: any) => {
        const records = country[key];
        if (!records || !Array.isArray(records)) return null;
        const entry = records.find((r: any) => parseInt(r.date) === year);
        if (!entry) return null;
        return { 
            name: code, 
            value: parseFloat(entry.value) 
        };
    }).filter(Boolean);

    // Sort and take top 5
    return list.sort((a: any, b: any) => b.value - a.value).slice(0, 5);
  }, [data, year, activeMode]);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full z-50 p-4 md:p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
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
                    className={`px-3 py-2 md:px-6 text-[10px] md:text-xs font-bold transition-all rounded-md uppercase tracking-widest ${
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

      {/* LEFT PANEL (Mobile Optimized) */}
      <div className="absolute top-24 left-4 md:top-1/2 md:left-8 md:-translate-y-1/2 z-40 pointer-events-none">
        <div className="glass-panel p-4 md:p-6 rounded-2xl w-48 md:w-72 pointer-events-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Target Locked</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-1 text-white">USA</h2>
            
            <div className="space-y-4 mt-4 md:mt-6">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Current Value</p>
                    <div className={`text-xl md:text-2xl font-mono text-shadow-glow ${
                        activeMode === 'CARBON' ? 'text-red-400' : 
                        activeMode === 'WEALTH' ? 'text-cyan-400' : 'text-emerald-400'
                    }`}>
                        {targetValue}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Year Focus</p>
                    <div className="text-lg md:text-xl text-white font-mono">{year}</div>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT PANEL (Leaderboard) */}
      <div className="absolute top-24 right-4 md:top-1/2 md:right-8 md:-translate-y-1/2 z-40 pointer-events-none">
        <div className="glass-panel p-4 md:p-6 rounded-2xl w-48 md:w-64 pointer-events-auto">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                Global Leaders ({year})
            </h3>
            <div className="space-y-2 md:space-y-3">
                {leaders.map((item: any, i: number) => (
                    <div key={item.name} className="flex justify-between items-center text-xs md:text-sm group hover:bg-white/5 p-1 rounded">
                        <span className="text-slate-300 font-medium">
                            <span className="text-slate-600 mr-2 font-mono">0{i+1}</span>
                            {item.name}
                        </span>
                        <span className="text-emerald-400/70 font-mono text-[10px]">{Math.round(item.value).toLocaleString()}</span>
                    </div>
                ))}
                {leaders.length === 0 && <div className="text-xs text-slate-600">Loading Data...</div>}
            </div>
        </div>
      </div>

      {/* TIMELINE CONTROL */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-full max-w-2xl z-40 pointer-events-auto">
        <div className="glass-panel p-3 md:p-4 rounded-full flex items-center gap-4 bg-black/80">
            <div className="font-mono text-xl md:text-2xl font-bold text-emerald-400 w-16 text-center">
                {year}
            </div>
            
            <input 
                type="range" 
                min="1990" 
                max="2022" 
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
        </div>
      </div>

      {/* 3D ENGINE */}
      <GlobeViz year={year} mode={activeMode} />
      
    </main>
  );
            }
