import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

export const QueryContext = createContext<{
  currentQueryData: Record<string, unknown>;
  setCurrentQueryData: Dispatch<SetStateAction<Record<string, unknown>>>;
} | null>(null);

export function QueryProvider({
  initialData,
  children,
}: {
  initialData: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const [currentQueryData, setCurrentQueryData] = useState(initialData);
  return (
    <QueryContext.Provider
      value={{
        currentQueryData,
        setCurrentQueryData,
      }}
    >
      {children}
    </QueryContext.Provider>
  );
}

export function useInternalQueryData() {
  return useContext(QueryContext);
}
