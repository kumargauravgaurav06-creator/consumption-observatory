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
    // Fetch borders - using a reliable CDN
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
       .then(r => r.json())
       .then(d => { if (d && d.features) setGeoJson(d.features); })
       .catch(err => console.error("GeoJSON failed to load", err));
  }, []);

  // 2. RENDER
  useEffect(() => {
    if (!globeEl.current) return;

    const loadLibrariesAndRender = async () => {
        try {
            const GlobeModule = await import('globe.gl');
            const Globe = GlobeModule.default;

            if (!globeInstance.current) {
                // @ts-ignore
                globeInstance.current = Globe()(globeEl.current)
                    .backgroundColor('rgba(0,0,0,0)') // Transparent Background
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    .atmosphereColor('#7ca4ff')
                    .atmosphereAltitude(0.12)
                    .onPolygonHover((hoverD: any) => {
                        if (globeEl.current) {
                            globeEl.current.style.cursor = hoverD ? 'pointer' : 'default';
                        }
                    }) 
                    .onPolygonClick((d: any) => { if (onCountryClick) onCountryClick(d.id); });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.3;
            }

            // 3. COLORS
            const getBaseColor = (metric: string) => {
                switch(metric) {
                    case 'ENERGY': return '0, 255, 100';    // Emerald
                    case 'WEALTH': return '255, 215, 0';    // Gold
                    case 'CARBON': return '255, 50, 50';    // Red
                    case 'INFLATION': return '255, 100, 0'; // Orange
                    case 'WATER': return '0, 150, 255';     // Blue
                    case 'INTERNET': return '0, 255, 255';  // Cyan
                    case 'LIFE': return '255, 0, 255';      // Magenta
                    case 'RENEWABLES': return '100, 255, 0';// Lime
                    default: return '255, 255, 255';        
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
                if (!metrics || !Array.isArray(metrics)) return null;
                const entry = metrics.find((d: any) => parseInt(d.date) === year);
                return entry ? parseFloat(entry.value) : null;
            };

            if (geoJson) {
                globeInstance.current.polygonsData(geoJson);
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0)');
                globeInstance.current.polygonCapColor(() => 'rgba(0,0,0,0)'); // Crystal Clear
                
                globeInstance.current.polygonStrokeColor((d: any) => {
                    const val = getVal(d.id);
                    if (val === null) return 'rgba(255,255,255, 0.1)'; 
                    const baseRgb = getBaseColor(mode);
                    return `rgba(${baseRgb}, 1)`;
                });
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