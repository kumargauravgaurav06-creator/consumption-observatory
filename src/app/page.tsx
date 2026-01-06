'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

const GlobeViz = dynamic(() => import('../components/GlobeViz'), { ssr: false });

// NAME DATABASE
const COUNTRY_NAMES: Record<string, string> = {
  'USA': 'United States', 'CHN': 'China', 'IND': 'India', 'RUS': 'Russia',
  'DEU': 'Germany', 'JPN': 'Japan', 'GBR': 'United Kingdom', 'FRA': 'France',
  'BRA': 'Brazil', 'ITA': 'Italy', 'CAN': 'Canada', 'KOR': 'South Korea',
  'AUS': 'Australia', 'ISL': 'Iceland', 'NOR': 'Norway', 'BHR': 'Bahrain',
  'KWT': 'Kuwait', 'SAU': 'Saudi Arabia', 'QAT': 'Qatar', 'ARE': 'UAE',
  'NGA': 'Nigeria', 'ZAF': 'South Africa', 'MEX': 'Mexico', 'IDN': 'Indonesia'
};

export default function Home() {
  const [year, setYear] = useState(2022);
  const [mode, setMode] = useState('ENERGY');
  const [data, setData] = useState<any>({});
  const [target, setTarget] = useState<string>('USA'); 

  // 1. FETCH
  useEffect(() => {
    fetch('/global_data.json')
      .then(res => res.json())
      .then(json => {
         const raw = json.data || json;
         if (Array.isArray(raw)) {
             const map: any = {};
             raw.forEach((d:any) => map[d.iso_code || d.id || 'UNKNOWN'] = d);
             setData(map);
         } else {
             setData(raw);
         }
      })
      .catch(e => console.log("Fetch Error"));
  }, []);

  // 2. SMART VALUES (LKV Logic)
  const getSmartValue = (countryCode: string) => {
      const country = data[countryCode];
      if (!country) return { value: 0, year: year, isEstimated: false };

      const key = mode === 'ENERGY' ? 'energy' : mode === 'WEALTH' ? 'gdp' : 'co2';
      const records = country[key];
      
      if (!Array.isArray(records) || records.length === 0) return { value: 0, year: year, isEstimated: false };

      const exactMatch = records.find((r:any) => parseInt(r.date) === year);
      if (exactMatch) return { value: parseFloat(exactMatch.value), year: year, isEstimated: false };

      // Fallback
      const sorted = [...records].sort((a:any, b:any) => parseInt(b.date) - parseInt(a.date));
      const fallback = sorted.find((r:any) => parseInt(r.date) < year);
      
      if (fallback) return { value: parseFloat(fallback.value), year: parseInt(fallback.date), isEstimated: true };
      
      return { value: 0, year: year, isEstimated: false };
  };

  const leaders = useMemo(() => {
      return Object.keys(data)
        .map(key => ({ name: key, ...getSmartValue(key) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .filter(item => item.value > 0);
  }, [data, year, mode]);

  // Auto-switch target if current is dead
  useEffect(() => {
      const val = getSmartValue(target).value;
      if (val === 0 && leaders.length > 0) setTarget(leaders[0].name);
  }, [mode, leaders]);

  const targetData = getSmartValue(target);
  const unit = mode === 'ENERGY' ? 'kWh' : mode === 'WEALTH' ? 'USD' : 'Mt';

  return (
    <main className="relative w-full h-screen bg-transparent overflow-hidden text-white select-none">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between pointer-events-none">
         <h1 className="text-3xl font-bold text-emerald-400 pointer-events-auto tracking-widest">PULSE.IO</h1>
         <div className="pointer-events-auto flex gap-2">
            {['ENERGY','WEALTH','CARBON'].map(m => (
                <button key={m} onClick={()=>setMode(m)} className={`px-4 py-1 rounded text-xs font-bold tracking-widest transition-all ${mode === m ? 'bg-emerald-500 text-black shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>
                    {m}
                </button>
            ))}
         </div>
      </div>

      {/* LEADERBOARD */}
      <div className="absolute top-24 right-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-64 pointer-events-auto backdrop-blur-md">
         <h3 className="text-xs font-bold text-slate-400 mb-4 border-b border-white/10 pb-2 tracking-widest">GLOBAL RANKING</h3>
         <div className="space-y-3">
            {leaders.map((item, i) => (
                <div key={item.name} onClick={() => setTarget(item.name)} className="flex justify-between text-xs cursor-pointer group hover:bg-white/5 p-1 rounded">
                    <span className="font-mono group-hover:text-emerald-400 transition-colors">0{i+1} {COUNTRY_NAMES[item.name] || item.name}</span>
                    <span className="text-emerald-400 font-mono">{Math.round(item.value).toLocaleString()}</span>
                </div>
            ))}
         </div>
      </div>

      {/* TARGET CARD */}
      <div className="absolute top-24 left-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-80 pointer-events-auto backdrop-blur-md transition-all">
         <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest">Target Locked</span>
            <div className={`w-2 h-2 rounded-full animate-pulse ${targetData.isEstimated ? 'bg-yellow-500' : 'bg-emerald-500'}`}></div>
         </div>
         <h2 className="text-4xl font-bold mb-1 truncate">{COUNTRY_NAMES[target] || target}</h2>
         <div className="mt-4 text-3xl font-mono text-white text-shadow-glow">
            {targetData.value > 0 ? targetData.value.toLocaleString() : "---"} <span className="text-sm text-slate-400">{unit}</span>
         </div>
         {targetData.isEstimated && <div className="mt-2 text-[10px] text-yellow-400 uppercase">⚠️ Data from {targetData.year}</div>}
      </div>

      {/* SLIDER */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 pointer-events-auto">
        <div className="p-4 rounded-full flex items-center gap-6 bg-black/90 border border-white/20 shadow-2xl backdrop-blur-xl">
            <span className="text-emerald-400 font-bold font-mono text-xl">{year}</span>
            <input type="range" className="w-full accent-emerald-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" min="2000" max="2025" value={year} onChange={(e) => setYear(parseInt(e.target.value))}/>
        </div>
      </div>

      {/* GLOBE - Pass the target prop for Flight */}
      <GlobeViz year={year} mode={mode} data={data} target={target} />
    </main>
  );
}
