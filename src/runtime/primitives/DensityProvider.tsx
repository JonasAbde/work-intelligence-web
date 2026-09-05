import React, { createContext, useContext, ReactNode } from 'react';
import { DensityMode } from '../runtimeTypes';

interface DensityContextType {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  // Dynamic scale tokens based on density
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    rowPadding: string;
    cardPadding: string;
    fontSizeSm: string;
    fontSizeBase: string;
    iconSize: string;
  };
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export const DensityProvider: React.FC<{
  density: DensityMode;
  onDensityChange: (density: DensityMode) => void;
  children: ReactNode;
}> = ({ density, onDensityChange, children }) => {
  const getTokens = (mode: DensityMode) => {
    switch (mode) {
      case 'dense':
        return {
          xs: 'gap-1',
          sm: 'gap-1.5',
          md: 'gap-2',
          lg: 'gap-3',
          rowPadding: 'py-1 px-2.5',
          cardPadding: 'p-2.5',
          fontSizeSm: 'text-[11px]',
          fontSizeBase: 'text-xs',
          iconSize: 'w-3.5 h-3.5',
        };
      case 'compact':
        return {
          xs: 'gap-1.5',
          sm: 'gap-2',
          md: 'gap-3',
          lg: 'gap-4',
          rowPadding: 'py-1.5 px-3',
          cardPadding: 'p-3.5',
          fontSizeSm: 'text-xs',
          fontSizeBase: 'text-xs',
          iconSize: 'w-4 h-4',
        };
      case 'comfortable':
      default:
        return {
          xs: 'gap-2',
          sm: 'gap-3',
          md: 'gap-4',
          lg: 'gap-6',
          rowPadding: 'py-2.5 px-4',
          cardPadding: 'p-4 sm:p-5',
          fontSizeSm: 'text-xs',
          fontSizeBase: 'text-sm',
          iconSize: 'w-4 h-4',
        };
    }
  };

  return (
    <DensityContext.Provider
      value={{
        density,
        setDensity: onDensityChange,
        spacing: getTokens(density),
      }}
    >
      {children}
    </DensityContext.Provider>
  );
};

export const useDensity = () => {
  const context = useContext(DensityContext);
  if (!context) {
    throw new Error('useDensity must be used within a DensityProvider');
  }
  return context;
};
