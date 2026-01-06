'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

const GlobeViz = dynamic(() => import('../components/GlobeViz'), { ssr: false });

export default function Home() {
  const [year, setYear] = useState(2022);
  const [activeMode, setActiveMode] = useState('ENERGY');
  const [data, setData] = useState<any>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // HELPER: Add to on-screen log
  const log = (msg: string) => setDebugLog(prev => [...prev, `> ${msg}`]);

  useEffect(() => {
    log("System Initialized. Attempting to fetch data...");
    
    // Add timestamp to force fresh load (bypasses cache)
    fetch('/global_data.json?v=' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then(json => {
        log("File Downloaded.");
        const realData = json.data || json;
        setData(realData);
        
        // ANALYZE DATA STRUCTURE
        const keys = Object.keys(realData);
        log(`Found ${keys.length} countries.`);
        log(`First 3 Keys: ${keys.slice(0, 3).join(', ')}`);
        
        // Check USA specifically
        if (realData['USA']) log("✅ Found 'USA' (Uppercase)");
        else if (realData['usa']) log("⚠️ Found 'usa' (Lowercase)");
        else log("❌ USA not found in keys!");
      })
      .catch(err => {
        log(`CRITICAL FAILURE: ${err.message}`);
      });
  }, []);

  // --- CALCULATION LOGIC ---
  const targetValue = useMemo(() => {
    if (!data) return "---";
    // Try both cases
    const country = data['USA'] || data['usa'];
    if (!country) return "No Data";
    
    const key = activeMode === 'ENERGY' ? 'energy' : activeMode === 'WEALTH' ? 'gdp' : 'co2';
    const unit = activeMode === 'ENERGY' ? 'kWh' : activeMode === 'WEALTH' ? 'USD' : 'Mt';
    
    // Check if metric exists
    if (!country[key]) return `No ${key}`;
    
    const records = country[key];
    const entry = Array.isArray(records) ? records.find((r: any) => parseInt(r.date) === year) : null;
    return entry ? `${parseFloat(entry.value).toLocaleString()} ${unit}` : "N/A";
  }, [data, year, activeMode]);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">
      
      {/* --- NORMAL UI --- */}
      <div className="absolute top-0 left-0 w-full z-50 p-4 flex justify-between pointer-events-none">
        <h1 className="text-2xl font-bold text-emerald-400 pointer-events-auto">PULSE.IO <span className="text-[10px] text-white/50">DIAGNOSTIC MODE</span></h1>
        <div className="pointer-events-auto flex gap-2">
            {['ENERGY', 'WEALTH', 'CARBON'].map(m => (
                <button key={m} onClick={() => setActiveMode(m)} className={`px-3 py-1 text-xs font-bold rounded ${activeMode === m ? 'bg-emerald-500 text-black' : 'bg-white/10'}`}>{m}</button>
            ))}
        </div>
      </div>

      <div className="absolute top-24 left-4 z-40 p-6 glass-panel rounded-xl w-64 border border-emerald-500/30 bg-black/80">
        <h2 className="text-4xl font-bold mb-2">USA</h2>
        <div className="text-2xl font-mono text-emerald-400">{targetValue}</div>
        <div className="text-xs text-slate-500 mt-1">YEAR: {year}</div>
      </div>

      {/* --- DEBUG CONSOLE (The Fixer) --- */}
      <div className="absolute bottom-0 left-0 w-full h-48 bg-black/90 border-t border-emerald-500/50 p-4 font-mono text-xs overflow-y-auto z-[60]">
        <h3 className="text-emerald-500 font-bold mb-2">/// SYSTEM DIAGNOSTICS ///</h3>
        {debugLog.map((line, i) => (
            <div key={i} className="mb-1 border-b border-white/5 pb-1">{line}</div>
        ))}
      </div>

      <GlobeViz year={year} mode={activeMode} />
    </main>
  );
}
