'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';

const GlobeViz = dynamic(() => import('../components/GlobeViz'), { ssr: false });

// METRIC CONFIGURATION
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

// MASTER DICTIONARY (Fixes 3-letter codes)
const COUNTRY_NAMES: Record<string, string> = {
  // Major Powers & G20
  'USA': 'United States', 'CHN': 'China', 'IND': 'India', 'RUS': 'Russia',
  'DEU': 'Germany', 'JPN': 'Japan', 'GBR': 'United Kingdom', 'FRA': 'France',
  'BRA': 'Brazil', 'ITA': 'Italy', 'CAN': 'Canada', 'KOR': 'South Korea',
  'AUS': 'Australia', 'MEX': 'Mexico', 'IDN': 'Indonesia', 'SAU': 'Saudi Arabia',
  'TUR': 'Turkey', 'ARG': 'Argentina', 'ZAF': 'South Africa',

  // Europe
  'ESP': 'Spain', 'SWE': 'Sweden', 'FIN': 'Finland', 'DNK': 'Denmark',
  'NOR': 'Norway', 'ISL': 'Iceland', 'CHE': 'Switzerland', 'IRL': 'Ireland',
  'AUT': 'Austria', 'BEL': 'Belgium', 'NLD': 'Netherlands', 'LUX': 'Luxembourg',
  'PRT': 'Portugal', 'POL': 'Poland', 'UKR': 'Ukraine', 'GRC': 'Greece',
  'CZE': 'Czechia', 'HUN': 'Hungary', 'ROU': 'Romania',

  // Middle East
  'ARE': 'UAE', 'QAT': 'Qatar', 'KWT': 'Kuwait', 'BHR': 'Bahrain',
  'OMN': 'Oman', 'ISR': 'Israel', 'IRN': 'Iran', 'IRQ': 'Iraq',

  // Islands & Territories (Top Performers)
  'BMU': 'Bermuda', 'CYM': 'Cayman Islands', 'SGP': 'Singapore', 'HKG': 'Hong Kong',
  'MAC': 'Macao', 'FRO': 'Faroe Islands', 'PYF': 'French Polynesia',
  'GRL': 'Greenland', 'PRI': 'Puerto Rico',

  // Developing & Others
  'NGA': 'Nigeria', 'EGY': 'Egypt', 'VNM': 'Vietnam', 'THA': 'Thailand',
  'PAK': 'Pakistan', 'BGD': 'Bangladesh', 'PHL': 'Philippines', 'MYS': 'Malaysia',
  'COL': 'Colombia', 'CHL': 'Chile', 'PER': 'Peru', 'VEN': 'Venezuela'
};

export default function Home() {
  const [year, setYear] = useState(2022);
  const [mode, setMode] = useState('ENERGY');
  const [data, setData] = useState<any>({});
  const [target, setTarget] = useState<string>('USA'); 
  const [isPlaying, setIsPlaying] = useState(false);

  // 1. FETCH DATA
  useEffect(() => {
    fetch('/global_data.json')
      .then(res => res.json())
      .then(json => {
         const raw = json.data || json;
         if (Array.isArray(raw)) {
             const map: any = {};
             raw.forEach((d:any) => map[d.iso_code || d.id || 'UNKNOWN'] = d);
             setData(map);
         } else { setData(raw); }
      })
      .catch(e => console.log("Fetch Error"));
  }, []);

  // 2. TIMELAPSE ENGINE
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setYear((prev) => (prev >= 2025 ? 2000 : prev + 1));
      }, 1200); // 1.2 Seconds per year
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 3. SMART VALUES
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

  const leaders = useMemo(() => {
      return Object.keys(data)
        .map(key => ({ name: key, ...getSmartValue(key) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .filter(item => item.value > 0);
  }, [data, year, mode]);

  useEffect(() => {
      const val = getSmartValue(target).value;
      if (val === 0 && leaders.length > 0) setTarget(leaders[0].name);
  }, [mode, leaders]);

  const targetData = getSmartValue(target);
  const config = METRICS[mode];
  const displayName = COUNTRY_NAMES[target] || target;

  return (
    <main className="relative w-full h-screen bg-transparent overflow-hidden text-white select-none">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full z-50 p-6 pointer-events-none">
         <div className="flex justify-between items-start">
             <h1 className="text-3xl font-bold text-emerald-400 pointer-events-auto tracking-widest drop-shadow-md">PULSE.IO</h1>
             <div className="pointer-events-auto grid grid-cols-4 gap-2 w-[400px]">
                {Object.keys(METRICS).map(m => (
                    <button key={m} onClick={()=>setMode(m)} 
                        className={`px-2 py-1.5 rounded text-[10px] font-bold tracking-wider transition-all border border-white/10
                        ${mode === m ? `${METRICS[m].color} text-black shadow-lg scale-105` : 'bg-black/40 hover:bg-white/10 text-slate-300'}`}>
                        {METRICS[m].label}
                    </button>
                ))}
             </div>
         </div>
      </div>

      {/* LEADERBOARD */}
      <div className="absolute top-28 right-4 z-50 p-6 rounded-xl border border-white/20 bg-black/80 w-64 pointer-events-auto backdrop-blur-md">
         <h3 className="text-xs font-bold text-slate-400 mb-4 border-b border-white/10 pb-2 tracking-widest">TOP RANKING</h3>
         <div className="space-y-3">
            {leaders.map((item, i) => (
                <div key={item.name} onClick={() => setTarget(item.name)} className="flex justify-between text-xs cursor-pointer group hover:bg-white/5 p-1 rounded transition-colors">
                    <span className="font-mono group-hover:text-emerald-400">0{i+1} {COUNTRY_NAMES[item.name] || item.name}</span>
                    <span className={`font-mono ${config.color.replace('bg-', 'text-')}`}>
                        {item.value.toLocaleString()} {config.unit}
                    </span>
                </div>
            ))}
         </div>
      </div>

      {/* TARGET CARD */}
      <div className="absolute top-28 left-4 z-50 p-
