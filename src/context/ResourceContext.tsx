import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Personnel, Asset, initialPersonnels, initialAssets } from '../data/resourceData';

interface ResourceContextType {
  personnels: Personnel[];
  assets: Asset[];
  updatePersonnel: (id: string, data: Partial<Personnel>) => void;
  updateAsset: (id: string, data: Partial<Asset>) => void;
  addPersonnel: (p: Personnel) => void;
  addAsset: (a: Asset) => void;
  deletePersonnel: (id: string) => void;
  deleteAsset: (id: string) => void;
  bulkDeletePersonnel: (ids: Set<string>) => void;
  bulkDeleteAssets: (ids: Set<string>) => void;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

export const ResourceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [personnels, setPersonnels] = useState<Personnel[]>(initialPersonnels);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);

  const updatePersonnel = (id: string, data: Partial<Personnel>) => {
    setPersonnels(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const updateAsset = (id: string, data: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.assetId === id ? { ...a, ...data } : a));
  };

  const addPersonnel = (p: Personnel) => setPersonnels(prev => [p, ...prev]);
  const addAsset = (a: Asset) => setAssets(prev => [a, ...prev]);

  const deletePersonnel = (id: string) => setPersonnels(prev => prev.filter(p => p.id !== id));
  const deleteAsset = (id: string) => setAssets(prev => prev.filter(a => a.assetId !== id));

  const bulkDeletePersonnel = (ids: Set<string>) => setPersonnels(prev => prev.filter(p => !ids.has(p.id)));
  const bulkDeleteAssets = (ids: Set<string>) => setAssets(prev => prev.filter(a => !ids.has(a.assetId)));

  return (
    <ResourceContext.Provider value={{ 
      personnels, assets, updatePersonnel, updateAsset, 
      addPersonnel, addAsset, deletePersonnel, deleteAsset,
      bulkDeletePersonnel, bulkDeleteAssets
    }}>
      {children}
    </ResourceContext.Provider>
  );
};

export const useResource = () => {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error('useResource must be used within a ResourceProvider');
  }
  return context;
};
