'use client';
import { useState, useEffect, useMemo } from 'react';

// FIX: Using relative paths (../) to find the files correctly
import GlobeViz from '../components/GlobeViz'; 
import dataset from '../data/dataset.json';

// --- DATA TYPES ---
type MetricType = 'ENERGY' | 'WEALTH' | 'CARBON' | 'RENEWABLES' | 'WATER' | 'INTERNET' | 'LIFE' | 'INFLATION';

const METRICS: Record<MetricType, { label: string; unit: string; color: string }> = {
  ENERGY: { label: 'Energy Usage', unit: 'kWh', color: 'text-emerald-400' },
  WEALTH: { label: 'GDP per Capita', unit: 'USD', color: 'text-yellow-400' },
  CARBON: { label: 'CO2 Emissions', unit: 'Tons', color: 'text-red-400' },
  RENEWABLES: { label: 'Green Energy', unit: '%', color: 'text-green-400' },
  WATER: { label: 'Water Access', unit: '%', color: 'text-blue-400' },
  INTERNET: { label: 'Online Access', unit: '%', color: 'text-cyan-400' },
  LIFE: { label: 'Life Expectancy', unit: 'Yrs', color: 'text-pink-400' },
  INFLATION: { label: 'Inflation', unit: '%', color: 'text-orange-400' },
};

export default function Home() {
  const [year, setYear] = useState(2022);
  const [mode, setMode] = useState<MetricType>('ENERGY');
  const [selectedCountry, setSelectedCountry] = useState<string>('USA'); 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // --- SMART INSIGHT CALCULATOR ---
  const stats = useMemo(() => {
    // Safety check for empty dataset
    if (!dataset || Object.keys(dataset).length === 0) return {
        value: 0, name: 'Loading...', rank: 0, total: 0, trend: 0, trendPercent: '0'
    };
    
    const keyMap: any = { 
        'ENERGY': 'energy', 'WEALTH': 'gdp', 'CARBON': 'co2', 
        'RENEWABLES': 'renewables', 'WATER': 'water', 
        'INTERNET': 'internet', 'LIFE': 'life', 'INFLATION': 'inflation' 
    };
    const key = keyMap[mode];
    
    const countryData = (dataset as any)[selectedCountry];
    const metrics = countryData ? countryData[key] : [];
    
    // Safety check: metrics might be undefined
    if (!metrics || metrics.length === 0) return { 
        value: 0, name: countryData?.name || selectedCountry, rank: 0, total: 0, trend: 0, trendPercent: '0' 
    };

    // NEAREST YEAR LOGIC
    // Sort entries by how close they are to the selected year
    const sortedByDate = [...metrics].sort((a: any, b: any) => 
        Math.abs(parseInt(a.date) - year) - Math.abs(parseInt(b.date) - year)
    );
    
    const currentEntry = sortedByDate[0];
    const currentValue = currentEntry ? parseFloat(currentEntry.value) : 0;

    // Trend Logic: Try 1 year ago, or 5 years ago if 1 year missing
    const prevEntry = metrics.find((d: any) => parseInt(d.date) === year - 1) 
                   || metrics.find((d: any) => parseInt(d.date) === year - 5);

    const prevValue = prevEntry ? parseFloat(prevEntry.value) : currentValue; 
    const trend = currentValue - prevValue;
    const trendPercent = prevValue !== 0 ? ((trend / prevValue) * 100).toFixed(1) : '0';

    // Global Rank Logic
    const allValues = Object.keys(dataset).map(code => {
        const cMetrics = (dataset as any)[code][key];
        const cSorted = cMetrics ? [...cMetrics].sort((a: any, b: any) => Math.abs(parseInt(a.date) - year) - Math.abs(parseInt(b.date) - year)) : [];
        const cEntry = cSorted[0];
        return { code, val: cEntry ? parseFloat(cEntry.value) : -1 };
    }).filter(x => x.val !== -1).sort((a, b) => b.val - a.val);

    const rank = allValues.findIndex(x => x.code === selectedCountry) + 1;
    const totalCountries = allValues.length;

    return { 
        value: currentValue, 
        name: countryData?.name || selectedCountry, 
        rank, 
        total: totalCountries,
        trend,
        trendPercent
    };
  }, [year, mode, selectedCountry]);

  if (!isClient) return null;

  return (
    <main className="relative w-full h-screen bg-transparent overflow-hidden text-white font-sans selection:bg-cyan-500/30">
      
      {/* HEADER */}
      <header className="absolute top-6 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
          PULSE.IO
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-mono tracking-widest">GLOBAL INTELLIGENCE UNIT</p>
      </header>

      {/* LEFT PANEL: SMART CARD */}
      <div className="absolute top-32 left-8 z-10 w-80 pointer-events-none">
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 p-6 rounded-2xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Target Analysis</p>
                    <h2 className="text-3xl font-bold text-white leading-none">{stats?.name}</h2>
                </div>
                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${METRICS[mode].color.replace('text-', 'text-')}`}></div>
            </div>

            <div className="mb-6">
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-mono font-light text-white">
                        {stats?.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className={`text-sm font-bold ${METRICS[mode].color}`}>
                        {METRICS[mode].unit}
                    </span>
                </div>
                <p className={`text-xs font-mono mt-1 ${METRICS[mode].color} opacity-80`}>
                    MODE: {METRICS[mode].label.toUpperCase()}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Global Rank</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">#{stats?.rank}</span>
                        <span className="text-xs text-gray-500">/ {stats?.total}</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Since Last Year</p>
                    <div className={`flex items-center gap-1 font-mono text-sm font-bold ${stats?.trend && stats.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <span>{stats?.trend && stats.trend >= 0 ? '▲' : '▼'}</span>
                        <span>{stats?.trendPercent}%</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT PANEL: METRIC SELECTOR */}
      <div className="absolute top-6 right-8 z-10 flex flex-col gap-2 items-end pointer-events-none">
        <div className="grid grid-cols-2 gap-2 pointer-events-auto">
            {(Object.keys(METRICS) as MetricType[]).map((m) => (
            <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 border ${
                mode === m 
                    ? `bg-${METRICS[m].color.split('-')[1]}-500/20 border-${METRICS[m].color.split('-')[1]}-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]`
                    : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
                {METRICS[m].label}
            </button>
            ))}
        </div>
      </div>

      {/* BOTTOM: TIMELINE */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-8 pointer-events-none">
        <div className="flex items-center gap-6 backdrop-blur-md bg-black/30 border border-white/10 px-6 py-4 rounded-full pointer-events-auto">
            <button 
                onClick={() => setYear(y => Math.max(2000, y - 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
            >
                ◀
            </button>
            <div className="flex-1 relative">
                <input 
                    type="range" 
                    min="2000" 
                    max="2022" 
                    value={year} 
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between mt-2 text-[10px] font-mono text-gray-500">
                    <span>2000</span>
                    <span className="text-cyan-400 font-bold text-sm -mt-1">{year}</span>
                    <span>2022</span>
                </div>
            </div>
            <button 
                onClick={() => setYear(y => Math.min(2022, y + 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
            >
                ▶
            </button>
        </div>
      </div>

      {/* 3D GLOBE */}
      <GlobeViz 
        year={year} 
        mode={mode} 
        data={dataset} 
        onCountryClick={setSelectedCountry} 
      />
      
    </main>
  );
}