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

  // 1. CALCULATE MAX (Auto-Calibration)
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

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
       .then(r => r.json())
       .then(d => { if (d && d.features) setGeoJson(d.features); });
  }, []);

  // 2. RENDER THE "CRYSTAL CLEAR" GLOBE
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
                    // TEXTURE: Blue Marble (Matches your reference image)
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    // ATMOSPHERE: Bright Cyan/White glow like sunlight
                    .atmosphereColor('#7ca4ff')
                    .atmosphereAltitude(0.15) 
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.6;
            }

            // 3. SCALES
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
                
                // INVISIBLE SIDES (Removes the blocky "plastic" look)
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0)');
                
                // BORDER: Extremely faint (5% opacity) just to define shapes
                globeInstance.current.polygonStrokeColor(() => 'rgba(255,255,255, 0.05)');

                // CAP COLOR: Data-Driven Transparency
                globeInstance.current.polygonCapColor((d: any) => {
                    const val = getVal(d.id);
                    
                    // A. No Data or Zero? -> COMPLETELY INVISIBLE
                    if (val === null || val === 0) return 'rgba(0,0,0,0)'; 

                    const scale = getScale(mode);
                    const c = scale(val);
                    
                    // B. Variable Opacity Calculation
                    // Low values = 0.1 opacity (Glass)
                    // High values = 0.5 opacity (Tinted Glass)
                    // This ensures the "Fog" is gone.
                    const opacity = 0.1 + ((val / maxVal) * 0.4); 
                    
                    return c ? c.replace('rgb', 'rgba').replace(')', `, ${opacity})`) : 'rgba(0,0,0,0)';
                });
                
                // ALTITUDE: Minimal lift to avoid "Spikes"
                globeInstance.current.polygonAltitude((d: any) => {
                    const val = getVal(d.id);
                    if (!val) return 0.001; 
                    return 0.005 + ((val / maxVal) * 0.08); // Very subtle 3D
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