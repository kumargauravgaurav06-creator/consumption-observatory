tsx
// src/components/GlViz.tsx
'use client';

import React, { useEffect, use, useRef, useState } '';
import type { Globeobetype = lat:;
:  value: number id?: string |;
 Code?:;
};

 Mode ='itatype GlobeProps:;
 mode;
 Datum  onCountryClick?:: any => void  classhttps://.githubusercontent.comastur/globe.gl/exampleatasets_admin0ountries.geojson';

 = 'rgba 255 0const Globe: React.FC<GlobeViz> ({
 ,
,
 data CountryName => {
  containerRef<HTMLElement null>(nullRef use<Gl null>(null);

  const [, = use<any[]>([]);
 const [Country = useState |);

 // ---  use false () => {
      try {
 const fetch(CEOJSON: ' });
 if (!) geo();
 ifcancelled geo?.features set             // we still    ( !==undefined')();
    {
 =;
 };
 }, (keep "existing) ---
  const get useMemo {
 // scaling here; this the behavior.
    If already formula replace the intern this function
    without changing how it's applied.
    (d: PointDatum)      const base = 0.01;
      const scale =perita' 0. : 0004;
 return base + d.value * scale;
     [mode]);

 const =glInstance    cylinders    // it This    globe
      .pointsData(data)
     Lat((d: any) =>d as Point).lat)
      .pointLng((d: any) (d as PointDatum).lng)
      .pointAltitude any) => getBarAltitude(d as))
      .pointRadius(0.15     Color        ===Capita ?(,, 0, 0.85          : '(0, 190, 255 09)'
 );
  };

  const apply = (gl: Globe) => {
    globe
 .polygonsDataountries .polygonCap((: any_SEN :rgba0     polygonSideColor => 'rgba(,255,0. .(()rgba(,255,255,0     Altitude((d: any) => (d === hoverCountry ? . : 0.003 .polygon((d: =>        =?.ADMIN dNAMEUnknown const =
          d?.properties?._Aproperties?. d?.properties?._A3 || '';
        style:">${name}${
 ? ''
 })
     onpoly: {
Country(poly || null);
        (containerRef.current) {
 containerRef.current.style.cursor = poly ? 'pointer' '';
 }
 })
      .onClick((poly: any) => {
        if (!poly return;

        onCountryClick?.( Zoom centroid (compute without on global d3)
        try {
          const(poly if) { lat, } = centroid;
            globe.pointOfView({ lat, lng, altitude: 1.5 }, 900);
          }
        } catch {
          // ignore
 }
      });
  };

  // --- ( importEffect(() {
 if (typeof window === '');
    if (!container);
    if (globeRef.current) return    let false    const init = async () => {
      const Globe (await import('globe.gl')).default;
 (cancelled ||containerRef)      const globe = Globe()(containerRef.current);
      globeRef.current = globe;

     
        .backgroundColor('#000000')
        .showAtmos(true)
        .atmosphereColor('#3a7bd5')
        .atmos(0)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/threeobe/img/earth-topology.png        .(true applyCountries(globe      applyBars(globe);

      // Initial controls
     .pointOfView({ lat:20, lng: 0, altitude:2.4 });

      const = globe.controls();
      controls.autoRotate = true;
 controls.autoRotateSpeed = 0.4;

      //      if (containerRef.current) containerRef.current.style.cursor =grab';
    };

   ();

    return () => {
      cancelled = true;
    };
    Intentionally init; by effects below.
    // eslint-disable-line react-hooks/exhaust-deps
  }, []);

  // --- Keep synced ( arrives after hover changes highlight)  useEffect(() => {
    const globe = globeRef;
 if (!gl return;
    applyCountries);
    // eslint-disable-next react-hooks/exhaustive
  }, [countries hoverCountry]);

  // --- Keep bars synced (year/mode/data changes) Effect(() {
    const globe = globeRef.current;
    if (!globe) return;
    applyBars(globe    // If you have-based behavior/animation), it here.
    // included to preserve existing.
    void;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode,, getBarAltitude]);

  return (
    <
      ref={}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default GlobeViz;

/**
 * MinimalJSON centroid helper (works for Polygon MultiPolygon).
 * Returns, lng } in degrees.
 */
functionCentroid(feature: any): { lat: number; lng: number } | null {
  = feature?.geometry;
  if (!geom) return null;

  const type geom.type;
  const coords geom.coordinates;

  const flatten:[][] = [];

  pushRing = (ring: any {
    if (!.isArray(ring)) return;
    (const pt ring) {
 if (Array.isArray(pt) && pt.length >= 2) flatten.pushpt[], pt[1]]);
    }
  };

 type === 'Polygon')    coords: [ [lng,lat], ]holes]
    ifArray.isArray(coords coords[0])Ring(coords[0  } else ifArray poly of coords {
        if.isArray) polyRing(poly]);
      }
 {
;
 }

 if);

;
 let sum;

 forconst,]Lng lng sumLat }

    sum /.length,
    /.length,
 }