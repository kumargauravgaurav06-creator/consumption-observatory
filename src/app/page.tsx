'use client';
import { useState, useEffect, useMemo } from 'react';

// FIX: Relative paths
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

  // --- HELPER: GET NEAREST VALUE ---
  const getMetricValue = (code: string, currentYear: number, metricKey: string) => {
      const d = (dataset as any)[code];
      if (!d || !d[metricKey]) return 0;
      const metrics = d[metricKey];
      const sorted = [...metrics].sort((a: any, b: any) => 
          Math.abs(parseInt(a.date) - currentYear) - Math.abs(parseInt(b.date) - currentYear)
      );
      return sorted[0] ? parseFloat(sorted[0].value) : 0;
  };

  // --- 1. LEADERBOARD CALCULATOR ---
  const leaderboard = useMemo(() => {
    if (!dataset) return [];
    const keyMap: any = { 
        'ENERGY': 'energy', 'WEALTH': 'gdp', 'CARBON': 'co2', 
        'RENEWABLES': 'renewables', 'WATER': 'water', 
        'INTERNET': 'internet', 'LIFE': 'life', 'INFLATION': 'inflation' 
    };
    const key = keyMap[mode];

    return Object.keys(dataset).map(code => ({
        code,
        name: (dataset as any)[code].name,
        value: getMetricValue(code, year, key)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  }, [year, mode]);

  // --- 2. SELECTED COUNTRY STATS ---
  const stats = useMemo(() => {
    if (!dataset) return null;
    const keyMap: any = { 
        'ENERGY': 'energy', 'WEALTH': 'gdp', 'CARBON': 'co2', 
        'RENEWABLES': 'renewables', 'WATER': 'water', 
        'INTERNET': 'internet', 'LIFE': 'life', 'INFLATION': 'inflation' 
    };
    const key = keyMap[mode];
    const d = (dataset as any)[selectedCountry];
    
    if (!d) return { value: 0, name: selectedCountry, rank: 0, total: 0, trend: 0, trendPercent: '0' };

    const val = getMetricValue(selectedCountry, year, key);
    const prevVal = getMetricValue(selectedCountry, year - 1, key) || getMetricValue(selectedCountry, year - 5, key);
    
    const allVals = Object.keys(dataset).map(c => getMetricValue(c, year, key)).sort((a, b) => b - a);
    const rank = allVals.indexOf(val) + 1;

    const trend = val - prevVal;
    const trendPercent = prevVal !== 0 ? ((trend / prevVal) * 100).toFixed(1) : '0';

    return { value: val, name: d.name, rank, total: allVals.length, trend, trendPercent };
  }, [year, mode, selectedCountry]);

  if (!isClient) return null;

  return (
    <main className="relative w-full h-screen bg-transparent overflow-hidden text-white font-sans selection:bg-cyan-500/30">
      
      {/* HEADER: Smaller on Mobile */}
      <header className="absolute top-4 left-4 md:top-6 md:left-8 z-10 pointer-events-none">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
          PULSE.IO
        </h1>
        <p className="text-[10px] md:text-xs text-gray-500 mt-1 font-mono tracking-widest">GLOBAL INTELLIGENCE UNIT</p>
      </header>

      {/* METRIC SELECTOR */}
      <div className="absolute top-16 left-0 w-full px-4 md:top-6 md:right-8 md:left-auto md:w-auto z-10 pointer-events-none flex flex-col items-end gap-6">
        
        <div className="flex flex-row overflow-x-auto w-full md:w-auto md:grid md:grid-cols-2 gap-2 pointer-events-auto pb-2 md:pb-0 no-scrollbar">
            {(Object.keys(METRICS) as MetricType[]).map((m) => (
            <button
                key={m}
                onClick={() => setMode(m)}
                className={`whitespace-nowrap px-3 py-2 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold tracking-wider transition-all duration-300 border flex-shrink-0 ${
                mode === m 
                    ? `bg-${METRICS[m].color.split('-')[1]}-500/20 border-${METRICS[m].color.split('-')[1]}-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]`
                    : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
                {METRICS[m].label}
            </button>
            ))}
        </div>

        {/* LEADERBOARD */}
        <div className="hidden md:block w-64 backdrop-blur-xl bg-black/40 border border-white/10 p-4 rounded-xl pointer-events-auto">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pb-2 border-b border-white/10">
                Top Leaders ({year})
            </h3>
            <div className="flex flex-col gap-2">
                {leaderboard.map((item, i) => (
                    <div 
                        key={item.code}
                        onClick={() => setSelectedCountry(item.code)}
                        className={`group flex items-center justify-between p-2 rounded hover:bg-white/10 cursor-pointer transition-all ${selectedCountry === item.code ? 'bg-white/10 border-l-2 border-cyan-400' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-gray-500 w-3">{i + 1}</span>
                            <span className="text-sm font-bold text-gray-200 group-hover:text-white">{item.name}</span>
                        </div>
                        <span className={`text-xs font-mono ${METRICS[mode].color}`}>
                            {item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* SMART CARD */}
      <div className="absolute bottom-24 left-4 right-4 md:top-32 md:left-8 md:right-auto md:bottom-auto md:w-80 z-10 pointer-events-none">
        <div className="backdrop-blur-xl bg-black/60 md:bg-black/40 border border-white/10 p-4 md:p-6 rounded-2xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-2 md:mb-4">
                <div>
                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest mb-1">Target Analysis</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-none">{stats?.name}</h2>
                </div>
                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${METRICS[mode].color.replace('text-', 'text-')}`}></div>
            </div>

            <div className="mb-4 md:mb-6">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-mono font-light text-white">
                        {stats?.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className={`text-sm font-bold ${METRICS[mode].color}`}>
                        {METRICS[mode].unit}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Rank</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg md:text-xl font-bold text-white">#{stats?.rank}</span>
                        <span className="text-xs text-gray-500">/ {stats?.total}</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Trend</p>
                    <div className={`flex items-center gap-1 font-mono text-sm font-bold ${stats?.trend && stats.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <span>{stats?.trend && stats.trend >= 0 ? '▲' : '▼'}</span>
                        <span>{stats?.trendPercent}%</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="absolute bottom-6 left-0 w-full px-4 md:bottom-10 z-10 pointer-events-none">
        <div className="flex items-center gap-4 md:gap-6 backdrop-blur-md bg-black/60 md:bg-black/30 border border-white/10 px-4 py-3 md:px-6 md:py-4 rounded-full max-w-2xl mx-auto pointer-events-auto">
            <button 
                onClick={() => setYear(y => Math.max(2000, y - 1))}
                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
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
                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
            >
                ▶
            </button>
        </div>
      </div>

      {/* 3D GLOBE - TARGET CONNECTED */}
      <GlobeViz 
        year={year} 
        mode={mode} 
        data={dataset} 
        target={selectedCountry}
        onCountryClick={setSelectedCountry} 
      />
      
    </main>
  );
}