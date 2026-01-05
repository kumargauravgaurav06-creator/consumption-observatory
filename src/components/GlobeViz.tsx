'use client';

import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';

export default function GlobeViz() {
  const globeEl = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // 1. Load Data
  useEffect(() => {
    setMounted(true);
    fetch('/global_data.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || json);
      })
      .catch((err) => console.error("Data Load Error:", err));
  }, []);

  // 2. Initialize Globe
  useEffect(() => {
    if (!mounted || !globeEl.current || !data) return;

    // @ts-ignore
    const world = Globe()(globeEl.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .width(window.innerWidth)
      .height(window.innerHeight)
      .pointAltitude((d: any) => d.size * 0.5)
      .pointRadius(1.2)
      .pointColor((d: any) => d.color)
      .pointsMerge(true);

    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.5;

    // --- TRANSFORM DATA ---
    const pointsData = [];
    
    // STRICT TYPING FIX: explicit type definition
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

    for (const [code, loc] of Object.entries(LOCATIONS)) {
        const countryData = data[code] || data[code.toLowerCase()];
        if(countryData && countryData['energy']) {
            let val = 0;
            // Handle both history arrays and single values
            if(Array.isArray(countryData['energy'])) {
                const arr = countryData['energy'];
                if(arr.length > 0) val = arr[arr.length - 1].value;
            } else if (countryData['energy'].value) {
                val = countryData['energy'].value;
            }
            
            pointsData.push({
                lat: loc.lat, 
                lng: loc.lng,
                size: val / 6000, 
                color: '#34d399'
            });
        }
    }
    world.pointsData(pointsData);

    const handleResize = () => {
       world.width(window.innerWidth);
       world.height(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [mounted, data]);

  if (!mounted) return <div className="text-white p-10">Initializing 3D Engine...</div>;

  return <div ref={globeEl} className="absolute inset-0 z-0" />;
}
