import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export type AdminLocation = "scarborough" | "markham";

interface LocationContextValue {
  location: AdminLocation;
  setLocation: (loc: AdminLocation) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

const STORAGE_KEY = "admin_selected_location";

function getSavedLocation(): AdminLocation {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "scarborough" || saved === "markham") return saved;
  } catch {}
  return "scarborough";
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<AdminLocation>(getSavedLocation);

  const setLocation = useCallback((loc: AdminLocation) => {
    setLocationState(loc);
    try {
      localStorage.setItem(STORAGE_KEY, loc);
    } catch {}
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useAdminLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useAdminLocation must be used within LocationProvider");
  return ctx;
}
