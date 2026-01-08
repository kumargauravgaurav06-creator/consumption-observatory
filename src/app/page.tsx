'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

const GlobeViz = dynamic(() => import('../components/GlobeViz'), { ssr: false });

const METRICS: Record<string, { key: string; unit: string; label: string; color: string }> = {
  'ENERGY':      { key: 'energy',      unit: 'kWh',   label: 'Energy',      color: 'bg-emerald-500' },
  'WEALTH':      { key: 'gdp',         unit: 'USD',   label: 'Wealth',      color: 'bg-cyan-500' },
  'CARBON':      { key: 'co2',         unit: 't',     label: 'Carbon',      color: 'bg-red-500' },
  'RENEWABLES':  { key: 'renewables',  unit: '%',     label: 'Green Energy',color: 'bg-green-400' },
  'WATER':       { key: 'water',       unit: '%',     label: 'Water Access',color: 'bg-blue-500' },
  'INTERNET':    { key: 'internet',    unit: '%',     label: 'Online',      color: 'bg-purple-500' },
  'LIFE':        { key: 'life',        unit: 'Yrs',   label: 'Life Exp.',   color: 'bg-pink-500' },
  'INFLATION':   { key: 'inflation',   unit: '%',     label: 'Inflation',   color: 'bg-orange-500' }
};

const COUNTRY_NAMES: Record<string, string> = {
  'USA': 'United States', 'CHN': 'China', 'IND': 'India', 'RUS': 'Russia',
  'DEU': 'Germany', 'JPN': 'Japan', 'GBR': 'United Kingdom', 'FRA': 'France',
  'BRA': 'Brazil', 'ITA': 'Italy', 'CAN': 'Canada', 'KOR': 'South Korea',
  'AUS': 'Australia', 'MEX': 'Mexico', 'IDN': 'Indonesia', 'SAU': 'Saudi Arabia',
  'TUR': 'Turkey', 'ARG': 'Argentina', 'ZAF': 'South Africa',
  'ESP': 'Spain', 'SWE': 'Sweden', 'FIN': 'Finland', 'DNK': 'Denmark',
  'NOR': 'Norway', 'ISL': 'Iceland', 'CHE': 'Switzerland', 'IRL': 'Ireland',
  'AUT': 'Austria', 'BEL': 'Belgium', 'NLD': 'Netherlands', 'LUX': 'Luxembourg',
  'PRT': 'Portugal', 'POL': 'Poland', 'UKR': 'Ukraine', 'GRC': 'Greece',
  'CZE': 'Czechia', 'HUN': 'Hungary', 'ROU': 'Romania',
  'ARE': 'UAE', 'QAT': 'Qatar', 'KWT': 'Kuwait', 'BHR': 'Bahrain',
  'OMN': 'Oman', 'ISR': 'Israel', 'IRN': 'Iran', 'IRQ': 'Iraq',
  'BMU': 'Bermuda', 'CYM': 'Cayman Islands', 'SGP': 'Singapore', 'HKG': 'Hong Kong',
  'MAC': 'Macao', 'FRO': 'Faroe Islands', 'PYF': 'French Polynesia',
  'GRL': 'Greenland', 'PRI': 'Puerto Rico',
  'NGA': 'Nigeria', 'EGY': 'Egypt', 'VNM': 'Vietnam', 'THA': 'Thailand',
  'PAK': 'Pakistan', 'BGD': 'Bangladesh', 'PHL': 'Philippines', 'MYS': 'Malaysia',
  'COL': 'Colombia', 'CHL': 'Chile', 'PER': 'Peru', 'VEN': 'Venezuela'
};

