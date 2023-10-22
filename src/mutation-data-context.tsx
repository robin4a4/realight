import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

export const MutationContext = createContext<{
  currentMutationData: Record<string, unknown>;
  setCurrentMutationData: Dispatch<SetStateAction<Record<string, unknown>>>;
} | null>(null);

export function MutationProvider({ children }: { children: React.ReactNode }) {
  const [currentMutationData, setCurrentMutationData] = useState<
    Record<string, unknown>
  >({});
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
