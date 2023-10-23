/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { ComponentProps, FormEvent, useRef, useState } from "react";
import { useInternalMutationData } from "./mutation-data-context";
import { useInternalQueryData } from "./query-data-context";

type FormState = "idle" | "submitting" | "error";

export function useForm() {
  const [state, setState] = useState<FormState>("idle");

  const abortControllerRef = useRef(new AbortController());
  const internalQueryData = useInternalQueryData();
  const internalMutationData = useInternalMutationData();
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("submitting");
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const currentUrl = new URL(window.location.href);
    fetch(currentUrl, {
      method: form.method,
      body: formData,
      signal: abortControllerRef.current.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        const { __QUERY_DATA__, ...mutationData } = data;
        internalMutationData?.setCurrentMutationData(mutationData);
        if (__QUERY_DATA__) {
          internalQueryData?.setCurrentQueryData(__QUERY_DATA__);
        }
        setState("idle");
      })
      .catch(() => {
        setState("error");
      });
  };

  const Form = (props: Omit<ComponentProps<"form">, "onClick">) => {
    return (
      <form {...props} onSubmit={(e) => submit(e)}>
        {props.children}
      </form>
    );
  };
  return {
    Form,
    state,
    submit,
  };
}
