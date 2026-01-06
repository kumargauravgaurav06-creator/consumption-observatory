'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

const GlobeViz = dynamic(() => import('../components/GlobeViz'), { ssr: false });

// HARDCODED BACKUP DATA
const BACKUP_DATA = {
  'USA': { energy: [{ value: 25000 }] },
  'CHN': { energy: [{ value: 35000 }] },
  'IND': { energy: [{ value: 9500 }] },
  'RUS': { energy: [{ value: 8200 }] },
  'DEU': { energy: [{ value: 4100 }] }
};

export default function Home() {
  const [year, setYear] = useState(2022);
  const [mode, setMode] = useState('ENERGY');
  const [data, setData] = useState<any>(BACKUP_DATA);

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

  return (
    // FIX IS HERE: Changed 'bg-black' to 'bg-transparent'
    <main className="relative w-full h-screen bg-transparent overflow-hidden text-white">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between pointer-events-none">
         <h1 className="text-3xl font-bold text-emerald-400 pointer-events-auto">PULSE.IO</h1>
         <div className="pointer-events-auto flex gap-2">
            {['ENERGY','WEALTH','CARBON'].map(m => (
                <button key={m} onClick={()=>setMode(m)} className="bg-white/10 px-4 py-1 rounded hover:bg-emerald-500">{m}</button>
            ))}
         </div>
      </div>

      {/* LEADERBOARD */}
      <div className="absolute top-24 right-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-64 pointer-events-auto">
         <h3 className="text-sm font-bold text-slate-400 mb-4 border-b border-white/10 pb-2">TOP LEADERS</h3>
         <div className="space-y-2">
            {Object.keys(data).slice(0, 5).map((key, i) => (
                <div key={key} className="flex justify-between text-sm">
                    <span>{i+1}. {key}</span>
                    <span className="text-emerald-400">Active</span>
                </div>
            ))}
         </div>
      </div>

      {/* TARGET CARD */}
      <div className="absolute top-24 left-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-72 pointer-events-auto">
         <h2 className="text-4xl font-bold">USA</h2>
         <p className="text-2xl text-emerald-400 mt-2">Active</p>
      </div>

      {/* SLIDER */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 pointer-events-auto">
        <div className="p-4 rounded-full flex items-center gap-4 bg-black/80 border border-white/10">
            <span className="text-emerald-400 font-bold">{year}</span>
            <input type="range" className="w-full accent-emerald-500" min="2000" max="2022" />
        </div>
      </div>

      {/* GLOBE */}
      <GlobeViz year={year} mode={mode} data={data} />
    </main>
  );
}
