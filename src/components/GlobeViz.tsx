'use client';

import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';

type GlobeProps = {
  year: number;
  mode: string;
  data: any;
  target?: string;
};

export default function GlobeViz({ year, mode, data, target }: GlobeProps) {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);

  const LOCATIONS: Record<string, { lat: number; lng: number }> = {
    'USA': { lat: 39.8, lng: -98.5 }, 'CHN': { lat: 35.8, lng: 104.1 },
    'IND': { lat: 20.5, lng: 78.9 }, 'RUS': { lat: 61.5, lng: 105.3 },
    'DEU': { lat: 51.1, lng: 10.4 }, 'JPN': { lat: 36.2, lng: 138.2 },
    'GBR': { lat: 55.3, lng: -3.4 }, 'FRA': { lat: 46.2, lng: 2.2 },
    'BRA': { lat: -14.2, lng: -51.9 }, 'ITA': { lat: 41.8, lng: 12.5 },
    'CAN': { lat: 56.1, lng: -106.3 }, 'AUS': { lat: -25.2, lng: 133.7 },
    'KOR': { lat: 35.9, lng: 127.7 }, 'ISL': { lat: 64.9, lng: -19.0 },
    'NOR': { lat: 60.4, lng: 8.4 }, 'SAU': { lat: 23.8, lng: 45.0 },
    'ZAF': { lat: -30.5, lng: 22.9 }, 'NGA': { lat: 9.0, lng: 8.6 },
    'EGY': { lat: 26.8, lng: 30.8 }, 'IDN': { lat: -0.7, lng: 113.9 },
    'KWT': { lat: 29.3, lng: 47.4 }, 'QAT': { lat: 25.3, lng: 51.1 },
    'ARE': { lat: 23.4, lng: 53.8 }, 'BHR': { lat: 26.0, lng: 50.5 },
    'SWE': { lat: 60.1, lng: 18.6 }, 'FIN': { lat: 61.9, lng: 25.7 },
    'DNK': { lat: 56.2, lng: 9.5 }, 'ESP': { lat: 40.4, lng: -3.7 }
  };

  useEffect(() => {
    if (!globeEl.current) return;

    // @ts-ignore
    const world = Globe()(globeEl.current)
      .backgroundColor('#000000')
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .width(window.innerWidth)
      .height(window.innerHeight)
      .pointAltitude('size')
      .pointRadius(0.6);

    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.3;
    globeInstance.current = world;

    const handleResize = () => {
       world.width(window.innerWidth);
       world.height(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!globeInstance.current || !data) return;

    // --- VISUAL CONFIGURATION ---
    // Key: Matches 'mode' from page.tsx
    // Scale: Higher number = Shorter bars (Value / Scale)
    const configs: any = { 
        'ENERGY':      { color: '#10b981', scale: 60000 },
        'WEALTH':      { color: '#06b6d4', scale: 80000 },
        'CARBON':      { color: '#ef4444', scale: 50 },
        'RENEWABLES':  { color: '#4ade80', scale: 200 }, // % (0-100)
        'WATER':       { color: '#3b82f6', scale: 200 }, // % (0-100)
        'INTERNET':    { color: '#a855f7', scale: 200 }, // % (0-100)
        'LIFE':        { color: '#ec4899', scale: 180 }, // Years (0-90)
        'INFLATION':   { color: '#f97316', scale: 40 }   // % (Usually 0-20, sometimes 100)
    };

    const config = configs[mode] || configs['ENERGY'];
    
    // Map mode to data key
    const modeKeys: any = {
        'ENERGY': 'energy', 'WEALTH': 'gdp', 'CARBON': 'co2',
        'RENEWABLES': 'renewables', 'WATER': 'water', 
        'INTERNET': 'internet', 'LIFE': 'life', 'INFLATION': 'inflation'
    };
    const dataKey = modeKeys[mode];

    const pointsData = [];

    for (const [key, val] of Object.entries(data) as any) {
        const countryCode = key.toUpperCase();
        if (LOCATIONS[countryCode]) {
            let value = 0;
            const metrics = val[dataKey];
            
            if (Array.isArray(metrics)) {
                const entry = metrics.find((d: any) => parseInt(d.date) === year);
                if (entry) value = parseFloat(entry.value);
                else if (metrics.length > 0) value = parseFloat(metrics[metrics.length-1].value); // LKV
            }
            
            if (value > 0) {
                // Scaling Logic
                let altitude = value / config.scale;
                
                // Specific clamps
                if (mode === 'INFLATION' && altitude > 0.8) altitude = 0.8; // Cap hyperinflation
                if (altitude > 0.5) altitude = 0.5; // General Cap
                if (altitude < 0.01) altitude = 0.01;

                pointsData.push({
                    lat: LOCATIONS[countryCode].lat,
                    lng: LOCATIONS[countryCode].lng,
                    size: altitude, 
                    color: config.color
                });
            }
        }
    }
    globeInstance.current.pointsData(pointsData);
  }, [data, year, mode]);

  useEffect(() => {
      if (!globeInstance.current || !target) return;
      const loc = LOCATIONS[target];
      if (loc) {
          globeInstance.current.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 2.0 }, 1500);
      }
  }, [target]);

  return <div ref={globeEl} className="fixed top-0 left-0 w-full h-full -z-10" />;
}
