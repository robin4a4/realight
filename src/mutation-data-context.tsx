import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import type { QueryDefaultType } from "./types";

export const MutationContext = createContext<{
  currentMutationData: QueryDefaultType;
  setCurrentMutationData: Dispatch<SetStateAction<QueryDefaultType>>;
} | null>(null);

export function MutationProvider({ children }: { children: React.ReactNode }) {
  const [currentMutationData, setCurrentMutationData] =
    useState<QueryDefaultType>({});
  return (
    <MutationContext.Provider
      value={{
        currentMutationData,
        setCurrentMutationData,
      }}
    >
      {children}
    </MutationContext.Provider>
  );
}

export function useInternalMutationData() {
  return useContext(MutationContext);
}