export default function Home() {
  const [year, setYear] = useState(2022);
  const [mode, setMode] = useState('ENERGY');
  const [data, setData] = useState<any>({});
  const [meta, setMeta] = useState<any>({});
  
  // COMPARISON STATE
  const [target, setTarget] = useState<string>('USA'); 
  const [compareTarget, setCompareTarget] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 

  useEffect(() => {
    fetch('/global_data.json')
      .then(res => res.json())
      .then(json => {
         // Handle new data structure
         if (json.data && Array.isArray(json.data)) {
             const map: any = {};
             json.data.forEach((d:any) => map[d.iso_code || d.id || 'UNKNOWN'] = d);
             setData(map);
             setMeta(json.meta || {});
         } else if (Array.isArray(json)) {
             // Fallback for old format
             const map: any = {};
             json.forEach((d:any) => map[d.iso_code || d.id || 'UNKNOWN'] = d);
             setData(map);
         }
      })
      .catch(e => console.log("Fetch Error", e));
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setYear((prev) => (prev >= 2025 ? 2000 : prev + 1));
      }, 800); // Optimized speed
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const getSmartValue = (countryCode: string) => {
      const country = data[countryCode];
      if (!country) return { value: 0, year: year, isEstimated: false };
      const key = METRICS[mode].key;
      const records = country[key];
      if (!Array.isArray(records) || records.length === 0) return { value: 0, year: year, isEstimated: false };
      const exactMatch = records.find((r:any) => parseInt(r.date) === year);
      if (exactMatch) return { value: parseFloat(exactMatch.value), year: year, isEstimated: false };
      const sorted = [...records].sort((a:any, b:any) => parseInt(b.date) - parseInt(a.date));
      const fallback = sorted.find((r:any) => parseInt(r.date) < year);
      if (fallback) return { value: parseFloat(fallback.value), year: parseInt(fallback.date), isEstimated: true };
      if (sorted.length > 0) return { value: parseFloat(sorted[0].value), year: parseInt(sorted[0].date), isEstimated: true };
      return { value: 0, year: year, isEstimated: false };
  };

  const handleCountrySelect = (code: string) => {
      if (target === code) return; 
      if (!target) {
          setTarget(code);
      } else if (!compareTarget) {
          setCompareTarget(code);
      } else {
          // If both full, replace target (or we could rotate, but replacing target is standard)
          setTarget(code);
          setCompareTarget(null);
      }
  };

  const leaders = useMemo(() => {
      let allCandidates = Object.keys(data).map(key => ({ name: key, ...getSmartValue(key) }));
      if (searchTerm.length > 0) {
          allCandidates = allCandidates.filter(item => {
              const fullName = COUNTRY_NAMES[item.name] || item.name;
              return fullName.toLowerCase().includes(searchTerm.toLowerCase()) || item.name.toLowerCase().includes(searchTerm.toLowerCase());
          });
          return allCandidates.sort((a, b) => b.value - a.value).slice(0, 10);
      }
      return allCandidates.filter(item => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [data, year, mode, searchTerm]);

  const targetData = getSmartValue(target);
  const compareData = compareTarget ? getSmartValue(compareTarget) : null;
  const config = METRICS[mode];
  const displayName = COUNTRY_NAMES[target] || target;
  const compareDisplayName = compareTarget ? (COUNTRY_NAMES[compareTarget] || compareTarget) : '';

  // Calculate comparison delta
  let delta = 0;
  if (compareData && targetData.value > 0) {
      delta = ((compareData.value - targetData.value) / targetData.value) * 100;
  }

  return (
    <main className="relative w-full h-screen bg-transparent overflow-hidden text-white select-none font-sans">
      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full z-50 p-6 pointer-events-none">
         <div className="flex justify-between items-start">
             <div>
                 <h1 className="text-3xl font-bold text-emerald-400 pointer-events-auto tracking-widest drop-shadow-md">PULSE.IO</h1>
                 {meta.last_updated && <p className="text-[9px] text-slate-500 font-mono mt-1">DATA UPDATED: {meta.last_updated}</p>}
             </div>
             <div className="pointer-events-auto grid grid-cols-4 gap-2 w-[400px]">
                {Object.keys(METRICS).map(m => (
                    <button key={m} onClick={()=>setMode(m)} className={`px-2 py-1.5 rounded text-[10px] font-bold tracking-wider transition-all border border-white/10 ${mode === m ? `${METRICS[m].color} text-black shadow-lg scale-105` : 'bg-black/40 hover:bg-white/10 text-slate-300'}`}>
                        {METRICS[m].label}
                    </button>
                ))}
             </div>
         </div>
      </div>

      {/* SEARCH PANEL */}
      <div className="absolute top-28 right-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-64 pointer-events-auto backdrop-blur-md">
         <div className="mb-4">
             <input type="text" placeholder="Search Country..." className="w-full bg-white/10 border border-white/20 rounded px-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-400 transition-colors placeholder-slate-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
         </div>
         <h3 className="text-xs font-bold text-slate-400 mb-4 border-b border-white/10 pb-2 tracking-widest flex justify-between">
             <span>{searchTerm ? 'RESULTS' : 'TOP RANKING'}</span>
             {(target || compareTarget) && <span onClick={() => {setTarget('USA'); setCompareTarget(null);}} className="text-[9px] cursor-pointer hover:text-white text-red-400">RESET ALL</span>}
         </h3>
         <div className="space-y-3">
            {leaders.length > 0 ? leaders.map((item, i) => (
                <div key={item.name} onClick={() => handleCountrySelect(item.name)} className={`flex justify-between text-xs cursor-pointer group hover:bg-white/5 p-1 rounded transition-colors ${target === item.name ? 'bg-white/10 border-l-2 border-emerald-400' : ''} ${compareTarget === item.name ? 'bg-white/10 border-l-2 border-pink-400' : ''}`}>
                    <span className="font-mono group-hover:text-emerald-400">{searchTerm ? '' : `0${i+1}`} {COUNTRY_NAMES[item.name] || item.name}</span>
                    <span className={`font-mono ${config.color.replace('bg-', 'text-')}`}>{item.value.toLocaleString()}</span>
                </div>
            )) : (<div className="text-xs text-slate-500 italic">No Data Found</div>)}
         </div>
      </div>

      {/* LEFT PANEL: PRIMARY TARGET */}
      <div className="absolute top-28 left-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-80 pointer-events-auto backdrop-blur-md transition-all shadow-2xl">
         <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Primary Target</span>
            <div className={`w-2 h-2 rounded-full animate-pulse ${targetData.isEstimated ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
         </div>
         <h2 className="text-4xl font-bold mb-1 truncate text-white">{displayName}</h2>
         <div className="mt-4 text-3xl font-mono text-white text-shadow-glow">{targetData.value !== 0 ? targetData.value.toLocaleString() : "---"} <span className="text-sm text-slate-400 ml-2">{config.unit}</span></div>
         {targetData.isEstimated && <div className="mt-2 text-[10px] text-yellow-400 border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 inline-block rounded">⚠️ Data from {targetData.year}</div>}
         <p className="text-[10px] text-slate-500 mt-4 uppercase">Mode: <span className={config.color.replace('bg-', 'text-')}>{config.label}</span></p>
      </div>

      {/* COMPARISON PANEL (Only visible if compareTarget is set) */}
      {compareTarget && compareData && (
          <div className="absolute bottom-28 right-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-64 pointer-events-auto backdrop-blur-md transition-all shadow-2xl border-t-4 border-t-pink-500">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">VS Comparison</span>
                <button onClick={() => setCompareTarget(null)} className="text-xs text-red-500 hover:text-white">✕</button>
             </div>
             <h2 className="text-2xl font-bold mb-1 truncate text-pink-400">{compareDisplayName}</h2>
             <div className="mt-2 text-xl font-mono text-white">{compareData.value !== 0 ? compareData.value.toLocaleString() : "---"} <span className="text-xs text-slate-400">{config.unit}</span></div>
             
             {/* Simple Delta Indicator */}
             <div className="mt-4 pt-4 border-t border-white/10">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">Difference</span>
                    <span className={`font-mono text-lg font-bold ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                    </span>
                 </div>
                 {/* Visual Bar Comparison */}
                 <div className="mt-2 w-full h-1 bg-slate-700 flex rounded overflow-hidden">
                     <div style={{ width: '50%' }} className="h-full bg-white/20 border-r border-black"></div>
                     <div style={{ width: '50%' }} className="h-full bg-pink-500/50"></div>
                 </div>
             </div>
          </div>
      )}

      {/* TIMELINE CONTROLS */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 pointer-events-auto">
        <div className="p-4 rounded-full flex items-center gap-6 bg-black/90 border border-white/20 shadow-2xl backdrop-blur-xl">
            <button onClick={() => setIsPlaying(!isPlaying)} className={`w-12 h-12 flex items-center justify-center rounded-full border border-white/10 transition-all ${isPlaying ? 'bg-red-500 text-white' : `${config.color} text-black hover:scale-110`}`}>
                {isPlaying ? <span className="font-bold text-xs">STOP</span> : <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <span className={`font-bold font-mono text-xl ${config.color.replace('bg-', 'text-')}`}>{year}</span>
            <input type="range" className={`w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-${config.color.replace('bg-', '')}`} min="2000" max="2025" value={year} onChange={(e) => { setIsPlaying(false); setYear(parseInt(e.target.value)); }}/>
        </div>
      </div>
      
      {/* 3D GLOBE */}
      <GlobeViz year={year} mode={mode} data={data} target={target} onCountryClick={handleCountrySelect} />
    </main>
  );
  }
        
