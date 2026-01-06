'use client';

import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';

type GlobeProps = {
  year: number;
  mode: string;
  data: any;
};

export default function GlobeViz({ year, mode, data }: GlobeProps) {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);

  useEffect(() => {
    if (!globeEl.current) return;

    // 1. SIMPLE RENDERER (Safe Mode)
    // @ts-ignore
    const world = Globe()(globeEl.current)
      .backgroundColor('#000000') // Force Black Background
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .width(window.innerWidth)
      .height(window.innerHeight)
      .pointAltitude(0.1) // Low altitude = safer rendering
      .pointRadius(0.5);

    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.5;
    
    globeInstance.current = world;

    const handleResize = () => {
       world.width(window.innerWidth);
       world.height(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Data Update Loop
  useEffect(() => {
    if (!globeInstance.current || !data) return;

    const config = { 
        color: mode === 'CARBON' ? '#ef4444' : mode === 'WEALTH' ? '#06b6d4' : '#10b981',
        scale: mode === 'ENERGY' ? 6000 : 500
    };

    const pointsData = [];
    const LOCATIONS: Record<string, { lat: number; lng: number }> = {
      'USA': { lat: 39.8, lng: -98.5 }, 'CHN': { lat: 35.8, lng: 104.1 },
      'IND': { lat: 20.5, lng: 78.9 }, 'BRA': { lat: -14.2, lng: -51.9 },
      'NGA': { lat: 9.0, lng: 8.6 }, 'DEU': { lat: 51.1, lng: 10.4 },
      'RUS': { lat: 61.5, lng: 105.3 }, 'JPN': { lat: 36.2, lng: 138.2 }
    };

    for (const [key, val] of Object.entries(data) as any) {
        const countryCode = key.toUpperCase();
        if (LOCATIONS[countryCode]) {
            let value = 0;
            const metrics = val.energy || val.gdp || val.co2;
            if (Array.isArray(metrics)) value = parseFloat(metrics[0]?.value || 0);
            
            if (value > 0) {
                pointsData.push({
                    lat: LOCATIONS[countryCode].lat,
                    lng: LOCATIONS[countryCode].lng,
                    size: value / config.scale,
                    color: config.color
                });
            }
        }
    }
    globeInstance.current.pointsData(pointsData);
  }, [data, year, mode]);

  // THIS LINE IS THE FIX: -z-10 forces it to the background
  return <div ref={globeEl} className="fixed top-0 left-0 w-full h-full -z-10" />;
}
