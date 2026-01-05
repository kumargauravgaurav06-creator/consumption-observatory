import dynamic from 'next/dynamic';

// Lazy Load the Globe
const GlobeViz = dynamic(() => import('../components/GlobeViz'), { 
  ssr: false,
  loading: () => <div className="text-emerald-500">Loading Core...</div>
});

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white">
      
      {/* --- TOP NAVIGATION --- */}
      <div className="absolute top-0 left-0 w-full z-20 p-6 flex justify-between items-start pointer-events-none">
        {/* Logo Area */}
        <div className="pointer-events-auto">
            <h1 className="text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                PULSE.IO
            </h1>
            <p className="text-xs text-emerald-500/80 tracking-[0.3em] mt-1">TEMPORAL ANALYTICS ENGINE</p>
        </div>

        {/* Top Right Buttons */}
        <div className="flex gap-4 pointer-events-auto">
            {['ENERGY', 'WEALTH', 'CARBON'].map((mode) => (
                <button key={mode} className="px-6 py-2 text-xs font-bold border border-white/20 hover:bg-white/10 hover:border-emerald-500 transition-all rounded-sm uppercase tracking-widest backdrop-blur-sm">
                    {mode}
                </button>
            ))}
        </div>
      </div>

      {/* --- LEFT DATA PANEL --- */}
      <div className="absolute top-1/2 left-10 -translate-y-1/2 z-20 pointer-events-none">
        <div className="glass-panel p-8 rounded-2xl w-80 backdrop-blur-xl border border-white/10 bg-black/40 pointer-events-auto">
            <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Target Locked</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            
            <h2 className="text-4xl font-bold mb-1">United<br/>States</h2>
            
            <div className="mt-8">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Metric Value</p>
                <div className="text-3xl font-mono text-emerald-400 text-shadow-glow">6,363 kWh</div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase">Global Rank</p>
                        <p className="text-xl font-bold">#1</p>
                    </div>
                    <button className="text-xs text-emerald-400 hover:text-emerald-300 underline">View Analysis</button>
                </div>
            </div>
        </div>
      </div>

      {/* --- BOTTOM TIMELINE --- */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl z-20 pointer-events-auto">
        <div className="glass-panel p-4 rounded-full border border-white/10 bg-black/60 backdrop-blur-md flex items-center gap-6">
            <button className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <svg className="w-4 h-4 text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden relative group cursor-pointer">
                <div className="absolute top-0 left-0 h-full w-[80%] bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
            </div>

            <div className="font-mono text-xl text-emerald-400 font-bold">2023</div>
        </div>
      </div>

      {/* --- 3D LAYER --- */}
      <GlobeViz />
      
    </main>
  );
}
