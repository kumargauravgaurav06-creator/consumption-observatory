'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

// Lazy Load Globe
const GlobeViz = dynamic(() => import('../components/GlobeViz'), { ssr: false });

// --- 1. THE TRANSLATOR DICTIONARY ---
// Maps 3-letter ISO codes to human-readable names
const COUNTRY_NAMES: Record<string, string> = {
  // North America
  'USA': 'United States', 'CAN': 'Canada', 'MEX': 'Mexico',
  
  // South America
  'BRA': 'Brazil', 'ARG': 'Argentina', 'CHL': 'Chile', 'PER': 'Peru',
  'COL': 'Colombia',
  
  // Europe
  'DEU': 'Germany', 'GBR': 'United Kingdom', 'FRA': 'France', 'ITA': 'Italy',
  'ESP': 'Spain', 'NLD': 'Netherlands', 'CHE': 'Switzerland', 'BEL': 'Belgium',
  'SWE': 'Sweden', 'NOR': 'Norway', 'DNK': 'Denmark', 'FIN': 'Finland',
  'ISL': 'Iceland', 'POL': 'Poland', 'UKR': 'Ukraine', 'RUS': 'Russia',
  'TUR': 'Turkey', 'AUT': 'Austria', 'IRL': 'Ireland', 'PRT': 'Portugal',
  
  // Asia
  'CHN': 'China', 'IND': 'India', 'JPN': 'Japan', 'KOR': 'South Korea',
  'IDN': 'Indonesia', 'VNM': 'Vietnam', 'THA': 'Thailand', 'MYS': 'Malaysia',
  'SGP': 'Singapore', 'PHL': 'Philippines', 'PAK': 'Pakistan', 'BGD': 'Bangladesh',
  
  // Middle East (Energy Giants)
  'SAU': 'Saudi Arabia', 'ARE': 'UAE', 'IRN': 'Iran', 'IRQ': 'Iraq',
  'KWT': 'Kuwait', 'QAT': 'Qatar', 'BHR': 'Bahrain', 'OMN': 'Oman',
  'ISR': 'Israel',
  
  // Africa
  'NGA': 'Nigeria', 'ZAF': 'South Africa', 'EGY': 'Egypt', 'DZA': 'Algeria',
  'MAR': 'Morocco', 'KEN': 'Kenya', 'ETH': 'Ethiopia',
  
  // Oceania
  'AUS': 'Australia', 'NZL': 'New Zealand'
};

