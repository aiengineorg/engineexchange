"use client";

import { createContext, useContext, type ReactNode } from "react";

interface Artifact {
  documentId: string;
  // Add other artifact properties as needed
}

interface ArtifactContextType {
  artifact: Artifact | null;
  setArtifact?: (artifact: Artifact | null) => void;
}

const ArtifactContext = createContext<ArtifactContextType>({
  artifact: null,
});

export function ArtifactProvider({ children }: { children: ReactNode }) {
  // Stub implementation for artifact context
  // This can be enhanced later if artifact functionality is needed
  return (
    <ArtifactContext.Provider value={{ artifact: null }}>
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifact() {
  const context = useContext(ArtifactContext);
  if (context === undefined) {
    throw new Error("useArtifact must be used within an ArtifactProvider");
  }
  return context;
}

