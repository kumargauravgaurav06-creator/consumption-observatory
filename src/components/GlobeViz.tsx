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
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false); // New state to track if globe is loaded

  // 1. DATA CALCULATION (Find Max Value for Scaling)
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

  // 2. FETCH GEOJSON
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
       .then(r => r.json())
       .then(d => { if (d && d.features) setGeoJson(d.features); })
       .catch(e => console.error("Geo load failed", e));
  }, []);

  // 3. HELPER: SMART CENTROID (Fixed USA)
  const getCentroid = (d: any) => {
      if (d.id === 'USA') return { lat: 39.6, lng: -96.3 }; // Kansas Center

      const geometry = d.geometry;
      if (!geometry) return null;
      let coords = geometry.coordinates;
      if (geometry.type === 'MultiPolygon') {
          coords.sort((a: any, b: any) => b[0].length - a[0].length);
          coords = coords[0];
      }
      const points = coords[0]; 
      let x = 0, y = 0;
      points.forEach((p: any) => { x += p[0]; y += p[1]; });
      return { lat: y / points.length, lng: x / points.length };
  };

  // 4. INIT EFFECT (Run Once to Build Globe)
  useEffect(() => {
    if (!globeEl.current || globeInstance.current) return;

    const initGlobe = async () => {
        try {
            const GlobeModule = await import('globe.gl');
            const Globe = GlobeModule.default;

            // @ts-ignore
            globeInstance.current = Globe()(globeEl.current)
                .backgroundColor('rgba(0,0,0,0)')
                .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                .width(window.innerWidth).height(window.innerHeight)
                .atmosphereColor('#7ca4ff')
                .atmosphereAltitude(0.12)
                .onPolygonHover((hoverD: any) => {
                    setHoverId(hoverD ? hoverD.id : null);
                    // Manually handle cursor here to avoid react render lag for cursor
                    if (globeEl.current) {
                        globeEl.current.style.cursor = hoverD ? 'pointer' : 'default';
                    }
                }) 
                .onPolygonClick((d: any) => { 
                    if (onCountryClick) onCountryClick(d.id);
                    const center = getCentroid(d);
                    if (center) {
                        globeInstance.current.pointOfView({ lat: center.lat, lng: center.lng, altitude: 1.8 }, 1000);
                    }
                });
            
            globeInstance.current.controls().autoRotate = true;
            globeInstance.current.controls().autoRotateSpeed = 0.5;
            
            setIsReady(true); // Signal that globe is ready for data updates
        } catch (e) {
            console.error("Globe Init Error:", e);
        }
    };
    initGlobe();
  }, []); // Empty dependency array = RUN ONCE

  // 5. UPDATE EFFECT (Run Whenever Data/Hover Changes)
  useEffect(() => {
      if (!globeInstance.current || !isReady || !geoJson) return;

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
        const entry = metrics.find((d: any) => parseInt(d.date) === year);
        return entry ? parseFloat(entry.value) : null;
      };

      // APPLY UPDATES
      globeInstance.current.polygonsData(geoJson);
      globeInstance.current.polygonSideColor(() => 'rgba(0,0,0,0)');
      globeInstance.current.polygonCapColor(() => 'rgba(0,0,0,0)');

      // DYNAMIC COLORS (Uses current hoverId)
      globeInstance.current.polygonStrokeColor((d: any) => {
          if (d.id === hoverId) return '#ffffff'; // White Highlight
          
          const val = getVal(d.id);
          if (val === null) return 'rgba(255,255,255, 0.1)'; 
          const baseRgb = getBaseColor(mode);
          return `rgba(${baseRgb}, 1)`;
      });

      // DYNAMIC ALTITUDE (Uses current hoverId)
      globeInstance.current.polygonAltitude((d: any) => {
          if (d.id === hoverId) return 0.04; // Pop-up Effect
          return 0.006;
      });

      // Pause rotation if hovering
      globeInstance.current.controls().autoRotate = !hoverId;
      globeInstance.current.polygonsTransitionDuration(300);

  }, [year, mode, data, geoJson, isReady, hoverId]); // Reruns whenever hoverId changes

  // 6. FLY TO TARGET EFFECT
  useEffect(() => {
      if (!globeInstance.current || !geoJson || !target) return;
      const country = geoJson.find((f: any) => f.id === target);
      if (country) {
          const center = getCentroid(country);
          if (center) {
              globeInstance.current.pointOfView({ lat: center.lat, lng: center.lng, altitude: 1.8 }, 1500);
          }
      }
  }, [target, geoJson, isReady]);

  // 7. RESIZE HANDLER
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