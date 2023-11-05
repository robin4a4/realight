import { useContext } from "react";
import { MutationContext } from "./mutation-data-context";
import { useInternalQueryData } from "./query-data-context";
import type { QueryDefaultType } from "./types";
export function useMutationData<TMutate extends (...args: any) => any>() {
  const mutationContext = useContext(MutationContext);
  if (!mutationContext) {
    throw new Error("MutationContext is not defined");
  }
  return mutationContext.currentMutationData as Awaited<
    ReturnType<TMutate>
  >["data"];
}

export function useQueryData<
  TQueryData extends () => Promise<QueryDefaultType>
>() {
  const internalQueryData = useInternalQueryData();
  return internalQueryData?.currentQueryData as Awaited<ReturnType<TQueryData>>;
}
