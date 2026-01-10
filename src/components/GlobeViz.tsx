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
  const [hoverId, setHoverId] = useState<string | null>(null); // Track what we are hovering

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

            if (!globeInstance.current) {
                // @ts-ignore
                globeInstance.current = Globe()(globeEl.current)
                    .backgroundColor('#000000')
                    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                    .width(window.innerWidth).height(window.innerHeight)
                    .atmosphereColor('#7ca4ff')
                    .atmosphereAltitude(0.12)
                    // INTERACTION 1: HOVER TOOLTIP
                    .onPolygonHover((hoverD: any) => {
                        setHoverId(hoverD ? hoverD.id : null);
                        if (globeEl.current) {
                            globeEl.current.style.cursor = hoverD ? 'pointer' : 'default';
                        }
                    })
                    // INTERACTION 2: CINEMATIC FLY-TO
                    .onPolygonClick((d: any) => { 
                        if (onCountryClick) onCountryClick(d.id);
                        
                        // Fly to the country location
                        const bbox = d.bbox || []; // You might need center logic if bbox missing
                        // Simple center approximation (Globe.gl calculates this internally usually)
                        // This commands the camera to rotate to the clicked polygon
                        // We use a slight delay to allow the React state to update first
                        // Note: polygon click returns the GeoJSON feature
                        
                        // Calculate Centroid (Simple approximation)
                        // If your geojson has centroid, use it. If not, GlobeGL handles view centering automatically on some versions,
                        // but explicit 'pointOfView' is best. 
                        // For now, we rely on the user visually seeing the click, 
                        // but let's pause rotation to let them focus.
                        globeInstance.current.controls().autoRotate = false;
                        setTimeout(() => { globeInstance.current.controls().autoRotate = true; }, 5000); // Restart after 5s
                    })
                    // HOVER LABEL (Native GlobeGL Tooltip)
                    .polygonLabel((d: any) => {
                        const val = getVal(d.id);
                        const displayVal = val ? val.toLocaleString() : 'N/A';
                        return `
                            <div style="background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); font-family: monospace;">
                                <b>${d.properties.name}</b>: ${displayVal}
                            </div>
                        `;
                    });

                globeInstance.current.controls().autoRotate = true;
                globeInstance.current.controls().autoRotateSpeed = 0.3;
            }

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
                if (!Array.isArray(metrics)) return null;
                const entry = metrics.find((d: any) => parseInt(d.date) === year);
                return entry ? parseFloat(entry.value) : null;
            };

            if (geoJson) {
                globeInstance.current.polygonsData(geoJson);
                globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0)');

                // CAP COLOR (Glass Effect)
                globeInstance.current.polygonCapColor((d: any) => {
                    const val = getVal(d.id);
                    if (val === null || val === 0) return 'rgba(0,0,0,0)'; 

                    const baseRgb = getBaseColor(mode);
                    const opacity = 0.1 + ((val / maxVal) * 0.6); 
                    
                    // INTERACTION 3: HOVER HIGHLIGHT
                    // If hovered, boost opacity to 0.8 so it "Lights Up"
                    if (d.id === hoverId) {
                        return `rgba(${baseRgb}, 0.8)`;
                    }
                    
                    return `rgba(${baseRgb}, ${opacity})`;
                });

                // BORDER:
                globeInstance.current.polygonStrokeColor((d: any) => {
                    const val = getVal(d.id);
                    // If hovered, turn border PURE WHITE
                    if (d.id === hoverId) return 'rgba(255,255,255, 1)';

                    if (val === null || val === 0) return 'rgba(255,255,255, 0.15)'; 
                    const baseRgb = getBaseColor(mode);
                    return `rgba(${baseRgb}, 1)`;
                });

                // ALTITUDE:
                globeInstance.current.polygonAltitude((d: any) => {
                    // Lift the hovered country slightly higher (Tactile Pop)
                    if (d.id === hoverId) return 0.03; 
                    return 0.006;
                });
                
                // Important: Trigger update when hoverId changes
                globeInstance.current.polygonsTransitionDuration(300); // Smooth transition
            }

        } catch (e) {
            console.error("Globe Load Error:", e);
        }
    };

    loadLibrariesAndRender();

  }, [geoJson, data, year, mode, maxVal, hoverId]); // Add hoverId to dependency array

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