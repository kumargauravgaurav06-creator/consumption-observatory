'use client';
import { useEffect, useRef, useState } from 'react';

// NOTE: We do not import Globe or D3 at the top. 
// This prevents the Server-Side Rendering (SSR) crash.

type GlobeProps = {
  year: number;
  mode: string;
  data: any;
  target?: string;
  onCountryClick: (code: string) => void;
};

export default function GlobeViz({ year, mode, data, target, onCountryClick }: GlobeProps) {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);
  const [geoJson, setGeoJson] = useState<any>(null);

  // 1. Load Borders
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
       .then(r => r.json())
       .then(d => { if (d && d.features) setGeoJson(d.features); });
  }, []);

  // 2. LAZY LOAD & RENDER LOOP
  useEffect(() => {
    if (!globeEl.current) return;

    // This function loads the libraries ONLY when the browser is ready
    const loadLibrariesAndRender = async () => {
        try {
            // A. Dynamically import the tools
            // This bypasses the "Client-side exception" completely
            const GlobeModule = await import('globe.gl');
            const Globe = GlobeModule.default;
            
            const d3Scale = await import('d3-scale');
            const d3Chromatic = await import('d3-scale-chromatic');

            // B. Initialize Globe (if not already done)
            if (!globeInstance.current) {
                // @ts-ignore - Ignore the TypeScript type mismatch
                globeInstance.current = Globe()(globeEl.current)
                    .backgroundColor('#000000')
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    .atmosphereColor('#3a228a')
                    .atmosphereAltitude(0.2)
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.5;
            }

            // C. Define Helper to get Colors safely
            const getD3Color = (metric: string, val: number) => {
                let scale;
                switch(metric) {
                    case 'ENERGY': scale = d3Scale.scaleSequential(d3Chromatic.interpolateGreens).domain([0, 60000]); break;
                    case 'WEALTH': scale = d3Scale.scaleSequential(d3Chromatic.interpolateViridis).domain([0, 100000]); break;
                    case 'CARBON': scale = d3Scale.scaleSequential(d3Chromatic.interpolateReds).domain([0, 30]); break;
                    case 'WATER':  scale = d3Scale.scaleSequential(d3Chromatic.interpolateBlues).domain([50, 100]); break;
                    default:       scale = d3Scale.scaleSequential(d3Chromatic.interpolateMagma).domain([0, 100]);
                }
                const c = scale(val);
                return c ? c.replace('rgb', 'rgba').replace(')', ', 0.8)') : 'rgba(255,255,255,0.1)';
            };

            // D. Helper to get Data
            const getVal = (id: string) => {
                if (!data || !data[id]) return 0;
                const keyMap: any = { 
                    'ENERGY': 'energy', 'WEALTH': 'gdp', 'CARBON': 'co2', 
                    'RENEWABLES': 'renewables', 'WATER': 'water', 
                    'INTERNET': 'internet', 'LIFE': 'life', 'INFLATION': 'inflation' 
                };
                const key = keyMap[mode];
                const metrics = data[id][key];
                if (!Array.isArray(metrics)) return 0;
                const entry = metrics.find((d: any) => parseInt(d.date) === year);
                if (entry) return parseFloat(entry.value);
                const sorted = [...metrics].sort((a:any, b:any) => parseInt(b.date) - parseInt(a.date));
                return sorted[0] ? parseFloat(sorted[0].value) : 0;
            };

            // E. Update Visuals
            if (geoJson) {
                globeInstance.current.polygonsData(geoJson);
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0)');
                globeInstance.current.polygonStrokeColor(() => '#111');
                globeInstance.current.polygonCapColor((d: any) => {
                    const val = getVal(d.id);
                    return val > 0 ? getD3Color(mode, val) : 'rgba(255,255,255,0.02)';
                });
                globeInstance.current.polygonAltitude((d: any) => {
                    const val = getVal(d.id);
                    const max = mode === 'WEALTH' ? 100000 : 50000;
                    return val > 0 ? (val / max) * 0.08 : 0.005;
                });
            }

        } catch (e) {
            console.error("Globe Load Error:", e);
        }
    };

    loadLibrariesAndRender();

  }, [geoJson, data, year, mode]); // Re-run when these change

  // Resize Handler
  useEffect(() => {
     const handleResize = () => { 
         if (globeInstance.current) {
             globeInstance.current.width(window.innerWidth);
             globeInstance.current.height(window.innerHeight);
         }
     };
     window.addEventListener('resize', handleResize);
     return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={globeEl} className="fixed top-0 left-0 w-full h-full -z-10" />;
}