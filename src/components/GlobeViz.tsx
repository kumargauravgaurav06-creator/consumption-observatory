'use client';

import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';

type GlobeProps = {
  year: number;
  mode: string;
  data: any; // <--- Now accepts clean data from the main page
};

export default function GlobeViz({ year, mode, data }: GlobeProps) {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  // 1. Initialize Globe (Visuals Only)
  useEffect(() => {
    setMounted(true);
    if (!globeEl.current) return;

    // @ts-ignore
    const world = Globe()(globeEl.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .width(window.innerWidth)
      .height(window.innerHeight)
      .pointAltitude((d: any) => d.size * 0.5)
      .pointRadius(1.2)
      .pointColor('color')
      .pointsMerge(true);

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

  // 2. React to Data Changes
  useEffect(() => {
    if (!globeInstance.current || !data) return;

    const MODE_CONFIG: any = {
        'ENERGY': { key: 'energy', color: '#34d399', scale: 6000 },
        'WEALTH': { key: 'gdp',    color: '#22d3ee', scale: 500 },
        'CARBON': { key: 'co2',    color: '#f87171', scale: 200 }
    };

    const config = MODE_CONFIG[mode] || MODE_CONFIG['ENERGY'];
    const pointsData = [];
    
    // Coordinates Map
    const LOCATIONS: Record<string, { lat: number; lng: number }> = {
      'USA': { lat: 39.8, lng: -98.5 },
      'CHN': { lat: 35.8, lng: 104.1 },
      'IND': { lat: 20.5, lng: 78.9 },
      'BRA': { lat: -14.2, lng: -51.9 },
      'NGA': { lat: 9.0, lng: 8.6 },
      'EUU': { lat: 54.5, lng: 15.2 },
      'DEU': { lat: 51.1, lng: 10.4 },
      'RUS': { lat: 61.5, lng: 105.3 }
    };

    // Loop through our clean dictionary
    for (const [code, countryData] of Object.entries(data) as any) {
        // Match country code (USA) to Location
        const loc = LOCATIONS[code.toUpperCase()];
        if (loc && countryData[config.key]) {
            let val = 0;
            const metricData = countryData[config.key];

            if(Array.isArray(metricData)) {
                const yearEntry = metricData.find((d: any) => parseInt(d.date) === year);
                if (yearEntry) val = parseFloat(yearEntry.value);
            } else if (metricData.value) {
                val = parseFloat(metricData.value);
            }
            
            if (val > 0) {
                pointsData.push({
                    lat: loc.lat, 
                    lng: loc.lng,
                    size: val / config.scale, 
                    color: config.color
                });
            }
        }
    }
    globeInstance.current.pointsData(pointsData);
  }, [data, year, mode]);

  if (!mounted) return <div className="text-emerald-500">Initializing...</div>;
  return <div ref={globeEl} className="absolute inset-0 z-0" />;
}
