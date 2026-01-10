'use client';
import { useEffect, useRef, useState, useMemo } from 'react';

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

  // 1. DATA CALCULATION
  const { maxVal } = useMemo(() => {
    if (!data) return { maxVal: 100 };
    let max = 0;
    const keyMap: any = { 
        'ENERGY': 'energy', 'WEALTH': 'gdp', 'CARBON': 'co2', 
        'RENEWABLES': 'renewables', 'WATER': 'water', 
        'INTERNET': 'internet', 'LIFE': 'life', 'INFLATION': 'inflation' 
    };
    const key = keyMap[mode];

    Object.values(data).forEach((country: any) => {
        const metrics = country[key];
        if (Array.isArray(metrics)) {
            const entry = metrics.find((d: any) => parseInt(d.date) === year);
            if (entry) {
                const val = parseFloat(entry.value);
                if (val > max) max = val;
            }
        }
    });
    return { maxVal: max > 0 ? max : 100 };
  }, [data, year, mode]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
       .then(r => r.json())
       .then(d => { if (d && d.features) setGeoJson(d.features); });
  }, []);

  // 2. RENDER
  useEffect(() => {
    if (!globeEl.current) return;

    const loadLibrariesAndRender = async () => {
        try {
            const GlobeModule = await import('globe.gl');
            const Globe = GlobeModule.default;
            const d3Scale = await import('d3-scale');

            if (!globeInstance.current) {
                // @ts-ignore
                globeInstance.current = Globe()(globeEl.current)
                    .backgroundColor('#000000')
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    .atmosphereColor('#7ca4ff')
                    .atmosphereAltitude(0.12) 
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.3;
            }

            // 3. COLOR PALETTE (Your Idea: One Color Per Mode)
            const getBaseColor = (metric: string) => {
                switch(metric) {
                    case 'ENERGY': return '0, 255, 100';    // Bright Emerald Green
                    case 'WEALTH': return '255, 215, 0';    // Gold
                    case 'CARBON': return '255, 50, 50';    // Bright Red
                    case 'INFLATION': return '255, 100, 0'; // Hot Orange
                    case 'WATER': return '0, 150, 255';     // Ocean Blue
                    case 'INTERNET': return '0, 255, 255';  // Cyan/Neon Blue
                    case 'LIFE': return '255, 0, 255';      // Magenta/Pink
                    case 'RENEWABLES': return '100, 255, 0';// Lime Green
                    default: return '255, 255, 255';        // White
                }
            };

            const getVal = (id: string) => {
                if (!data || !data[id]) return null;
                const keyMap: any = { 
                    'ENERGY': 'energy', 'WEALTH': 'gdp', 'CARBON': 'co2', 
                    'RENEWABLES': 'renewables', 'WATER': 'water', 
                    'INTERNET': 'internet', 'LIFE': 'life', 'INFLATION': 'inflation' 
                };
                const key = keyMap[mode];
                const metrics = data[id][key];
                if (!Array.isArray(metrics)) return null;
                const entry = metrics.find((d: any) => parseInt(d.date) === year);
                return entry ? parseFloat(entry.value) : null;
            };

            if (geoJson) {
                globeInstance.current.polygonsData(geoJson);

                // --- THE "GLASS GRADIENT" IMPLEMENTATION ---
                
                // 1. INVISIBLE SIDES (Keep it looking like a sticker, not a block)
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0)');

                // 2. CAP COLOR: THE GRADIENT LOGIC
                globeInstance.current.polygonCapColor((d: any) => {
                    const val = getVal(d.id);
                    if (val === null || val === 0) return 'rgba(0,0,0,0)'; // Invisible if 0

                    const baseRgb = getBaseColor(mode);
                    
                    // OPACITY LOGIC:
                    // Low Value = 10% Opacity (See the mountains clearly)
                    // High Value = 70% Opacity (Rich color, but still slightly transparent)
                    const opacity = 0.1 + ((val / maxVal) * 0.6); 
                    
                    return `rgba(${baseRgb}, ${opacity})`;
                });

                // 3. BORDER: SOLID COLOR (To define the shape clearly)
                globeInstance.current.polygonStrokeColor((d: any) => {
                    const val = getVal(d.id);
                    if (val === null || val === 0) return 'rgba(255,255,255, 0.15)'; // Faint white ghost
                    const baseRgb = getBaseColor(mode);
                    return `rgba(${baseRgb}, 1)`; // 100% Solid Border
                });

                // 4. ALTITUDE: Low (Decal style)
                globeInstance.current.polygonAltitude(0.006);
            }

        } catch (e) {
            console.error("Globe Load Error:", e);
        }
    };

    loadLibrariesAndRender();

  }, [geoJson, data, year, mode, maxVal]);

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