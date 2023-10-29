import type { QueryDefaultType } from "./types";

export function JsonResponse<TData = QueryDefaultType>(
	data: TData,
	options: { revalidate?: boolean } = {},
) {
	return {
		type: "json-response",
		data,
		...options,
	};
}
