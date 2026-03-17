import React, { createContext, useMemo, useState } from 'react';
import { BRANDS } from './sizeCharts';

export const BrandDataContext = createContext({
  brands: BRANDS,
  setBrands: () => {},
  lastUpdated: null
});

export const BrandDataProvider = ({ children }) => {
  const [brands, setBrandsState] = useState(BRANDS);
  const [lastUpdated, setLastUpdated] = useState(null);

  const setBrands = (nextBrands) => {
    setBrandsState(nextBrands);
    setLastUpdated(new Date().toISOString());
  };

  const value = useMemo(
    () => ({ brands, setBrands, lastUpdated }),
    [brands, lastUpdated]
  );

  return <BrandDataContext.Provider value={value}>{children}</BrandDataContext.Provider>;
};
