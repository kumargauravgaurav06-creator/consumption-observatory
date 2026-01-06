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
    'ARE': { lat: 23.4, lng: 53.8 }, 'BHR': { lat: 26.0, lng: 50.5 }
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
      .pointRadius(0.6); // Slightly thinner for elegance

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

    // SCALING FACTORS (Adjusted for "Goldilocks" Height)
    const config = { 
        color: mode === 'CARBON' ? '#ef4444' : mode === 'WEALTH' ? '#06b6d4' : '#10b981',
        scale: mode === 'ENERGY' ? 60000 : mode === 'WEALTH' ? 80000 : 50 
        // Note: Increased divisors to shrink bars naturally
    };

    const pointsData = [];

    for (const [key, val] of Object.entries(data) as any) {
        const countryCode = key.toUpperCase();
        if (LOCATIONS[countryCode]) {
            let value = 0;
            const metrics = mode === 'ENERGY' ? val.energy : mode === 'WEALTH' ? val.gdp : val.co2;
            
            if (Array.isArray(metrics)) {
                const entry = metrics.find((d: any) => parseInt(d.date) === year);
                if (entry) value = parseFloat(entry.value);
                else if (metrics.length > 0) value = parseFloat(metrics[metrics.length-1].value);
            }
            
            if (value > 0) {
                // CLAMP MAX HEIGHT TO 0.5 (Half Earth Radius)
                let altitude = value / config.scale;
                if (altitude > 0.5) altitude = 0.5; 
                if (altitude < 0.01) altitude = 0.01; // Minimum visibility

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
