/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import {
	ComponentProps,
	FormEvent,
	forwardRef,
	useMemo,
	useRef,
	useState,
} from "react";
import { useInternalMutationData } from "./mutation-data-context";
import { useInternalQueryData } from "./query-data-context";

type FormState = "idle" | "submitting" | "error";

export function useForm() {
	const [state, setState] = useState<FormState>("idle");

	const abortControllerRef = useRef(new AbortController());
	const internalQueryData = useInternalQueryData();
	const internalMutationData = useInternalMutationData();

	const submitFormData = (url: string, formData: FormData, method: string) => {
		fetch(url, {
			method,
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
				if (data.redirect) {
					window.location.replace(data.redirect);
				}
				setState("idle");
			})
			.catch(() => {
				setState("error");
			});
	};

	const submit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setState("submitting");
		abortControllerRef.current.abort();
		abortControllerRef.current = new AbortController();

		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const currentUrl = new URL(window.location.href);
		submitFormData(currentUrl.pathname, formData, form.method);
	};

	const submitObject = (obj: Record<string, unknown>) => {
		setState("submitting");
		abortControllerRef.current.abort();
		abortControllerRef.current = new AbortController();
		const formData = new FormData();

		for (const key in obj) {
			// @ts-ignore
			formData.append(key, obj[key]);
		}

		const currentUrl = new URL(window.location.href);
		submitFormData(currentUrl.pathname, formData, "POST");
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const Form = useMemo(() => {
		const Form = forwardRef<
			HTMLFormElement,
			Omit<ComponentProps<"form">, "onClick">
		>(function Form(props, ref) {
			return (
				<form ref={ref} {...props} onSubmit={(e) => submit(e)}>
					{props.children}
				</form>
			);
		});
		return Form;
	}, [""]);

	const formHookValues = useMemo(() => {
		return {
			Form,
			state,
			submit,
			submitObject,
		};
	}, [Form, state, submit]);

	return formHookValues;
}
