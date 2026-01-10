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
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    .atmosphereColor('#7ca4ff')
                    .atmosphereAltitude(0.15) 
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.5;
            }

            // 3. COLOR SCALES (Optimized for Visibility on Satellite Map)
            // We use colors that contrast well with Blue/Green Earth
            const getScale = (metric: string) => {
                switch(metric) {
                    case 'ENERGY': return d3Scale.scaleSequential(d3Chromatic.interpolateSpring).domain([0, maxVal]); // Bright Green/Pink
                    case 'WEALTH': return d3Scale.scaleSequential(d3Chromatic.interpolateWarming).domain([0, maxVal]); // Gold/Orange
                    case 'CARBON': return d3Scale.scaleSequential(d3Chromatic.interpolateReds).domain([0, maxVal]); // Bright Red
                    case 'INFLATION': return d3Scale.scaleSequential(d3Chromatic.interpolatePlasma).domain([0, maxVal]); // Purple/Yellow Neon
                    case 'WATER': return d3Scale.scaleSequential(d3Chromatic.interpolateCool).domain([0, 100]); // Cyan/Purple
                    case 'INTERNET': return d3Scale.scaleSequential(d3Chromatic.interpolateCyan).domain([0, 100]); // Bright Cyan
                    default: return d3Scale.scaleSequential(d3Chromatic.interpolateViridis).domain([0, maxVal]);
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

                // --- HIGH VISIBILITY SETTINGS ---

                // 1. CAP & SIDE: INVISIBLE
                globeInstance.current.polygonCapColor(() => 'rgba(0,0,0,0)');
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0)');

                // 2. ALTITUDE: LIFTED
                // We raise the lines to 0.01 to ensure they sit ON TOP of the mountains/clouds
                globeInstance.current.polygonAltitude(0.01);

                // 3. STROKE: SOLID & BRIGHT
                globeInstance.current.polygonStrokeColor((d: any) => {
                    const val = getVal(d.id);
                    
                    // A. No Data? -> Solid White Line (40% Opacity)
                    // This ensures every country is visible as a boundary
                    if (val === null || val === 0) return 'rgba(255,255,255, 0.4)';

                    // B. Real Data -> 100% OPAQUE COLOR
                    const scale = getScale(mode);
                    return scale(val); // No transparency added. Pure color.
                });
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