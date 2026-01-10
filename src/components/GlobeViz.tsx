'use client';
import { useEffect, useRef, useState } from 'react';

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

  // 2. RENDER LOGIC
  useEffect(() => {
    if (!globeEl.current) return;

    const loadLibrariesAndRender = async () => {
        try {
            const GlobeModule = await import('globe.gl');
            const Globe = GlobeModule.default;
            const d3Scale = await import('d3-scale');
            const d3Chromatic = await import('d3-scale-chromatic');

            // Initialize Globe (One time only)
            if (!globeInstance.current) {
                // @ts-ignore
                globeInstance.current = Globe()(globeEl.current)
                    .backgroundColor('#000000')
                    // High-Contrast Dark Map (Better for colors than Satellite)
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    .atmosphereColor('#88c0d0') // Soft Nordic Blue glow
                    .atmosphereAltitude(0.15)
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.6;
            }

            // --- SINGLE COLOR SCALES (Lighter -> Darker) ---
            const getScale = (metric: string) => {
                switch(metric) {
                    case 'ENERGY': 
                        // Green: Pale -> Deep
                        return d3Scale.scaleSequential(d3Chromatic.interpolateGreens).domain([0, 60000]); 
                    case 'WEALTH': 
                        // Orange/Gold: Pale -> Deep
                        return d3Scale.scaleSequential(d3Chromatic.interpolateOranges).domain([0, 100000]); 
                    case 'CARBON': 
                        // Red: Pale -> Deep
                        return d3Scale.scaleSequential(d3Chromatic.interpolateReds).domain([0, 30]); 
                    case 'WATER': 
                    case 'INTERNET':
                        // Blue: Pale -> Deep
                        return d3Scale.scaleSequential(d3Chromatic.interpolateBlues).domain([0, 100]); 
                    case 'INFLATION':
                    case 'LIFE':
                        // Purple: Pale -> Deep
                        return d3Scale.scaleSequential(d3Chromatic.interpolatePurples).domain([0, 100]);
                    default:       
                        return d3Scale.scaleSequential(d3Chromatic.interpolateGreys).domain([0, 100]);
                }
            };

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

            if (geoJson) {
                // Update Data
                globeInstance.current.polygonsData(geoJson);
                
                // 1. SIDE COLOR: Darker version of the top color for depth
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0, 0.6)');
                
                // 2. STROKE: Very thin, visible lines
                globeInstance.current.polygonStrokeColor(() => 'rgba(255,255,255, 0.1)');

                // 3. CAP COLOR: The main gradient
                globeInstance.current.polygonCapColor((d: any) => {
                    const val = getVal(d.id);
                    if (val === 0) return 'rgba(50,50,50, 0.3)'; // Dark Grey for "No Data" (Visible but background)
                    
                    const scale = getScale(mode);
                    const c = scale(val);
                    // High Opacity (0.9) to make colors pop against dark background
                    return c ? c.replace('rgb', 'rgba').replace(')', ', 0.9)') : 'rgba(50,50,50,0.3)';
                });
                
                // 4. ALTITUDE: Smooth extrusion
                globeInstance.current.polygonAltitude((d: any) => {
                    const val = getVal(d.id);
                    const max = mode === 'WEALTH' ? 100000 : mode === 'ENERGY' ? 60000 : 100;
                    // Base altitude 0.01 + visual height
                    return val > 0 ? 0.01 + ((val / max) * 0.12) : 0.008;
                });
                
                // 5. TRANSITION: Smooth animation when switching modes
                globeInstance.current.polygonsTransitionDuration(1000);
            }

        } catch (e) {
            console.error("Globe Load Error:", e);
        }
    };

    loadLibrariesAndRender();

  }, [geoJson, data, year, mode]);

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