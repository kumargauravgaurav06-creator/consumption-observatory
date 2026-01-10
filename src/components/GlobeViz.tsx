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

  // 1. DATA-DRIVEN SCALING (No guessing)
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
    console.log(`[GlobeViz] Max Value for ${mode}:`, max); // Debug log to confirm new code
    return { maxVal: max > 0 ? max : 100 };
  }, [data, year, mode]);

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

            if (!globeInstance.current) {
                // @ts-ignore
                globeInstance.current = Globe()(globeEl.current)
                    .backgroundColor('#000000')
                    // TEXTURE: Blue Marble (The Reference Image Look)
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    // ATMOSPHERE: Bright and Airy
                    .atmosphereColor('#7ca4ff')
                    .atmosphereAltitude(0.15) 
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.5;
            }

            // 3. COLOR SCALES (Bright Neon for Borders)
            // We use standard linear scales mapped to your real maxVal
            const getScale = (metric: string) => {
                switch(metric) {
                    case 'ENERGY': return d3Scale.scaleSequential(d3Chromatic.interpolateGreens).domain([0, maxVal]);
                    case 'WEALTH': return d3Scale.scaleSequential(d3Chromatic.interpolateYlOrBr).domain([0, maxVal]); // Gold
                    case 'CARBON': return d3Scale.scaleSequential(d3Chromatic.interpolateReds).domain([0, maxVal]);
                    case 'INFLATION': return d3Scale.scaleSequential(d3Chromatic.interpolateInferno).domain([0, maxVal]);
                    default: return d3Scale.scaleSequential(d3Chromatic.interpolateCyan).domain([0, 100]);
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

                // --- STRICT BORDER-ONLY MODE ---

                // 1. CAP COLOR (Fill): STRICTLY OFF
                // Use 'rgba(0,0,0,0)' to make the body invisible
                globeInstance.current.polygonCapColor(() => 'rgba(0,0,0,0)');

                // 2. SIDE COLOR (3D Wall): STRICTLY OFF
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0)');

                // 3. ALTITUDE: FLAT
                // We keep it extremely low (0.001) so it sits on the surface like a decal
                // If we make it too high, it looks like a block.
                globeInstance.current.polygonAltitude(0.005);

                // 4. STROKE COLOR (Border): DATA DRIVEN
                globeInstance.current.polygonStrokeColor((d: any) => {
                    const val = getVal(d.id);
                    
                    // A. No Data? -> Faint Gray Outline (20% opacity)
                    if (val === null || val === 0) return 'rgba(200,200,200, 0.2)';

                    // B. Real Data -> Bright Neon Color (100% opacity)
                    const scale = getScale(mode);
                    return scale(val);
                });
            }

        } catch (e) {
            console.error("Globe Load Error:", e);
        }
    };

    loadLibrariesAndRender();

  }, [geoJson, data, year, mode, maxVal]);

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