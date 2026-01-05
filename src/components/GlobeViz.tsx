'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'globe.gl';

// Define the shape of the data we expect
type GlobeProps = {
  year: number;
  mode: string;
};

export default function GlobeViz({ year, mode }: GlobeProps) {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null); // Keep track of the globe instance
  const [data, setData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // 1. Load Data Once
  useEffect(() => {
    setMounted(true);
    fetch('/global_data.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || json);
      })
      .catch((err) => console.error("Data Load Error:", err));
  }, []);

  // 2. Initialize Globe (Run Only Once)
  useEffect(() => {
    if (!mounted || !globeEl.current) return;

    // @ts-ignore
    const world = Globe()(globeEl.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .width(window.innerWidth)
      .height(window.innerHeight)
      .pointAltitude((d: any) => d.size * 0.5) // Altitude based on value
      .pointRadius(1.2)
      .pointColor('color') // Use the color property from data
      .pointsMerge(true);

    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.5;

    globeInstance.current = world;

    // Handle Resize
    const handleResize = () => {
       world.width(window.innerWidth);
       world.height(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);

  // 3. REACTIVE UPDATE: Run whenever 'data', 'year', or 'mode' changes
  useEffect(() => {
    if (!globeInstance.current || !data) return;

    // --- CONFIGURATION BASED ON MODE ---
    const MODE_CONFIG: any = {
        'ENERGY': { key: 'energy', color: '#34d399', scale: 6000 }, // Green
        'WEALTH': { key: 'gdp',    color: '#22d3ee', scale: 500 },  // Blue
        'CARBON': { key: 'co2',    color: '#f87171', scale: 200 }   // Red
    };

    const config = MODE_CONFIG[mode] || MODE_CONFIG['ENERGY'];
    const pointsData = [];
    
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

    // --- DATA PROCESSING LOOP ---
    for (const [code, loc] of Object.entries(LOCATIONS)) {
        const countryData = data[code] || data[code.toLowerCase()];
        
        if(countryData && countryData[config.key]) {
            let val = 0;
            const metricData = countryData[config.key];

            // Handle Array (Time Series) vs Single Object
            if(Array.isArray(metricData)) {
                // Find the specific year
                const yearEntry = metricData.find((d: any) => d.date == year.toString());
                if (yearEntry) val = yearEntry.value;
            } else if (metricData.value) {
                val = metricData.value;
            }
            
            // Only add if we have a value
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

    // Update the globe efficiently
    globeInstance.current.pointsData(pointsData);

  }, [data, year, mode]); // <--- This dependency array is the magic

  if (!mounted) return <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-emerald-500">Loading Core...</div>;

  return <div ref={globeEl} className="absolute inset-0 z-0" />;
}
