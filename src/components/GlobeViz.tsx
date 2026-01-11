'use client';
import { useEffect, useRef, useState, useMemo } from 'react';

type GlobeProps = {
  year: number;
  mode: string;
  data: any;
  target?: string; // This listens for the Leaderboard clicks
  onCountryClick: (code: string) => void;
};

export default function GlobeViz({ year, mode, data, target, onCountryClick }: GlobeProps) {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

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
       .then(d => { if (d && d.features) setGeoJson(d.features); })
       .catch(e => console.error("Geo load failed", e));
  }, []);

  // 2. HELPER: CALCULATE CENTER OF COUNTRY FOR FLY-TO
  const getCentroid = (geometry: any) => {
      if (!geometry) return null;
      let coords = geometry.coordinates;
      // Unwrap MultiPolygon to get the biggest polygon (usually the mainland)
      if (geometry.type === 'MultiPolygon') {
          // Simple approximation: take the first polygon (usually the largest in standard geojsons)
          coords = coords[0];
      }
      
      // Calculate average of the ring
      // Polygon structure: [ [ [x, y], [x, y] ... ] ]
      const points = coords[0]; 
      let x = 0, y = 0;
      points.forEach((p: any) => { x += p[0]; y += p[1]; });
      
      return { lat: y / points.length, lng: x / points.length };
  };

  // 3. EFFECT: FLY TO TARGET (When Leaderboard is clicked)
  useEffect(() => {
      if (!globeInstance.current || !geoJson || !target) return;
      
      // Find the feature
      const country = geoJson.find((f: any) => f.id === target);
      if (country) {
          const center = getCentroid(country.geometry);
          if (center) {
              // Smooth Fly Animation
              globeInstance.current.pointOfView({ lat: center.lat, lng: center.lng, altitude: 2.0 }, 1500);
          }
      }
  }, [target, geoJson]);

  // 4. RENDER
  useEffect(() => {
    if (!globeEl.current) return;

    const loadLibrariesAndRender = async () => {
        try {
            const GlobeModule = await import('globe.gl');
            const Globe = GlobeModule.default;

            if (!globeInstance.current) {
                // @ts-ignore
                globeInstance.current = Globe()(globeEl.current)
                    .backgroundColor('rgba(0,0,0,0)')
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    .atmosphereColor('#7ca4ff')
                    .atmosphereAltitude(0.12)
                    // HOVER INTERACTION
                    .onPolygonHover((hoverD: any) => {
                        setHoverId(hoverD ? hoverD.id : null);
                        if (globeInstance.current) {
                            // Pause rotation when hovering to let user focus
                            globeInstance.current.controls().autoRotate = !hoverD;
                            globeEl.current!.style.cursor = hoverD ? 'pointer' : 'default';
                        }
                    }) 
                    // CLICK INTERACTION
                    .onPolygonClick((d: any) => { 
                        if (onCountryClick) onCountryClick(d.id);
                        const center = getCentroid(d.geometry);
                        if (center) {
                            globeInstance.current.pointOfView({ lat: center.lat, lng: center.lng, altitude: 2.0 }, 1000);
                        }
                    });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.5;
            }

            // --- VISUALIZATION LOGIC ---
            const getBaseColor = (metric: string) => {
                switch(metric) {
                    case 'ENERGY': return '0, 255, 100';    
                    case 'WEALTH': return '255, 215, 0';    
                    case 'CARBON': return '255, 50, 50';    
                    case 'INFLATION': return '255, 100, 0'; 
                    case 'WATER': return '0, 150, 255';     
                    case 'INTERNET': return '0, 255, 255';  
                    case 'LIFE': return '255, 0, 255';      
                    case 'RENEWABLES': return '100, 255, 0';
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
                
                // Find nearest logic inside globe for coloring? No, keeping it simple: match year.
                // Or use simple find for speed.
                const entry = metrics.find((d: any) => parseInt(d.date) === year);
                return entry ? parseFloat(entry.value) : null;
            };

            if (geoJson) {
                globeInstance.current.polygonsData(geoJson);
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0)');
                globeInstance.current.polygonCapColor(() => 'rgba(0,0,0,0)'); // Still Crystal Clear

                // BORDER COLOR - Reacts to Hover
                globeInstance.current.polygonStrokeColor((d: any) => {
                    // IF HOVERED: Turn White
                    if (d.id === hoverId) return 'rgba(255, 255, 255, 1)';

                    const val = getVal(d.id);
                    if (val === null) return 'rgba(255,255,255, 0.1)'; 
                    const baseRgb = getBaseColor(mode);
                    return `rgba(${baseRgb}, 1)`;
                });

                // ALTITUDE - Reacts to Hover (The "Pop Up" Effect)
                globeInstance.current.polygonAltitude((d: any) => {
                    if (d.id === hoverId) return 0.04; // Lifts up when hovered
                    return 0.006;
                });
                
                // Important: Trigger update cycle for interactions
                globeInstance.current.polygonsTransitionDuration(300);
            }

        } catch (e) {
            console.error("Globe Load Error:", e);
        }
    };

    loadLibrariesAndRender();

  }, [geoJson, data, year, mode, maxVal, hoverId]); // Dependencies include hoverId to trigger re-render of colors

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