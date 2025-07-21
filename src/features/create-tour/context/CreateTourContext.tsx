import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface CreateTourContextData {
  // Photo data
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  
  // Location data
  locationLabel: string;
  setLocationLabel: (label: string) => void;
  
  // Preferences text from photo confirmation
  preferencesText: string;
  setPreferencesText: (text: string) => void;
  
  // Helper functions
  clearPhotoData: () => void;
}

const CreateTourContext = createContext<CreateTourContextData | undefined>(undefined);

export interface CreateTourProviderProps {
  children: ReactNode;
}

export function CreateTourProvider({ children }: CreateTourProviderProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [preferencesText, setPreferencesText] = useState<string>('');

  const clearPhotoData = useCallback(() => {
    setPhotoUri(null);
    setPreferencesText('');
  }, []);

  const value: CreateTourContextData = {
    photoUri,
    setPhotoUri,
    locationLabel,
    setLocationLabel,
    preferencesText,
    setPreferencesText,
    clearPhotoData,
  };

  return (
    <CreateTourContext.Provider value={value}>
      {children}
    </CreateTourContext.Provider>
  );
}

export function useCreateTour() {
  const context = useContext(CreateTourContext);
  if (context === undefined) {
    throw new Error('useCreateTour must be used within a CreateTourProvider');
  }
  return context;
} 