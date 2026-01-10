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

  // 1. CALCULATE REAL MAXIMUM (No Guessing)
  // This finds the true highest number in your dataset for the current view
  const { maxVal } = useMemo(() => {
    if (!data) return { maxVal: 0 };
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

  // 2. Load Borders
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
       .then(r => r.json())
       .then(d => { if (d && d.features) setGeoJson(d.features); });
  }, []);

  // 3. RENDER REALISTIC EARTH
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
                    // USE SATELLITE TEXTURE (Real World Look)
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    // Realistic Atmosphere
                    .atmosphereColor('#7ca4ff')
                    .atmosphereAltitude(0.15)
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.5;
            }

            // 4. SCALES (Natural)
            const getScale = (metric: string) => {
                switch(metric) {
                    case 'ENERGY': return d3Scale.scaleSequential(d3Chromatic.interpolateGreens).domain([0, maxVal]);
                    case 'WEALTH': return d3Scale.scaleSequential(d3Chromatic.interpolateYlOrBr).domain([0, maxVal]);
                    case 'CARBON': return d3Scale.scaleSequential(d3Chromatic.interpolateReds).domain([0, maxVal]);
                    case 'INFLATION': return d3Scale.scaleSequential(d3Chromatic.interpolateInferno).domain([0, maxVal]);
                    default: return d3Scale.scaleSequential(d3Chromatic.interpolateBlues).domain([0, 100]);
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
                
                // VISUALS: Subtle glass effect
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0, 0.1)'); 
                globeInstance.current.polygonStrokeColor(() => 'rgba(255,255,255, 0.2)'); // Light borders

                globeInstance.current.polygonCapColor((d: any) => {
                    const val = getVal(d.id);
                    // Transparent if no data (Let the satellite image show through)
                    if (val === null || val === 0) return 'rgba(0,0,0,0)'; 

                    const scale = getScale(mode);
                    const c = scale(val);
                    // 60% Opacity: Shows color BUT lets you see the mountains underneath
                    return c ? c.replace('rgb', 'rgba').replace(')', ', 0.6)') : 'rgba(0,0,0,0)';
                });
                
                // ALTITUDE: Real data height
                globeInstance.current.polygonAltitude((d: any) => {
                    const val = getVal(d.id);
                    if (!val) return 0.005;
                    return 0.01 + ((val / maxVal) * 0.15);
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