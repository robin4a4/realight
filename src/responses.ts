import type { QueryDefaultType } from "./types";

export function JsonResponse<TData = QueryDefaultType>(
	data: TData,
	options: { revalidate?: boolean } = {},
) {
	return {
		type: "json-response",
		url: "",
		data,
		...options,
	};
}

export function RedirectResponse(url: string) {
	return {
		type: "redirect-response",
		data: null,
		revalidate: false,
		url,
	};
}
