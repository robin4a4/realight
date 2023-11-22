import type { QueryDefaultType } from "./types";

export function JsonResponse<TData = QueryDefaultType>(
	data: TData,
	options: { revalidate?: boolean } & ResponseInit = {},
) {
	return {
		type: "json-response",
		url: "",
		data,
		options,
	};
}

export function RedirectResponse(url: string, options: ResponseInit = {} ) {
	return {
		type: "redirect-response",
		url,
		data: null,
		options: {
			revalidate: false,
			...options
		}
	};
}
