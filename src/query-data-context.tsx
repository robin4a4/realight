import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import type { QueryDefaultType } from "./types";

export const QueryContext = createContext<{
  currentQueryData: QueryDefaultType;
  setCurrentQueryData: Dispatch<SetStateAction<QueryDefaultType>>;
} | null>(null);

export function QueryProvider({
  initialData,
  children,
}: {
  initialData: QueryDefaultType;
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
