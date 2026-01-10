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

  // 2. RENDER REALISTIC GLOBE
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
                    // REALISTIC TEXTURE: Blue Marble (Satellite View)
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    // REALISTIC ATMOSPHERE: Light Blue Glow
                    .atmosphereColor('#4ca6ff') 
                    .atmosphereAltitude(0.15)
                    .width(window.innerWidth).height(window.innerHeight)
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.5;
            }

            // REALISTIC COLOR SCALES
            const getD3Color = (metric: string, val: number) => {
                let scale;
                switch(metric) {
                    case 'ENERGY': 
                        // Green (Eco/Energy)
                        scale = d3Scale.scaleSequential(d3Chromatic.interpolateGreens).domain([0, 60000]); 
                        break;
                    case 'WEALTH': 
                        // Gold/Orange (Money) -> using YlOrBr (Yellow-Orange-Brown)
                        scale = d3Scale.scaleSequential(d3Chromatic.interpolateYlOrBr).domain([0, 100000]); 
                        break;
                    case 'CARBON': 
                        // Red (Danger)
                        scale = d3Scale.scaleSequential(d3Chromatic.interpolateReds).domain([0, 30]); 
                        break;
                    case 'WATER': 
                    case 'INTERNET': // (Online)
                        // Blue (Technology/Water)
                        scale = d3Scale.scaleSequential(d3Chromatic.interpolateBlues).domain([0, 100]); 
                        break;
                    case 'INFLATION':
                         // White to Red (Heatmap)
                        scale = d3Scale.scaleSequential(d3Chromatic.interpolateReds).domain([0, 20]);
                        break;
                    default:       
                        scale = d3Scale.scaleSequential(d3Chromatic.interpolateViridis).domain([0, 100]);
                }
                const c = scale(val);
                // Glass Effect: 0.6 opacity lets the satellite texture show through
                return c ? c.replace('rgb', 'rgba').replace(')', ', 0.6)') : 'rgba(255,255,255,0.1)';
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
                
                // VISUALS: Subtle borders, transparent glass fill
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0.2)');
                globeInstance.current.polygonStrokeColor(() => 'rgba(255,255,255,0.3)'); // Light borders
                
                globeInstance.current.polygonCapColor((d: any) => {
                    const val = getVal(d.id);
                    // Use a very faint grey for 0 data, so it's never "Invisible"
                    return val > 0 ? getD3Color(mode, val) : 'rgba(200,200,200,0.1)'; 
                });
                
                // 3D LIFT: Keep the anti-flicker logic
                globeInstance.current.polygonAltitude((d: any) => {
                    const val = getVal(d.id);
                    const max = mode === 'WEALTH' ? 100000 : mode === 'ENERGY' ? 60000 : 100;
                    return val > 0 ? 0.01 + ((val / max) * 0.1) : 0.005;
                });
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