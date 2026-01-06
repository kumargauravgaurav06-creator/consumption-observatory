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
  const [data, setData] = useState<any>(null);

  // 1. FETCH DATA FROM LOCAL PUBLIC FOLDER
  useEffect(() => {
    // The browser automatically looks in 'public' when we use a slash '/'
    fetch('/global_data.json')
      .then(res => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then(json => {
        console.log("Data Loaded:", json);
        setData(json.data || json);
      })
      .catch(err => console.error("Data Load Failed:", err));
  }, []);

  // 2. CALCULATE TARGET (USA)
  const targetValue = useMemo(() => {
    if (!data) return "---";
    // Check both Uppercase and Lowercase keys to be safe
    const country = data['USA'] || data['usa'];
    if (!country) return "No Data";
    
    const key = activeMode === 'ENERGY' ? 'energy' : activeMode === 'WEALTH' ? 'gdp' : 'co2';
    const unit = activeMode === 'ENERGY' ? 'kWh' : activeMode === 'WEALTH' ? 'USD' : 'Mt';
    
    const records = country[key];
    if (!records || !Array.isArray(records)) return "N/A";

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
            name: code.toUpperCase(), 
            value: parseFloat(entry.value) 
        };
    }).filter(Boolean);

    return list.sort((a: any, b: any) => b.value - a.value).slice(0, 5);
  }, [data, year, activeMode]);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full z-50 p-4 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                PULSE.IO
            </h1>
            <p className="text-[10px] text-emerald-500/80 tracking-[0.3em] mt-1 font-mono">TEMPORAL ANALYTICS ENGINE</p>
        </div>

        <div className="flex gap-2 pointer-events-auto bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
            {['ENERGY', 'WEALTH', 'CARBON'].map((mode) => (
                <button 
                    key={mode} 
                    onClick={() => setActiveMode(mode)}
                    className={`px-3 py-2 text-[10px] font-bold transition-all rounded-md uppercase tracking-widest ${
                        activeMode === mode 
                        ? 'bg-emerald-500 text-black shadow-lg' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                >
                    {mode}
                </button>
            ))}
        </div>
      </div>

      {/* DATA PANEL */}
      <div className="absolute top-24 left-4 z-40 pointer-events-none">
        <div className="glass-panel p-6 rounded-2xl w-64 pointer-events-auto border border-emerald-500/20 bg-black/50 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Target Locked</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            
            <h2 className="text-5xl font-bold mb-1 text-white">USA</h2>
            
            <div className="space-y-4 mt-6">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Metric Value</p>
                    <div className="text-2xl font-mono text-emerald-400 text-shadow-glow">
                        {targetValue}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Year Focus</p>
                    <div className="text-xl text-white font-mono">{year}</div>
                </div>
            </div>
        </div>
      </div>

      {/* LEADERBOARD */}
      <div className="absolute top-24 right-4 z-40 pointer-events-none">
        <div className="glass-panel p-6 rounded-2xl w-64 pointer-events-auto border border-emerald-500/20 bg-black/50 backdrop-blur-xl">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                Top Leaders ({year})
            </h3>
            <div className="space-y-3">
                {leaders.length > 0 ? leaders.map((item: any, i: number) => (
                    <div key={item.name} className="flex justify-between items-center text-xs group hover:bg-white/5 p-1 rounded">
                        <span className="text-slate-300 font-medium">
                            <span className="text-slate-600 mr-2 font-mono">0{i+1}</span>
                            {item.name}
                        </span>
                        <span className="text-emerald-400 font-mono">{Math.round(item.value).toLocaleString()}</span>
                    </div>
                )) : <div className="text-xs text-red-400 animate-pulse">Scanning Data Stream...</div>}
            </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-40 pointer-events-auto">
        <div className="glass-panel p-4 rounded-full flex items-center gap-4 bg-black/80 border border-white/10">
            <div className="font-mono text-2xl font-bold text-emerald-400 w-16 text-center">{year}</div>
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

      <GlobeViz year={year} mode={activeMode} />
    </main>
  );
                }
