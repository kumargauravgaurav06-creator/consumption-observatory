'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

// Load Globe
const GlobeViz = dynamic(() => import('../components/GlobeViz'), { ssr: false });

export default function Home() {
  const [year, setYear] = useState(2022);
  const [activeMode, setActiveMode] = useState('ENERGY');
  const [data, setData] = useState<any>(null);

  // 1. FETCH & ADAPT DATA
  useEffect(() => {
    fetch('/global_data.json')
      .then(res => res.json())
      .then(json => {
        let rawData = json.data || json;
        
        // --- THE ADAPTER: Convert List to Dictionary ---
        if (Array.isArray(rawData)) {
            console.log("List detected. Adapting...");
            const map: any = {};
            rawData.forEach((item: any) => {
                const key = item.iso_code || item.code || item.country || item.id;
                if (key) map[key.toUpperCase()] = item;
            });
            rawData = map;
        }
        
        setData(rawData);
      })
      .catch(err => console.error("Data Error:", err));
  }, []);

  // 2. GET TARGET VALUE (USA)
  const targetValue = useMemo(() => {
    if (!data) return "---";
    const country = data['USA'];
    if (!country) return "No Data";
    
    const key = activeMode === 'ENERGY' ? 'energy' : activeMode === 'WEALTH' ? 'gdp' : 'co2';
    const unit = activeMode === 'ENERGY' ? 'kWh' : activeMode === 'WEALTH' ? 'USD' : 'Mt';
    
    const records = country[key];
    if (!records) return "N/A";
    
    let val = 0;
    if (Array.isArray(records)) {
        const entry = records.find((r: any) => parseInt(r.date) === year);
        if (entry) val = parseFloat(entry.value);
    }
    return val > 0 ? `${val.toLocaleString()} ${unit}` : "N/A";
  }, [data, year, activeMode]);

  // 3. LEADERBOARD
  const leaders = useMemo(() => {
    if (!data) return [];
    const key = activeMode === 'ENERGY' ? 'energy' : activeMode === 'WEALTH' ? 'gdp' : 'co2';
    
    return Object.keys(data).map(code => {
        const records = data[code][key];
        let val = 0;
        if (Array.isArray(records)) {
             const entry = records.find((r: any) => parseInt(r.date) === year);
             if (entry) val = parseFloat(entry.value);
        }
        return { name: code, value: val };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .filter(i => i.value > 0);
  }, [data, year, activeMode]);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden font-sans text-white select-none">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full z-50 p-4 flex justify-between pointer-events-none">
        <h1 className="text-2xl font-bold text-emerald-400 pointer-events-auto tracking-wider">PULSE.IO</h1>
        <div className="pointer-events-auto flex gap-2 bg-black/50 p-1 rounded-lg backdrop-blur-md">
            {['ENERGY', 'WEALTH', 'CARBON'].map(m => (
                <button key={m} onClick={() => setActiveMode(m)} className={`px-4 py-1 text-[10px] font-bold rounded tracking-widest transition-all ${activeMode === m ? 'bg-emerald-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}>{m}</button>
            ))}
        </div>
      </div>

      {/* LEFT PANEL */}
      <div className="absolute top-24 left-4 z-40 p-6 glass-panel rounded-2xl w-72 border border-emerald-500/20 bg-black/60 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest">Target Locked</span>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
        </div>
        <h2 className="text-5xl font-bold mb-2 text-white">USA</h2>
        <div className="text-3xl font-mono text-emerald-400 text-shadow-glow mt-4">{targetValue}</div>
        <div className="text-xs text-slate-500 mt-2 uppercase tracking-wider">Metric: {activeMode}</div>
      </div>

      {/* RIGHT PANEL */}
      <div className="absolute top-24 right-4 z-40 p-6 glass-panel rounded-2xl w-64 border border-white/10 bg-black/60 backdrop-blur-xl">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Top Leaders ({year})</h3>
        <div className="space-y-3">
            {leaders.map((item, i) => (
                <div key={item.name} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300"><span className="text-slate-600 mr-2 font-mono">0{i+1}</span>{item.name}</span>
                    <span className="text-emerald-400 font-mono">{Math.round(item.value).toLocaleString()}</span>
                </div>
            ))}
        </div>
      </div>

      {/* TIMELINE */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-40 pointer-events-auto">
        <div className="glass-panel p-4 rounded-full flex items-center gap-4 bg-black/80 border border-white/10 shadow-2xl">
           <div className="font-mono text-xl font-bold text-emerald-400 w-16 text-center">{year}</div>
           <input type="range" min="2000" max="2022" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"/>
        </div>
      </div>

      {/* Pass Data to Globe */}
      <GlobeViz year={year} mode={activeMode} data={data} />
    </main>
  );
}