export default function Home() {
  const [year, setYear] = useState(2022);
  const [mode, setMode] = useState('ENERGY'); // ENERGY, WEALTH, CARBON
  const [data, setData] = useState<any>({});
  const [target, setTarget] = useState<string>('USA'); 

  // --- 2. FETCH DATA ENGINE ---
  useEffect(() => {
    fetch('/global_data.json')
      .then(res => res.json())
      .then(json => {
         const raw = json.data || json;
         if (Array.isArray(raw)) {
             // Convert List to Dictionary for fast lookup
             const map: any = {};
             raw.forEach((d:any) => map[d.iso_code || d.id || 'UNKNOWN'] = d);
             setData(map);
         } else {
             setData(raw);
         }
      })
      .catch(e => console.log("Fetch Error"));
  }, []);

  // --- 3. SMART VALUE ENGINE (LKV LOGIC) ---
  // Finds the best available data point if the current year is missing
  const getSmartValue = (countryCode: string) => {
      const country = data[countryCode];
      if (!country) return { value: 0, year: year, isEstimated: false };

      const key = mode === 'ENERGY' ? 'energy' : mode === 'WEALTH' ? 'gdp' : 'co2';
      const records = country[key];
      
      if (!Array.isArray(records) || records.length === 0) return { value: 0, year: year, isEstimated: false };

      // A. Try Exact Match
      const exactMatch = records.find((r:any) => parseInt(r.date) === year);
      if (exactMatch) return { value: parseFloat(exactMatch.value), year: year, isEstimated: false };

      // B. Fallback: Find closest previous year
      const sorted = [...records].sort((a:any, b:any) => parseInt(b.date) - parseInt(a.date));
      const fallback = sorted.find((r:any) => parseInt(r.date) < year);
      
      if (fallback) return { value: parseFloat(fallback.value), year: parseInt(fallback.date), isEstimated: true };
      
      // C. Last Resort: Just take the absolute latest we have
      if (sorted.length > 0) {
          return { value: parseFloat(sorted[0].value), year: parseInt(sorted[0].date), isEstimated: true };
      }

      return { value: 0, year: year, isEstimated: false };
  };

  // --- 4. LEADERBOARD CALCULATION ---
  const leaders = useMemo(() => {
      return Object.keys(data)
        .map(key => ({ name: key, ...getSmartValue(key) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // Top 5
        .filter(item => item.value > 0);
  }, [data, year, mode]);

  // --- 5. AUTO-TARGET SWITCHER ---
  // If the current target has 0 data, switch to the #1 Leader
  useEffect(() => {
      const val = getSmartValue(target).value;
      if (val === 0 && leaders.length > 0) {
          setTarget(leaders[0].name);
      }
  }, [mode, leaders, target]);

  const targetData = getSmartValue(target);
  const unit = mode === 'ENERGY' ? 'kWh' : mode === 'WEALTH' ? 'USD' : 'Mt';
  
  // Use the dictionary to get the full name, or fallback to the code
  const displayName = COUNTRY_NAMES[target] || target;

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

      {/* LEADERBOARD PANEL */}
      <div className="absolute top-24 right-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-64 pointer-events-auto backdrop-blur-md">
         <h3 className="text-xs font-bold text-slate-400 mb-4 border-b border-white/10 pb-2 tracking-widest">GLOBAL RANKING</h3>
         <div className="space-y-3">
            {leaders.map((item, i) => (
                <div 
                    key={item.name} 
                    onClick={() => setTarget(item.name)} 
                    className="flex justify-between text-xs cursor-pointer group hover:bg-white/5 p-1 rounded transition-colors"
                >
                    <span className="font-mono group-hover:text-emerald-400 transition-colors">
                        0{i+1} {COUNTRY_NAMES[item.name] || item.name}
                    </span>
                    <span className="text-emerald-400 font-mono">
                        {Math.round(item.value).toLocaleString()}
                    </span>
                </div>
            ))}
         </div>
      </div>

      {/* TARGET CARD (Smart Display) */}
      <div className="absolute top-24 left-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-80 pointer-events-auto backdrop-blur-md transition-all">
         <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest">Target Locked</span>
            <div className={`w-2 h-2 rounded-full animate-pulse ${targetData.isEstimated ? 'bg-yellow-500' : 'bg-emerald-500'}`}></div>
         </div>
         
         <h2 className="text-4xl font-bold mb-1 truncate">{displayName}</h2>
         
         <div className="mt-4 text-3xl font-mono text-white text-shadow-glow">
            {targetData.value > 0 ? targetData.value.toLocaleString() : "---"} 
            <span className="text-sm text-slate-400 ml-2">{unit}</span>
         </div>
         
         {/* Show warning if using old data */}
         {targetData.isEstimated && (
             <div className="mt-2 text-[10px] text-yellow-400 uppercase tracking-wider border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 inline-block rounded">
                ⚠️ Data from {targetData.year}
             </div>
         )}
      </div>

      {/* TIME SLIDER */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 pointer-events-auto">
        <div className="p-4 rounded-full flex items-center gap-6 bg-black/90 border border-white/20 shadow-2xl backdrop-blur-xl">
            <span className="text-emerald-400 font-bold font-mono text-xl">{year}</span>
            <input 
                type="range" 
                className="w-full accent-emerald-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" 
                min="2000" 
                max="2025" 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
            />
        </div>
      </div>

      {/* GLOBE VISUALIZATION */}
      <GlobeViz year={year} mode={mode} data={data} target={target} />
    </main>
  );
}
