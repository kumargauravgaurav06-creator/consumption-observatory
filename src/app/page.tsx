// ... inside src/app/page.tsx

  // --- SMART INSIGHT CALCULATOR ---
  const stats = useMemo(() => {
    if (!dataset || Object.keys(dataset).length === 0) return {
        value: 0, name: 'Loading...', rank: 0, total: 0, trend: 0, trendPercent: '0'
    };
    
    const keyMap: any = { 
        'ENERGY': 'energy', 'WEALTH': 'gdp', 'CARBON': 'co2', 
        'RENEWABLES': 'renewables', 'WATER': 'water', 
        'INTERNET': 'internet', 'LIFE': 'life', 'INFLATION': 'inflation' 
    };
    const key = keyMap[mode];
    
    const countryData = (dataset as any)[selectedCountry];
    const metrics = countryData ? countryData[key] : [];
    
    if (!metrics || metrics.length === 0) return { 
        value: 0, name: countryData?.name || selectedCountry, rank: 0, total: 0, trend: 0, trendPercent: '0' 
    };

    // FIX: FIND NEAREST YEAR IF EXACT MISSING
    // We sort entries by date distance to the selected year and pick the closest one
    const sortedByDate = [...metrics].sort((a: any, b: any) => 
        Math.abs(parseInt(a.date) - year) - Math.abs(parseInt(b.date) - year)
    );
    
    const currentEntry = sortedByDate[0]; // The closest data point available
    const currentValue = currentEntry ? parseFloat(currentEntry.value) : 0;

    // Trend Logic: Try to find data from 1 year ago, or 5 years ago if 1 year missing
    const prevEntry = metrics.find((d: any) => parseInt(d.date) === year - 1) 
                   || metrics.find((d: any) => parseInt(d.date) === year - 5);

    const prevValue = prevEntry ? parseFloat(prevEntry.value) : currentValue; 
    const trend = currentValue - prevValue;
    const trendPercent = prevValue !== 0 ? ((trend / prevValue) * 100).toFixed(1) : '0';

    // Global Rank Logic
    const allValues = Object.keys(dataset).map(code => {
        const cMetrics = (dataset as any)[code][key];
        // Also use nearest logic for ranking to be fair
        const cSorted = cMetrics ? [...cMetrics].sort((a: any, b: any) => Math.abs(parseInt(a.date) - year) - Math.abs(parseInt(b.date) - year)) : [];
        const cEntry = cSorted[0];
        return { code, val: cEntry ? parseFloat(cEntry.value) : -1 };
    }).filter(x => x.val !== -1).sort((a, b) => b.val - a.val);

    const rank = allValues.findIndex(x => x.code === selectedCountry) + 1;
    const totalCountries = allValues.length;

    return { 
        value: currentValue, 
        name: countryData?.name || selectedCountry, 
        rank, 
        total: totalCountries,
        trend,
        trendPercent
    };
  }, [year, mode, selectedCountry]);