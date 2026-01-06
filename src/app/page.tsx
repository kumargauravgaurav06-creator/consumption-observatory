'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

const GlobeViz = dynamic(() => import('../components/GlobeViz'), { ssr: false });

// 1. BACKUP DATA (Used while loading)
const BACKUP_DATA = {
  'USA': { energy: [{ value: 25450, date: '2022' }], gdp: [{ value: 23000 }], co2: [{ value: 4500 }] },
  'CHN': { energy: [{ value: 35000, date: '2022' }], gdp: [{ value: 18000 }], co2: [{ value: 11000 }] },
  'IND': { energy: [{ value: 9500, date: '2022' }],  gdp: [{ value: 3500 }],  co2: [{ value: 2800 }] },
  'RUS': { energy: [{ value: 8200, date: '2022' }],  gdp: [{ value: 1700 }],  co2: [{ value: 1800 }] },
  'DEU': { energy: [{ value: 4100, date: '2022' }],  gdp: [{ value: 4200 }],  co2: [{ value: 750 }] }
};

export default function Home() {
  const [year, setYear] = useState(2022);
  const [mode, setMode] = useState('ENERGY');
  const [data, setData] = useState<any>(BACKUP_DATA);

  // 2. FETCH REAL DATA
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
      .catch(e => console.log("Using Backup Data"));
  }, []);

  // 3. HELPER: Get Value for a Country
  const getValue = (countryCode: string) => {
      const country = data[countryCode];
      if (!country) return 0;
      
      const key = mode === 'ENERGY' ? 'energy' : mode === 'WEALTH' ? 'gdp' : 'co2';
      const records = country[key];
      
      if (Array.isArray(records)) {
          // Find closest year or default to first
          const entry = records.find((r:any) => parseInt(r.date) === year) || records[0];
          return entry ? parseFloat(entry.value) : 0;
      }
      return 0;
  };

  const targetValue = getValue('USA');
  const unit = mode === 'ENERGY' ? 'kWh' : mode === 'WEALTH' ? 'USD' : 'Mt';

  // 4. SORT LEADERS
  const leaders = Object.keys(data)
      .map(key => ({ name: key, value: getValue(key) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .filter(item => item.value > 0);

  return (
    <main className="relative w-full h-screen bg-transparent overflow-hidden text-white select-none">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between pointer-events-none">
         <h1 className="text-3xl font-bold text-emerald-400 pointer-events-auto tracking-widest">PULSE.IO</h1>
         <div className="pointer-events-auto flex gap-2">
            {['ENERGY','WEALTH','CARBON'].map(m => (
                <button key={m} onClick={()=>setMode(m)} className={`px-4 py-1 rounded text-xs font-bold tracking-widest transition-all ${mode === m ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-white/20'}`}>
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
                <div key={item.name} className="flex justify-between text-xs">
                    <span className="text-slate-300 font-mono">0{i+1} {item.name}</span>
                    <span className="text-emerald-400 font-mono">{Math.round(item.value).toLocaleString()}</span>
                </div>
            ))}
         </div>
      </div>

      {/* TARGET CARD (USA) */}
      <div className="absolute top-24 left-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-72 pointer-events-auto backdrop-blur-md">
         <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest">Target Locked</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
         </div>
         <h2 className="text-5xl font-bold mb-1">USA</h2>
         <p className="text-2xl text-emerald-400 font-mono text-shadow-glow mt-4">
            {targetValue.toLocaleString()} <span className="text-sm text-slate-400">{unit}</span>
         </p>
         <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">Active Metric: {mode}</p>
      </div>

      {/* SLIDER */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 pointer-events-auto">
        <div className="p-4 rounded-full flex items-center gap-6 bg-black/90 border border-white/20 shadow-2xl backdrop-blur-xl">
            <span className="text-emerald-400 font-bold font-mono text-xl">{year}</span>
            <input 
                type="range" 
                className="w-full accent-emerald-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" 
                min="2000" 
                max="2022" 
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
            />
        </div>
      </div>

      {/* GLOBE */}
      <GlobeViz year={year} mode={mode} data={data} />
    </main>
  );
}
