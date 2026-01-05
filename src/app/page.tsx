import dynamic from 'next/dynamic';

// Lazy Load the Globe (Turn off SSR)
// This prevents the "Window not defined" error
const GlobeViz = dynamic(() => import('../components/GlobeViz'), { 
  ssr: false,
  loading: () => <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500">Loading Observatory...</div>
});

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      
      {/* UI OVERLAY */}
      <div className="absolute top-0 left-0 w-full z-10 p-6 pointer-events-none">
        <nav className="flex justify-between items-center pointer-events-auto">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                <h1 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">PULSE.IO</h1>
            </div>
            <div className="glass-panel p-2 rounded-lg">
                <span className="text-xs text-slate-400 font-mono">NEXT.JS ARCHITECTURE V2.0</span>
            </div>
        </nav>
      </div>

      {/* 3D ENGINE */}
      <GlobeViz />
      
    </main>
  );
}
