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

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
       .then(r => r.json())
       .then(d => { if (d && d.features) setGeoJson(d.features); });
  }, []);

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
                    // HD SATELLITE TEXTURE
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    // CRISP ATMOSPHERE (Subtle glow, not foggy)
                    .atmosphereColor('#7ca4ff') 
                    .atmosphereAltitude(0.12) 
                    .width(window.innerWidth).height(window.innerHeight)
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.6;
            }

            // VIBRANT COLORS for Satellite Contrast
            const getD3Color = (metric: string, val: number, max: number) => {
                let scale;
                const normalized = Math.min(val / max, 1); // 0 to 1 intensity
                
                // Dynamic Opacity: 
                // Low data = See the real earth (0.1 opacity)
                // High data = See the color (0.8 opacity)
                const opacity = 0.1 + (normalized * 0.7);

                switch(metric) {
                    case 'ENERGY': 
                        // Electric Green
                        return `rgba(0, 255, 100, ${opacity})`; 
                    case 'WEALTH': 
                        // Rich Gold
                        return `rgba(255, 215, 0, ${opacity})`; 
                    case 'CARBON': 
                        // Alarm Red
                        return `rgba(255, 50, 50, ${opacity})`; 
                    case 'WATER':  
                    case 'INTERNET':
                        // Cyber Blue
                        return `rgba(0, 180, 255, ${opacity})`; 
                    case 'INFLATION':
                        // Hot Orange
                        return `rgba(255, 140, 0, ${opacity})`;
                    default:       
                        // Deep Purple
                        return `rgba(180, 50, 255, ${opacity})`;
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
                globeInstance.current.polygonsData(geoJson);
                
                // SIDE COLOR: Dark glass for depth
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0.6)');
                
                // STROKE: Very faint white to define borders without clutter
                globeInstance.current.polygonStrokeColor(() => 'rgba(255,255,255,0.15)');
                
                globeInstance.current.polygonCapColor((d: any) => {
                    const val = getVal(d.id);
                    const max = mode === 'WEALTH' ? 100000 : mode === 'ENERGY' ? 60000 : 100;
                    // Return Vivid Custom Color
                    return val > 0 ? getD3Color(mode, val, max) : 'rgba(0,0,0,0)'; // Totally invisible if no data
                });
                
                // 3D HEIGHT: Data "grows" out of the map
                globeInstance.current.polygonAltitude((d: any) => {
                    const val = getVal(d.id);
                    const max = mode === 'WEALTH' ? 100000 : mode === 'ENERGY' ? 60000 : 100;
                    return val > 0 ? 0.01 + ((val / max) * 0.15) : 0.005;
                });
            }

        } catch (e) {
            console.error("Globe Error:", e);
        }
    };

    loadLibrariesAndRender();

  }, [geoJson, data, year, mode]);

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